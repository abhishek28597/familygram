from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models import User, Post
from app.schemas import UserResponse, UserUpdate, PostResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    # Get all users except the current user
    users = db.query(User).filter(User.id != current_user.id).order_by(User.username).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/{user_id}/posts", response_model=list[PostResponse])
def get_user_posts(user_id: UUID, db: Session = Depends(get_db), skip: int = 0, limit: int = 50):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    posts = db.query(Post).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    
    db.commit()
    db.refresh(current_user)
    return current_user

