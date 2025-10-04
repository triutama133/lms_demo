import { NextResponse } from 'next/server';
import { verifyRecaptchaToken } from '../../../lib/recaptcha';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Captcha verification required' }, { status: 400 });
    }

    const data = await verifyRecaptchaToken(token);
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data);
      return NextResponse.json({ success: false, error: 'Captcha verification failed', details: data }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Captcha verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}