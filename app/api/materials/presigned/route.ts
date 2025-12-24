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
    // Extract filename from URL
    const fileName = storageService.extractFileNameFromUrl(fileUrl);

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'Invalid file URL' }, { status: 400 });
    }

    // Determine which storage service to use based on URL
    let presignedUrl: string | null = null;
    if (fileUrl.includes('supabase.co')) {
      // Use Supabase storage
      presignedUrl = await storageService.getSignedUrl(fileName, 3600);
    } else if (fileUrl.includes('minio') || fileUrl.includes('157.66.35.109')) {
      // Use MinIO storage for legacy files
      const minIOService = new MinIOService();
      presignedUrl = await minIOService.getSignedUrl(fileName, 3600);
    } else {
      // Default to current storage service
      presignedUrl = await storageService.getSignedUrl(fileName, 3600);
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
    headers.set('Content-Type', fileResponse.headers.get('content-type') ?? 'application/pdf');
    const contentLength = fileResponse.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    const safeFileName = fileName.split('?')[0] || 'file.pdf';
    headers.set(
      'Content-Disposition',
      fileResponse.headers.get('content-disposition') ?? `inline; filename="${safeFileName}"`,
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
