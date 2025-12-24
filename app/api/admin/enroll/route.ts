import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';

interface EnrollRequest {
  course_id?: string;
  user_ids?: string[];
  all_users?: boolean;
}

export async function POST(req: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
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
    const body = (await req.json()) as EnrollRequest;
    const courseId = body.course_id;
    const selectedUserIds = Array.isArray(body.user_ids) ? [...new Set(body.user_ids.filter(Boolean))] : [];
    const enrollAll = Boolean(body.all_users);

    if (!courseId) {
      return finalize({ success: false, error: 'course_id wajib diisi.' }, { status: 400 });
    }

    let targetUserIds: string[] = [];
    if (enrollAll) {
      const users = await dbService.user.findMany({
        select: { id: true }
      }) as { id: string }[];
      targetUserIds = users.map((row) => row.id).filter(Boolean);
    } else {
      targetUserIds = selectedUserIds;
    }

    if (!targetUserIds.length) {
      return finalize({ success: false, error: 'Tidak ada user yang dipilih untuk didaftarkan.' }, { status: 400 });
    }

    const uniqueUserIds = Array.from(new Set(targetUserIds));

    const existingEnrollments = await dbService.enrollment.findMany({
      where: {
        courseId: courseId,
        userId: { in: uniqueUserIds }
      },
      select: { userId: true }
    }) as { userId: string }[];

    const alreadyEnrolledIds = new Set(existingEnrollments.map((row) => row.userId));
    const newUserIds = uniqueUserIds.filter((id) => !alreadyEnrolledIds.has(id));

    if (newUserIds.length === 0) {
      return finalize({
        success: true,
        enrolled_count: 0,
        message: 'Semua user yang dipilih sudah terdaftar di course ini.',
      });
    }

    const enrollmentRows = newUserIds.map((userId) => ({
      userId,
      courseId,
    }));

    await dbService.enrollment.createMany({
      data: enrollmentRows
    });

    return finalize({
      success: true,
      enrolled_count: newUserIds.length,
      message: `Berhasil mendaftarkan ${newUserIds.length} user ke course tersebut.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mendaftarkan user ke course';
    return finalize({ success: false, error: message }, { status: 500 });
  }
}
