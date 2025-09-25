import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, requireAuth } from '../../../utils/auth';

export async function GET(request: Request) {
  let payload;
  try {
    payload = await requireAuth();
    ensureRole(payload, ['teacher', 'admin']);
  } catch (error) {
    return authErrorResponse(error);
  }
  // Ambil user id dari query (atau session, jika sudah ada auth)
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');
  if (!teacherId) {
    return NextResponse.json({ success: false, error: 'Teacher ID wajib diisi.' }, { status: 400 });
  }
  if (payload.role === 'teacher' && payload.sub !== teacherId) {
    return authErrorResponse(new Error('Forbidden'));
  }

  // Ambil courses yang dibuat oleh teacher, beserta jumlah peserta yang enroll
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, description, created_at, enrollments:enrollments(count)')
    .eq('teacher_id', teacherId);
  if (coursesError) {
    return NextResponse.json({ success: false, error: coursesError.message }, { status: 500 });
  }
  // Map enrolled_count ke setiap course
  type Course = { id: string; title: string; description: string; created_at: string; enrollments?: Array<{ count: number }> };
  const coursesWithCount = Array.isArray(courses)
    ? courses.map((c: Course) => ({
        ...c,
        enrolled_count: c.enrollments && Array.isArray(c.enrollments) && c.enrollments.length > 0
          ? c.enrollments[0].count || 0
          : 0
      }))
    : [];

  // Ambil materi yang dibuat oleh teacher
  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select('id, course_id, title, type, pdf_url, content, order, created_at')
    .in('course_id', coursesWithCount.map((c: { id: string }) => c.id));
  if (materialsError) {
    return NextResponse.json({ success: false, error: materialsError.message }, { status: 500 });
  }

  // Ambil progress siswa untuk courses teacher
  const { data: progress } = await supabase
    .from('progress')
    .select('id, enrollment_id, material_id, status, updated_at');
  // (opsional: filter progress by course/material if needed)

  return NextResponse.json({ success: true, courses: coursesWithCount, materials, progress });
}
