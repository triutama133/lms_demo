import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['teacher', 'admin']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  // Ambil user id dari query (atau session, jika sudah ada auth)
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');

  // Jika admin, izinkan akses ke semua courses atau courses teacher tertentu
  // Jika teacher, hanya boleh akses courses sendiri
  let queryTeacherId = teacherId;
  if (payload.role === 'admin') {
    // Admin bisa melihat semua courses jika tidak specify teacher_id
    // Atau courses teacher tertentu jika teacher_id disediakan
    queryTeacherId = teacherId || null; // null berarti ambil semua courses
  } else {
    // Teacher hanya boleh akses courses sendiri
    if (!teacherId || payload.sub !== teacherId) {
      return authErrorResponse(new Error('Forbidden'));
    }
    queryTeacherId = teacherId;
  }

  // Ambil courses berdasarkan teacher_id (atau semua jika admin dan teacherId null)
  let courseQuery = supabase
    .from('courses')
    .select('id, title, description, categories, created_at, teacher_id');

  if (queryTeacherId) {
    courseQuery = courseQuery.eq('teacher_id', queryTeacherId);
  }

  const { data: courses, error: coursesError } = await courseQuery;
  if (coursesError) {
    return NextResponse.json({ success: false, error: coursesError.message }, { status: 500 });
  }

  // Get enrolled count for each course
  const courseIds = courses?.map((c: { id: string }) => c.id) || [];
  let enrolledMap: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds);
    if (enrollmentError) {
      return NextResponse.json({ success: false, error: enrollmentError.message }, { status: 500 });
    }
    enrolledMap = (enrollmentData || []).reduce<Record<string, number>>((acc: Record<string, number>, row: { course_id: string }) => {
      acc[row.course_id] = (acc[row.course_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  // Get teacher names if admin is viewing all courses
  const teacherIds = [...new Set(courses?.map((c: { teacher_id: string }) => c.teacher_id).filter(Boolean) || [])];
  let teacherMap: Record<string, string> = {};
  if (payload.role === 'admin' && teacherIds.length > 0) {
    const { data: teacherData, error: teacherError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', teacherIds);
    if (teacherError) {
      return NextResponse.json({ success: false, error: teacherError.message }, { status: 500 });
    }
    teacherMap = Object.fromEntries((teacherData || []).map((row: { id: string; name: string }) => [row.id, row.name]));
  }

  // Get all unique category IDs from all courses
  const allCategoryIds = [...new Set((courses || []).flatMap((c: { categories?: string[] }) => c.categories || []).filter(Boolean))];
  let categoryMap: Record<string, string> = {};
  if (allCategoryIds.length > 0) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', allCategoryIds);
    if (categoryError) {
      return NextResponse.json({ success: false, error: categoryError.message }, { status: 500 });
    }
    categoryMap = Object.fromEntries((categoryData || []).map((row: { id: string; name: string }) => [row.id, row.name]));
  }

  // Map enrolled_count ke setiap course
  type Course = { id: string; title: string; description: string; categories?: string[]; created_at: string; teacher_id: string };
  const coursesWithCount = Array.isArray(courses)
    ? courses.map((c: Course) => ({
        ...c,
        enrolled_count: enrolledMap[c.id] ?? 0,
        teacher_name: payload.role === 'admin' ? (teacherMap[c.teacher_id] ?? '-') : undefined,
        categories: (c.categories || []).map((catId) => categoryMap[catId]).filter(Boolean),
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

  const response = NextResponse.json({ success: true, courses: coursesWithCount, materials, progress });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}
