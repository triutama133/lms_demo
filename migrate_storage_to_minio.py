import os
import tempfile
import urllib.parse
import requests
import psycopg2
from dotenv import load_dotenv
from minio import Minio

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")  # e.g. http://103.31.205.81:9000
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "lms-materials")

if not all([DATABASE_URL, MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY]):
    raise SystemExit("Missing required env vars: DATABASE_URL, MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY")

# parse endpoint
parsed = urllib.parse.urlparse(MINIO_ENDPOINT)
minio_host = parsed.netloc or parsed.path
use_ssl = parsed.scheme == "https"

minio_client = Minio(minio_host, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=use_ssl)

# ensure bucket exists
try:
    if not minio_client.bucket_exists(MINIO_BUCKET):
        minio_client.make_bucket(MINIO_BUCKET)
        print(f"Created bucket {MINIO_BUCKET}")
except Exception as e:
    print("Could not ensure bucket exists:", e)
    raise

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# select materials pointing to supabase
cur.execute("SELECT id, pdf_url FROM materials WHERE pdf_url ILIKE '%supabase.co%'")
rows = cur.fetchall()
print(f"Found {len(rows)} materials to migrate.")

success = 0
fail = 0

for mid, url in rows:
    try:
        if not url:
            print('skip empty', mid)
            fail += 1
            continue
        parsed = urllib.parse.urlparse(url)
        name = os.path.basename(parsed.path)
        name = urllib.parse.unquote(name)
        if not name:
            print('no filename for', mid)
            fail += 1
            continue

        print(f"Downloading {url}...")
        r = requests.get(url, stream=True, timeout=60)
        r.raise_for_status()

        with tempfile.NamedTemporaryFile() as tf:
            for chunk in r.iter_content(1024 * 1024):
                if chunk:
                    tf.write(chunk)
            tf.flush()
            tf.seek(0)
            # upload to minio
            print(f"Uploading {name} to MinIO bucket {MINIO_BUCKET}...")
            minio_client.fput_object(MINIO_BUCKET, name, tf.name)

        # update DB to store object key (name)
        cur.execute("UPDATE materials SET pdf_url = %s WHERE id = %s", (name, mid))
        conn.commit()
        print("migrated", mid, "->", name)
        success += 1
    except Exception as e:
        conn.rollback()
        print("error", mid, e)
        fail += 1

cur.close()
conn.close()
print("done. success:", success, "fail:", fail)
