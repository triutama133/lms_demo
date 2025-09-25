import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '../../../lib/auth';

export async function POST(request: Request) {
  const { email, password, role } = await request.json();

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

  const token = await signAuthToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  response.cookies.set({
    name: 'lms_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Number(process.env.JWT_COOKIE_MAX_AGE ?? 60 * 60),
  });

  return response;
}
