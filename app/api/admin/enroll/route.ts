import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, requireAuth } from '../../../utils/auth';

interface EnrollRequest {
  course_id?: string;
  user_ids?: string[];
  all_users?: boolean;
}

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();
    ensureRole(payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const body = (await req.json()) as EnrollRequest;
    const courseId = body.course_id;
    const selectedUserIds = Array.isArray(body.user_ids) ? [...new Set(body.user_ids.filter(Boolean))] : [];
    const enrollAll = Boolean(body.all_users);

    if (!courseId) {
      return NextResponse.json({ success: false, error: 'course_id wajib diisi.' }, { status: 400 });
    }

    let targetUserIds: string[] = [];
    if (enrollAll) {
      const { data, error } = await supabase
        .from('users')
        .select('id');
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      targetUserIds = (data || []).map((row) => row.id).filter(Boolean);
    } else {
      targetUserIds = selectedUserIds;
    }

    if (!targetUserIds.length) {
      return NextResponse.json({ success: false, error: 'Tidak ada user yang dipilih untuk didaftarkan.' }, { status: 400 });
    }

    const uniqueUserIds = Array.from(new Set(targetUserIds));

    const { data: existingEnrollments, error: existingError } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('course_id', courseId)
      .in('user_id', uniqueUserIds);

    if (existingError) {
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 });
    }

    const alreadyEnrolledIds = new Set((existingEnrollments || []).map((row) => row.user_id));
    const newUserIds = uniqueUserIds.filter((id) => !alreadyEnrolledIds.has(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        enrolled_count: 0,
        message: 'Semua user yang dipilih sudah terdaftar di course ini.',
      });
    }

    const enrollmentRows = newUserIds.map((userId) => ({
      user_id: userId,
      course_id: courseId,
    }));

    const { error: insertError } = await supabase
      .from('enrollments')
      .insert(enrollmentRows);

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      enrolled_count: newUserIds.length,
      message: `Berhasil mendaftarkan ${newUserIds.length} user ke course tersebut.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mendaftarkan user ke course';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
