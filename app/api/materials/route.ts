import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

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
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('type, pdf_url')
      .eq('id', id)
      .single();
    if (fetchError || !material) {
      return finalize({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    if (material.type === 'pdf' && material.pdf_url) {
      try {
        // Extract file path from Supabase Storage URL
        const urlParts = material.pdf_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from('materials').remove([fileName]);
      } catch {
        // Intentionally swallow errors when deleting remote file
      }
    }
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
      return finalize({ success: false, error: error.message }, { status: 500 });
    }
    return finalize({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
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
      const { data, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, buffer, {
          contentType: pdfFile.type,
        });
      if (uploadError) {
        return finalize({ success: false, error: uploadError.message }, { status: 500 });
      }
      updateData.pdf_url = data?.path ? supabase.storage.from('materials').getPublicUrl(data.path).data.publicUrl : null;
    }
    const { data, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) {
      return finalize({ success: false, error: error.message }, { status: 500 });
    }
    if (Array.isArray(sections)) {
      await supabase.from('material_sections').delete().eq('material_id', id);
      if (sections.length > 0) {
        const sectionRows = sections.map((section, idx) => ({
          material_id: id,
          title: section.title,
          content: section.content,
          order: idx + 1,
        }));
        const sectionInsert = await supabase.from('material_sections').insert(sectionRows);
        if (sectionInsert.error) {
          return finalize({ success: false, error: sectionInsert.error.message }, { status: 500 });
        }
      }
    }
    return finalize({ success: true, material: data?.[0] });
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
    let insertResult;

    if (type === 'pdf') {
      if (!file) {
        return finalize({ error: 'PDF file required.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${course_id}_${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, buffer, {
          contentType: file.type,
        });
      if (uploadError) {
        return finalize({ error: uploadError.message }, { status: 500 });
      }
      const pdf_url = data?.path ? supabase.storage.from('materials').getPublicUrl(data.path).data.publicUrl : null;
      insertResult = await supabase
        .from('materials')
        .insert({
          title,
          description,
          course_id,
          type,
          pdf_url,
        })
        .select();
      if (insertResult.error) {
        return finalize({ error: insertResult.error.message }, { status: 500 });
      }
      return finalize({ success: true, pdf_url, material: insertResult.data[0] });
    }

    insertResult = await supabase
      .from('materials')
      .insert({
        title,
        description,
        course_id,
        type,
      })
      .select();
    if (insertResult.error) {
      return finalize({ error: insertResult.error.message }, { status: 500 });
    }
    const material = insertResult.data[0];
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
        material_id: material.id,
        title: section.title,
        content: section.content,
        order: idx + 1,
      }));
      const sectionInsert = await supabase.from('material_sections').insert(sectionRows);
      if (sectionInsert.error) {
        return finalize({ error: sectionInsert.error.message }, { status: 500 });
      }
    }
    return finalize({ success: true, material });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return finalize({ error: errorMsg }, { status: 500 });
  }
}
