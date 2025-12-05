import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { minIOService, MinIOService } from '../../../../utils/minio';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.max(1, Math.min(1000, Number(searchParams.get('limit') ?? '15')));
  const search = (searchParams.get('search') ?? '').trim();
  const categoryIds = (searchParams.get('category_ids') ?? '').trim();
  const skip = (page - 1) * limit;

  try {
    // Build where conditions
    const where: Prisma.CourseWhereInput = {};

    if (search) {
      // Find teachers matching the search
      const teachers = await prisma.user.findMany({
        where: {
          name: { contains: search, mode: 'insensitive' },
          role: 'teacher'
        },
        select: { id: true }
      });
      const teacherIds = teachers.map(t => t.id);

      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        ...(teacherIds.length > 0 ? [{ teacherId: { in: teacherIds } }] : [])
      ];
    }

    // Apply category filter if provided
    if (categoryIds) {
      const categoryIdArray = categoryIds.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
      if (categoryIdArray.length > 0) {
        where.categories = { hasSome: categoryIdArray };
      }
    }

    // Get courses with count
    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          teacherId: true,
          categories: true
        },
        orderBy: { title: 'asc' },
        skip,
        take: limit
      }),
      prisma.course.count({ where })
    ]);

    // Get teacher names
    const teacherIds = [...new Set(courses.map((c) => c.teacherId).filter(Boolean))];
    let teacherMap: Record<string, string> = {};
    if (teacherIds.length > 0) {
      const teachers = await prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true }
      });
      teacherMap = Object.fromEntries(teachers.map((row) => [row.id, row.name]));
    }

    // Get all unique category IDs from all courses
    const allCategoryIds = [...new Set(courses.flatMap((c) => c.categories || []).filter(Boolean))];
    let categoryMap: Record<string, string> = {};
    if (allCategoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: allCategoryIds } },
        select: { id: true, name: true }
      });
      categoryMap = Object.fromEntries(categories.map((row) => [row.id, row.name]));
    }

    // Get enrollment counts
    const courseIds = courses.map((c) => c.id);
    let enrolledMap: Record<string, number> = {};
    if (courseIds.length > 0) {
      const enrollments = await prisma.enrollment.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { courseId: true }
      });
      enrolledMap = Object.fromEntries(enrollments.map(e => [e.courseId, e._count.courseId]));
    }

    const enrollmentTotalCount = await prisma.enrollment.count();

    const result = courses.map((course) => ({
      ...course,
      teacher_name: teacherMap[course.teacherId] ?? '-',
      enrolled_count: enrolledMap[course.id] ?? 0,
      categories: (course.categories || []).map((catId) => categoryMap[catId]).filter(Boolean),
    }));

    const response = NextResponse.json({
      success: true,
      courses: result,
      total: totalCount,
      page,
      limit,
      enrollmentTotal: enrollmentTotalCount,
    });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  } catch (error) {
    console.error('Database query error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;

  try {
    const body = await request.json();
    const { course_ids } = body;

    if (!Array.isArray(course_ids) || course_ids.length === 0) {
      return NextResponse.json({ success: false, error: 'course_ids harus berupa array dan tidak boleh kosong.' }, { status: 400 });
    }

    // Validate that all IDs are strings and not empty
    const validCourseIds = course_ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

    if (validCourseIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada course ID yang valid.' }, { status: 400 });
    }

    // Check if courses exist
    const existingCourses = await prisma.course.findMany({
      where: { id: { in: validCourseIds } },
      select: { id: true, title: true }
    });

    const foundIds = new Set(existingCourses.map(course => course.id));
    const notFoundIds = validCourseIds.filter(id => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Course dengan ID berikut tidak ditemukan: ${notFoundIds.join(', ')}`
      }, { status: 404 });
    }

    // Get all materials for these courses to delete their files from storage
    const materials = await prisma.material.findMany({
      where: {
        courseId: { in: validCourseIds },
        pdfUrl: { not: null }
      },
      select: { pdfUrl: true }
    });

    // Delete files from MinIO Storage
    if (materials && materials.length > 0) {
      const fileNames = materials
        .filter((m: { pdfUrl: string | null }) => m.pdfUrl)
        .map((m: { pdfUrl: string | null }) => {
          // Extract filename from MinIO Storage URL
          const fileName = MinIOService.extractFileNameFromUrl(m.pdfUrl!);
          return fileName;
        })
        .filter(Boolean) as string[];

      if (fileNames.length > 0) {
        const deleteResult = await minIOService.deleteFiles(fileNames);
        if (!deleteResult.success) {
          console.error('Error deleting files from storage:', deleteResult.error);
          // Continue with course deletion even if file deletion fails
        }
      }
    }

    // Delete courses - CASCADE DELETE will handle related records (enrollments, progress, ratings, materials)
    await prisma.course.deleteMany({
      where: { id: { in: validCourseIds } }
    });

    const response = NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${existingCourses.length} course.`,
      deleted_courses: existingCourses.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
    });

    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;

  } catch (error) {
    console.error('Database delete error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
