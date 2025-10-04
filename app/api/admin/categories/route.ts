import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, created_at')
    .order('name', { ascending: true });
  const response = NextResponse.json({ success: !error, categories: data ?? [], error: error?.message });
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { name, description } = body ?? {};
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ success: false, error: 'Nama kategori wajib.' }, { status: 400 });
  }

  // Generate UUID for category ID
  const categoryId = uuidv4();

  const { data, error } = await supabase
    .from('categories')
    .insert({ id: categoryId, name, description })
    .select();
  const response = NextResponse.json(
    error ? { success: false, error: error.message } : { success: true, category: data?.[0] },
    { status: error ? 500 : 200 },
  );
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}

export async function PUT(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { id, name, description } = body ?? {};
  if (!id || !name) {
    return NextResponse.json({ success: false, error: 'id dan name wajib.' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', id)
    .select();
  const response = NextResponse.json(
    error ? { success: false, error: error.message } : { success: true, category: data?.[0] },
    { status: error ? 500 : 200 },
  );
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { id } = body ?? {};
  if (!id) {
    return NextResponse.json({ success: false, error: 'id wajib.' }, { status: 400 });
  }
  const { error } = await supabase.from('categories').delete().eq('id', id);
  const response = NextResponse.json(
    error ? { success: false, error: error.message } : { success: true },
    { status: error ? 500 : 200 },
  );
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}

