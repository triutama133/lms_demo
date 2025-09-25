import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import { authErrorResponse, requireAuth } from '../../utils/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'user_id wajib diisi.' });
  }
  let payload;
  try {
    payload = await requireAuth();
  } catch (error) {
    return authErrorResponse(error);
  }
  if (payload.sub !== userId && payload.role !== 'admin') {
    return authErrorResponse(new Error('Forbidden'));
  }
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId);
  if (enrollError) {
    return NextResponse.json({ success: false, error: enrollError.message });
  }
  type Enrollment = { course_id: string };
  const courseIds = (enrollments as Enrollment[]).map((e) => e.course_id);
  if (!courseIds.length) {
    return NextResponse.json({ success: true, courses: [] });
  }
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description')
    .in('id', courseIds);
  if (courseError) {
    return NextResponse.json({ success: false, error: courseError.message });
  }
  return NextResponse.json({ success: true, courses });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user_id: userId, course_id: courseId } = body;
  if (!userId || !courseId) {
    return NextResponse.json({ success: false, error: 'user_id dan course_id wajib diisi.' });
  }
  let payload;
  try {
    payload = await requireAuth();
  } catch (error) {
    return authErrorResponse(error);
  }
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
    return NextResponse.json({ success: true, enrollment_id: existing.id });
  }
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId })
    .select();
  if (error || !data || !data[0]) {
    return NextResponse.json({ success: false, error: 'Gagal enroll.' });
  }
  return NextResponse.json({ success: true, enrollment_id: data[0].id });
}
