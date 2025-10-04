import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { verifyRecaptchaToken } from '../../../lib/recaptcha';

export async function POST(request: Request) {
  const { name, email, password, provinsi, captchaToken } = await request.json();

  // Verify captcha first
  if (!captchaToken) {
    return NextResponse.json({ success: false, error: 'Captcha verification required.' }, { status: 400 });
  }

  try {
    const captchaData = await verifyRecaptchaToken(captchaToken);
    if (!captchaData.success) {
      console.error('reCAPTCHA verification failed on server:', captchaData);
      return NextResponse.json({ success: false, error: 'Captcha verification failed.', details: captchaData }, { status: 400 });
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
