from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    family_names: List[str] = Field(..., min_items=1, description="List of family names to join")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    family_id: Optional[UUID] = None


# Post Schemas
class PostBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class PostResponse(PostBase):
    id: UUID
    user_id: UUID
    family_id: UUID
    created_at: datetime
    updated_at: datetime
    likes_count: int
    dislikes_count: int
    comments_count: int
    user: UserResponse

    class Config:
        from_attributes = True


# Comment Schemas
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentCreate(CommentBase):
    pass


class CommentUpdate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: UUID
    post_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


# Reaction Schemas
class ReactionResponse(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    reaction_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# Message Schemas
class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    recipient_id: UUID


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: UUID
    sender_id: UUID
    family_id: UUID
    is_read: bool
    created_at: datetime
    sender: UserResponse

    class Config:
        from_attributes = True


# Family Schemas
class FamilyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class FamilyCreate(FamilyBase):
    pass


class FamilyResponse(FamilyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FamilySelection(BaseModel):
    family_id: UUID


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    families: List[FamilyResponse]
    selected_family: Optional[FamilyResponse] = None


# Search Schemas
class SearchResponse(BaseModel):
    posts: List[PostResponse]
    total: int

