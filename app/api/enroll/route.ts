import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { isCourseAccessibleByUser } from '../../utils/access';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'user_id wajib diisi.' });
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
  if (payload.sub !== userId && payload.role !== 'admin') {
    return authErrorResponse(new Error('Forbidden'));
  }
  // Category-based access: block enroll if student does not have required category
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId);
  if (enrollError) {
    return finalize({ success: false, error: (enrollError as { message?: string }).message ?? 'Unknown error' });
  }
  type Enrollment = { course_id: string };
  const courseIds = (enrollments as Enrollment[]).map((e) => e.course_id);
  if (!courseIds.length) {
    return finalize({ success: true, courses: [] });
  }
  if (payload.role !== 'admin' && payload.role !== 'teacher') {
    for (const courseId of courseIds) {
      const allowed = await isCourseAccessibleByUser({ userId: payload.sub, role: payload.role, courseId });
      if (!allowed) {
        return finalize({ success: false, error: 'Course tidak tersedia untuk kategori akun Anda.' }, { status: 403 });
      }
    }
  }
  // ...existing code...
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description')
    .in('id', courseIds);
  if (courseError) {
    return finalize({ success: false, error: (courseError as { message?: string }).message ?? 'Unknown error' });
  }
  return finalize({ success: true, courses });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user_id: userId, course_id: courseId } = body;
  if (!userId || !courseId) {
    return NextResponse.json({ success: false, error: 'user_id dan course_id wajib diisi.' });
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
  if (payload.sub !== userId && payload.role !== 'admin') {
    return authErrorResponse(new Error('Forbidden'));
  }
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
  if (existing) {
    return finalize({ success: true, enrollment_id: existing.id });
  }
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId })
    .select();
  if (error || !data || !data[0]) {
    return finalize({ success: false, error: 'Gagal enroll.' });
  }
  return finalize({ success: true, enrollment_id: data[0].id });
}
