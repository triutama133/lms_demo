import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { storageService } from '../../../../utils/storage';
import { dbService } from '../../../../utils/database';

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
    const where: Record<string, unknown> = {};

    if (search) {
      // Find teachers matching the search
      const teachers = await dbService.user.findMany({
        where: {
          name: { contains: search, mode: 'insensitive' },
          role: 'teacher'
        },
        select: { id: true }
      }) as { id: string }[];
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
    const coursesResult = await dbService.course.findMany({
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
    }) as { id: string; title: string; description: string; teacherId: string; categories: string[] }[];

    const totalCount = await dbService.course.count({ where });

    // Get teacher names
    const teacherIds = [...new Set(coursesResult.map((c) => c.teacherId).filter(Boolean))];
    let teacherMap: Record<string, string> = {};
    if (teacherIds.length > 0) {
      const teachers = await dbService.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true }
      }) as { id: string; name: string }[];
      teacherMap = Object.fromEntries(teachers.map((row) => [row.id, row.name]));
    }

    // Get all unique category IDs from all courses
    const allCategoryIds = [...new Set(coursesResult.flatMap((c) => c.categories || []).filter(Boolean))];
    let categoryMap: Record<string, string> = {};
    if (allCategoryIds.length > 0) {
      const categories = await dbService.category.findMany({
        where: { id: { in: allCategoryIds } },
        select: { id: true, name: true }
      }) as { id: string; name: string }[];
      categoryMap = Object.fromEntries(categories.map((row) => [row.id, row.name]));
    }

    // Get enrollment counts
    const courseIds = coursesResult.map((c) => c.id);
    let enrolledMap: Record<string, number> = {};
    if (courseIds.length > 0) {
      const enrollments = await dbService.enrollment.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { courseId: true }
      }) as { courseId: string; _count: { courseId: number } }[];
      enrolledMap = Object.fromEntries(enrollments.map(e => [e.courseId, e._count.courseId]));
    }

    const enrollmentTotalCount = await dbService.enrollment.count({});

    const result = coursesResult.map((course) => ({
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

    // Short-lived debug: log raw incoming shape when an error occurs
    // (helps capture shapes like [{ id: { value: '...' } }])
    const rawPayload = course_ids;

    // UUID validator
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Recursively try to extract a string-looking id from a value
    const extractId = (val: unknown, depth = 0): string | null => {
      if (!val || depth > 4) return null;
      if (typeof val === 'string') {
        const s = val.trim();
        return s.length ? s : null;
      }
      if (Array.isArray(val)) {
        for (const v of val) {
          const r = extractId(v, depth + 1);
          if (r) return r;
        }
        return null;
      }
      if (typeof val === 'object') {
        const o = val as Record<string, unknown>;
        // Common id fields
        for (const key of ['id', 'course_id', 'uuid', 'value']) {
          if (key in o) {
            const maybe = extractId(o[key], depth + 1);
            if (maybe) return maybe;
          }
        }
        // Fallback: search all values
        for (const k of Object.keys(o)) {
          const maybe = extractId(o[k], depth + 1);
          if (maybe) return maybe;
        }
      }
      return null;
    };

    const candidateIds: string[] = (course_ids || []).map((entry: unknown) => extractId(entry)).filter((v): v is string => !!v);
    const validCourseIds = Array.from(new Set(candidateIds.filter(id => uuidRe.test(id))));

    // Build list of invalid incoming entries for debugging (empty, object, or non-UUID)
    const safePreview = (v: unknown) => {
      try {
        const s = JSON.stringify(v);
        return s.length > 200 ? s.slice(0, 200) + '...' : s;
      } catch (e) {
        try { return String(v); } catch { return '<unserializable>' }
      }
    };

    const invalidEntries: Array<{ index: number; reason: string; extracted?: string | null; preview: string }> = [];
    for (let i = 0; i < course_ids.length; i++) {
      const entry = course_ids[i];
      const extracted = extractId(entry);
      if (!extracted) {
        invalidEntries.push({ index: i, reason: 'no-id-extracted', extracted: null, preview: safePreview(entry) });
        continue;
      }
      if (!uuidRe.test(extracted)) {
        invalidEntries.push({ index: i, reason: 'invalid-uuid-format', extracted, preview: safePreview(entry) });
      }
    }

    if (invalidEntries.length > 0) {
      console.error('course-delete found invalid course_ids:', invalidEntries.slice(0, 20));
      return NextResponse.json({ success: false, error: 'Beberapa course_ids tidak valid. Periksa payload.', invalid_entries: invalidEntries.slice(0, 20) }, { status: 400 });
    }

    // Check if courses exist
    const existingCourses = await dbService.course.findMany({
      where: { id: { in: validCourseIds } },
      select: { id: true, title: true }
    }) as { id: string; title: string }[];

    const foundIds = new Set(existingCourses.map(course => course.id));
    const notFoundIds = validCourseIds.filter(id => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Course dengan ID berikut tidak ditemukan: ${notFoundIds.join(', ')}`
      }, { status: 404 });
    }

    // Get all materials for these courses to delete their files from storage
    const materials = await dbService.material.findMany({
      where: {
        courseId: { in: validCourseIds },
        pdfUrl: { not: null }
      },
      select: { pdfUrl: true }
    }) as { pdfUrl: string | null }[];

    // Delete files from MinIO Storage
    if (materials && materials.length > 0) {
      const fileNames = materials
        .filter((m: { pdfUrl: string | null }) => m.pdfUrl)
        .map((m: { pdfUrl: string | null }) => {
          // Extract filename from MinIO Storage URL
          const fileName = storageService.extractFileNameFromUrl(m.pdfUrl!);
          return fileName;
        })
        .filter(Boolean) as string[];

      if (fileNames.length > 0) {
        const deleteResult = await storageService.deleteFiles(fileNames);
        if (!deleteResult.success) {
          console.error('Error deleting files from storage:', deleteResult.error);
          // Continue with course deletion even if file deletion fails
        }
      }
    }

    // Delete courses - CASCADE DELETE will handle related records (enrollments, progress, ratings, materials)
    await dbService.course.deleteMany({
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
