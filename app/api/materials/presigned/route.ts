import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '../../../../utils/storage';
import { MinIOService } from '../../../../utils/minio';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get('url');
  const stream = searchParams.get('stream') === '1' || searchParams.get('stream') === 'true';

  if (!fileUrl) {
    return NextResponse.json({ success: false, error: 'File URL required' }, { status: 400 });
  }

  try {
    // If caller passed an object key (not a full URL), treat it as MinIO/S3 object key
    let presignedUrl: string | null = null;
    let fileName: string | null = null;
    if (!fileUrl.startsWith('http')) {
      const objectKey = fileUrl; // already an object key / filename
      fileName = objectKey;
      // Prefer MinIOService when configured
      if (process.env.MINIO_ENDPOINT) {
        const minIOService = new MinIOService();
        presignedUrl = await minIOService.getSignedUrl(objectKey, 3600);
      } else {
        presignedUrl = await storageService.getSignedUrl(objectKey, 3600);
      }
    } else {
      // Extract filename from URL
      fileName = storageService.extractFileNameFromUrl(fileUrl);

      if (!fileName) {
        return NextResponse.json({ success: false, error: 'Invalid file URL' }, { status: 400 });
      }

      // Determine which storage service to use based on URL
      if (fileUrl.includes('supabase.co')) {
        // Use Supabase storage
        presignedUrl = await storageService.getSignedUrl(fileName, 3600);
      } else if ((fileUrl.includes('minio') || (process.env.MINIO_PUBLIC_URL && fileUrl.includes(process.env.MINIO_PUBLIC_URL.replace(/^https?:\/\//, '')))) && process.env.MINIO_ENDPOINT) {
        // Use MinIO storage for legacy files if configured
        const minIOService = new MinIOService();
        presignedUrl = await minIOService.getSignedUrl(fileName, 3600);
      } else {
        // Default to current storage service
        presignedUrl = await storageService.getSignedUrl(fileName, 3600);
      }
    }

    if (!presignedUrl) {
      return NextResponse.json({ success: false, error: 'Failed to generate access URL' }, { status: 500 });
    }

    if (!stream) {
      const proxiedUrl = new URL(req.url);
      proxiedUrl.searchParams.set('stream', '1');
      proxiedUrl.searchParams.set('url', fileUrl);
      return NextResponse.json({ success: true, url: `${proxiedUrl.pathname}?${proxiedUrl.searchParams.toString()}` });
    }

    // Stream the file so the user only ever sees the localhost URL
    const fileResponse = await fetch(presignedUrl);
    if (!fileResponse.ok || !fileResponse.body) {
      return NextResponse.json({ success: false, error: 'Failed to fetch file' }, { status: 502 });
    }

    const headers = new Headers();
    // Prefer the upstream content-type, but force PDF when filename indicates PDF
    let contentType = fileResponse.headers.get('content-type') ?? '';
    if (!contentType || contentType === 'application/octet-stream') {
      if (fileName && fileName.toLowerCase().endsWith('.pdf')) {
        contentType = 'application/pdf';
      } else {
        contentType = fileResponse.headers.get('content-type') ?? 'application/octet-stream';
      }
    }
    headers.set('Content-Type', contentType);
    const contentLength = fileResponse.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    const safeFileName = (fileName ? fileName.split('?')[0] : 'file.pdf') || 'file.pdf';
    // Use both filename and filename* for better cross-browser handling of UTF-8 names
    const encodedName = encodeURIComponent(safeFileName).replace(/'/g, '%27');
    headers.set(
      'Content-Disposition',
      fileResponse.headers.get('content-disposition') ?? `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedName}`,
    );
    headers.set('Cache-Control', 'private, max-age=0, no-store');

    return new NextResponse(fileResponse.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
