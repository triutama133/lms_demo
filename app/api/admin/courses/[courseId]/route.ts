import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../../utils/auth';
import { dbService } from '../../../../../utils/database';

type Enrollment = {
  userId: string;
  enrolledAt: Date;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  provinsi: string | null;
};

export async function GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
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

  const { courseId } = await params;

  if (!courseId) {
    return finalize({ success: false, error: 'courseId wajib diisi' }, { status: 400 });
  }

  try {
    // Check if course exists and user has permission
    const course = await dbService.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, teacherId: true }
    }) as { id: string; title: string; teacherId: string } | null;

    if (!course) {
      return finalize({ success: false, error: 'Course tidak ditemukan' }, { status: 404 });
    }

    // Teachers can only see participants of their own courses
    if (payload.role === 'teacher' && course.teacherId !== payload.sub) {
      return finalize({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get enrollments for this course
    const enrollments = await dbService.enrollment.findMany({
      where: { courseId },
      select: { userId: true, enrolledAt: true },
      orderBy: { enrolledAt: 'desc' }
    }) as { userId: string; enrolledAt: Date }[];

    if (enrollments.length === 0) {
      return finalize({ success: true, participants: [] });
    }

    // Get user data for enrolled users
    const userIds = enrollments.map((e: Enrollment) => e.userId);
    const users = await dbService.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true, provinsi: true }
    }) as { id: string; name: string; email: string; role: string; provinsi: string | null }[];

    // Combine enrollment data with user data
    const participants = users.map((user: User) => {
      const enrollment = enrollments.find((e: Enrollment) => e.userId === user.id);
      return {
        ...user,
        enrolled_at: enrollment?.enrolledAt ? new Date(enrollment.enrolledAt).toISOString() : null
      };
    });

    return finalize({ success: true, participants });
  } catch (error) {
    console.error('Get course participants error:', error);
    return finalize({ success: false, error: 'Gagal mengambil data peserta' }, { status: 500 });
  }
}