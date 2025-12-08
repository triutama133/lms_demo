import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load Supabase credentials
SUPABASE_URL1 = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY1 = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_URL2 = os.getenv('SUPABASE_URL2')
SUPABASE_ANON_KEY2 = os.getenv('SUPABASE_ANON_KEY2')

# Validate required environment variables
if not all([SUPABASE_URL1, SUPABASE_ANON_KEY1, SUPABASE_URL2, SUPABASE_ANON_KEY2]):
    raise ValueError("Missing required Supabase environment variables")

# Connect to Supabase instances
supabase1 = create_client(SUPABASE_URL1, SUPABASE_ANON_KEY1)
supabase2 = create_client(SUPABASE_URL2, SUPABASE_ANON_KEY2)

# List of tables to migrate in order (considering foreign key dependencies)
tables = [
    'users',
    'categories',
    'courses',
    'materials',
    'material_sections',
    'enrollments',
    'progress',
    'user_categories',
    'course_ratings'
]

def migrate_table(table_name):
    print(f"Migrating table: {table_name}")

    try:
        # Get all data from source Supabase
        response1 = supabase1.table(table_name).select('*').execute()
        data = response1.data

        if not data:
            print(f"No data in {table_name}")
            return

        print(f"Found {len(data)} records in {table_name}")

        # Insert data to destination Supabase
        # Note: This will fail if records already exist. For full migration, you might need to truncate first.
        response2 = supabase2.table(table_name).insert(data).execute()

        print(f"Successfully migrated {len(data)} records to {table_name}")

    except Exception as e:
        print(f"Error migrating {table_name}: {e}")

# Migrate all tables
print("Starting database migration from Supabase 1 to Supabase 2...")
for table in tables:
    migrate_table(table)

print("Database migration completed!")