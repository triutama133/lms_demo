import { NextResponse } from 'next/server';
import { dbService } from '../../../utils/database';
import bcrypt from 'bcryptjs';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { v4 as uuidv4 } from 'uuid';

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

  // Input validation
  if (!name || !email || !password) {
    return NextResponse.json({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
  }

  // Name validation and sanitization
  const sanitizedName = name.trim().replace(/[<>"']/g, '');
  if (sanitizedName.length < 2 || sanitizedName.length > 100) {
    return NextResponse.json({ success: false, error: 'Nama harus 2-100 karakter.' }, { status: 400 });
  }

  // Email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ success: false, error: 'Format email tidak valid.' }, { status: 400 });
  }

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();

  // Password strength validation
  if (!password || password.length < 8) {
    return NextResponse.json({ success: false, error: 'Password minimal 8 karakter.' }, { status: 400 });
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return NextResponse.json({ success: false, error: 'Password harus mengandung huruf besar, huruf kecil, dan angka.' }, { status: 400 });
  }

  // Check for common weak passwords
  const commonPasswords = ['password', 'Password1', '12345678', 'Qwerty123'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
    return NextResponse.json({ success: false, error: 'Password terlalu lemah. Hindari kata umum.' }, { status: 400 });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Check if email already exists
    const existingUser = await dbService.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    }) as { id: string } | null;

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar.' }, { status: 409 });
    }

    // Sanitize provinsi input
    const sanitizedProvinsi = provinsi ? provinsi.trim().replace(/[<>"']/g, '') : '';

    // Insert user to users table, set default role 'student'
    const user = await dbService.user.create({
      data: { 
        id: uuidv4(), 
        name: sanitizedName, 
        email: normalizedEmail, 
        password: hashedPassword, 
        role: 'student', 
        provinsi: sanitizedProvinsi 
      }
    }) as { id: string; name: string; email: string; role: string; provinsi: string | null };

    // Remove password from response
    const userWithoutPassword = { id: user.id, name: user.name, email: user.email, role: user.role, provinsi: user.provinsi };
    return NextResponse.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
