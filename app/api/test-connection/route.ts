import { NextResponse } from 'next/server';
import { dbService } from '../../../utils/database';

export async function GET() {
  try {
    // Test basic connection
    const data = await dbService.user.findMany({
      select: { id: true },
      take: 1
    }) as { id: string }[];

    return NextResponse.json({
      success: true,
      message: 'Database connection OK',
      hasData: data && data.length > 0
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}