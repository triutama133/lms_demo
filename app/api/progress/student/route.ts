import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id wajib diisi.' });
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

  // Hanya user sendiri atau admin/teacher yang bisa lihat
  if (payload.sub !== user_id && payload.role !== 'admin' && payload.role !== 'teacher') {
    return authErrorResponse(new Error('Forbidden'));
  }

  try {
    // Ambil semua enrollment user dengan course info
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        created_at,
        courses (
          id,
          title,
          description,
          teacher_id
        )
      `)
      .eq('user_id', user_id);

    if (enrollError) {
      return finalize({ success: false, error: 'Gagal fetch enrollments.' });
    }

    const progressData = [];

    for (const enrollment of enrollments || []) {
      const course = enrollment.courses as unknown as {
        id: string;
        title: string;
        description: string;
        teacher_id: string;
      };
      if (!course) continue;

      // Ambil teacher name
      const { data: teacher } = await supabase
        .from('users')
        .select('name')
        .eq('id', course.teacher_id)
        .single();

      // Ambil semua materials untuk course ini
      const { data: materials, error: matError } = await supabase
        .from('materials')
        .select('id, title, type, order_position')
        .eq('course_id', course.id)
        .order('order_position');

      if (matError) continue;

      // Ambil progress untuk enrollment ini
      const { data: progress, error: progError } = await supabase
        .from('progress')
        .select('material_id, status, updated_at')
        .eq('enrollment_id', enrollment.id);

      if (progError) continue;

      // Hitung progress
      const totalMaterials = materials.length;
      const completedMaterials = progress.filter(p => p.status === 'completed').length;
      const completionPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

      // Hitung waktu belajar (estimasi)
      const timeSpent = completedMaterials * 15; // Asumsi 15 menit per materi

      // Ambil materi terakhir yang diakses
      const lastAccessed = progress.length > 0
        ? progress.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
        : enrollment.created_at;

      progressData.push({
        courseId: course.id,
        courseTitle: course.title,
        courseDescription: course.description,
        teacherName: teacher?.name || 'Unknown',
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.created_at,
        totalMaterials,
        completedMaterials,
        completionPercentage,
        timeSpent,
        lastAccessed,
        materials: materials.map(material => ({
          id: material.id,
          title: material.title,
          type: material.type,
          completed: progress.some(p => p.material_id === material.id && p.status === 'completed')
        }))
      });
    }

    // Hitung statistik keseluruhan
    const totalCourses = progressData.length;
    const completedCourses = progressData.filter(p => p.completionPercentage === 100).length;
    const totalTimeSpent = progressData.reduce((sum, p) => sum + p.timeSpent, 0);
    const averageCompletion = totalCourses > 0
      ? Math.round(progressData.reduce((sum, p) => sum + p.completionPercentage, 0) / totalCourses)
      : 0;

    return finalize({
      success: true,
      summary: {
        totalCourses,
        completedCourses,
        totalTimeSpent,
        averageCompletion,
        totalMaterials: progressData.reduce((sum, p) => sum + p.totalMaterials, 0),
        completedMaterials: progressData.reduce((sum, p) => sum + p.completedMaterials, 0)
      },
      courses: progressData
    });

  } catch (error) {
    console.error('Error fetching student progress:', error);
    return finalize({ success: false, error: 'Gagal fetch progress data.' });
  }
}