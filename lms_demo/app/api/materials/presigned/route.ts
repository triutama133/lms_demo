import { NextRequest, NextResponse } from 'next/server';
import { minIOService, MinIOService } from '../../../../utils/minio';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return NextResponse.json({ success: false, error: 'File URL required' }, { status: 400 });
  }

  try {
    // Extract filename from URL
    const fileName = MinIOService.extractFileNameFromUrl(fileUrl);

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'Invalid file URL' }, { status: 400 });
    }

    // Generate presigned URL (expires in 1 hour)
    const presignedUrl = await minIOService.getPresignedUrl(fileName, 3600);

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