import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { order } = body; // [{ id, order }]
    if (!Array.isArray(order)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid order data' }), { status: 400 });
    }
    // Update semua section sesuai urutan baru
    for (const item of order) {
      const { error } = await supabase
        .from('sections')
        .update({ order: item.order })
        .eq('id', item.id);
      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
      }
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Failed to update order' }), { status: 500 });
  }
}