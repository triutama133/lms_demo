import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { dbService } from '../../../utils/database';

export async function GET() {
  let auth;
  try {
    auth = await requireAuth();
    // Allow both admin and teacher to access categories
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  try {
    const categories = await dbService.category.findMany({
      select: { id: true, name: true, description: true, createdAt: true },
      orderBy: { name: 'asc' }
    });
    const response = NextResponse.json({ success: true, categories });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}