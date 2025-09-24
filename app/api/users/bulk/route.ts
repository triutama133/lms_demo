import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { users: newUsers } = await req.json();
    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      return NextResponse.json({ success: false, error: 'Data user tidak valid' }, { status: 400 });
    }
    type CreatedUser = {
      id: string;
      name: string;
      email: string;
      role: string;
      provinsi: string;
    };
    type FailedUser = {
      idx: number;
      errors: string[];
      user: Record<string, unknown>;
    };
    const created: CreatedUser[] = [];
    const failed: FailedUser[] = [];
    for (const [idx, u] of newUsers.entries()) {
      const errors: string[] = [];
      if (!u.name) errors.push('Field "name" wajib');
      if (!u.email) errors.push('Field "email" wajib');
      if (!u.role) errors.push('Field "role" wajib');
      if (u.role && !['student','teacher','admin'].includes((u.role+'').toLowerCase())) errors.push('Role harus student/teacher/admin');
      if (errors.length > 0) {
        failed.push({ idx: idx+1, errors, user: u });
        continue;
      }
      // Set default password jika kosong
      const rawPassword = u.password && u.password.trim() ? u.password : 'ilmi123';
      // Cek email duplikat
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', u.email)
        .single();
      if (existing) {
        failed.push({ idx: idx+1, errors: [`Email ${u.email} sudah terdaftar`], user: u });
        continue;
      }
      // Hash password
      const hashed = await bcrypt.hash(rawPassword, 10);
      const user = {
        id: uuidv4(),
        name: u.name,
        email: u.email,
        role: u.role,
        provinsi: u.provinsi || '',
        password: hashed,
      };
      const { error: errInsert } = await supabase
        .from('users')
        .insert([user]);
      if (errInsert) {
        failed.push({ idx: idx+1, errors: [errInsert.message], user: u });
        continue;
      }
  const { password: _password, ...userWithoutPassword } = user;
  created.push(userWithoutPassword);
    }
    if (failed.length > 0) {
      return NextResponse.json({ success: false, error: 'Beberapa user gagal diimport', detail: failed, created }, { status: 400 });
    }
    return NextResponse.json({ success: true, created });
  } catch {
    return NextResponse.json({ success: false, error: 'Gagal tambah user' }, { status: 500 });
  }
}
