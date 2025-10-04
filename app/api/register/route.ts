import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { name, email, password, provinsi, captchaToken } = await request.json();

  // Verify captcha first
  if (!captchaToken) {
    return NextResponse.json({ success: false, error: 'Captcha verification required.' }, { status: 400 });
  }

  try {
    const captchaResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/verify-captcha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: captchaToken }),
    });

    const captchaData = await captchaResponse.json();
    if (!captchaData.success) {
      return NextResponse.json({ success: false, error: 'Captcha verification failed.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Captcha verification error:', error);
    return NextResponse.json({ success: false, error: 'Captcha verification failed.' }, { status: 500 });
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
