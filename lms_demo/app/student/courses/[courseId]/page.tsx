"use client";
import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StudentHeader from '../../../components/StudentHeader';
import CourseRatings from '../../../../components/CourseRatings';
import Modal from '../../../../components/Modal';

export default function CourseDetailPage() {
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const params = useParams();
  const courseId = params?.courseId as string;
  type Material = { id: string; title: string };
  type Course = { id: string; title: string; description: string };
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const checkEnrollmentAndProgress = useCallback(async () => {
    let user_id = localStorage.getItem('user_id');
    if (!user_id) {
      const userData = localStorage.getItem('lms_user');
      if (userData) {
        try {
          const userObj = JSON.parse(userData);
          user_id = userObj.id;
        } catch {}
      }
    }

    if (!user_id) {
      setLoading(false);
      return;
    }

    try {
      // Check enrollment
      const enrollRes = await fetch(`/api/enroll?user_id=${user_id}`);
      const enrollData = await enrollRes.json();

      if (enrollData.success && Array.isArray(enrollData.courses)) {
        const enrolledCourseIds = enrollData.courses.map((c: Course) => c.id);
        const isEnrolled = enrolledCourseIds.includes(courseId);
        setEnrolled(isEnrolled);

        // If enrolled, fetch progress
        if (isEnrolled) {
          try {
            const enrollmentRes = await fetch(`/api/enroll/details?user_id=${user_id}&course_id=${courseId}`);
            const enrollmentData = await enrollmentRes.json();

            if (enrollmentData.success && enrollmentData.enrollment_id) {
              const progressRes = await fetch(`/api/progress?user_id=${user_id}&course_id=${courseId}`);
              const progressData = await progressRes.json();

              if (progressData.success && Array.isArray(progressData.progress)) {
                const completed = progressData.progress.filter((p: { completed: boolean }) => p.completed).length;
                const total = progressData.progress.length;
                setProgressPercent(total > 0 ? Math.round((completed / total) * 100) : 0);
              }
            }
          } catch (error) {
            console.error('Error fetching progress:', error);
          }
        } else {
          setProgressPercent(null);
        }
      }
    } catch (error) {
      console.error('Error checking enrollment and progress:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    // Fetch course data
    fetch(`/api/courses?course_id=${courseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourse(data.course);
          setMaterials(data.materials || []);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
      })
      .catch(() => {
        setError('Gagal fetch data');
      });

    // Check enrollment status and fetch progress if enrolled
    checkEnrollmentAndProgress();
  }, [courseId, checkEnrollmentAndProgress]);

  const handleEnroll = async () => {
    // Get user_id from localStorage
    let user_id = localStorage.getItem('user_id');
    if (!user_id) {
      // Fallback: try to get from lms_user
      const userData = localStorage.getItem('lms_user');
      if (userData) {
        try {
          const userObj = JSON.parse(userData);
          user_id = userObj.id;
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }

    console.log('Frontend: user_id from localStorage:', user_id);
    console.log('Frontend: localStorage lms_user:', localStorage.getItem('lms_user'));

    if (!user_id) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Login Diperlukan',
        message: 'Silakan login terlebih dahulu untuk mengikuti course.'
      });
      return;
    }

    setEnrolling(true);

    try {
      console.log('Frontend: Attempting to enroll user:', user_id, 'in course:', courseId);

      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, course_id: courseId }),
      });

      console.log('Frontend: Response status:', res.status);

      const data = await res.json();
      console.log('Frontend: Enroll response:', data);

      if (data.success && data.enrollment_id) {
        localStorage.setItem('enrollment_id', data.enrollment_id);

        // Refresh enrollment and progress data
        await checkEnrollmentAndProgress();

        setModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil Enroll!',
          message: 'Selamat! Anda telah berhasil terdaftar di course ini.'
        });
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Gagal Enroll',
          message: data.error || 'Terjadi kesalahan saat mendaftar course.'
        });
      }
    } catch (error) {
      console.error('Frontend: Error during enrollment:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Kesalahan',
        message: 'Terjadi kesalahan saat enroll. Silakan coba lagi.'
      });
    } finally {
      setEnrolling(false);
    }
  };

  const rightSlot = useMemo(() => (
    progressPercent !== null ? (
      <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Progress {progressPercent}%</div>
    ) : null
  ), [progressPercent]);

  return (
    <>
      <StudentHeader rightSlot={rightSlot} />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-100 px-4 pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
          {loading ? (
            <div className="rounded-3xl border border-white/70 bg-white/90 p-10 text-center text-slate-500 shadow-md">Loading course...</div>
          ) : error ? (
            <div className="rounded-3xl border border-white/70 bg-white/90 p-10 text-center text-red-600 shadow-md">{error}</div>
          ) : course ? (
            <>
              <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl">
                <div className="grid gap-8 p-8 md:grid-cols-[2fr,1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-400">Course Detail</p>
                    <h1 className="mt-3 text-3xl font-bold text-blue-900 md:text-4xl">{course.title}</h1>
                    <p className="mt-3 text-sm text-slate-600 md:text-base">{course.description}</p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      {!enrolled ? (
                        <button
                          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleEnroll}
                          disabled={enrolling}
                        >
                          {enrolling ? 'Mendaftarkan...' : 'Enroll Course'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                          ✓ Kamu sudah terdaftar
                        </span>
                      )}
                      <Link
                        href="/student/courses"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        ← Kembali ke daftar course
                      </Link>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6">
                    <h2 className="text-sm font-semibold text-blue-800">Snapshot Progress</h2>
                    <p className="mt-2 text-xs text-slate-500">Pantau sejauh mana perjalanan belajarmu dalam course ini.</p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white shadow">
                        <span className="text-lg font-bold text-blue-700">{progressPercent ?? 0}%</span>
                        <span className="absolute inset-0 rounded-full border-4 border-transparent" style={{ borderTopColor: '#2563eb', transform: `rotate(${(progressPercent ?? 0) / 100 * 360}deg)` }} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Goal harian</p>
                        <p className="text-sm font-semibold text-blue-800">Minimal 1 materi</p>
                        <p className="text-xs text-slate-500">Tandai materi sebagai selesai untuk meningkatkan persentase.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-800">Materi Pembelajaran</h2>
                    <p className="text-sm text-slate-500">Susun rencana belajar dan selesaikan materi untuk meningkatkan progress.</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{materials.length} materi tersedia</span>
                </div>
                {!enrolled ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-8 text-center text-blue-700">
                    Enroll terlebih dahulu untuk mengakses materi lengkap dan tracking progress otomatis.
                  </div>
                ) : materials.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/70 p-8 text-center text-slate-500">
                    Materi belum tersedia. Pantau halaman ini untuk update terbaru dari mentor.
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {materials.map((material, index) => (
                      <div key={material.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-center gap-3">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">{index + 1}</div>
                          <div>
                            <h3 className="text-sm font-semibold text-blue-900">{material.title}</h3>
                          </div>
                        </div>
                        <Link
                          href={`/student/materials/${material.id}`}
                          className="inline-flex items-center justify-between rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-purple-700"
                        >
                          Buka Materi
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Course Ratings Section */}
              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md">
                <CourseRatings courseId={courseId as string} />
              </section>

            </>
          ) : null}
        </div>
      </main>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </>
  );
}
