#!/bin/bash

# Database Cleanup Script Wrapper
# This script runs the database cleanup script inside the backend container

echo "=========================================="
echo "Database Cleanup Script"
echo "=========================================="
echo ""
echo "This will delete ALL data from the database!"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose not found. Please install docker-compose."
    exit 1
fi

# Check if backend container is running
if ! docker-compose ps | grep -q "family_gram_backend.*Up"; then
    echo "Error: Backend container is not running."
    echo "Please start the containers first with: docker-compose up -d"
    exit 1
fi

echo "Running database cleanup script..."
echo ""

# Run the cleanup script in the backend container
docker-compose exec backend python /app/scripts/clean_db.py

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Database cleanup completed!"
else
    echo ""
    echo "❌ Database cleanup failed!"
    exit $exit_code
fi

