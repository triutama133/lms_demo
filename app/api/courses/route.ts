import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { filterCoursesByAccess, isCourseAccessibleByUser } from '../../utils/access';

async function requireTeacherOrAdmin() {
  const auth = await requireAuth();
  ensureRole(auth.payload, ['teacher', 'admin']);
  return auth;
}

export async function PUT(request: Request) {
  let auth;
  try {
    auth = await requireTeacherOrAdmin();
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
  try {
    const body = await request.json();
    const { id, title, description } = body;
    if (!id || !title || !description) {
      return finalize({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('courses')
      .update({ title, description })
      .eq('id', id)
      .select();
    if (error) {
      return finalize({ success: false, error: error.message }, { status: 500 });
    }
    return finalize({ success: true, course: data[0] });
  } catch {
    return finalize({ success: false, error: 'Gagal update course.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireTeacherOrAdmin();
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
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return finalize({ success: false, error: 'Course ID wajib diisi.' }, { status: 400 });
    }
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    if (error) {
      return finalize({ success: false, error: error.message }, { status: 500 });
    }
    return finalize({ success: true });
  } catch {
    return finalize({ success: false, error: 'Gagal hapus course.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireTeacherOrAdmin();
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
  try {
    const body = await request.json();
    const { title, description, teacher_id, categories } = body;
    if (!title || !description || !teacher_id) {
      return finalize({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('courses')
      .insert({ title, description, teacher_id, categories: categories || [] })
      .select();
    if (error) {
      return finalize({ success: false, error: error.message }, { status: 500 });
    }
    return finalize({ success: true, course: data[0] });
  } catch {
    return finalize({ success: false, error: 'Gagal tambah course.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
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
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');
  if (courseId) {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, teacher_id, categories')
      .eq('id', courseId)
      .single();
    if (courseError) {
      return finalize({ success: false, error: courseError.message }, { status: 500 });
    }

    // Convert category IDs to names
    let processedCourse = course;
    if (course.categories && Array.isArray(course.categories) && course.categories.length > 0) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', course.categories);
      if (categoryError) {
        return finalize({ success: false, error: categoryError.message }, { status: 500 });
      }
      const categoryMap = Object.fromEntries((categoryData || []).map((row) => [row.id, row.name]));
      processedCourse = {
        ...course,
        categories: course.categories.map((catId: string) => categoryMap[catId]).filter(Boolean),
      };
    }

    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id, title, type, pdf_url, content, order, created_at')
      .eq('course_id', courseId);
    if (materialsError) {
      return finalize({ success: false, error: materialsError.message }, { status: 500 });
    }
    // Enforce access for non-admin/teacher
    const role = (payload.role || '').toString();
    if (role !== 'admin' && role !== 'teacher') {
      const allowed = await isCourseAccessibleByUser({ userId: payload.sub, role, courseId });
      if (!allowed) {
        return finalize({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }
    return finalize({ success: true, course: processedCourse, materials });
  }
  const { data, error } = await supabase
    .from('courses')
    .select('*');
  if (error) {
    return finalize({ success: false, error: error.message });
  }
  // Filter for student
  const role = (payload.role || '').toString();
  const courses = Array.isArray(data) ? (data as Array<{ id: string; teacher_id?: string | null; categories?: string[] }>) : [];
  const filtered = await filterCoursesByAccess(courses, payload.sub, role);

  // Convert category IDs to names for all courses
  const processedCourses = await Promise.all(filtered.map(async (course) => {
    if (course.categories && Array.isArray(course.categories) && course.categories.length > 0) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', course.categories);
      if (categoryError) {
        console.error('Error fetching categories:', categoryError);
        return course; // Return course without category conversion if error
      }
      const categoryMap = Object.fromEntries((categoryData || []).map((row) => [row.id, row.name]));
      return {
        ...course,
        categories: course.categories.map((catId: string) => categoryMap[catId]).filter(Boolean),
      };
    }
    return course;
  }));

  return finalize({ success: true, courses: processedCourses });
}
