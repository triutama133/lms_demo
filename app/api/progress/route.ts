import { NextResponse } from 'next/server';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { dbService } from '../../../utils/database';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  const course_id = searchParams.get('course_id');
  if (!user_id || !course_id) {
    return NextResponse.json({ success: false, error: 'user_id dan course_id wajib diisi.' });
  }
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

  // Check if user is enrolled in the course
  const enrollment = await dbService.enrollment.findFirst({
    where: {
      userId: user_id,
      courseId: course_id
    }
  });

  if (!enrollment) {
    return finalize({ success: false, error: 'User tidak enrolled di course ini.' }, { status: 404 });
  }

  if (payload.sub !== user_id && payload.role !== 'admin' && payload.role !== 'teacher') {
    return authErrorResponse(new Error('Forbidden'));
  }

  // Get all progress for user and course
  const progress = await dbService.progress.findMany({
    where: {
      userId: user_id,
      courseId: course_id
    },
    select: {
      id: true,
      materialId: true,
      completed: true,
      updatedAt: true
    }
  });

  return finalize({ success: true, progress });
}
