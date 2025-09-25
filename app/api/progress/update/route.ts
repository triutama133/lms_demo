import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, requireAuth } from '../../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, material_id, status } = body;
  if (!user_id || !material_id || !status) {
    return NextResponse.json({ success: false, error: 'Data tidak lengkap' });
  }
  let payload;
  try {
    payload = await requireAuth();
  } catch (error) {
    return authErrorResponse(error);
  }
  if (payload.sub !== user_id && payload.role !== 'admin' && payload.role !== 'teacher') {
    return authErrorResponse(new Error('Forbidden'));
  }

  // Upsert progress
  const { error } = await supabase
    .from('progress')
    .upsert([
      { user_id, material_id, status },
    ], { onConflict: 'user_id,material_id' });

  if (error) {
    return NextResponse.json({ success: false, error: 'Gagal update progress' });
  }

  return NextResponse.json({ success: true });
}
