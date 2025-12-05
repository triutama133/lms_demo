import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://157.66.35.109:9000',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'lmsminio',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'lmsminio133133',
  },
  forcePathStyle: true,
});

async function checkMinIOFiles() {
  try {
    console.log('Checking MinIO bucket:', process.env.MINIO_BUCKET || 'ilmilms-bucket');

    // List objects in bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET || 'ilmilms-bucket',
      MaxKeys: 10
    });

    const listResponse = await s3Client.send(listCommand);

    console.log('Files in bucket:');
    if (listResponse.Contents) {
      listResponse.Contents.forEach(obj => {
        console.log(`- ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log('No files found in bucket');
    }

    // Check specific file
    const testFile = '473b5c6a-48d8-4a6d-a7e2-cdee0dd6eb95_1759734540482_Fundamental AQ Kompetensi Optimalisasi Peran - Ade Komara.pdf';
    console.log(`\nChecking specific file: ${testFile}`);

    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.MINIO_BUCKET || 'ilmilms-bucket',
        Key: testFile
      });

      const headResponse = await s3Client.send(headCommand);
      console.log('File exists:', headResponse);
    } catch (error) {
      console.log('File does not exist or error:', error instanceof Error ? error.message : String(error));
    }

  } catch (error) {
    console.error('Error checking MinIO:', error);
  }
}

checkMinIOFiles();