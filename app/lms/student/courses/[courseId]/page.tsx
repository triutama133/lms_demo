"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StudentHeader from '../../../../components/StudentHeader';

export default function CourseDetailPage() {
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const { courseId } = useParams();
  type Material = { id: string; title: string };
  type Course = { id: string; title: string; description: string };
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses?course_id=${courseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourse(data.course);
          setMaterials(data.materials || []);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch data');
        setLoading(false);
      });
    // Cek enrollment dari backend
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
    if (user_id) {
      fetch(`/api/enroll?user_id=${user_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.courses)) {
            const enrolledCourseIds = data.courses.map((c: Course) => c.id);
            setEnrolled(enrolledCourseIds.includes(courseId));
          }
        });
    }
  }, [courseId]);

  const handleEnroll = async () => {
    let user_id = localStorage.getItem('user_id');
    if (!user_id) {
      // Fallback: try to get from lms_user
      const userData = localStorage.getItem('lms_user');
      if (userData) {
        try {
          const userObj = JSON.parse(userData);
          user_id = userObj.id;
        } catch {}
      }
      // Fetch progress for this enrollment and course
      const enrollment_id = localStorage.getItem('enrollment_id');
      if (enrollment_id && courseId) {
        fetch(`/api/progress?enrollment_id=${enrollment_id}&course_id=${courseId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.progress)) {
              const completed = data.progress.filter((p: { status: string }) => p.status === 'completed').length;
              const total = data.progress.length;
              setProgressPercent(total > 0 ? Math.round((completed / total) * 100) : 0);
            }
          });
      }
    }
    if (!user_id) {
      alert('User belum login!');
      return;
    }
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, course_id: courseId }),
    });
    const data = await res.json();
    if (data.success && data.enrollment_id) {
      localStorage.setItem('enrollment_id', data.enrollment_id);
      setEnrolled(true);
    } else {
      alert('Gagal enroll: ' + (data.error || 'Unknown error'));
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
                          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                          onClick={handleEnroll}
                        >
                          Enroll Course
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                          ✓ Kamu sudah terdaftar
                        </span>
                      )}
                      <Link
                        href="/lms/student/courses"
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
                          href={`/lms/student/materials/${material.id}`}
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

            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
