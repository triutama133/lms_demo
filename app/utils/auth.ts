import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthTokenPayload, verifyAuthToken } from '../../lib/auth';

export async function requireAuth(): Promise<AuthTokenPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get('lms_token')?.value;
  if (!token) {
    throw new Error('Unauthorized');
  }
  return verifyAuthToken(token);
}

export function ensureRole(payload: AuthTokenPayload, roles: string | string[]): void {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(payload.role)) {
    throw new Error('Forbidden');
  }
}

export function unauthorizedResponse(message = 'Unauthorized', status = 401) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function authErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'Forbidden') {
      return unauthorizedResponse('Forbidden', 403);
    }
  }
  return unauthorizedResponse();
}
