from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.database import get_db
from app.models import User, Post, PostReaction, ReactionType
from app.schemas import PostCreate, PostUpdate, PostResponse, ReactionResponse
from app.auth import get_current_user, get_current_family_id

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=list[PostResponse])
def get_posts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    family_id: UUID = Depends(get_current_family_id)
):
    posts = db.query(Post).filter(
        Post.family_id == family_id
    ).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
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
    return post


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    family_id: UUID = Depends(get_current_family_id)
):
    db_post = Post(
        user_id=current_user.id,
        family_id=family_id,
        content=post_data.content
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: UUID,
    post_data: PostUpdate,
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
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    post.content = post_data.content
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: UUID,
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
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    db.delete(post)
    db.commit()
    return None


@router.post("/{post_id}/like", response_model=ReactionResponse)
def like_post(
    post_id: UUID,
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
    
    # Check if user already reacted
    existing_reaction = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == current_user.id
    ).first()
    
    if existing_reaction:
        if existing_reaction.reaction_type == ReactionType.LIKE:
            # Already liked, return existing
            return existing_reaction
        else:
            # Change from dislike to like
            existing_reaction.reaction_type = ReactionType.LIKE
            post.dislikes_count -= 1
            post.likes_count += 1
            db.commit()
            db.refresh(existing_reaction)
            return existing_reaction
    else:
        # Create new like
        reaction = PostReaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction_type=ReactionType.LIKE
        )
        post.likes_count += 1
        db.add(reaction)
        db.commit()
        db.refresh(reaction)
        return reaction


@router.post("/{post_id}/dislike", response_model=ReactionResponse)
def dislike_post(
    post_id: UUID,
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
    
    # Check if user already reacted
    existing_reaction = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == current_user.id
    ).first()
    
    if existing_reaction:
        if existing_reaction.reaction_type == ReactionType.DISLIKE:
            # Already disliked, return existing
            return existing_reaction
        else:
            # Change from like to dislike
            existing_reaction.reaction_type = ReactionType.DISLIKE
            post.likes_count -= 1
            post.dislikes_count += 1
            db.commit()
            db.refresh(existing_reaction)
            return existing_reaction
    else:
        # Create new dislike
        reaction = PostReaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction_type=ReactionType.DISLIKE
        )
        post.dislikes_count += 1
        db.add(reaction)
        db.commit()
        db.refresh(reaction)
        return reaction


@router.delete("/{post_id}/reaction", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction(
    post_id: UUID,
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
    
    reaction = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == current_user.id
    ).first()
    
    if not reaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )
    
    # Update counts
    if reaction.reaction_type == ReactionType.LIKE:
        post.likes_count -= 1
    else:
        post.dislikes_count -= 1
    
    db.delete(reaction)
    db.commit()
    return None

