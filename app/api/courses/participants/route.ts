import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';

const prisma = new PrismaClient();

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
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true }
  });
  if (!course) {
    return finalize({ success: false, error: 'Course tidak ditemukan' }, { status: 404 });
  }
  if (payload.role === 'teacher' && course.teacherId !== payload.sub) {
    return authErrorResponse(new Error('Forbidden'));
  }

  // Ambil enrollments untuk course ini
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true }
  });
  if (!enrollments || enrollments.length === 0) {
    return finalize({ success: true, participants: [] });
  }

  // Ambil data user dari user_id hasil enrollments
  const userIds = enrollments.map((e) => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  return finalize({ success: true, participants: users });
}
