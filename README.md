# Family Social Media Application

A minimal Twitter-like social media application for small family groups (5-10 users) built with FastAPI backend and React frontend.

## Features

- User authentication (signup/login)
- Text posts with comments
- Like/dislike reactions on posts
- User profiles
- Keyword search for posts
- Direct messaging between users
- **Family Insights** - AI-powered daily summaries and sentiment analysis (requires Groq API key)

## Tech Stack

- **Backend**: Python 3.11+ with FastAPI
- **Frontend**: React 18+ with Vite
- **Database**: PostgreSQL (Docker container)
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Git

### Running the Application

1. Clone the repository

2. (Optional) Create a `.env` file in the root directory to customize settings:
   ```
   POSTGRES_USER=familygram
   POSTGRES_PASSWORD=familygram123
   POSTGRES_DB=familygram
   JWT_SECRET_KEY=your-secret-key-change-in-production
   ```
   Note: Default values are already set in docker-compose.yml, so this step is optional.

3. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```
   This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 8000
   - Frontend on port 3000

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

5. Create your first account by clicking "Sign up" on the login page.

### Development (Without Docker)

For local development without Docker, you'll need to set up the database and environment variables:

#### Backend
1. Create a `.env` file in the `backend/` directory:
   ```
   DATABASE_URL=postgresql://familygram:familygram123@localhost:5432/familygram
   JWT_SECRET_KEY=your-secret-key-change-in-production
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

2. Set up and run:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

#### Frontend
1. Create a `.env` file in the `frontend/` directory:
   ```
   VITE_API_URL=http://localhost:8000
   ```

2. Set up and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Project Structure

```
family_gram/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── docs/            # System design documentation
└── docker-compose.yml
```

## System Design Documentation

Detailed system design diagrams and documentation are available in the [`docs/`](./docs/) folder:

- **[System Architecture](./docs/system-architecture.md)** - High-level architecture, service communication, and technology stack
- **[Authentication Flow](./docs/authentication-flow.md)** - Complete authentication process, JWT token lifecycle, and security features
- **[Data Model Design](./docs/data-model.md)** - Entity relationship diagrams, database schema, and data relationships

### Quick Overview

The application follows a microservices architecture with:
- **Frontend**: React SPA that communicates with backend via REST API
- **Backend**: FastAPI service handling business logic and authentication
- **Database**: PostgreSQL storing all application data

Authentication uses JWT tokens with bcrypt password hashing. See the [authentication flow documentation](./docs/authentication-flow.md) for details.

## Family Insights Feature

The Family Insights feature uses AI (via Groq API) to provide:
- **Daily Family Summary**: AI-generated summary of all family posts for the day
- **User Sentiment Analysis**: Individual user summaries with mood/sentiment analysis based on their posts and messages

### Setup

1. Get a Groq API key from [Groq Console](https://console.groq.com)
2. Navigate to the "Family" tab in the application
3. Enter your Groq API key (stored locally in your browser, per user)
4. Click "Request Family Summary" to generate AI summaries

### Features

- **On-demand generation**: Summaries are generated on-demand, not stored in the database
- **User-specific API keys**: Each user's API key is stored separately in browser localStorage
- **Automatic fallback**: If the primary model (`llama-3.3-70b-versatile`) hits rate limits, it automatically falls back to `llama-3.1-8b-instant`
- **Privacy**: API keys are never sent to the server except during API calls to Groq

### API Endpoints

- `POST /api/family/summary` - Generate family daily summary
- `POST /api/family/users/{user_id}/summary` - Generate user-specific summary and sentiment

## API Endpoints

See the API documentation at http://localhost:8000/docs when the backend is running.

