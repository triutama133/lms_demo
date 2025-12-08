import os
from supabase import create_client
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load environment variables for security
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
VPS_HOST = os.getenv('VPS_HOST')
VPS_DB = os.getenv('VPS_DB')
VPS_USER = os.getenv('VPS_USER')
VPS_PASSWORD = os.getenv('VPS_PASSWORD')

if not all([SUPABASE_URL, SUPABASE_ANON_KEY, VPS_HOST, VPS_DB, VPS_USER, VPS_PASSWORD]):
    raise ValueError("Missing required environment variables. Set SUPABASE_URL, SUPABASE_ANON_KEY, VPS_HOST, VPS_DB, VPS_USER, VPS_PASSWORD")

# Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Connect to VPS PostgreSQL
vps_conn = psycopg2.connect(
    host=VPS_HOST,
    database=VPS_DB,
    user=VPS_USER,
    password=VPS_PASSWORD
)
vps_cur = vps_conn.cursor()

# Tables to migrate
tables = [
    'users',
    'categories',
    'courses',
    'enrollments',
    'progress',
    'user_categories',
    'course_ratings',
    'materials',
    'material_sections'
]

# Define default category
DEFAULT_CATEGORY = {
    'id': 1,
    'name': 'Public',
    'description': 'Open for all registered users'
}

def migrate_table(table_name):
    print(f"Migrating {table_name}...")
    try:
        # Fetch data from Supabase
        response = supabase.table(table_name).select('*').execute()
        data = response.data

        if not data:
            print(f"No data in {table_name}")
            return

        # Special handling for categories: Ensure default category exists
        if table_name == 'categories':
            # Check if default category exists in Supabase data
            has_default = any(record.get('id') == DEFAULT_CATEGORY['id'] for record in data)
            if not has_default:
                data.insert(0, DEFAULT_CATEGORY)  # Add default at the beginning
                print("Added default category to migration data")

        # Special handling for courses: Set default category if category_id is null
        if table_name == 'courses':
            for record in data:
                if record.get('category_id') is None:
                    record['category_id'] = DEFAULT_CATEGORY['id']
                    print(f"Set default category for course {record.get('id')}")

        # Get columns
        columns = list(data[0].keys())
        quoted_columns = [f'"{col}"' for col in columns]

        # Fetch existing data from VPS for comparison
        try:
            vps_cur.execute(f"SELECT * FROM {table_name}")
            existing_rows = vps_cur.fetchall()

            # Get column names from database to ensure correct mapping
            vps_cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' ORDER BY ordinal_position")
            db_columns = [row[0] for row in vps_cur.fetchall()]

            # Create mapping from database columns to our data columns
            existing_data = {}
            for row in existing_rows:
                row_dict = {}
                for i, col_name in enumerate(db_columns):
                    if col_name in columns:
                        row_dict[col_name] = row[i]
                if 'id' in row_dict:
                    existing_data[row_dict['id']] = row_dict

            print(f"Found {len(existing_data)} existing records in {table_name}")

        except psycopg2.Error as e:
            print(f"Could not fetch existing data for {table_name}: {e}")
            print("Proceeding without comparison (will use UPSERT)")
            existing_data = {}

        # Analyze data for insert/update/skip
        to_insert = []
        to_update = []
        to_skip = []

        for record in data:
            record_id = record.get('id')
            if not record_id:
                print(f"Warning: Record without ID found in {table_name}, skipping")
                continue

            if record_id in existing_data:
                # Compare all fields
                existing_record = existing_data[record_id]
                is_different = False

                for col in columns:
                    if col not in existing_record:
                        # New column, consider as different
                        is_different = True
                        break

                    # Handle None/null values
                    existing_val = existing_record[col]
                    new_val = record[col]

                    # Convert both to string for comparison to handle type differences
                    existing_str = str(existing_val) if existing_val is not None else ''
                    new_str = str(new_val) if new_val is not None else ''

                    if existing_str != new_str:
                        is_different = True
                        break

                if is_different:
                    to_update.append(record)
                else:
                    to_skip.append(record_id)
            else:
                to_insert.append(record)

        print(f"Analysis complete for {table_name}:")
        print(f"- {len(to_insert)} records to insert")
        print(f"- {len(to_update)} records to update")
        print(f"- {len(to_skip)} records identical (skipped)")

        # Process inserts
        if to_insert:
            placeholders = ', '.join(['%s'] * len(columns))
            insert_query = f"INSERT INTO {table_name} ({', '.join(quoted_columns)}) VALUES ({placeholders})"

            batch_size = 50
            for i in range(0, len(to_insert), batch_size):
                batch = to_insert[i:i + batch_size]
                values = [tuple(record[col] for col in columns) for record in batch]

                try:
                    vps_cur.executemany(insert_query, values)
                    vps_conn.commit()
                    print(f"Inserted batch {i//batch_size + 1} ({len(batch)} records)")
                except psycopg2.Error as e:
                    vps_conn.rollback()
                    print(f"Error inserting batch {i//batch_size + 1} in {table_name}: {e}")

        # Process updates
        if to_update:
            update_columns = [col for col in columns if col != 'id']
            if update_columns:
                set_clause = ', '.join([f'"{col}" = %s' for col in update_columns])
                update_query = f"UPDATE {table_name} SET {set_clause} WHERE id = %s"

                for record in to_update:
                    try:
                        update_values = [record[col] for col in update_columns] + [record['id']]
                        vps_cur.execute(update_query, update_values)
                        vps_conn.commit()
                    except psycopg2.Error as e:
                        vps_conn.rollback()
                        print(f"Error updating record {record['id']} in {table_name}: {e}")

                print(f"Updated {len(to_update)} records")

        print(f"Successfully processed {table_name}:")
        print(f"- Inserted: {len(to_insert)} records")
        print(f"- Updated: {len(to_update)} records")
        print(f"- Skipped: {len(to_skip)} records (identical)")

    except Exception as e:
        print(f"Error migrating {table_name}: {e}")
        vps_conn.rollback()

# Run migration for all tables
for table in tables:
    migrate_table(table)

vps_cur.close()
vps_conn.close()
print("Migration completed!")