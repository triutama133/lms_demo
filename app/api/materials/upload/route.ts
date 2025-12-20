import { NextResponse } from 'next/server';
import { prisma } from "@/app/utils/supabaseClient";
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { storageService } from '../../../../utils/storage';

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['teacher', 'admin']);
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
    // Parse form data
    const formData = await request.formData();
    const type = formData.get('type');
    const title = formData.get('title');
    let pdfUrl = null;
    let textContent = null;

    if (type === 'pdf') {
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return finalize({ success: false, error: 'File PDF tidak valid.' }, { status: 400 });
      }

      // Validate file size (100MB max)
      const MAX_SIZE = 100 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return finalize({ success: false, error: 'File terlalu besar. Maksimal 100MB.' }, { status: 400 });
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        return finalize({ success: false, error: 'Hanya file PDF yang diperbolehkan.' }, { status: 400 });
      }

      // Upload ke MinIO Storage
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      const uploadResult = await storageService.uploadFile(fileBuffer, fileName, file.type);

      if (!uploadResult.success) {
        return finalize({ success: false, error: uploadResult.error || 'Upload gagal' }, { status: 500 });
      }

      pdfUrl = uploadResult.url || null;
    } else if (type === 'text') {
      textContent = formData.get('content');
      if (!textContent) {
        return finalize({ success: false, error: 'Isi materi tidak boleh kosong.' }, { status: 400 });
      }
    }

    // Simpan metadata ke tabel materials
    const material = await prisma.material.create({
      data: {
        title: title as string,
        type: type as string,
        pdfUrl,
        content: textContent as string,
      }
    });

    return finalize({ success: true, material });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return finalize({ success: false, error: errorMsg }, { status: 500 });
  }
}
