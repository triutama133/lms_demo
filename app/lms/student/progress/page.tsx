"use client";
import Link from 'next/link';
import StudentHeader from '../../../components/StudentHeader';
import { useEffect, useState } from 'react';

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  teacherName: string;
  enrollmentId: string;
  enrolledAt: string;
  totalMaterials: number;
  completedMaterials: number;
  completionPercentage: number;
  timeSpent: number;
  lastAccessed: string;
  materials: Array<{
    id: string;
    title: string;
    type: string;
    completed: boolean;
  }>;
}

interface ProgressSummary {
  totalCourses: number;
  completedCourses: number;
  totalTimeSpent: number;
  averageCompletion: number;
  totalMaterials: number;
  completedMaterials: number;
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<CourseProgress[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const userData = localStorage.getItem('lms_user');
        if (!userData) {
          setError('User belum login');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        const response = await fetch(`/api/progress/student?user_id=${user.id}`);

        if (!response.ok) {
          throw new Error('Gagal fetch progress');
        }

        const data = await response.json();

        if (data.success) {
          setProgressData(data.courses || []);
          setSummary(data.summary);
        } else {
          setError(data.error || 'Gagal memuat progress');
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError('Gagal memuat data progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} jam ${mins > 0 ? `${mins} menit` : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <StudentHeader />
        <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-100 px-4 pb-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat progress belajar...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <StudentHeader />
        <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-100 px-4 pb-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <Link href="/lms/student/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const completionPercent = summary ? summary.averageCompletion : 0;

  return (
    <>
      <StudentHeader />
      <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-100 px-4 pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl">
            <div className="grid gap-8 p-8 md:grid-cols-[1.6fr,1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-400">Learning Tracker</p>
                <h1 className="mt-3 text-3xl font-bold text-purple-900 md:text-4xl">
                  Progress belajarmu {completionPercent > 0 ? 'bagus!' : 'perlu ditingkatkan'}
                </h1>
                <p className="mt-3 text-sm text-slate-600 md:text-base">
                  {summary && summary.totalCourses > 0
                    ? `Kamu telah menyelesaikan ${summary.completedMaterials} dari ${summary.totalMaterials} materi di ${summary.totalCourses} course.`
                    : 'Belum ada progress belajar yang tercatat.'
                  }
                </p>
                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
                  <Link href="/lms/student/courses" className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-purple-700">Lanjutkan Course</Link>
                  <Link href="/lms/student/materials" className="rounded-xl border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50">Lihat Materi</Link>
                </div>
              </div>
              <div className="rounded-3xl border border-purple-100 bg-purple-50/70 p-6">
                <h2 className="text-sm font-semibold text-purple-700">Progress Keseluruhan</h2>
                <p className="mt-2 text-xs text-slate-500">
                  {summary ? `Rata-rata completion ${summary.averageCompletion}%` : 'Belum ada data'}
                </p>
                <div className="mt-6 flex items-center gap-5">
                  <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow">
                    <span className="text-xl font-bold text-purple-700">{completionPercent}%</span>
                    <span
                      className="absolute inset-0 rounded-full border-4 border-transparent"
                      style={{
                        borderTopColor: '#7c3aed',
                        transform: `rotate(${completionPercent / 100 * 360}deg)`
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Statistik</p>
                    <p className="text-sm font-semibold text-purple-800">
                      {summary ? `${summary.completedCourses}/${summary.totalCourses} course selesai` : '0/0 course'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {summary ? formatTime(summary.totalTimeSpent) : '0 menit'} belajar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-[1.6fr,1fr]">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">Progress per Course</h2>
              {progressData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Belum ada course yang diikuti.</p>
                  <Link href="/lms/student/courses" className="mt-2 inline-block text-blue-600 hover:underline">
                    Jelajahi Course
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressData.map((course) => (
                    <div key={course.courseId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">{course.courseTitle}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{course.courseDescription}</p>
                          <p className="text-xs text-slate-500 mt-1">Teacher: {course.teacherName}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-blue-600">{course.completionPercentage}%</div>
                          <div className="text-xs text-slate-500">
                            {course.completedMaterials}/{course.totalMaterials} materi
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.completionPercentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Didaftar: {formatDate(course.enrolledAt)}</span>
                        <span>Terakhir akses: {formatDate(course.lastAccessed)}</span>
                        <Link
                          href={`/lms/student/courses/${course.courseId}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Lanjutkan →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow">
                <h3 className="text-sm font-semibold text-blue-800">Target Mingguan</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li>• Selesaikan 2 materi per hari</li>
                  <li>• Ikuti minimal 1 course aktif</li>
                  <li>• Review materi yang sudah dipelajari</li>
                </ul>
                <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700">
                  Kelola Target
                </button>
              </div>

              <div className="rounded-3xl border border-purple-100 bg-purple-50/70 p-6 shadow">
                <h3 className="text-sm font-semibold text-purple-800">Statistik Belajar</h3>
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Waktu Belajar:</span>
                    <span className="font-semibold text-purple-700">
                      {summary ? formatTime(summary.totalTimeSpent) : '0 menit'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Course Selesai:</span>
                    <span className="font-semibold text-purple-700">
                      {summary ? summary.completedCourses : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Materi Diselesaikan:</span>
                    <span className="font-semibold text-purple-700">
                      {summary ? summary.completedMaterials : 0}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md text-center text-sm text-slate-500">
            Tetap konsisten dengan belajar setiap hari! Butuh bantuan? Hubungi mentor atau tim support kami.
          </section>
        </div>
      </main>
    </>
  );
}
