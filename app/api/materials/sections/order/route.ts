import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(req: NextRequest) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['teacher', 'admin']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const finalize = async (body: unknown, init: ResponseInit = {}) => {
    const response = NextResponse.json(body, init);
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  };
  try {
    const body = await req.json();
    const { order } = body; // [{ id, order }]
    if (!Array.isArray(order)) {
      return finalize({ success: false, error: 'Invalid order data' }, { status: 400 });
    }
    for (const item of order) {
      const { error } = await supabase
        .from('material_sections')
        .update({ order: item.order })
        .eq('id', item.id);
      if (error) {
        return finalize({ success: false, error: error.message }, { status: 500 });
      }
    }
    return finalize({ success: true }, { status: 200 });
  } catch {
    return finalize({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
