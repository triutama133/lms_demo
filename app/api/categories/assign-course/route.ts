import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';

async function ensureTeacherOwnsCourse(teacherId: string, courseId: string): Promise<boolean> {
  try {
    const course = await dbService.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true }
    }) as { teacherId: string } | null;
    if (!course) return false;
    return course.teacherId === teacherId;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { course_id, category_id } = body ?? {};
  if (!course_id || !category_id) {
    return NextResponse.json({ success: false, error: 'course_id dan category_id wajib.' }, { status: 400 });
  }
  try {
    // teacher only allowed for own course
    if (payload.role === 'teacher') {
      const owns = await ensureTeacherOwnsCourse(payload.sub, course_id);
      if (!owns) {
        return authErrorResponse(new Error('Forbidden'));
      }
    }
    // category must exist (created by admin)
    const cat = await dbService.category.findUnique({
      where: { id: category_id },
      select: { id: true, name: true }
    }) as { id: string; name: string } | null;
    if (!cat) {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    // Update categories array in courses table
    const currentCourse = await dbService.course.findUnique({
      where: { id: course_id },
      select: { categories: true }
    }) as { categories: string[] } | null;

    if (!currentCourse) {
      return NextResponse.json({ success: false, error: 'Course tidak ditemukan.' }, { status: 404 });
    }

    const currentCategories = currentCourse.categories || [];
    if (!currentCategories.includes(category_id)) {
      const updatedCategories = [...currentCategories, category_id];
      await dbService.course.update({
        where: { id: course_id },
        data: { categories: updatedCategories }
      });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const { searchParams } = new URL(request.url);
  const multi = searchParams.get('course_ids');
  try {
    if (multi) {
      if (payload.role === 'teacher') {
        return authErrorResponse(new Error('Forbidden'));
      }
      const rawIds = multi.split(',').map((id) => id.trim()).filter(Boolean);
      if (rawIds.length === 0) {
        return NextResponse.json({ success: false, error: 'course_ids wajib.' }, { status: 400 });
      }
      const courses = await dbService.course.findMany({
        where: { id: { in: rawIds } },
        select: { id: true, categories: true }
      }) as { id: string; categories: string[] | null }[];
      const assignments: Record<string, string[]> = {};
      rawIds.forEach((id) => {
        assignments[id] = [];
      });
      courses.forEach((row: { id: string; categories: string[] | null }) => {
        assignments[row.id] = row.categories || [];
      });
      const response = NextResponse.json({ success: true, assignments });
      if (shouldRefresh) await refreshAuthCookie(response, payload);
      return response;
    }
    const course_id = searchParams.get('course_id') ?? '';
    if (!course_id) {
      return NextResponse.json({ success: false, error: 'course_id wajib.' }, { status: 400 });
    }
    if (payload.role === 'teacher') {
      const owns = await ensureTeacherOwnsCourse(payload.sub, course_id);
      if (!owns) {
        return authErrorResponse(new Error('Forbidden'));
      }
    }
    const cats = await dbService.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }) as { id: string; name: string }[];

    // Get assigned categories from courses table
    const courseData = await dbService.course.findUnique({
      where: { id: course_id },
      select: { categories: true }
    }) as { categories: string[] | null } | null;

    if (!courseData) {
      return NextResponse.json({ success: false, error: 'Course tidak ditemukan.' }, { status: 404 });
    }

    const assignedIds = courseData.categories || [];
    const response = NextResponse.json({ success: true, categories: cats, assigned: assignedIds });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { course_id, category_id } = body ?? {};
  if (!course_id || !category_id) {
    return NextResponse.json({ success: false, error: 'course_id dan category_id wajib.' }, { status: 400 });
  }
  try {
    if (payload.role === 'teacher') {
      const owns = await ensureTeacherOwnsCourse(payload.sub, course_id);
      if (!owns) {
        return authErrorResponse(new Error('Forbidden'));
      }
    }

    // category must exist (created by admin)
    const cat = await dbService.category.findUnique({
      where: { id: category_id },
      select: { id: true, name: true }
    }) as { id: string; name: string } | null;
    if (!cat) {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    // Update categories array in courses table
    const currentCourse = await dbService.course.findUnique({
      where: { id: course_id },
      select: { categories: true }
    }) as { categories: string[] | null } | null;

    if (!currentCourse) {
      return NextResponse.json({ success: false, error: 'Course tidak ditemukan.' }, { status: 404 });
    }

    const currentCategories = currentCourse.categories || [];
    const updatedCategories = currentCategories.filter((id: string) => id !== category_id);

    await dbService.course.update({
      where: { id: course_id },
      data: { categories: updatedCategories }
    });

    const response = NextResponse.json({ success: true }, { status: 200 });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['admin', 'teacher']);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { course_id, category_ids } = body ?? {};
  if (!course_id) {
    return NextResponse.json({ success: false, error: 'course_id wajib.' }, { status: 400 });
  }
  if (!Array.isArray(category_ids)) {
    return NextResponse.json({ success: false, error: 'category_ids harus array.' }, { status: 400 });
  }
  try {
    if (payload.role === 'teacher') {
      const owns = await ensureTeacherOwnsCourse(payload.sub, course_id);
      if (!owns) {
        return authErrorResponse(new Error('Forbidden'));
      }
    }

    // Validate all category_ids exist (if not empty)
    if (category_ids.length > 0) {
      const cats = await dbService.category.findMany({
        where: { id: { in: category_ids } },
        select: { id: true }
      }) as { id: string }[];
      if (cats.length !== category_ids.length) {
        return NextResponse.json({ success: false, error: 'Beberapa kategori tidak ditemukan.' }, { status: 404 });
      }
    }

    // Update categories array in courses table
    await dbService.course.update({
      where: { id: course_id },
      data: { categories: category_ids }
    });

    const response = NextResponse.json({ success: true }, { status: 200 });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
