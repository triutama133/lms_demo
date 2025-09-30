import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  const course_id = searchParams.get('course_id');

  if (!user_id || !course_id) {
    return NextResponse.json({ success: false, error: 'user_id dan course_id wajib diisi.' });
  }

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

  // Hanya user sendiri atau admin yang bisa lihat
  if (payload.sub !== user_id && payload.role !== 'admin') {
    return authErrorResponse(new Error('Forbidden'));
  }

  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('id, created_at')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .single();

    if (error || !enrollment) {
      return finalize({ success: false, error: 'Enrollment tidak ditemukan.' });
    }

    return finalize({
      success: true,
      enrollment_id: enrollment.id,
      enrolled_at: enrollment.created_at
    });

  } catch (error) {
    console.error('Error fetching enrollment details:', error);
    return finalize({ success: false, error: 'Gagal fetch enrollment details.' });
  }
}