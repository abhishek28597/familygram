from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.models import Post
from app.schemas import PostResponse, SearchResponse
from app.auth import get_current_family_id
from uuid import UUID

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search_posts(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    family_id: UUID = Depends(get_current_family_id)
):
    if not q:
        return SearchResponse(posts=[], total=0)
    
    # Use PostgreSQL full-text search, filtered by family
    search_term = f"%{q.lower()}%"
    query = db.query(Post).filter(
        Post.family_id == family_id,
        func.lower(Post.content).like(search_term)
    )
    
    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    return SearchResponse(posts=posts, total=total)

