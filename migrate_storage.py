import os
from supabase import create_client
from minio import Minio
from minio.error import S3Error
import requests
import io
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load environment variables (no fallbacks for security)
SUPABASE_URL = os.getenv('SUPABASE_URL2')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY2')
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY')
MINIO_BUCKET = os.getenv('MINIO_BUCKET')

# Validate required environment variables
required_vars = [
    ('SUPABASE_URL2', SUPABASE_URL),
    ('SUPABASE_ANON_KEY2', SUPABASE_ANON_KEY),
    ('MINIO_ENDPOINT', MINIO_ENDPOINT),
    ('MINIO_ACCESS_KEY', MINIO_ACCESS_KEY),
    ('MINIO_SECRET_KEY', MINIO_SECRET_KEY),
    ('MINIO_BUCKET', MINIO_BUCKET)
]

missing_vars = [name for name, value in required_vars if not value]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Clean MINIO_ENDPOINT (remove http:// if present)
MINIO_ENDPOINT = MINIO_ENDPOINT.replace('http://', '').replace('https://', '')

# Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Connect to MinIO
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # False karena localhost
)

# Create bucket if not exists
try:
    if not minio_client.bucket_exists(MINIO_BUCKET):
        minio_client.make_bucket(MINIO_BUCKET)
        print(f"Bucket '{MINIO_BUCKET}' created.")
except S3Error as err:
    print(f"Error creating bucket: {err}")

# Get list of files from Supabase Storage
bucket_name = 'materials'  # Ganti dengan nama bucket Supabase kamu
files = supabase.storage.from_(bucket_name).list()

def migrate_file(file_info):
    file_name = file_info['name']
    print(f"Checking {file_name}...")

    try:
        # Check if file exists in MinIO
        try:
            minio_stat = minio_client.stat_object(MINIO_BUCKET, file_name)
            minio_exists = True
            minio_size = minio_stat.size
            print(f"File {file_name} exists in MinIO (size: {minio_size} bytes)")
        except S3Error as e:
            if e.code == 'NoSuchKey':
                minio_exists = False
                minio_size = 0
                print(f"File {file_name} does not exist in MinIO")
            else:
                raise e

        # Get file info from Supabase
        # Note: Supabase list() doesn't support search parameter, so we get all files in the directory
        path = file_name.split('/')[:-1] if '/' in file_name else ''
        supabase_info = supabase.storage.from_(bucket_name).list(path)
        if not supabase_info:
            print(f"File {file_name} not found in Supabase info")
            return 'error'

        # Find the specific file in the list
        file_basename = file_name.split('/')[-1]
        supabase_file = next((f for f in supabase_info if f['name'] == file_basename), None)
        if not supabase_file:
            print(f"File {file_name} not found in Supabase")
            return 'error'

        supabase_size = supabase_file.get('metadata', {}).get('size', 0)

        # Compare file sizes
        if minio_exists and minio_size == supabase_size:
            print(f"✅ File {file_name} is identical (size: {minio_size} bytes) - SKIPPED")
            return 'skipped'
        elif minio_exists and minio_size != supabase_size:
            print(f"📝 File {file_name} exists but different size (MinIO: {minio_size}, Supabase: {supabase_size}) - WILL UPDATE")
        else:
            print(f"🆕 File {file_name} is new (size: {supabase_size} bytes) - WILL MIGRATE")

        # Download from Supabase
        print(f"Downloading {file_name} from Supabase...")
        file_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        response = requests.get(file_url)
        response.raise_for_status()

        # Verify downloaded size matches expected
        downloaded_size = len(response.content)
        if downloaded_size != supabase_size:
            print(f"⚠️  Warning: Downloaded size ({downloaded_size}) doesn't match expected size ({supabase_size}) for {file_name}")

        # Upload to MinIO
        print(f"Uploading {file_name} to MinIO...")
        minio_client.put_object(
            MINIO_BUCKET,
            file_name,
            io.BytesIO(response.content),
            len(response.content),
            content_type=response.headers.get('content-type', 'application/octet-stream')
        )

        if minio_exists:
            print(f"✅ Updated {file_name} in MinIO (size: {downloaded_size} bytes)")
            return 'updated'
        else:
            print(f"✅ Migrated {file_name} to MinIO (size: {downloaded_size} bytes)")
            return 'migrated'

    except Exception as e:
        print(f"❌ Error migrating {file_name}: {e}")
        return 'error'

# Migrate all files with summary
total_files = len([f for f in files if f.get('name')])
migrated = 0
updated = 0
skipped = 0
errors = 0

print(f"\n🚀 Starting storage migration for {total_files} files...\n")

for file_info in files:
    if file_info.get('name'):  # Skip folders
        result = migrate_file(file_info)
        if result == 'migrated':
            migrated += 1
        elif result == 'updated':
            updated += 1
        elif result == 'skipped':
            skipped += 1
        elif result == 'error':
            errors += 1

print("\n📊 Storage migration completed!")
print(f"Total files processed: {total_files}")
print(f"✅ Migrated: {migrated} files")
print(f"📝 Updated: {updated} files")
print(f"⏭️  Skipped: {skipped} files")
print(f"❌ Errors: {errors} files")