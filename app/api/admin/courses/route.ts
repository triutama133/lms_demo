import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  categories: string[] | null;
};

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.max(1, Math.min(1000, Number(searchParams.get('limit') ?? '15')));
  const search = (searchParams.get('search') ?? '').trim();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let courseQuery = supabase
    .from('courses')
    .select('id, title, description, teacher_id, categories', { count: 'exact' })
    .order('title', { ascending: true })
    .range(from, to);

  if (search) {
    const teacherMatch = await supabase
      .from('users')
      .select('id')
      .ilike('name', `%${search}%`);
    if (teacherMatch.error) {
      return NextResponse.json({ success: false, error: teacherMatch.error.message }, { status: 500 });
    }
    const teacherIds = (teacherMatch.data || []).map((row) => row.id);
    const filters = [`title.ilike.%${search}%`];
    if (teacherIds.length > 0) {
      const idList = teacherIds.join(',');
      filters.push(`teacher_id.in.(${idList})`);
    }
    courseQuery = courseQuery.or(filters.join(','));
  }

  const { data: courseData, error: courseError, count } = await courseQuery;
  if (courseError) {
    return NextResponse.json({ success: false, error: courseError.message }, { status: 500 });
  }

  const courses = (courseData || []) as CourseRow[];
  const teacherIds = [...new Set(courses.map((c) => c.teacher_id).filter(Boolean))];
  let teacherMap: Record<string, string> = {};
  if (teacherIds.length > 0) {
    const { data: teacherData, error: teacherError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', teacherIds);
    if (teacherError) {
      return NextResponse.json({ success: false, error: teacherError.message }, { status: 500 });
    }
    teacherMap = Object.fromEntries((teacherData || []).map((row) => [row.id, row.name]));
  }

  // Get all unique category IDs from all courses
  const allCategoryIds = [...new Set(courses.flatMap((c) => c.categories || []).filter(Boolean))];
  let categoryMap: Record<string, string> = {};
  if (allCategoryIds.length > 0) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', allCategoryIds);
    if (categoryError) {
      return NextResponse.json({ success: false, error: categoryError.message }, { status: 500 });
    }
    categoryMap = Object.fromEntries((categoryData || []).map((row) => [row.id, row.name]));
  }

  const courseIds = courses.map((c) => c.id);
  let enrolledMap: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds);
    if (enrollmentError) {
      return NextResponse.json({ success: false, error: enrollmentError.message }, { status: 500 });
    }
    enrolledMap = (enrollmentData || []).reduce<Record<string, number>>((acc, row: { course_id: string }) => {
      acc[row.course_id] = (acc[row.course_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const { count: enrollmentTotalCount, error: enrollmentTotalError } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true });
  if (enrollmentTotalError) {
    return NextResponse.json({ success: false, error: enrollmentTotalError.message }, { status: 500 });
  }

  const result = courses.map((course) => ({
    ...course,
    teacher_name: teacherMap[course.teacher_id] ?? '-',
    enrolled_count: enrolledMap[course.id] ?? 0,
    categories: (course.categories || []).map((catId) => categoryMap[catId]).filter(Boolean),
  }));

  const response = NextResponse.json({
    success: true,
    courses: result,
    total: count ?? 0,
    page,
    limit,
    enrollmentTotal: enrollmentTotalCount ?? 0,
  });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}
