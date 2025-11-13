import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api.routes import auth, users, posts, comments, search, messages, family

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Family Social Media API", version="1.0.0")

# CORS middleware - supports both local and production
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add production frontend URL if provided
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(search.router)
app.include_router(messages.router)
app.include_router(family.router)


@app.get("/")
def root():
    return {"message": "Family Social Media API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

