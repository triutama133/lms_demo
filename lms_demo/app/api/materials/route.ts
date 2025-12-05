import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { minIOService, MinIOService } from '../../../utils/minio';

const prisma = new PrismaClient();

async function requireTeacherOrAdmin() {
  const auth = await requireAuth();
  ensureRole(auth.payload, ['teacher', 'admin']);
  return auth;
}

export async function DELETE(req: NextRequest) {
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
    const body = await req.json();
    const id = body.id;
    if (!id) {
      return finalize({ success: false, error: 'ID materi wajib diisi.' }, { status: 400 });
    }
    const material = await prisma.material.findUnique({
      where: { id },
      select: { type: true, pdfUrl: true }
    });
    if (!material) {
      return finalize({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    if (material.type === 'pdf' && material.pdfUrl) {
      try {
        // Extract file path from MinIO URL and delete
        const fileName = MinIOService.extractFileNameFromUrl(material.pdfUrl);
        if (fileName) {
          await minIOService.deleteFile(fileName);
        }
      } catch {
        // Intentionally swallow errors when deleting remote file
      }
    }
    await prisma.material.delete({ where: { id } });
    return finalize({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return finalize({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
    let id: string;
    let title: string;
    let description: string;
    let pdfFile: File | null = null;
    let sections: unknown;
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData();
      id = formData.get('id') as string;
      title = formData.get('title') as string;
      description = formData.get('description') as string;
      pdfFile = formData.get('pdf') as File | null;
    } else {
      const body = await req.json();
      id = body.id;
      title = body.title;
      description = body.description;
      sections = body.sections;
    }
    if (!id || !title) {
      return finalize({ success: false, error: 'ID dan judul wajib diisi.' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = { title, description };
    if (pdfFile) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const fileName = `${id}_${Date.now()}_${pdfFile.name}`;

      const uploadResult = await minIOService.uploadFile(buffer, fileName);
      if (!uploadResult.success) {
        return finalize({ success: false, error: uploadResult.error || 'Upload gagal' }, { status: 500 });
      }

      updateData.pdfUrl = uploadResult.url;
    }
    const material = await prisma.material.update({
      where: { id },
      data: updateData
    });
    if (Array.isArray(sections)) {
      await prisma.materialSection.deleteMany({ where: { materialId: id } });
      if (sections.length > 0) {
        const sectionRows = sections.map((section, idx) => ({
          materialId: id,
          title: section.title,
          content: section.content,
          order: idx + 1,
        }));
        await prisma.materialSection.createMany({ data: sectionRows });
      }
    }
    return finalize({ success: true, material });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return finalize({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const course_id = formData.get('course_id') as string;
    const sections = formData.get('sections');

    if (type === 'pdf') {
      if (!file) {
        return finalize({ error: 'PDF file required.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${course_id}_${Date.now()}_${file.name}`;

      const uploadResult = await minIOService.uploadFile(buffer, fileName);
      if (!uploadResult.success) {
        return finalize({ error: uploadResult.error || 'Upload gagal' }, { status: 500 });
      }

      const pdfUrl = uploadResult.url;
      const material = await prisma.material.create({
        data: {
          title,
          description,
          courseId: course_id,
          type,
          pdfUrl,
        }
      });
      return finalize({ success: true, pdfUrl: pdfUrl ? MinIOService.replaceWithPublicUrl(pdfUrl) : null, material });
    }

    const material = await prisma.material.create({
      data: {
        title,
        description,
        courseId: course_id,
        type,
      }
    });
    type Section = { title: string; content: string; order: number };
    let sectionsArr: Section[] = [];
    if (typeof sections === 'string') {
      try {
        sectionsArr = JSON.parse(sections);
      } catch {
        sectionsArr = [];
      }
    } else if (Array.isArray(sections)) {
      sectionsArr = sections as Section[];
    }
    if (material && material.id && Array.isArray(sectionsArr) && sectionsArr.length > 0) {
      const sectionRows = sectionsArr.map((section, idx) => ({
        materialId: material.id,
        title: section.title,
        content: section.content,
        order: idx + 1,
      }));
      await prisma.materialSection.createMany({ data: sectionRows });
    }
    return finalize({ success: true, material });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return finalize({ error: errorMsg }, { status: 500 });
  }
}
