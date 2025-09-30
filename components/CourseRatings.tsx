'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface RatingSummary {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    stars: number;
    count: number;
    percentage: number;
  }[];
}

interface CourseRatingsProps {
  courseId: string;
}

export default function CourseRatings({ courseId }: CourseRatingsProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [error, setError] = useState('');

  const fetchRatings = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/ratings?course_id=${courseId}`);
      const data = await response.json();

      if (data.success) {
        setRatings(data.ratings);
        setSummary(data.summary);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Gagal memuat ratings');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const submitRating = async () => {
    if (userRating === 0) {
      setError('Pilih rating terlebih dahulu');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/courses/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseId,
          rating: userRating,
          review: userReview.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowReviewForm(false);
        setUserRating(0);
        setUserReview('');
        await fetchRatings(); // Refresh ratings
      } else {
        setError(data.error);
      }
    } catch {
      setError('Gagal mengirim rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } transition-transform`}
            onClick={interactive ? () => onChange?.(star) : undefined}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Ulasan & Rating</h3>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showReviewForm ? 'Batal' : 'Beri Ulasan'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Rating Summary */}
      {summary && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {summary.averageRating}
              </div>
              <div className="flex justify-center mb-1">
                {renderStars(Math.round(summary.averageRating))}
              </div>
              <div className="text-sm text-gray-600">
                {summary.totalRatings} ulasan
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const dist = summary.ratingDistribution.find(d => d.stars === stars);
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-8">{stars}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${dist?.percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {dist?.count || 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium mb-4">Beri Rating & Ulasan</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex gap-1">
                {renderStars(userRating, true, setUserRating)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ulasan (Opsional)
              </label>
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="Bagikan pengalaman Anda mengikuti course ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={submitRating}
                disabled={submitting || userRating === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                ) : null}
                Kirim Ulasan
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setUserRating(0);
                  setUserReview('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada ulasan untuk course ini.</p>
            <p className="text-sm">Jadilah yang pertama memberikan ulasan!</p>
          </div>
        ) : (
          ratings.map((rating) => (
            <div key={rating.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {rating.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{rating.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(rating.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
                {renderStars(rating.rating)}
              </div>

              {rating.review && (
                <p className="text-gray-700 mt-2">{rating.review}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}