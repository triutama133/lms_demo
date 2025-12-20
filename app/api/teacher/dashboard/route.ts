import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { prisma } from "@/app/utils/supabaseClient";
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

  const courses = await prisma.course.findMany({
    where: whereCondition,
    select: {
      id: true,
      title: true,
      description: true,
      categories: true,
      createdAt: true,
      teacherId: true
    }
  });

  // Get enrolled count for each course
  const courseIds = courses?.map((c) => c.id) || [];
  let enrolledMap: Record<string, number> = {};
  if (courseIds.length > 0) {
    const enrollments = await prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { courseId: true }
    });
    enrolledMap = Object.fromEntries(enrollments.map(e => [e.courseId, e._count.courseId]));
  }

  // Get teacher names if admin is viewing all courses
  const teacherIds = [...new Set(courses?.map((c) => c.teacherId).filter(Boolean) || [])];
  let teacherMap: Record<string, string> = {};
  if (payload.role === 'admin' && teacherIds.length > 0) {
    const teachers = await prisma.user.findMany({
      where: { id: { in: teacherIds } },
      select: { id: true, name: true }
    });
    teacherMap = Object.fromEntries(teachers.map((row) => [row.id, row.name]));
  }

  // Get all unique category IDs from all courses
  const allCategoryIds = [...new Set((courses || []).flatMap((c) => c.categories || []).filter(Boolean))];
  let categoryMap: Record<string, string> = {};
  if (allCategoryIds.length > 0) {
    const categories = await prisma.category.findMany({
      where: { id: { in: allCategoryIds } },
      select: { id: true, name: true }
    });
    categoryMap = Object.fromEntries(categories.map((row) => [row.id, row.name]));
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
        categories: (c.categories || []).map((catId) => categoryMap[catId]).filter(Boolean),
      }))
    : [];

  // Ambil materi yang dibuat oleh teacher
  const materials = await prisma.material.findMany({
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
  });

  // Process materials to replace URLs with public domain
  const processedMaterials = materials.map(material => ({
    ...material,
    pdfUrl: material.pdfUrl ? storageService.replaceWithPublicUrl(material.pdfUrl) : null
  }));

  // Ambil progress siswa untuk courses teacher
  const progress = await prisma.progress.findMany({
    select: {
      id: true,
      userId: true,
      courseId: true,
      materialId: true,
      completed: true,
      updatedAt: true
    }
  });
  // (opsional: filter progress by course/material if needed)

  const response = NextResponse.json({ success: true, courses: coursesWithCount, materials: processedMaterials, progress });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}
