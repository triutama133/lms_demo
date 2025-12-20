import { NextResponse } from 'next/server';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { isCourseAccessibleByUser } from '../../utils/access';
import { prisma } from "@/app/utils/supabaseClient";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'user_id wajib diisi.' });
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
  if (payload.sub !== userId && payload.role !== 'admin') {
    return authErrorResponse(new Error('Forbidden'));
  }
  // Category-based access: block enroll if student does not have required category
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: userId },
    select: { courseId: true }
  });

  const courseIds = enrollments.map((e) => e.courseId);
  if (!courseIds.length) {
    return finalize({ success: true, courses: [] });
  }
  // No need to check access control for already enrolled courses
  // User should be able to see their enrolled courses even if categories change later
  // ...existing code...
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true, description: true }
  });

  return finalize({ success: true, courses });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id: userId, course_id: courseId } = body;
    if (!userId || !courseId) {
      console.log('Missing user_id or course_id:', { userId, courseId });
      return NextResponse.json({ success: false, error: 'user_id dan course_id wajib diisi.' });
    }

    console.log('Enroll attempt:', { userId, courseId });

    let auth;
    try {
      auth = await requireAuth();
    } catch (error) {
      console.log('Auth failed:', error);
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

    // Check access control BEFORE enrolling (same logic as GET /api/courses)
    if (payload.role !== 'admin' && payload.role !== 'teacher') {
      const allowed = await isCourseAccessibleByUser({ userId: payload.sub, role: payload.role, courseId });
      if (!allowed) {
        console.log('Access denied for user:', payload.sub, 'role:', payload.role, 'course:', courseId);
        return finalize({ success: false, error: 'Course tidak tersedia untuk kategori akun Anda.' }, { status: 403 });
      }
    }

    try {
      const existing = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId
        }
      });

      console.log('Existing enrollment check:', existing);

      if (existing) {
        console.log('Already enrolled, returning existing enrollment_id:', existing.id);
        return finalize({ success: true, enrollment_id: existing.id });
      }

      console.log('Creating new enrollment...');

      const data = await prisma.enrollment.create({
        data: {
          userId: userId,
          courseId: courseId
        }
      });

      console.log('Insert result:', data);

      if (!data) {
        console.log('Insert failed');
        return finalize({ success: false, error: 'Gagal enroll.' });
      }

      console.log('Enrollment successful:', data.id);
      return finalize({ success: true, enrollment_id: data.id });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return finalize({ success: false, error: 'Database error occurred.' });
    }
  } catch (error) {
    console.error('Unexpected error in enroll POST:', error);
    return NextResponse.json({ success: false, error: 'Unexpected server error.' });
  }
}
