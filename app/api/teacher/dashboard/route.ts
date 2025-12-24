import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';
import { storageService } from '../../../../utils/storage';

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['teacher', 'admin']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;

  try {
    // Ambil user id dari query (atau session, jika sudah ada auth)
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');


    // Jika admin, izinkan akses ke semua courses atau courses teacher tertentu
    // Jika teacher, hanya boleh akses courses sendiri
    let queryTeacherId = teacherId;
    if (payload.role === 'admin') {
      // Admin bisa melihat semua courses jika tidak specify teacher_id
      // Atau courses teacher tertentu jika teacher_id disediakan
      queryTeacherId = teacherId || null; // null berarti ambil semua courses
    } else {
      // Teacher hanya boleh akses courses sendiri
      // Jika tidak ada teacher_id di query, gunakan teacher_id dari session
      queryTeacherId = teacherId || payload.sub;
    }

    // Ambil courses berdasarkan teacher_id (atau semua jika admin dan teacherId null)
    const whereCondition: { teacherId?: string } = {};
    if (queryTeacherId) {
      whereCondition.teacherId = queryTeacherId;
    }

    const courses = await dbService.course.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        description: true,
        categories: true,
        createdAt: true,
        teacherId: true
      }
    }) as { id: string; title: string; description: string | null; categories: string[]; createdAt: Date; teacherId: string }[];

    // Get enrolled count for each course
    const courseIds = (courses as { id: string }[])?.map((c) => c.id) || [];
    let enrolledMap: Record<string, number> = {};
    if (courseIds.length > 0) {
      const enrollments = await dbService.enrollment.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { courseId: true }
      });
      enrolledMap = Object.fromEntries((enrollments as { courseId: string; _count: { courseId: number } }[]).map(e => [e.courseId, e._count.courseId]));
    }

    // Get teacher names if admin is viewing all courses
    const teacherIds = [...new Set((courses as { teacherId: string }[])?.map((c) => c.teacherId).filter(Boolean) || [])];
    let teacherMap: Record<string, string> = {};
    if (payload.role === 'admin' && teacherIds.length > 0) {
      const teachers = await dbService.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true }
      });
      teacherMap = Object.fromEntries((teachers as { id: string; name: string }[]).map((row) => [row.id, row.name]));
    }

    // Get all unique category IDs from all courses
    const allCategoryIds = [...new Set(((courses as { categories: string[] }[]) || []).flatMap((c) => c.categories || []).filter(Boolean))];
    let categoryMap: Record<string, string> = {};
    if (allCategoryIds.length > 0) {
      const categories = await dbService.category.findMany({
        where: { id: { in: allCategoryIds } },
        select: { id: true, name: true }
      });
      categoryMap = Object.fromEntries((categories as { id: string; name: string }[]).map((row) => [row.id, row.name]));
    }

    // Map enrolled_count ke setiap course
    type CourseWithCount = {
      id: string;
      title: string;
      description: string | null;
      categories: string[];
      createdAt: Date;
      teacherId: string;
      enrolled_count: number;
      teacher_name?: string;
    };
    const coursesWithCount: CourseWithCount[] = Array.isArray(courses)
      ? courses.map((c) => ({
          ...c,
          enrolled_count: enrolledMap[c.id] ?? 0,
          teacher_name: payload.role === 'admin' ? (teacherMap[c.teacherId] ?? '-') : undefined,
          categories: ((c as { categories: string[] }).categories || []).map((catId: string) => categoryMap[catId]).filter(Boolean),
        }))
      : [];

    // Ambil materi yang dibuat oleh teacher
    const materials = await dbService.material.findMany({
      where: { courseId: { in: coursesWithCount.map((c) => c.id) } },
      select: {
        id: true,
        courseId: true,
        title: true,
        type: true,
        pdfUrl: true,
        content: true,
        order: true,
        createdAt: true
      }
    }) as { id: string; courseId: string; title: string; type: string; pdfUrl: string | null; content: string | null; order: number; createdAt: Date }[];

    // Process materials to replace URLs with public domain
    const processedMaterials = (materials as { pdfUrl?: string }[]).map(material => ({
      ...material,
      pdfUrl: material.pdfUrl ? storageService.replaceWithPublicUrl(material.pdfUrl) : null
    }));

    // Ambil progress siswa untuk courses teacher
    const progress = await dbService.progress.findMany({
      select: {
        id: true,
        userId: true,
        courseId: true,
        materialId: true,
        completed: true,
        updatedAt: true
      }
    }) as { id: string; userId: string; courseId: string; materialId: string; completed: boolean; updatedAt: Date }[];
    // (opsional: filter progress by course/material if needed)

    const response = NextResponse.json({ success: true, courses: coursesWithCount, materials: processedMaterials, progress });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
