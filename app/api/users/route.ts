import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';

export async function GET() {
  // Ambil semua user
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role');
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, users: data });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, email, role, password } = body;
  if (!id || !name || !email || !role) {
    return NextResponse.json({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
  }
  let updateData: Record<string, unknown> = { name, email, role };
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    updateData.password = hashed;
  }
  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ success: false, error: 'User ID wajib diisi.' }, { status: 400 });
  }
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
