from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models import User, Post, Comment
from app.schemas import CommentCreate, CommentUpdate, CommentResponse
from app.auth import get_current_user, get_current_family_id

router = APIRouter(prefix="/api", tags=["comments"])


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
def get_comments(
    post_id: UUID,
    db: Session = Depends(get_db),
    family_id: UUID = Depends(get_current_family_id)
):
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.family_id == family_id
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    return comments


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: UUID,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    family_id: UUID = Depends(get_current_family_id)
):
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.family_id == family_id
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    db_comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    post.comments_count += 1
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    family_id: UUID = Depends(get_current_family_id)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Verify post belongs to active family
    post = db.query(Post).filter(
        Post.id == comment.post_id,
        Post.family_id == family_id
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    family_id: UUID = Depends(get_current_family_id)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Verify post belongs to active family
    post = db.query(Post).filter(
        Post.id == comment.post_id,
        Post.family_id == family_id
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    # Update post comment count
    post.comments_count -= 1
    
    db.delete(comment)
    db.commit()
    return None

