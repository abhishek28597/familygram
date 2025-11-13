from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.models import Post
from app.schemas import PostResponse, SearchResponse

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search_posts(q: str = Query(..., min_length=1), db: Session = Depends(get_db), skip: int = 0, limit: int = 50):
    if not q:
        return SearchResponse(posts=[], total=0)
    
    # Use PostgreSQL full-text search
    search_term = f"%{q.lower()}%"
    query = db.query(Post).filter(
        func.lower(Post.content).like(search_term)
    )
    
    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    return SearchResponse(posts=posts, total=total)

