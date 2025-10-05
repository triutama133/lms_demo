import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthTokenPayload, signAuthToken, verifyAuthToken } from '../../lib/auth';

const AUTH_COOKIE_NAME = 'lms_token';
const DEFAULT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_REFRESH_THRESHOLD = 10 * 60; // 10 minutes

type RequireAuthResult = {
  payload: AuthTokenPayload;
  shouldRefresh: boolean;
};

function getCookieMaxAge(): number {
  return Number(process.env.JWT_COOKIE_MAX_AGE ?? DEFAULT_COOKIE_MAX_AGE);
}

function getRefreshThreshold(): number {
  return Number(process.env.JWT_REFRESH_THRESHOLD_SECONDS ?? DEFAULT_REFRESH_THRESHOLD);
}

export async function requireAuth(): Promise<RequireAuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifyAuthToken(token);
  const exp = typeof payload.exp === 'number' ? payload.exp : null;
  const now = Math.floor(Date.now() / 1000);
  const shouldRefresh = !!exp && exp - now <= getRefreshThreshold();

  return { payload, shouldRefresh };
}

type TokenClaims = {
  sub: string;
  role: string;
  email?: string;
  name?: string;
};

function resolveClaimsFromPayload(payload: AuthTokenPayload): TokenClaims {
  return {
    sub: payload.sub,
    role: payload.role,
    email: payload.email,
    name: payload.name,
  };
}

async function applyAuthCookie(response: NextResponse, claims: TokenClaims) {
  const token = await signAuthToken(claims);
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getCookieMaxAge(),
  });
}

export async function setAuthCookie(response: NextResponse, claims: TokenClaims) {
  await applyAuthCookie(response, claims);
}

export async function refreshAuthCookie(response: NextResponse, payload: AuthTokenPayload) {
  await applyAuthCookie(response, resolveClaimsFromPayload(payload));
}

export const authCookieName = AUTH_COOKIE_NAME;

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
