import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const course_id = searchParams.get('course_id');

  if (!course_id) {
    return NextResponse.json({ success: false, error: 'course_id wajib diisi.' });
  }

  try {
    // Ambil semua ratings dan reviews untuk course ini
    const { data: ratings, error } = await supabase
      .from('course_ratings')
      .select(`
        id,
        rating,
        review,
        created_at,
        updated_at,
        users!inner (
          id,
          name
        )
      `)
      .eq('course_id', course_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: 'Gagal fetch ratings.' });
    }

    // Hitung statistik
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(stars => ({
      stars,
      count: ratings.filter(r => r.rating === stars).length,
      percentage: totalRatings > 0 ? Math.round((ratings.filter(r => r.rating === stars).length / totalRatings) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      ratings: ratings.map(r => ({
        id: r.id,
        rating: r.rating,
        review: r.review,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        user: {
          id: (r as unknown as { users: { id: string; name: string } }).users?.id,
          name: (r as unknown as { users: { id: string; name: string } }).users?.name || 'Anonymous'
        }
      })),
      summary: {
        totalRatings,
        averageRating,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching course ratings:', error);
    return NextResponse.json({ success: false, error: 'Gagal fetch ratings.' });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { course_id, rating, review } = body;

  if (!course_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: 'Data tidak valid. Rating harus 1-5.' });
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

  try {
    // Cek apakah user sudah enrolled di course ini
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', payload.sub)
      .eq('course_id', course_id)
      .single();

    if (enrollError || !enrollment) {
      return finalize({ success: false, error: 'Anda harus mengikuti course ini untuk memberikan rating.' }, { status: 403 });
    }

    // Cek apakah user sudah pernah memberikan rating
    const { data: existingRating } = await supabase
      .from('course_ratings')
      .select('id')
      .eq('user_id', payload.sub)
      .eq('course_id', course_id)
      .single();

    if (existingRating) {
      // Update rating yang sudah ada
      const { error: updateError } = await supabase
        .from('course_ratings')
        .update({
          rating,
          review: review || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id);

      if (updateError) {
        return finalize({ success: false, error: 'Gagal update rating.' });
      }

      return finalize({ success: true, message: 'Rating berhasil diupdate.' });
    } else {
      // Buat rating baru
      const { error: insertError } = await supabase
        .from('course_ratings')
        .insert({
          user_id: payload.sub,
          course_id,
          rating,
          review: review || null
        });

      if (insertError) {
        return finalize({ success: false, error: 'Gagal submit rating.' });
      }

      return finalize({ success: true, message: 'Rating berhasil disubmit.' });
    }

  } catch (error) {
    console.error('Error submitting course rating:', error);
    return finalize({ success: false, error: 'Gagal submit rating.' });
  }
}