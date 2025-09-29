import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // Upload ke Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('materials').upload(fileName, file);
    if (error) {
      return finalize({ success: false, error: error.message }, { status: 500 });
    }
  pdfUrl = data?.path ? supabase.storage.from('materials').getPublicUrl(data.path).data.publicUrl : null;
  } else if (type === 'text') {
    textContent = formData.get('content');
    if (!textContent) {
      return finalize({ success: false, error: 'Isi materi tidak boleh kosong.' }, { status: 400 });
    }
  }

  // Simpan metadata ke tabel materials
  const { data: material, error: dbError } = await supabase.from('materials').insert([
    {
      title,
      type,
      pdf_url: pdfUrl,
      content: textContent,
      created_at: new Date().toISOString(),
    },
  ]);
  if (dbError) {
    return finalize({ success: false, error: dbError.message }, { status: 500 });
  }

  return finalize({ success: true, material });
}
