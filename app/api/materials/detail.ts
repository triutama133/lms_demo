import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { isCourseAccessibleByUser } from '../../utils/access';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function GET(req: NextRequest) {
  let auth;
  try {
    auth = await requireAuth();
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
  const { searchParams } = new URL(req.url);
  const material_id = searchParams.get('material_id');
  if (!material_id) {
    return finalize({ success: false, error: 'ID materi wajib diisi.' }, { status: 400 });
  }
  // Ambil data materi
  const { data: material, error } = await supabase.from('materials').select('*').eq('id', material_id).single();
  if (error || !material) {
    return finalize({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
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
  // If student, ensure access by course categories
  const role = (payload.role || '').toString();
  if (role !== 'admin' && role !== 'teacher') {
    if (material.course_id) {
      const ok = await isCourseAccessibleByUser({ userId: payload.sub, role, courseId: material.course_id });
      if (!ok) {
        return finalize({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  return finalize({ success: true, material });
}
