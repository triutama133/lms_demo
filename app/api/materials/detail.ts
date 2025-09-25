import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, requireAuth } from '../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch (error) {
    return authErrorResponse(error);
  }
  const { searchParams } = new URL(req.url);
  const material_id = searchParams.get('material_id');
  if (!material_id) {
    return NextResponse.json({ success: false, error: 'ID materi wajib diisi.' }, { status: 400 });
  }
  // Ambil data materi
  const { data: material, error } = await supabase.from('materials').select('*').eq('id', material_id).single();
  if (error || !material) {
    return NextResponse.json({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
  }
  // Jika tipe markdown, ambil sections dari table material_sections
  if (material.type === 'markdown') {
    // Urutkan berdasarkan 'order' jika ada, fallback ke 'id'
    const { data: sections } = await supabase
      .from('material_sections')
      .select('title, content, order')
      .eq('material_id', material_id)
      .order('order', { ascending: true })
      .order('id', { ascending: true });
    material.sections = Array.isArray(sections) ? sections : [];
  } else {
    material.sections = [];
  }
  return NextResponse.json({ success: true, material });
}
