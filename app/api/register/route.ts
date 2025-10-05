import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
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

  // Insert user to users table, set default role 'student'
  const { data, error } = await supabase.from('users').insert([
    { name, email, password: hashedPassword, role: 'student', provinsi }
  ]);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
