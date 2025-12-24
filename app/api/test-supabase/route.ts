import { NextResponse } from 'next/server';
import { dbService } from "@/utils/database";
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';

export async function GET() {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  try {
    const data = await dbService.user.findMany({ take: 1, select: { id: true, email: true, role: true } });
    const response = NextResponse.json({ success: true, data, databaseType: process.env.DATABASE_TYPE || 'prisma' });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    const response = NextResponse.json({ success: false, error: errorMsg, databaseType: process.env.DATABASE_TYPE || 'prisma' });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  }
}
