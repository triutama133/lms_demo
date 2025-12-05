import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const course_id = searchParams.get('course_id');

  if (!course_id) {
    return NextResponse.json({ success: false, error: 'course_id wajib diisi.' });
  }

  try {
    // Get all ratings for this course with user info
    const ratings = await prisma.courseRating.findMany({
      where: { courseId: course_id },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
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
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
          id: r.user.id,
          name: r.user.name || 'Anonymous'
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
    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: payload.sub,
        courseId: course_id
      }
    });

    if (!enrollment) {
      return finalize({ success: false, error: 'Anda harus mengikuti course ini untuk memberikan rating.' }, { status: 403 });
    }

    // Check if user already rated this course
    const existingRating = await prisma.courseRating.findFirst({
      where: {
        userId: payload.sub,
        courseId: course_id
      }
    });

    if (existingRating) {
      // Update existing rating
      await prisma.courseRating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          review: review || null,
          updatedAt: new Date()
        }
      });

      return finalize({ success: true, message: 'Rating berhasil diupdate.' });
    } else {
      // Create new rating
      await prisma.courseRating.create({
        data: {
          userId: payload.sub,
          courseId: course_id,
          rating,
          review: review || null
        }
      });

      return finalize({ success: true, message: 'Rating berhasil disubmit.' });
    }

  } catch (error) {
    console.error('Error submitting course rating:', error);
    return finalize({ success: false, error: 'Gagal submit rating.' });
  }
}