import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, requireAuth } from '../../../utils/auth';

export async function GET() {
  try {
    const payload = await requireAuth();
    ensureRole(payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  // Ambil semua course beserta nama teacher dan jumlah peserta
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description, teacher_id');
  if (courseError) {
    return NextResponse.json({ success: false, error: courseError.message }, { status: 500 });
  }

  // Ambil semua teacher
  type Course = { id: string; title: string; description: string; teacher_id: string };
  type Teacher = { id: string; name: string };
  type Enrollment = { course_id: string; user_id: string };
  const teacherIds = [...new Set((courses as Course[]).map((c) => c.teacher_id))];
  const { data: teachers, error: teacherError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', teacherIds);
  if (teacherError) {
    return NextResponse.json({ success: false, error: teacherError.message }, { status: 500 });
  }

  // Ambil jumlah peserta per course
  const courseIds = (courses as Course[]).map((c) => c.id);
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id, user_id');
  if (enrollError) {
    return NextResponse.json({ success: false, error: enrollError.message }, { status: 500 });
  }

  // Map teacher name dan jumlah peserta ke course
  const teacherMap = Object.fromEntries((teachers as Teacher[]).map((t) => [t.id, t.name]));
  const enrolledMap: Record<string, number> = {};
  for (const cId of courseIds) {
    enrolledMap[cId] = (enrollments as Enrollment[]).filter((e) => e.course_id === cId).length;
  }

  const result = (courses as Course[]).map((c) => ({
    ...c,
    teacher_name: teacherMap[c.teacher_id] || '-',
    enrolled_count: enrolledMap[c.id] || 0,
  }));

  return NextResponse.json({ success: true, courses: result });
}
