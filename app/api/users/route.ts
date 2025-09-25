import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { authErrorResponse, ensureRole, requireAuth } from '../../utils/auth';

export async function GET() {
  try {
    const payload = await requireAuth();
    ensureRole(payload, 'admin');
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, provinsi');
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, users: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await requireAuth();
    ensureRole(payload, 'admin');
    const body = await request.json();
    const { id, name, email, role, password, provinsi } = body;
    if (!id || !name || !email || !role) {
      return NextResponse.json({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = { name, email, role };
    if (provinsi !== undefined) {
      updateData.provinsi = provinsi;
    }
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
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await requireAuth();
    ensureRole(payload, 'admin');
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
  } catch (error) {
    return authErrorResponse(error);
  }
}
