import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: false, error: 'Endpoint deprecated: gunakan /api/teacher/dashboard' }, { status: 410 });
}
