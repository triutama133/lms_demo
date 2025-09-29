import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';

export async function GET() {
  let auth;
  try {
    auth = await requireAuth();
    // Allow both admin and teacher to access categories
    ensureRole(auth.payload, ['admin', 'teacher']);
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