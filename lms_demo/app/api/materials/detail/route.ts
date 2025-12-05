import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { isCourseAccessibleByUser } from '../../../utils/access';
import { MinIOService } from '../../../../utils/minio';

const prisma = new PrismaClient();

export async function GET(req: Request) {
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
  const id = searchParams.get('material_id');
  if (!id) {
    return finalize({ success: false, error: 'ID materi tidak ditemukan' });
  }

  // Fetch material detail
  const material = await prisma.material.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      pdfUrl: true,
      content: true,
      courseId: true
    }
  });

  if (!material) {
    return finalize({ success: false, error: 'Materi tidak ditemukan' });
  }

  type Section = { title: string; content: string; order: number | null };
  let sections: Section[] = [];
  if (material.type === 'markdown') {
    const sectionData = await prisma.materialSection.findMany({
      where: { materialId: id },
      select: { title: true, content: true, order: true },
      orderBy: [
        { order: 'asc' },
        { id: 'asc' }
      ]
    });

    if (Array.isArray(sectionData)) {
      sections = sectionData.map((section) => {
        let content = section.content;
        // If content is stringified JSON, parse it
        if (typeof content === 'string' && content.startsWith('"') && content.endsWith('"')) {
          try {
            content = JSON.parse(content);
          } catch {
            // fallback: leave as is
          }
        }
        // Remove extra quotes if present
        if (typeof content === 'string' && content[0] === '"' && content[content.length-1] === '"') {
          content = content.slice(1, -1);
        }
        return {
          ...section,
          content,
        };
      });
    } else {
      sections = [];
    }
  }

  // Enforce course-level access for students
  const role = (payload.role || '').toString();
  if (role !== 'admin' && role !== 'teacher') {
    if (material.courseId) {
      const ok = await isCourseAccessibleByUser({ userId: payload.sub, role, courseId: material.courseId });
      if (!ok) {
        return finalize({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  return finalize({
    success: true,
    material: {
      id: material.id,
      title: material.title,
      description: material.description,
      type: material.type,
      pdf_url: material.pdfUrl ? MinIOService.replaceWithPublicUrl(material.pdfUrl) : null,
      content: material.content,
      course_id: material.courseId,
      sections,
    },
  });
}
