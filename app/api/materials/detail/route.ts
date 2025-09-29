import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { isCourseAccessibleByUser } from '../../../utils/access';

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
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, description, type, pdf_url, content, course_id')
    .eq('id', id)
    .single();

  if (error || !data) {
    return finalize({ success: false, error: 'Materi tidak ditemukan' });
  }

  type Section = { title: string; content: string; order: number };
  let sections: Section[] = [];
  if (data.type === 'markdown') {
    const { data: sectionData } = await supabase
      .from('material_sections')
      .select('title, content, order')
      .eq('material_id', id)
      .order('order', { ascending: true })
      .order('id', { ascending: true });
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
    const ok = await isCourseAccessibleByUser({ userId: payload.sub, role, courseId: data.course_id });
    if (!ok) {
      return finalize({ success: false, error: 'Forbidden' }, { status: 403 });
    }
  }

  return finalize({
    success: true,
    material: {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      pdf_url: data.pdf_url,
      content: data.content,
      course_id: data.course_id,
      sections,
    },
  });
}
