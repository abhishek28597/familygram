from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import User, Post, Message, Family, UserFamily
from app.auth import get_current_user, get_current_family_id
from app.services.llm_service import GroqLLMService
from app.schemas import FamilyResponse, FamilyCreate

router = APIRouter(prefix="/api/family", tags=["family"])


@router.get("", response_model=list[FamilyResponse])
def get_user_families(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all families the current user belongs to"""
    user_families = db.query(UserFamily).filter(UserFamily.user_id == current_user.id).all()
    family_ids = [uf.family_id for uf in user_families]
    families = db.query(Family).filter(Family.id.in_(family_ids)).all()
    return [FamilyResponse.model_validate(f) for f in families]


@router.get("/check/{family_name}", response_model=dict)
def check_family_exists(
    family_name: str,
    db: Session = Depends(get_db)
):
    """Check if a family exists (case-insensitive)"""
    from sqlalchemy import func
    
    normalized_name = family_name.lower()
    
    # Try exact match first
    family = db.query(Family).filter(Family.name == family_name).first()
    if not family:
        # Try case-insensitive match
        family = db.query(Family).filter(func.lower(Family.name) == normalized_name).first()
    
    return {
        "exists": family is not None,
        "family": FamilyResponse.model_validate(family) if family else None
    }


@router.post("", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
def create_family(
    family_data: FamilyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new family and automatically join it (case-insensitive check)"""
    from sqlalchemy import func
    
    # Normalize family name for case-insensitive matching
    normalized_name = family_data.name.lower()
    
    # Check if family already exists (case-insensitive)
    existing_family = db.query(Family).filter(Family.name == family_data.name).first()
    if not existing_family:
        existing_family = db.query(Family).filter(func.lower(Family.name) == normalized_name).first()
    
    if existing_family:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Family with this name already exists"
        )
    
    # Create family
    family = Family(name=family_data.name)
    db.add(family)
    db.flush()
    
    # Join the family
    user_family = UserFamily(user_id=current_user.id, family_id=family.id)
    db.add(user_family)
    db.commit()
    db.refresh(family)
    
    return FamilyResponse.model_validate(family)


