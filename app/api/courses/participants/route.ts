import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['teacher', 'admin']);
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
  if (!courseId) {
    return finalize({ success: false, error: 'course_id wajib diisi' }, { status: 400 });
  }
  const course = await dbService.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true }
  }) as { teacherId: string } | null;
  if (!course) {
    return finalize({ success: false, error: 'Course tidak ditemukan' }, { status: 404 });
  }
  if (payload.role === 'teacher' && course.teacherId !== payload.sub) {
    return authErrorResponse(new Error('Forbidden'));
  }

  try {
    // Ambil enrollments untuk course ini
    const enrollments = await dbService.enrollment.findMany({
      where: { courseId },
      select: { userId: true }
    }) as { userId: string }[];
    if (!enrollments || enrollments.length === 0) {
      return finalize({ success: true, participants: [] });
    }

    // Ambil data user dari user_id hasil enrollments
    const userIds = enrollments.map((e) => e.userId);
    const users = await dbService.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    return finalize({ success: true, participants: users });
  } catch (error) {
    console.error('Error fetching participants:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return finalize({ success: false, error: `Gagal fetch data: ${errorMsg}` }, { status: 500 });
  }
}
