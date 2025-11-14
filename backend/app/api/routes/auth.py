from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models import User, Family, UserFamily
from app.schemas import UserCreate, UserResponse, Token, LoginResponse, FamilyResponse, FamilySelection
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        bio=user_data.bio
    )
    db.add(db_user)
    db.flush()  # Flush to get user ID
    
    # Create or get families and create user-family associations
    for family_name in user_data.family_names:
        family_name = family_name.strip()
        if not family_name:
            continue
        
        # Normalize family name (lowercase for case-insensitive matching)
        normalized_name = family_name.lower()
        
        # Check if family exists (case-insensitive), if not create it
        # First try exact match, then try case-insensitive
        family = db.query(Family).filter(Family.name == family_name).first()
        if not family:
            # Try case-insensitive match
            from sqlalchemy import func
            family = db.query(Family).filter(func.lower(Family.name) == normalized_name).first()
        
        if not family:
            # Create new family with the exact name provided by user
            family = Family(name=family_name)
            db.add(family)
            db.flush()
        
        # Create user-family association
        user_family = UserFamily(user_id=db_user.id, family_id=family.id)
        db.add(user_family)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    family_id: Optional[str] = Query(None, description="Optional family_id to select at login"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user's families
    user_families = db.query(UserFamily).filter(UserFamily.user_id == user.id).all()
    family_ids = [uf.family_id for uf in user_families]
    families = db.query(Family).filter(Family.id.in_(family_ids)).all()
    family_responses = [FamilyResponse.model_validate(f) for f in families]
    
    # Determine selected family
    selected_family = None
    family_id_for_token = None
    
    if family_id:
        try:
            family_uuid = UUID(family_id)
            # Verify user belongs to selected family
            if family_uuid not in family_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not a member of this family"
                )
            family_id_for_token = family_uuid
            selected_family = next((f for f in family_responses if f.id == family_uuid), None)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid family_id format"
            )
    elif families:
        # Auto-select first family if no selection provided
        family_id_for_token = families[0].id
        selected_family = family_responses[0]
    
    # Create token with family_id
    token_data = {"sub": str(user.id)}
    if family_id_for_token:
        token_data["family_id"] = str(family_id_for_token)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        families=family_responses,
        selected_family=selected_family
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/select-family", response_model=Token)
def select_family(
    family_selection: FamilySelection,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user belongs to the selected family
    user_family = db.query(UserFamily).filter(
        UserFamily.user_id == current_user.id,
        UserFamily.family_id == family_selection.family_id
    ).first()
    
    if not user_family:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this family"
        )
    
    # Create new token with updated family_id
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.id), "family_id": str(family_selection.family_id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

