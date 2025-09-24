import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { name, email, password, provinsi } = await request.json();

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
