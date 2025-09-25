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
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');
  if (!courseId) {
    return NextResponse.json({ success: false, error: 'course_id wajib diisi' }, { status: 400 });
  }
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('teacher_id')
    .eq('id', courseId)
    .single();
  if (courseError || !course) {
    return NextResponse.json({ success: false, error: 'Course tidak ditemukan' }, { status: 404 });
  }
  if (payload.role === 'teacher' && course.teacher_id !== payload.sub) {
    return authErrorResponse(new Error('Forbidden'));
  }

  // Ambil enrollments untuk course ini
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('course_id', courseId);
  if (enrollError) {
    return NextResponse.json({ success: false, error: enrollError.message }, { status: 500 });
  }
  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ success: true, participants: [] });
  }

  // Ambil data user dari user_id hasil enrollments
  type Enrollment = { user_id: string };
  const userIds = (enrollments as Enrollment[]).map((e) => e.user_id);
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds);
  if (userError) {
    return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, participants: users });
}
