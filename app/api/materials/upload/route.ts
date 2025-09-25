import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, requireAuth } from '../../../utils/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const payload = await requireAuth();
    ensureRole(payload, ['teacher', 'admin']);
  } catch (error) {
    return authErrorResponse(error);
  }
  // Parse form data
  const formData = await request.formData();
  const type = formData.get('type');
  const title = formData.get('title');
  let pdfUrl = null;
  let textContent = null;

  if (type === 'pdf') {
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File PDF tidak valid.' }, { status: 400 });
    }
    // Upload ke Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('materials').upload(fileName, file);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  pdfUrl = data?.path ? supabase.storage.from('materials').getPublicUrl(data.path).data.publicUrl : null;
  } else if (type === 'text') {
    textContent = formData.get('content');
    if (!textContent) {
      return NextResponse.json({ success: false, error: 'Isi materi tidak boleh kosong.' }, { status: 400 });
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
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, material });
}
