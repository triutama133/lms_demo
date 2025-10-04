import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Captcha verification required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const debug = process.env.RECAPTCHA_DEBUG === 'true';
    if (debug) {
      try {
        const masked = typeof token === 'string' ? `${token.slice(0, 6)}...${token.slice(-6)}` : token;
        console.debug('[reCAPTCHA debug] Received token (masked):', masked);
      } catch {
        console.debug('[reCAPTCHA debug] Received token (raw):', token);
      }
    }

    // Verify with Google reCAPTCHA v2
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (debug) {
      try {
        console.debug('[reCAPTCHA debug] Google verify response:', JSON.stringify(data));
      } catch {
        console.debug('[reCAPTCHA debug] Google verify response (raw):', data);
      }
    }

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: 'Captcha verification failed' },
        { status: 400 }
      );
    }

    // For reCAPTCHA v2, just check if success is true
    // No score checking needed like in v3
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Captcha verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}