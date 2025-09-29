import { NextResponse } from 'next/server';
import { supabase } from '../../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../../utils/auth';

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const { searchParams } = new URL(request.url);
  const multi = searchParams.get('user_ids');
  if (multi) {
    const rawIds = multi.split(',').map((id) => id.trim()).filter(Boolean);
    if (rawIds.length === 0) {
      return NextResponse.json({ success: false, error: 'user_ids wajib.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('users')
      .select('id, categories')
      .in('id', rawIds);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const assignments: Record<string, string[]> = {};
    rawIds.forEach((id) => {
      assignments[id] = [];
    });
    (data || []).forEach((user: { id: string; categories: string[] | null }) => {
      assignments[user.id] = user.categories || [];
    });
    const response = NextResponse.json({ success: true, assignments });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  }
  const user_id = searchParams.get('user_id') ?? '';
  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id wajib.' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('users')
    .select('categories')
    .eq('id', user_id)
    .single();
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  const assigned = data?.categories || [];
  const response = NextResponse.json({ success: true, assigned });
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
  const { user_id, category_id } = body ?? {};
  if (!user_id || !category_id) {
    return NextResponse.json({ success: false, error: 'user_id dan category_id wajib.' }, { status: 400 });
  }

  // Get current categories for the user
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('categories')
    .eq('id', user_id)
    .single();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const currentCategories = userData?.categories || [];
  const newCategories = [...new Set([...currentCategories, category_id])]; // Avoid duplicates

  const { error } = await supabase
    .from('users')
    .update({ categories: newCategories })
    .eq('id', user_id);

  const response = NextResponse.json(
    error ? { success: false, error: error.message } : { success: true },
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
  const { user_id, category_id } = body ?? {};
  if (!user_id || !category_id) {
    return NextResponse.json({ success: false, error: 'user_id dan category_id wajib.' }, { status: 400 });
  }

  // Get current categories for the user
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('categories')
    .eq('id', user_id)
    .single();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const currentCategories = userData?.categories || [];
  const newCategories = currentCategories.filter((id: string) => id !== category_id);

  const { error } = await supabase
    .from('users')
    .update({ categories: newCategories })
    .eq('id', user_id);

  const response = NextResponse.json(
    error ? { success: false, error: error.message } : { success: true },
    { status: error ? 500 : 200 },
  );
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}
