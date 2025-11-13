# Deployment Guide

This guide covers deploying the Family Gram application to production using Render.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Render Setup](#render-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- GitHub account with repository pushed
- Render account (sign up at https://render.com)
- Groq API key (for Family Insights feature - optional)

## Render Setup

### 1. Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended for easy repo connection)
3. Verify your email

### 2. Connect GitHub Repository

1. In Render dashboard, go to **New** → **Blueprint** (or create services individually)
2. Connect your GitHub account if not already connected
3. Select your repository: `family-gram` (or your repo name)

## Database Setup

### Create PostgreSQL Database

1. In Render dashboard, click **New** → **PostgreSQL**
2. Configure the database:
   - **Name**: `family-gram-db`
   - **Database**: `familygram`
   - **User**: `familygram`
   - **PostgreSQL Version**: `15`
   - **Region**: Choose closest to your users (or same as services)
   - **Plan**: `Free` (or upgrade as needed)
3. Click **Create Database**
4. **Save the connection details**:
   - Internal Database URL (for services in same region)
   - External Database URL (for external connections)
   - Username and Password

### Database Connection String Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://familygram:password@dpg-xxxxx-a.oregon-postgres.render.com/familygram
```

## Backend Deployment

### Step 1: Create Backend Web Service

1. In Render dashboard, click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:

#### Basic Settings

- **Name**: `family-gram-backend`
- **Region**: Same as database (recommended)
- **Branch**: `main` (or your production branch)
- **Root Directory**: (leave blank)

#### Environment Settings

- **Environment**: `Docker`
- **Dockerfile Path**: `backend/Dockerfile`
- **Docker Context**: `backend`

#### Plan

- **Plan**: `Free` (or upgrade as needed)

#### Environment Variables

Add the following environment variables:

```
DATABASE_URL=postgresql://familygram:password@dpg-xxxxx-a/familygram
```
(Use the **internal database URL** - without the `.oregon-postgres.render.com` part)

```
JWT_SECRET_KEY=your-generated-secret-key-here
```
(Generate using: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

```
JWT_ALGORITHM=HS256
```

```
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

```
FRONTEND_URL=https://family-gram-frontend.onrender.com
```
(Update this after frontend is deployed with the actual frontend URL)

#### Advanced Settings

- **Auto-Deploy**: `Yes` (deploys on push to main branch)
- **Health Check Path**: `/health`

### Step 2: Deploy

1. Click **Create Web Service**
2. Wait for build to complete (5-10 minutes first time)
3. Note your backend URL: `https://family-gram-backend.onrender.com`

### Step 3: Verify Backend

1. Test health endpoint: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"healthy"}`
2. Test API docs: `https://your-backend-url.onrender.com/docs`
   - Should show FastAPI Swagger UI

## Frontend Deployment

### Step 1: Create Frontend Web Service

1. In Render dashboard, click **New** → **Web Service**
2. Connect your GitHub repository (same repo)
3. Configure the service:

#### Basic Settings

- **Name**: `family-gram-frontend`
- **Region**: Same as backend (recommended)
- **Branch**: `main` (or your production branch)
- **Root Directory**: (leave blank)

#### Environment Settings

- **Environment**: `Docker`
- **Dockerfile Path**: `frontend/Dockerfile`
- **Docker Context**: `frontend`

#### Plan

- **Plan**: `Free` (or upgrade as needed)

#### Environment Variables

Add the following environment variable:

```
VITE_API_URL=https://family-gram-backend.onrender.com
```
(Use your actual backend URL from the previous step)

**Note**: Since Vite embeds environment variables at build time, the `VITE_API_URL` must be set before the first build. If you need to change it later, you'll need to rebuild.

#### Advanced Settings

- **Auto-Deploy**: `Yes` (deploys on push to main branch)

### Step 2: Deploy

1. Click **Create Web Service**
2. Wait for build to complete (5-10 minutes first time)
3. Note your frontend URL: `https://family-gram-frontend.onrender.com`

### Step 3: Update Backend CORS

1. Go to your backend service in Render
2. Navigate to **Environment** tab
3. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   FRONTEND_URL=https://family-gram-frontend.onrender.com
   ```
4. Save (this will trigger a redeploy)

### Step 4: Verify Frontend

1. Open your frontend URL in browser
2. Test signup/login
3. Test creating posts
4. Check browser console for errors

## Environment Variables Summary

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (internal) | `postgresql://user:pass@host/db` |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Generated random string |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://family-gram-frontend.onrender.com` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://family-gram-backend.onrender.com` |

## Post-Deployment

### 1. Test Full Application Flow

- [ ] Sign up new account
- [ ] Log in
- [ ] Create posts
- [ ] Add comments
- [ ] Like/dislike posts
- [ ] Send messages
- [ ] Test Family Insights (requires Groq API key)

### 2. Monitor Logs

- Check backend logs in Render dashboard
- Check frontend logs in Render dashboard
- Monitor for errors or warnings

### 3. Set Up Custom Domain (Optional)

1. Go to service settings
2. Navigate to **Custom Domains**
3. Add your domain
4. Follow DNS configuration instructions

## Troubleshooting

### CORS Errors

**Problem**: Frontend can't connect to backend, CORS errors in browser console.

**Solution**:
1. Verify `FRONTEND_URL` in backend environment variables matches frontend URL exactly
2. Ensure no trailing slash in `FRONTEND_URL`
3. Redeploy backend after updating `FRONTEND_URL`
4. Hard refresh frontend (Ctrl+Shift+R or Cmd+Shift+R)

### Database Connection Errors

**Problem**: Backend can't connect to database.

**Solution**:
1. Verify `DATABASE_URL` uses **internal** database URL (not external)
2. Check database is running and healthy in Render dashboard
3. Verify credentials are correct
4. Check backend logs for specific error messages

### Frontend Shows Old API URL

**Problem**: Frontend still calling wrong backend URL.

**Solution**:
1. `VITE_API_URL` is embedded at build time
2. Update `VITE_API_URL` environment variable
3. Trigger manual rebuild: **Manual Deploy** → **Clear build cache & deploy**

### Build Failures

**Problem**: Docker build fails on Render.

**Solution**:
1. Check build logs in Render dashboard
2. Verify Dockerfile paths are correct:
   - Backend: `backend/Dockerfile`
   - Frontend: `frontend/Dockerfile`
3. Verify Docker context is correct:
   - Backend: `backend`
   - Frontend: `frontend`
4. Ensure all required files are committed to Git

### Services Not Starting

**Problem**: Service shows as "Live" but not responding.

**Solution**:
1. Check service logs for errors
2. Verify health check endpoint is accessible
3. Check if service is in "Sleeping" state (free tier limitation)
4. Wait a few seconds for service to wake up

## Free Tier Limitations

### Render Free Tier

- **Services**: Services spin down after 15 minutes of inactivity
- **Database**: Limited to 90 days retention, 1GB storage
- **Build Time**: Limited build minutes per month
- **Sleep Mode**: Services wake up on first request (may take 30-60 seconds)

### Recommendations

- For production with real users, consider upgrading to paid plans
- Monitor usage and upgrade before hitting limits
- Set up uptime monitoring to keep services awake

## Local vs Production

### Local Development

- Uses `docker-compose.yml` with `Dockerfile.dev` for frontend
- Vite dev server with hot reload
- Development database in Docker
- Access at `http://localhost:3000`

### Production

- Uses `Dockerfile` for both services (production builds)
- Nginx for frontend (optimized static files)
- Production database on Render
- Access at your Render URLs

## Continuous Deployment

The application supports two deployment methods:

### Method 1: Render Auto-Deploy (Recommended)

Render can automatically deploy when you push to the `main` branch:

1. In each service (backend and frontend) settings
2. Enable **Auto-Deploy** → **Yes**
3. Set **Branch** → `main`
4. Every push to `main` will trigger automatic deployment

### Method 2: GitHub Actions Workflow

For more control, use the GitHub Actions workflow that triggers Render deployments via API:

1. **Get Render API Key**:
   - Go to Render Dashboard → Account Settings → API Keys
   - Click "Create API Key"
   - Give it a name (e.g., "GitHub Actions")
   - Copy the key (you won't see it again!)

2. **Get Service IDs**:
   - **Backend Service ID**:
     - Go to your backend service in Render
     - Look at the URL: `https://dashboard.render.com/web/[SERVICE_ID]`
     - The Service ID is the long string in the URL
     - Or go to Settings → scroll to bottom to see Service ID
   - **Frontend Service ID**:
     - Repeat the same process for your frontend service

3. **Add GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to: **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add these three secrets:
     - **Name**: `RENDER_API_KEY`
       **Value**: Your Render API key
     - **Name**: `RENDER_SERVICE_ID_BACKEND`
       **Value**: Your backend service ID
     - **Name**: `RENDER_SERVICE_ID_FRONTEND`
       **Value**: Your frontend service ID

4. **Workflow is ready**:
   - The workflow (`.github/workflows/deploy.yml`) will automatically run on push to `main`
   - You can also manually trigger it: **Actions** → **Deploy to Render** → **Run workflow**
   - The workflow uses Render's REST API to trigger deployments

**Note**: The workflow triggers deployments but doesn't wait for them to complete. Check the Render dashboard to monitor deployment progress.

See [GitHub Actions Workflow](../.github/workflows/deploy.yml) for the workflow file.

## Security Notes

1. **Never commit secrets** to Git
2. **Use environment variables** for all sensitive data
3. **Rotate JWT_SECRET_KEY** periodically
4. **Keep dependencies updated** for security patches
5. **Monitor logs** for suspicious activity

## Support

For issues:
1. Check Render service logs
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Review this troubleshooting section
5. Check Render documentation: https://render.com/docs

