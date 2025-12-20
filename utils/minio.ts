import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// File upload security constraints
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
];

// Validate required environment variables
if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
  throw new Error('MinIO configuration missing: MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY must be set');
}

const s3Client = new S3Client({
  region: 'us-east-1', // MinIO doesn't require a specific region, but AWS SDK needs one
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export class MinIOService {
  private bucketName: string;

  constructor(bucketName?: string) {
    this.bucketName = bucketName || process.env.MINIO_BUCKET || 'materials';
  }

  /**
   * Upload a file to MinIO with validation
   */
  async uploadFile(file: Buffer, fileName: string, contentType?: string): Promise<UploadResult> {
    try {
      // Validate file size
      if (file.length > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        };
      }

      // Validate content type if provided
      if (contentType && !ALLOWED_FILE_TYPES.includes(contentType)) {
        return {
          success: false,
          error: `File type ${contentType} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        };
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read', // Make files publicly accessible
      });

      await s3Client.send(command);

      const url = `${process.env.MINIO_PUBLIC_URL || process.env.MINIO_ENDPOINT}/${this.bucketName}/${fileName}`;

      return {
        success: true,
        url,
      };
    } catch (error) {
      console.error('MinIO upload error:', error);
      return {
        success: false,
        error: 'Upload failed',
      };
    }
  }

  /**
   * Delete a single file from MinIO
   */
  async deleteFile(fileName: string): Promise<DeleteResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await s3Client.send(command);

      return { success: true };
    } catch (error) {
      console.error('MinIO delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Delete multiple files from MinIO
   */
  async deleteFiles(fileNames: string[]): Promise<DeleteResult> {
    try {
      if (fileNames.length === 0) {
        return { success: true };
      }

      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: fileNames.map(key => ({ Key: key })),
        },
      });

      await s3Client.send(command);

      return { success: true };
    } catch (error) {
      console.error('MinIO bulk delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk delete failed',
      };
    }
  }

  /**
   * Get a file from MinIO
   */
  async getFile(fileName: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const response = await s3Client.send(command);

      if (response.Body) {
        const reader = response.Body.transformToByteArray();
        const buffer = await reader;
        return Buffer.from(buffer);
      }

      return null;
    } catch (error) {
      console.error('MinIO get file error:', error);
      return null;
    }
  }

  /**
   * Generate a presigned URL for file access
   */
  async getPresignedUrl(fileName: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

      // Replace IP endpoint with public domain if configured
      if (process.env.MINIO_PUBLIC_URL) {
        const endpointUrl = process.env.MINIO_ENDPOINT || 'http://157.66.35.109:9000';
        const publicUrl = process.env.MINIO_PUBLIC_URL;
        return signedUrl.replace(endpointUrl, publicUrl);
      }

      return signedUrl;
    } catch (error) {
      console.error('MinIO presigned URL error:', error);
      return null;
    }
  }

  /**
   * Extract filename from MinIO URL
   */
  static extractFileNameFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const encodedFileName = urlParts[urlParts.length - 1];
      // Decode URL-encoded characters like %20 for spaces
      return decodeURIComponent(encodedFileName);
    } catch {
      return null;
    }
  }

  /**
   * Replace IP endpoint with public domain in URL
   */
  static replaceWithPublicUrl(url: string): string {
    if (process.env.MINIO_PUBLIC_URL) {
      const endpointUrl = process.env.MINIO_ENDPOINT || 'http://157.66.35.109:9000';
      return url.replace(endpointUrl, process.env.MINIO_PUBLIC_URL);
    }
    return url;
  }
}

// Export a default instance
export const minIOService = new MinIOService();