import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import { authErrorResponse, ensureRole, requireAuth } from '../../utils/auth';

async function requireTeacherOrAdmin() {
  const payload = await requireAuth();
  ensureRole(payload, ['teacher', 'admin']);
  return payload;
}

export async function PUT(request: Request) {
  try {
    await requireTeacherOrAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const body = await request.json();
    const { id, title, description } = body;
    if (!id || !title || !description) {
      return NextResponse.json({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('courses')
      .update({ title, description })
      .eq('id', id)
      .select();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, course: data[0] });
  } catch {
    return NextResponse.json({ success: false, error: 'Gagal update course.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireTeacherOrAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Course ID wajib diisi.' }, { status: 400 });
    }
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Gagal hapus course.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireTeacherOrAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const body = await request.json();
    const { title, description, teacher_id } = body;
    if (!title || !description || !teacher_id) {
      return NextResponse.json({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('courses')
      .insert({ title, description, teacher_id })
      .select();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, course: data[0] });
  } catch {
    return NextResponse.json({ success: false, error: 'Gagal tambah course.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch (error) {
    return authErrorResponse(error);
  }
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');
  if (courseId) {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, teacher_id')
      .eq('id', courseId)
      .single();
    if (courseError) {
      return NextResponse.json({ success: false, error: courseError.message }, { status: 500 });
    }
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id, title, type, pdf_url, content, order, created_at')
      .eq('course_id', courseId);
    if (materialsError) {
      return NextResponse.json({ success: false, error: materialsError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, course, materials });
  }
  const { data, error } = await supabase
    .from('courses')
    .select('*');
  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
  return NextResponse.json({ success: true, courses: data });
}
