import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const enrollment_id = searchParams.get('enrollment_id');
  const course_id = searchParams.get('course_id');
  if (!enrollment_id || !course_id) {
    return NextResponse.json({ success: false, error: 'enrollment_id dan course_id wajib diisi.' });
  }
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
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('id', enrollment_id)
    .single();
  if (enrollmentError || !enrollment) {
    return finalize({ success: false, error: 'Enrollment tidak ditemukan.' }, { status: 404 });
  }
  if (payload.sub !== enrollment.user_id && payload.role !== 'admin' && payload.role !== 'teacher') {
    return authErrorResponse(new Error('Forbidden'));
  }

  // Ambil semua progress untuk enrollment dan course
  // Join ke tabel materials untuk filter by course_id
  const { data, error } = await supabase
    .from('progress')
    .select('id, material_id, status, updated_at, materials(course_id)')
    .eq('enrollment_id', enrollment_id);

  if (error) {
    return finalize({ success: false, error: 'Gagal fetch progress.' });
  }

  // Filter hanya progress yang materialnya ada di course yang dimaksud
  const progress = (data || []).filter((p) =>
    Array.isArray(p.materials) &&
    p.materials.some((m) => m.course_id === course_id)
  );

  return finalize({ success: true, progress });
}
