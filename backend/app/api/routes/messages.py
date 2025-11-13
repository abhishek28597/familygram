from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from uuid import UUID

from app.database import get_db
from app.models import User, Message
from app.schemas import MessageCreate, MessageResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("", response_model=list[MessageResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get all unique conversations (users who sent or received messages)
    conversations = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id
        )
    ).order_by(Message.created_at.desc()).all()
    
    # Group by other user and get latest message
    user_conversations = {}
    for msg in conversations:
        other_user_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        if other_user_id not in user_conversations:
            user_conversations[other_user_id] = msg
    
    return list(user_conversations.values())


@router.get("/{user_id}", response_model=list[MessageResponse])
def get_conversation(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user exists
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == user_id),
            and_(Message.sender_id == user_id, Message.recipient_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).all()
    
    return messages


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify recipient exists
    recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    if recipient.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    db_message = Message(
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        content=message_data.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@router.put("/{message_id}/read", response_model=MessageResponse)
def mark_message_read(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark this message as read"
        )
    
    message.is_read = True
    db.commit()
    db.refresh(message)
    return message


@router.get("/unread-count", response_model=dict)
def get_unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Message).filter(
        and_(
            Message.recipient_id == current_user.id,
            Message.is_read == False
        )
    ).count()
    
    return {"unread_count": count}

