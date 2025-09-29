import { supabase } from '../../utils/supabaseClient';
import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';

export async function GET() {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    const response = NextResponse.json({ success: false, error: error.message });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  }
  const response = NextResponse.json({ success: true, data });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}
