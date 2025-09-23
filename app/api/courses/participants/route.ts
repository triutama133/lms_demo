import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');
  if (!courseId) {
    return NextResponse.json({ success: false, error: 'course_id wajib diisi' }, { status: 400 });
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
  const userIds = enrollments.map((e: any) => e.user_id);
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds);
  if (userError) {
    return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, participants: users });
}
