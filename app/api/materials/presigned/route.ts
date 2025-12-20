import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '../../../../utils/storage';
import { MinIOService } from '../../../../utils/minio';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get('url');

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

    return NextResponse.json({
      success: true,
      url: presignedUrl
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}