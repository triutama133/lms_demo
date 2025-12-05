import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Role = 'admin' | 'teacher' | 'student' | string;

function isTableMissing(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code === '42P01') return true; // undefined_table
  return typeof err.message === 'string' && /relation .* does not exist/i.test(err.message);
}

export async function getUserCategoryIds(userId: string): Promise<Set<string> | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { categories: true }
    });
    if (!user) return null;
    const categories = user.categories || [];
    return new Set<string>(categories);
  } catch (error) {
    if (isTableMissing(error)) return null; // no access restriction feature
    throw error;
  }
}

export async function getCourseCategoryIds(courseId: string): Promise<string[] | null> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { categories: true }
    });
    if (!course) return null;
    // Handle null categories as empty array (public course)
    const categories = course.categories || [];
    return categories;
  } catch (error) {
    if (isTableMissing(error)) return null; // no restriction configured
    throw error;
  }
}

export async function isCourseAccessibleByUser(params: {
  userId: string;
  role: Role;
  courseId: string;
  teacherId?: string | null;
}): Promise<boolean> {
  const { userId, role, courseId, teacherId } = params;
  if (role === 'admin') return true;
  if (role === 'teacher') {
    // teacher boleh mengakses semua; jika ingin ketat: hanya course miliknya
    if (!teacherId) return true;
    // Fallback allow if teacherId unknown in context
    return true;
  }
  // Student: cek kategori
  const courseCats = await getCourseCategoryIds(courseId);
  if (courseCats === null) return true; // fitur belum diaktifkan (tabel belum ada)
  if (!courseCats || courseCats.length === 0) {
    console.log(`Course ${courseId} is public (no categories)`);
    return true; // course tanpa kategori = publik
  }
  const userCats = await getUserCategoryIds(userId);
  if (userCats === null) return true; // fitur belum diaktifkan
  for (const cid of courseCats) {
    if (userCats.has(cid)) return true;
  }
  return false;
}

export async function filterCoursesByAccess<T extends { id: string; teacher_id?: string | null }>(
  courses: T[],
  userId: string,
  role: Role,
): Promise<T[]> {
  if (role === 'admin' || role === 'teacher') return courses;
  const result: T[] = [];
  for (const c of courses) {
    const ok = await isCourseAccessibleByUser({ userId, role, courseId: c.id, teacherId: c.teacher_id ?? null });
    if (ok) result.push(c);
  }
  return result;
}



