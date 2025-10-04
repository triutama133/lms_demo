import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function ensureTeacherOwnsCourse(teacherId: string, courseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('courses')
    .select('teacher_id')
    .eq('id', courseId)
    .single();
  if (error || !data) return false;
  return data.teacher_id === teacherId;
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { course_id, category_id } = body ?? {};
  if (!course_id || !category_id) {
    return NextResponse.json({ success: false, error: 'course_id dan category_id wajib.' }, { status: 400 });
  }
  // teacher only allowed for own course
  if (payload.role === 'teacher') {
    const owns = await ensureTeacherOwnsCourse(payload.sub, course_id);
    if (!owns) {
      return authErrorResponse(new Error('Forbidden'));
    }
  }
  // category must exist (created by admin)
  const { data: cat, error: catErr } = await supabase.from('categories').select('id, name').eq('id', category_id).single();
  if (catErr || !cat) {
    return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
  }

  // Update categories array in courses table
  const { data: currentCourse, error: fetchError } = await supabase
    .from('courses')
    .select('categories')
    .eq('id', course_id)
    .single();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const currentCategories = currentCourse?.categories || [];
  if (!currentCategories.includes(category_id)) {
    const updatedCategories = [...currentCategories, category_id];
    const { error } = await supabase
      .from('courses')
      .update({ categories: updatedCategories })
      .eq('id', course_id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const { searchParams } = new URL(request.url);
  const multi = searchParams.get('course_ids');
  if (multi) {
    if (payload.role === 'teacher') {
      return authErrorResponse(new Error('Forbidden'));
    }
    const rawIds = multi.split(',').map((id) => id.trim()).filter(Boolean);
    if (rawIds.length === 0) {
      return NextResponse.json({ success: false, error: 'course_ids wajib.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('courses')
      .select('id, categories')
      .in('id', rawIds);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const assignments: Record<string, string[]> = {};
    rawIds.forEach((id) => {
      assignments[id] = [];
    });
    (data || []).forEach((row: { id: string; categories: string[] }) => {
      assignments[row.id] = row.categories || [];
    });
    const response = NextResponse.json({ success: true, assignments });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  }
  const course_id = searchParams.get('course_id') ?? '';
  if (!course_id) {
    return NextResponse.json({ success: false, error: 'course_id wajib.' }, { status: 400 });
  }
  if (payload.role === 'teacher') {
    const owns = await ensureTeacherOwnsCourse(payload.sub, course_id);
    if (!owns) {
      return authErrorResponse(new Error('Forbidden'));
    }
  }
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true });
  if (catErr) {
    return NextResponse.json({ success: false, error: catErr.message }, { status: 500 });
  }

  // Get assigned categories from courses table
  const { data: courseData, error: courseErr } = await supabase
    .from('courses')
    .select('categories')
    .eq('id', course_id)
    .single();

  if (courseErr) {
    return NextResponse.json({ success: false, error: courseErr.message }, { status: 500 });
  }

  const assignedIds = courseData?.categories || [];
  const response = NextResponse.json({ success: true, categories: cats ?? [], assigned: assignedIds });
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { course_id, category_id } = body ?? {};
  if (!course_id || !category_id) {
    return NextResponse.json({ success: false, error: 'course_id dan category_id wajib.' }, { status: 400 });
  }
  if (payload.role === 'teacher') {
    const owns = await ensureTeacherOwnsCourse(payload.sub, course_id);
    if (!owns) {
      return authErrorResponse(new Error('Forbidden'));
    }
  }

  // category must exist (created by admin)
  const { data: cat, error: catErr } = await supabase.from('categories').select('id, name').eq('id', category_id).single();
  if (catErr || !cat) {
    return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
  }

  // Update categories array in courses table
  const { data: currentCourse, error: fetchError } = await supabase
    .from('courses')
    .select('categories')
    .eq('id', course_id)
    .single();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const currentCategories = currentCourse?.categories || [];
  const updatedCategories = currentCategories.filter((id: string) => id !== category_id);

  const { error } = await supabase
    .from('courses')
    .update({ categories: updatedCategories })
    .eq('id', course_id);

  const response = NextResponse.json(
    error ? { success: false, error: error.message } : { success: true },
    { status: error ? 500 : 200 },
  );
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}
