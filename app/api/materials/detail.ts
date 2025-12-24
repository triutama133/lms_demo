import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { dbService } from '../../../utils/database';
import { isCourseAccessibleByUser } from '../../utils/access';

type MaterialWithSections = {
  id: string;
  createdAt: Date;
  description: string | null;
  title: string;
  type: string;
  courseId: string | null;
  content: string | null;
  order: number | null;
  pdfUrl: string | null;
  sections: { title: string; content: string; order: number | null }[];
};

export async function GET(req: NextRequest) {
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
  const { searchParams } = new URL(req.url);
  const material_id = searchParams.get('material_id');
  if (!material_id) {
    return finalize({ success: false, error: 'ID materi wajib diisi.' }, { status: 400 });
  }
  try {
    // Ambil data materi
    const material = await dbService.material.findUnique({
      where: { id: material_id }
    }) as MaterialWithSections;
    if (!material) {
      return finalize({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    // Jika tipe markdown, ambil sections dari table material_sections
    if (material.type === 'markdown') {
      // Urutkan berdasarkan 'order' jika ada, fallback ke 'id'
      const sections = await dbService.materialSection.findMany({
        where: { materialId: material_id },
        select: { title: true, content: true, order: true },
        orderBy: [
          { order: 'asc' },
          { id: 'asc' }
        ]
      }) as { title: string; content: string; order: number | null }[];
      material.sections = sections;
    } else {
      material.sections = [];
    }
    // If student, ensure access by course categories
    const role = (payload.role || '').toString();
    if (role !== 'admin' && role !== 'teacher') {
      if (material.courseId) {
        const ok = await isCourseAccessibleByUser({ userId: payload.sub, role, courseId: material.courseId });
        if (!ok) {
          return finalize({ success: false, error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    return finalize({ success: true, material });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return finalize({ success: false, error: errorMsg }, { status: 500 });
  }
}
