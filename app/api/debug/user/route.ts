import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';

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
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ success: false, error: 'email query param required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, password')
    .eq('email', email)
    .limit(1);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Development-only: return user row (includes password hash). Remove after debugging.
  const response = NextResponse.json({ success: true, user: data[0] });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}
