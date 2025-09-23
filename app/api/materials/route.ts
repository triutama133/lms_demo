export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID materi wajib diisi.' }, { status: 400 });
    }
    // Ambil data materi untuk cek tipe/pdf_url
    const { data: material, error: fetchError } = await supabase.from('materials').select('type, pdf_url').eq('id', id).single();
    if (fetchError || !material) {
      return NextResponse.json({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    // (Opsional) Hapus file PDF di GCS jika tipe pdf dan ada pdf_url
    if (material.type === 'pdf' && material.pdf_url && storage) {
      try {
        // Ekstrak path file dari url
        const urlParts = material.pdf_url.split('/');
        const filePath = urlParts.slice(4).join('/');
        if (!bucketName) {
          throw new Error('GCS_BUCKET_NAME env tidak ditemukan');
        }
        const bucket = storage.bucket(bucketName);
        await bucket.file(filePath).delete();
      } catch (err) {
        // Jika gagal hapus file, lanjutkan hapus DB
      }
    }
    // Hapus dari DB
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    let id, title, description, pdfFile, sections;
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData();
      id = formData.get('id') as string;
      title = formData.get('title') as string;
      description = formData.get('description') as string;
      pdfFile = formData.get('pdf') as File | null;
      // Tidak support sections via multipart, hanya json
    } else {
      const body = await req.json();
      id = body.id;
      title = body.title;
      description = body.description;
      sections = body.sections;
    }
    if (!id || !title) {
      return NextResponse.json({ success: false, error: 'ID dan judul wajib diisi.' }, { status: 400 });
    }
    let updateData: any = { title, description };
    // Jika ada file PDF baru, upload dan replace
    if (pdfFile) {
      if (!storage) {
        return NextResponse.json({ success: false, error: 'GCS credentials required.' }, { status: 500 });
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
    // Update ke DB
    const { data, error } = await supabase.from('materials').update(updateData).eq('id', id).select();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    // Jika ada sections, update material_sections
    if (Array.isArray(sections)) {
      // Hapus semua section lama
      await supabase.from('material_sections').delete().eq('material_id', id);
      // Insert ulang semua section baru
      if (sections.length > 0) {
        const sectionRows = sections.map((section, idx) => ({
          material_id: id,
          title: section.title,
          content: section.content,
          order: idx + 1
        }));
        const sectionInsert = await supabase.from('material_sections').insert(sectionRows);
        if (sectionInsert.error) {
          return NextResponse.json({ success: false, error: sectionInsert.error.message }, { status: 500 });
        }
      }
    }
    return NextResponse.json({ success: true, material: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { createClient } from '@supabase/supabase-js';

const bucketName: string = process.env.GCS_BUCKET_NAME || '';
const credentials = process.env.GCS_CREDENTIALS_JSON ? JSON.parse(process.env.GCS_CREDENTIALS_JSON) : undefined;

const storage = credentials ? new Storage({ credentials }) : undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function POST(req: NextRequest) {
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
        return NextResponse.json({ error: 'PDF file and GCS credentials required.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const gcsFileName = `materials/${course_id}/${Date.now()}_${file.name}`;
      const bucket = storage.bucket(bucketName);
      const gcsFile = bucket.file(gcsFileName);
      await gcsFile.save(buffer, {
        contentType: file.type,
      });
      const pdf_url = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
      // Insert ke DB
      insertResult = await supabase.from('materials').insert({
        title,
        description,
        course_id,
        type,
        pdf_url
      }).select();
      if (insertResult.error) {
        return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, pdf_url, material: insertResult.data[0] });
    } else {
      // Insert markdown/article ke DB
      insertResult = await supabase.from('materials').insert({
        title,
        description,
        course_id,
        type
      }).select();
      if (insertResult.error) {
        return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
      }
      const material = insertResult.data[0];
      // Insert sections ke table material_sections
      let sectionsArr: any[] = [];
      try {
        sectionsArr = typeof sections === 'string' ? JSON.parse(sections) : sections;
      } catch {
        sectionsArr = [];
      }
      console.log('[DEBUG] Insert section:', { materialId: material?.id, sectionsArr });
      if (material && material.id && Array.isArray(sectionsArr) && sectionsArr.length > 0) {
        const sectionRows = sectionsArr.map((section: any, idx: number) => ({
          material_id: material.id,
          title: section.title,
          content: section.content,
          order: idx + 1
        }));
        console.log('[DEBUG] Insert sectionRows:', sectionRows);
        const sectionInsert = await supabase.from('material_sections').insert(sectionRows);
        if (sectionInsert.error) {
          console.error('[ERROR] Insert section:', sectionInsert.error);
          return NextResponse.json({ error: sectionInsert.error.message }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true, material });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
