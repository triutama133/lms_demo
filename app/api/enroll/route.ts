
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id wajib diisi.' });
  }
  // Ambil daftar enrollments user
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', user_id);
  if (enrollError) {
    return NextResponse.json({ success: false, error: enrollError.message });
  }
  type Enrollment = { course_id: string };
  const courseIds = (enrollments as Enrollment[]).map((e) => e.course_id);
  if (!courseIds.length) {
    return NextResponse.json({ success: true, courses: [] });
  }
  // Ambil detail course
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description')
    .in('id', courseIds);
  if (courseError) {
    return NextResponse.json({ success: false, error: courseError.message });
  }
  return NextResponse.json({ success: true, courses });
}
import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function POST(request: Request) {
  const body = await request.json();
  const { user_id, course_id } = body;
  if (!user_id || !course_id) {
    return NextResponse.json({ success: false, error: 'user_id dan course_id wajib diisi.' });
  }
  // Cek apakah sudah enroll
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .single();
  if (existing) {
    return NextResponse.json({ success: true, enrollment_id: existing.id });
  }
  // Enroll baru
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ user_id, course_id })
    .select();
  if (error || !data || !data[0]) {
    return NextResponse.json({ success: false, error: 'Gagal enroll.' });
  }
  return NextResponse.json({ success: true, enrollment_id: data[0].id });
}
