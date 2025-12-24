import { NextResponse } from 'next/server';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
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

  // Hanya user sendiri atau admin/teacher yang bisa lihat
  if (payload.sub !== user_id && payload.role !== 'admin' && payload.role !== 'teacher') {
    return authErrorResponse(new Error('Forbidden'));
  }

  try {
    // Get all enrollments for user
    const enrollments = await dbService.enrollment.findMany({
      where: { userId: user_id },
      select: { courseId: true }
    }) as { courseId: string }[];

    const courseIds = enrollments.map(e => e.courseId);

    const progressData = [];

    for (const courseId of courseIds) {
      // Get course info
      const course = await dbService.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, description: true, teacherId: true }
      }) as { id: string; title: string; description: string | null; teacherId: string } | null;

      if (!course) continue;

      // Get teacher info
      const teacher = await dbService.user.findUnique({
        where: { id: course.teacherId },
        select: { name: true }
      }) as { name: string } | null;

      // Get all materials for this course
      const materials = await dbService.material.findMany({
        where: { courseId: course.id },
        select: { id: true, title: true, type: true, order: true },
        orderBy: { order: 'asc' }
      }) as { id: string; title: string; type: string; order: number | null }[];

      // Get progress for this user and course
      const progress = await dbService.progress.findMany({
        where: {
          userId: user_id,
          courseId: course.id
        },
        select: { materialId: true, completed: true, updatedAt: true }
      }) as { materialId: string; completed: boolean; updatedAt: Date }[];

      // Get enrollment info
      const enrollment = await dbService.enrollment.findFirst({
        where: { userId: user_id, courseId: courseId },
        select: { id: true, enrolledAt: true }
      }) as { id: string; enrolledAt: Date } | null;

      if (!enrollment) continue;

      // Calculate completion stats
      const totalMaterials = materials.length;
      const completedMaterials = progress.filter(p => p.completed).length;
      const completionPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

      // Estimate time spent (15 minutes per material)
      const timeSpent = completedMaterials * 15;

      // Get last accessed time
      const lastAccessed = progress.length > 0
        ? progress.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].updatedAt
        : enrollment.enrolledAt;

      progressData.push({
        courseId: course.id,
        courseTitle: course.title,
        courseDescription: course.description,
        teacherName: teacher?.name || 'Unknown',
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        totalMaterials,
        completedMaterials,
        completionPercentage,
        timeSpent,
        lastAccessed,
        materials: materials.map(material => ({
          id: material.id,
          title: material.title,
          type: material.type,
          completed: progress.some(p => p.materialId === material.id && p.completed)
        }))
      });
    }

    // Calculate overall statistics
    const totalCourses = progressData.length;
    const completedCourses = progressData.filter(p => p.completionPercentage === 100).length;
    const totalTimeSpent = progressData.reduce((sum, p) => sum + p.timeSpent, 0);
    const averageCompletion = totalCourses > 0
      ? Math.round(progressData.reduce((sum, p) => sum + p.completionPercentage, 0) / totalCourses)
      : 0;

    return finalize({
      success: true,
      summary: {
        totalCourses,
        completedCourses,
        totalTimeSpent,
        averageCompletion,
        totalMaterials: progressData.reduce((sum, p) => sum + p.totalMaterials, 0),
        completedMaterials: progressData.reduce((sum, p) => sum + p.completedMaterials, 0)
      },
      courses: progressData
    });

  } catch (error) {
    console.error('Error fetching student progress:', error);
    return finalize({ success: false, error: 'Gagal fetch progress data.' });
  }
}