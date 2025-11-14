# Database Cleanup Script

This script allows you to completely clean the database and recreate all tables with the current schema. This is useful after making data model changes.

## ⚠️ WARNING

**This script will delete ALL data in the database!** Use with caution.

## Usage

### Option 1: Using the shell script (Recommended)

From the project root directory:

```bash
./scripts/clean_db.sh
```

### Option 2: Using docker-compose exec directly

```bash
docker-compose exec backend python /app/scripts/clean_db.py
```

### Option 3: Running locally (if not using Docker)

Make sure you have the database running and environment variables set:

```bash
cd backend
python scripts/clean_db.py
```

## What it does

1. Drops all existing tables in the database
2. Recreates all tables using the current SQLAlchemy models
3. Verifies that tables were created successfully

## Requirements

- Docker and docker-compose installed (for Option 1 and 2)
- Backend container must be running
- Database must be accessible

## Example Output

```
============================================================
Database Cleanup Script
============================================================

⚠️  WARNING: This will delete ALL data in the database!

Are you sure you want to delete ALL data? (yes/no): yes
✓ Connected to database

📋 Dropping all tables...
✓ All tables dropped successfully

🔨 Creating tables with current schema...
✓ All tables created successfully

🔍 Verifying tables...
✓ Found 7 tables:
  - comments
  - families
  - messages
  - post_reactions
  - posts
  - user_families
  - users

============================================================
✅ Database cleanup completed successfully!
============================================================

The database is now clean and ready for fresh data.
You can now start using the application.
```

