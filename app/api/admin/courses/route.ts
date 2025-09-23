import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

export async function GET() {
  // Ambil semua course beserta nama teacher dan jumlah peserta
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description, teacher_id');
  if (courseError) {
    return NextResponse.json({ success: false, error: courseError.message }, { status: 500 });
  }

  // Ambil semua teacher
  const teacherIds = [...new Set(courses.map((c: any) => c.teacher_id))];
  const { data: teachers, error: teacherError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', teacherIds);
  if (teacherError) {
    return NextResponse.json({ success: false, error: teacherError.message }, { status: 500 });
  }

  // Ambil jumlah peserta per course
  const courseIds = courses.map((c: any) => c.id);
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id, user_id');
  if (enrollError) {
    return NextResponse.json({ success: false, error: enrollError.message }, { status: 500 });
  }

  // Map teacher name dan jumlah peserta ke course
  const teacherMap = Object.fromEntries(teachers.map((t: any) => [t.id, t.name]));
  const enrolledMap: Record<string, number> = {};
  for (const cId of courseIds) {
    enrolledMap[cId] = enrollments.filter((e: any) => e.course_id === cId).length;
  }

  const result = courses.map((c: any) => ({
    ...c,
    teacher_name: teacherMap[c.teacher_id] || '-',
    enrolled_count: enrolledMap[c.id] || 0,
  }));

  return NextResponse.json({ success: true, courses: result });
}
