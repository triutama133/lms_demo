import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '../../utils/auth';

export async function POST(request: Request) {
  const { email, password, role, captchaToken } = await request.json();

  // Verify captcha first
  if (!captchaToken) {
    return NextResponse.json({ success: false, error: 'Captcha verification required.' }, { status: 400 });
  }

  try {
    const captchaResponse = await fetch('/api/verify-captcha', {
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

  // Cari user berdasarkan email saja
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, password, role')
    .eq('email', email)
    .limit(1);

  if (error || !users || users.length === 0) {
    return NextResponse.json({ success: false, error: 'Email atau password salah.' }, { status: 401 });
  }

  const user = users[0];
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
}
