#!/usr/bin/env python3
"""
Database Cleanup Script

This script drops all tables and recreates them with the current schema.
Use this when you want to start fresh after data model changes.

WARNING: This will delete ALL data in the database!
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine, Base
from app.models import (
    Family,
    UserFamily,
    User,
    Post,
    Comment,
    PostReaction,
    Message
)


def clean_database():
    """Drop all tables and recreate them"""
    print("=" * 60)
    print("Database Cleanup Script")
    print("=" * 60)
    print("\n⚠️  WARNING: This will delete ALL data in the database!")
    print()
    
    try:
        # Connect to database
        with engine.connect() as conn:
            print("✓ Connected to database")
            
            # Drop all tables
            print("\n📋 Dropping all tables...")
            Base.metadata.drop_all(bind=engine)
            print("✓ All tables dropped successfully")
            
            # Recreate all tables
            print("\n🔨 Creating tables with current schema...")
            Base.metadata.create_all(bind=engine)
            print("✓ All tables created successfully")
            
            # Verify tables exist
            print("\n🔍 Verifying tables...")
            with conn.begin():
                result = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name;
                """))
                tables = [row[0] for row in result]
                
            if tables:
                print(f"✓ Found {len(tables)} tables:")
                for table in tables:
                    print(f"  - {table}")
            else:
                print("⚠️  No tables found (this might be expected if schema is empty)")
            
            print("\n" + "=" * 60)
            print("✅ Database cleanup completed successfully!")
            print("=" * 60)
            print("\nThe database is now clean and ready for fresh data.")
            print("You can now start using the application.\n")
            
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ Error during database cleanup:")
        print("=" * 60)
        print(f"\n{str(e)}\n")
        sys.exit(1)


if __name__ == "__main__":
    # Check for non-interactive mode (for CI/CD)
    auto_confirm = os.getenv("AUTO_CONFIRM", "").lower() in ['true', 'yes', '1']
    
    if not auto_confirm:
        # Ask for confirmation
        response = input("Are you sure you want to delete ALL data? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("\nOperation cancelled.")
            sys.exit(0)
    else:
        print("⚠️  AUTO_CONFIRM is set. Proceeding without interactive confirmation...")
        print()
    
    clean_database()