@router.post("/{family_id}/join", response_model=FamilyResponse)
def join_family(
    family_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join an existing family by ID"""
    # Verify family exists
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Check if user is already a member
    existing_membership = db.query(UserFamily).filter(
        UserFamily.user_id == current_user.id,
        UserFamily.family_id == family_id
    ).first()
    if existing_membership:
        return FamilyResponse.model_validate(family)
    
    # Join the family
    user_family = UserFamily(user_id=current_user.id, family_id=family_id)
    db.add(user_family)
    db.commit()
    
    return FamilyResponse.model_validate(family)


@router.post("/join-by-name", response_model=FamilyResponse)
def join_family_by_name(
    family_data: FamilyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a family by name, creating it if it doesn't exist (case-insensitive)"""
    from sqlalchemy import func
    
    # Normalize family name for case-insensitive matching
    normalized_name = family_data.name.lower()
    
    # Check if family exists (case-insensitive)
    # First try exact match
    family = db.query(Family).filter(Family.name == family_data.name).first()
    if not family:
        # Try case-insensitive match
        family = db.query(Family).filter(func.lower(Family.name) == normalized_name).first()
    
    if not family:
        # Create family if it doesn't exist (use the exact name provided)
        family = Family(name=family_data.name)
        db.add(family)
        db.flush()
    
    # Check if user is already a member
    existing_membership = db.query(UserFamily).filter(
        UserFamily.user_id == current_user.id,
        UserFamily.family_id == family.id
    ).first()
    if existing_membership:
        return FamilyResponse.model_validate(family)
    
    # Join the family
    user_family = UserFamily(user_id=current_user.id, family_id=family.id)
    db.add(user_family)
    db.commit()
    db.refresh(family)
    
    return FamilyResponse.model_validate(family)


@router.get("/{family_id}/members", response_model=list[dict])
def get_family_members(
    family_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all members of a family (only if current user is a member)"""
    # Verify user is a member of this family
    user_family = db.query(UserFamily).filter(
        UserFamily.user_id == current_user.id,
        UserFamily.family_id == family_id
    ).first()
    
    if not user_family:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this family"
        )
    
    # Get all members
    user_families = db.query(UserFamily).filter(UserFamily.family_id == family_id).all()
    user_ids = [uf.user_id for uf in user_families]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    return [
        {
            "id": str(user.id),
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email
        }
        for user in users
    ]


class GroqApiKeyRequest(BaseModel):
    groq_api_key: str
    date: Optional[str] = None  # Format: YYYY-MM-DD


class FamilySummaryResponse(BaseModel):
    summary: str
    total_posts: int
    date: str
    users_active: int


class UserSummaryResponse(BaseModel):
    user_id: UUID
    username: str
    date: str
    post_summary: str
    sentiment: str  # Free text description
    posts_count: int
    messages_with_you: Optional[dict] = None


@router.post("/summary", response_model=FamilySummaryResponse)
def get_family_summary(
    request: GroqApiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    family_id: UUID = Depends(get_current_family_id)
):
    """
    Generate daily summary of all family posts
    Requires Groq API key from user
    """
    try:
        # Parse date or use today
        target_date = datetime.strptime(request.date, "%Y-%m-%d").date() if request.date else date.today()
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        # Get all posts from the day in the current family
        posts = db.query(Post).filter(
            and_(
                Post.family_id == family_id,
                Post.created_at >= start_datetime,
                Post.created_at <= end_datetime
            )
        ).order_by(Post.created_at.desc()).all()
        
        # Get all users in this family
        user_families = db.query(UserFamily).filter(UserFamily.family_id == family_id).all()
        user_ids = [uf.user_id for uf in user_families]
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        
        # Format posts for LLM
        posts_data = []
        for post in posts:
            posts_data.append({
                "id": str(post.id),
                "content": post.content,
                "user": {
                    "id": str(post.user_id),
                    "username": post.user.username
                },
                "created_at": post.created_at.isoformat()
            })
        
        users_data = [{"id": str(u.id), "username": u.username} for u in users]
        
        # Initialize LLM service
        llm_service = GroqLLMService(request.groq_api_key)
        
        # Generate summary
        summary = llm_service.generate_family_summary(posts_data, users_data)
        
        # Get unique active users
        active_user_ids = set(post.user_id for post in posts)
        
        return FamilySummaryResponse(
            summary=summary,
            total_posts=len(posts),
            date=target_date.isoformat(),
            users_active=len(active_user_ids)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating summary: {str(e)}"
        )


@router.post("/users/{user_id}/summary", response_model=UserSummaryResponse)
def get_user_summary(
    user_id: UUID,
    request: GroqApiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    family_id: UUID = Depends(get_current_family_id)
):
    """
    Get individual user's daily summary and sentiment analysis
    Includes analysis of their posts and messages with current user
    Sentiment is returned as free text description (not a score)
    """
    try:
        # Verify user exists and is in the same family
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify target user is in the same family
        target_user_family = db.query(UserFamily).filter(
            UserFamily.user_id == user_id,
            UserFamily.family_id == family_id
        ).first()
        if not target_user_family:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a member of this family"
            )
        
        # Parse date or use today
        target_date = datetime.strptime(request.date, "%Y-%m-%d").date() if request.date else date.today()
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        # Get user's posts from the day in this family
        user_posts = db.query(Post).filter(
            and_(
                Post.family_id == family_id,
                Post.user_id == user_id,
                Post.created_at >= start_datetime,
                Post.created_at <= end_datetime
            )
        ).order_by(Post.created_at.desc()).all()
        
        # Get messages between current user and target user from the day in this family
        messages = db.query(Message).filter(
            and_(
                Message.family_id == family_id,
                Message.created_at >= start_datetime,
                Message.created_at <= end_datetime,
                (
                    (Message.sender_id == current_user.id and Message.recipient_id == user_id) |
                    (Message.sender_id == user_id and Message.recipient_id == current_user.id)
                )
            )
        ).order_by(Message.created_at.desc()).all()
        
        # Format data for LLM
        posts_data = [{
            "id": str(p.id),
            "content": p.content,
            "created_at": p.created_at.isoformat()
        } for p in user_posts]
        
        messages_data = [{
            "id": str(m.id),
            "content": m.content,
            "sender_id": str(m.sender_id),
            "created_at": m.created_at.isoformat()
        } for m in messages]
        
        # Initialize LLM service
        llm_service = GroqLLMService(request.groq_api_key)
        
        # Generate summary and sentiment
        result = llm_service.generate_user_summary(posts_data, messages_data)
        
        # Add message analysis if messages exist
        messages_with_you = None
        if messages:
            messages_with_you = {
                "count": len(messages),
                "summary": f"You exchanged {len(messages)} messages today."
            }
        
        return UserSummaryResponse(
            user_id=user_id,
            username=target_user.username,
            date=target_date.isoformat(),
            post_summary=result["post_summary"],
            sentiment=result["sentiment"],
            posts_count=len(user_posts),
            messages_with_you=messages_with_you
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating user summary: {str(e)}"
        )

