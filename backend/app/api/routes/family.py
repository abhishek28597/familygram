from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import User, Post, Message
from app.auth import get_current_user
from app.services.llm_service import GroqLLMService

router = APIRouter(prefix="/api/family", tags=["family"])


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
    db: Session = Depends(get_db)
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
        
        # Get all posts from the day
        posts = db.query(Post).filter(
            and_(
                Post.created_at >= start_datetime,
                Post.created_at <= end_datetime
            )
        ).order_by(Post.created_at.desc()).all()
        
        # Get all users
        users = db.query(User).all()
        
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
    db: Session = Depends(get_db)
):
    """
    Get individual user's daily summary and sentiment analysis
    Includes analysis of their posts and messages with current user
    Sentiment is returned as free text description (not a score)
    """
    try:
        # Verify user exists
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Parse date or use today
        target_date = datetime.strptime(request.date, "%Y-%m-%d").date() if request.date else date.today()
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        # Get user's posts from the day
        user_posts = db.query(Post).filter(
            and_(
                Post.user_id == user_id,
                Post.created_at >= start_datetime,
                Post.created_at <= end_datetime
            )
        ).order_by(Post.created_at.desc()).all()
        
        # Get messages between current user and target user from the day
        messages = db.query(Message).filter(
            and_(
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

