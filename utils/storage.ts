import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface StorageService {
  uploadFile(file: Buffer, fileName: string, contentType: string): Promise<UploadResult>;
  deleteFile(fileName: string): Promise<DeleteResult>;
  deleteFiles(fileNames: string[]): Promise<DeleteResult>;
  getSignedUrl(fileName: string, expiresIn?: number): Promise<string | null>;
  replaceWithPublicUrl(url: string): string;
  extractFileNameFromUrl(url: string): string;
}

// MinIO Implementation
class MinIOStorage implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
      throw new Error('MinIO configuration missing');
    }
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    });
    this.bucketName = process.env.MINIO_BUCKET || 'materials';
  }

  async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ContentType: contentType,
      });
      await this.s3Client.send(command);
      const url = `${process.env.MINIO_PUBLIC_URL}/${this.bucketName}/${fileName}`;
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async deleteFile(fileName: string): Promise<DeleteResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      await this.s3Client.send(command);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async deleteFiles(fileNames: string[]): Promise<DeleteResult> {
    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: fileNames.map(key => ({ Key: key })),
        },
      });
      await this.s3Client.send(command);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }

  replaceWithPublicUrl(url: string): string {
    if (url.includes('minio') && process.env.MINIO_PUBLIC_URL) {
      return url.replace(process.env.MINIO_ENDPOINT!, process.env.MINIO_PUBLIC_URL);
    }
    return url;
  }

  extractFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }
}

// Supabase Implementation
class SupabaseStorage implements StorageService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    this.bucketName = process.env.SUPABASE_BUCKET || 'materials';
  }

  async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<UploadResult> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          contentType,
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);
      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async deleteFile(fileName: string): Promise<DeleteResult> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileName]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async deleteFiles(fileNames: string[]): Promise<DeleteResult> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(fileNames);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(fileName, expiresIn);
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }

  replaceWithPublicUrl(url: string): string {
    // Supabase URLs are already public
    return url;
  }

  extractFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }
}

// Factory function to get the appropriate storage service
export function createStorageService(): StorageService {
  const storageType = process.env.STORAGE_TYPE || 'minio';
  if (storageType === 'supabase') {
    return new SupabaseStorage();
  } else {
    return new MinIOStorage();
  }
}

// Export the service instance
export const storageService = createStorageService();