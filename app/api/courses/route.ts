import { NextResponse } from 'next/server';
import { dbService } from '../../../utils/database';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { filterCoursesByAccess, isCourseAccessibleByUser } from '../../utils/access';
import { storageService } from '../../../utils/storage';

async function requireTeacherOrAdmin() {
  const auth = await requireAuth();
  ensureRole(auth.payload, ['teacher', 'admin']);
  return auth;
}

export async function PUT(request: Request) {
  let auth;
  try {
    auth = await requireTeacherOrAdmin();
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
    const body = await request.json();
    const { id, title, description } = body;
    if (!id || !title || !description) {
      return finalize({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }
    const course = await dbService.course.update({
      where: { id },
      data: { title, description }
    });
    return finalize({ success: true, course });
  } catch {
    return finalize({ success: false, error: 'Gagal update course.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireTeacherOrAdmin();
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
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return finalize({ success: false, error: 'Course ID wajib diisi.' }, { status: 400 });
    }

    // Get all materials for this course to delete their files from storage
    const materials = await dbService.material.findMany({
      where: { courseId: id, pdfUrl: { not: null } },
      select: { pdfUrl: true }
    });

    // Delete files from MinIO Storage
    if ((materials as unknown[]).length > 0) {
      const fileNames = (materials as unknown[])
        .filter((m: unknown) => (m as { pdfUrl?: string }).pdfUrl)
        .map((m: unknown) => storageService.extractFileNameFromUrl((m as { pdfUrl?: string }).pdfUrl!))
        .filter(Boolean) as string[];

      if (fileNames.length > 0) {
        const deleteResult = await storageService.deleteFiles(fileNames);
        if (!deleteResult.success) {
          console.error('Error deleting files from MinIO:', deleteResult.error);
          // Continue with course deletion even if file deletion fails
        }
      }
    }

    await dbService.course.delete({
      where: { id }
    });
    return finalize({ success: true });
  } catch {
    return finalize({ success: false, error: 'Gagal hapus course.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireTeacherOrAdmin();
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
    const body = await request.json();
    const { title, description, teacher_id, categories } = body;
    if (!title || !description || !teacher_id) {
      return finalize({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }

    // Validate teacher_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(teacher_id)) {
      return finalize({ success: false, error: 'Teacher ID tidak valid.' }, { status: 400 });
    }

    // Check if teacher exists
    const teacher = await dbService.user.findUnique({
      where: { id: teacher_id },
      select: { id: true, role: true }
    }) as { id: string; role: string } | null;
    if (!teacher || !['teacher', 'admin'].includes(teacher.role)) {
      return finalize({ success: false, error: 'User bukan teacher atau admin.' }, { status: 400 });
    }

    // Set default category if categories is empty or null
    const finalCategories = categories && categories.length > 0 ? categories : []; // No default category, course will be public
    const course = await dbService.course.create({
      data: { title, description, teacherId: teacher_id, categories: finalCategories }
    });
    return finalize({ success: true, course });
  } catch (error) {
    console.error('Error creating course:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return finalize({ success: false, error: `Gagal tambah course: ${errorMsg}` }, { status: 500 });
  }
}

export async function GET(request: Request) {
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
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');
  try {
    if (courseId) {
      const course = await dbService.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, description: true, teacherId: true, categories: true }
      }) as { id: string; title: string; description: string; teacherId: string; categories: string[] } | null;
      if (!course) {
        return finalize({ success: false, error: 'Course not found' }, { status: 404 });
      }

      // Convert category IDs to names
      let processedCourse = course;
      if (course.categories && Array.isArray(course.categories) && course.categories.length > 0) {
        const categories = await dbService.category.findMany({
          where: { id: { in: course.categories } },
          select: { id: true, name: true }
        }) as { id: string; name: string }[];
        const categoryMap = Object.fromEntries(categories.map((c: { id: string; name: string }) => [c.id, c.name]));
        processedCourse = {
          ...course,
          categories: course.categories.map((catId: string) => categoryMap[catId]).filter(Boolean),
        };
      }

      const materials = await dbService.material.findMany({
        where: { courseId },
        select: { id: true, title: true, type: true, pdfUrl: true, content: true, order: true, createdAt: true }
      }) as { id: string; title: string; type: string; pdfUrl: string | null; content: string | null; order: number | null; createdAt: Date }[];

      // Process materials to replace URLs with public domain
      const processedMaterials = materials.map(material => ({
        ...material,
        pdfUrl: material.pdfUrl ? storageService.replaceWithPublicUrl(material.pdfUrl) : null
      }));

      // Enforce access for non-admin/teacher: Allow if course has no categories (public) or user has access
      const role = (payload.role || '').toString();
      if (role !== 'admin' && role !== 'teacher') {
        const allowed = await isCourseAccessibleByUser({ userId: payload.sub, role, courseId });
        if (!allowed) {
          return finalize({ success: false, error: 'Forbidden' }, { status: 403 });
        }
      }
      return finalize({ success: true, course: processedCourse, materials: processedMaterials });
    }
    const courses = await dbService.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        teacherId: true,
        categories: true
      }
    }) as { id: string; title: string; description: string | null; teacherId: string; categories: string[] }[];

    // Filter for student: Include courses with no categories (public) for all registered users
    const role = (payload.role || '').toString();
    const coursesWithTeacherId = courses.map(c => ({ ...c, teacher_id: c.teacherId }));
    const filtered = await filterCoursesByAccess(coursesWithTeacherId, payload.sub, role);

    // Convert category IDs to names for all courses
    const processedCourses = await Promise.all(filtered.map(async (course: { id: string; teacherId: string; categories: string[] }) => {
      if (course.categories && Array.isArray(course.categories) && course.categories.length > 0) {
        const categories = await dbService.category.findMany({
          where: { id: { in: course.categories } },
          select: { id: true, name: true }
        }) as { id: string; name: string }[];
        const categoryMap = Object.fromEntries(categories.map((c: { id: string; name: string }) => [c.id, c.name]));
        return {
          ...course,
          categories: course.categories.map((catId: string) => categoryMap[catId]).filter(Boolean),
        };
      }
      return course;
    }));

    return finalize({ success: true, courses: processedCourses });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return finalize({ success: false, error: errorMsg }, { status: 500 });
  }
}
