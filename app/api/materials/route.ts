import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';

const bucketName: string = process.env.GCS_BUCKET_NAME || '';
const credentials = process.env.GCS_CREDENTIALS_JSON ? JSON.parse(process.env.GCS_CREDENTIALS_JSON) : undefined;
const storage = credentials ? new Storage({ credentials }) : undefined;

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
    if (material.type === 'pdf' && material.pdf_url && storage) {
      try {
        const urlParts = material.pdf_url.split('/');
        const filePath = urlParts.slice(4).join('/');
        if (!bucketName) {
          throw new Error('GCS_BUCKET_NAME env tidak ditemukan');
        }
        const bucket = storage.bucket(bucketName);
        await bucket.file(filePath).delete();
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
      if (!storage) {
        return finalize({ success: false, error: 'GCS credentials required.' }, { status: 500 });
      }
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const gcsFileName = `materials/${id}/${Date.now()}_${pdfFile.name}`;
      const bucket = storage.bucket(bucketName!);
      const gcsFile = bucket.file(gcsFileName);
      await gcsFile.save(buffer, {
        contentType: pdfFile.type,
      });
      updateData.pdf_url = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
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
      if (!file || !storage) {
        return finalize({ error: 'PDF file and GCS credentials required.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const gcsFileName = `materials/${course_id}/${Date.now()}_${file.name}`;
      const bucket = storage.bucket(bucketName);
      const gcsFile = bucket.file(gcsFileName);
      await gcsFile.save(buffer, {
        contentType: file.type,
      });
      const pdf_url = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
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
