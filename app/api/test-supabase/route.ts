import { supabase } from '../../utils/supabaseClient';
import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, requireAuth } from '../../utils/auth';

export async function GET() {
  try {
    const payload = await requireAuth();
    ensureRole(payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
  return NextResponse.json({ success: true, data });
}
