import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { NextResponse } from 'next/server';
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
    const data = await prisma.user.findMany({ take: 1 });
    const response = NextResponse.json({ success: true, data });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    const response = NextResponse.json({ success: false, error: errorMsg });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  }
}
