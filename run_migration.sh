#!/bin/bash

# Script to run database migration for courses categories
# This script applies the migration to add categories array column to courses table

echo "Running database migration for courses categories..."

# Check if .env file exists and load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set."
    echo "Please set DATABASE_URL in your .env file or environment."
    exit 1
fi

# Run the migration using psql
echo "Applying migration to database..."
psql "$DATABASE_URL" -f database_migration.sql

if [ $? -eq 0 ]; then
    echo "Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify the migration by checking that courses table has 'categories' column"
    echo "2. Test the course category assignment functionality"
    echo "3. Optionally drop the old 'course_categories' table after verification"
else
    echo "Migration failed. Please check the error messages above."
    exit 1
fi