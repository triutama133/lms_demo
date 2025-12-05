import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from './lib/auth';

const PUBLIC_PATHS = ['/lms/login', '/lms/register', '/lms/home'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/lms')) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('lms_token')?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/lms/login';
    return NextResponse.redirect(url);
  }

  try {
    const payload = await verifyAuthToken(token);
    if (pathname.startsWith('/lms/admin') && payload.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/lms/dashboard';
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/lms/teacher') && !['teacher', 'admin'].includes(payload.role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/lms/dashboard';
      return NextResponse.redirect(url);
    }
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = '/lms/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lms/:path*'],
};
