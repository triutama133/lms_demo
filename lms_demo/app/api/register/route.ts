import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'register_attempts',
  points: 5, // Number of attempts
  duration: 60, // Per 60 seconds (1 minute)
});

export async function POST(request: Request) {
  const { name, email, password, provinsi, captcha } = await request.json();

  // Rate limiting
  try {
    await rateLimiter.consume(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
  } catch {
    return NextResponse.json({ success: false, error: 'Terlalu banyak percobaan register. Coba lagi nanti.' }, { status: 429 });
  }

  // Basic captcha validation (in production, use a more secure method)
  if (!captcha || captcha.length < 4) {
    return NextResponse.json({ success: false, error: 'Captcha tidak valid.' }, { status: 400 });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Insert user to users table, set default role 'student'
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'student', provinsi } as Prisma.UserUncheckedCreateInput
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
