import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '../../utils/auth';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'login_attempts',
  points: 5, // Number of attempts
  duration: 60, // Per 60 seconds (1 minute)
});

export async function POST(request: Request) {
  const { email, password, role, captcha } = await request.json();

  // Rate limiting
  try {
    await rateLimiter.consume(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
  } catch {
    return NextResponse.json({ success: false, error: 'Terlalu banyak percobaan login. Coba lagi nanti.' }, { status: 429 });
  }

  // Basic captcha validation (in production, use a more secure method)
  if (!captcha || captcha.length < 4) {
    return NextResponse.json({ success: false, error: 'Captcha tidak valid.' }, { status: 400 });
  }

  try {
    // Cari user berdasarkan email saja
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, name: true, email: true, password: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Email atau password salah.' }, { status: 401 });
    }

    // Bandingkan password hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ success: false, error: 'Email atau password salah.' }, { status: 401 });
    }

    // Pastikan role yang diminta sesuai role user (gunakan 'teacher' sebagai istilah konsisten)
    const requested = (role || '').toString();
    const actual = (user.role || '').toString();
    if (requested && requested !== actual) {
      return NextResponse.json({ success: false, error: 'Role tidak sesuai.' }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    await setAuthCookie(response, {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
