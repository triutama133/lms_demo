"use client";
import Link from 'next/link';
import TeacherHeader from '../../../components/TeacherHeader';
import { useEffect, useState } from 'react';

export default function TeacherDashboard() {
  type Course = { id: string; title: string; description: string; enrolled_count?: number };
  const [courses, setCourses] = useState<Course[]>([]);
  // ...existing code...
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('lms_user') : null;
    if (!userData) {
      setError('User belum login');
      setLoading(false);
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== 'teacher') {
      setError('Akses hanya untuk teacher');
      setLoading(false);
      return;
    }
    fetch(`/api/teacher/dashboard?teacher_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourses(data.courses || []);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch data');
        setLoading(false);
      });
  }, []);

  return (
    <>
      <TeacherHeader />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
        <section className="max-w-3xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Teacher Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Link href="/lms/courses/manage" className="bg-blue-100 hover:bg-blue-200 rounded-lg p-6 shadow text-center font-semibold text-blue-700 transition-all">
            Kelola Courses
          </Link>
          <Link href="/lms/teacher/progress" className="bg-green-100 hover:bg-green-200 rounded-lg p-6 shadow text-center font-semibold text-green-700 transition-all">
            Monitoring Progress Siswa
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading data...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-purple-700 mb-2">Courses Anda</h2>
              {courses.length === 0 ? (
                <div className="text-gray-500">Belum ada course.</div>
              ) : (
                <ul className="list-disc pl-6">
                  {courses.map((c: Course) => (
                    <li key={c.id} className="mb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <span className="font-semibold text-blue-700">{c.title}</span>
                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-sm ml-2">
                            {c.enrolled_count ? `${c.enrolled_count} peserta` : '0 peserta'}
                          </span>
                          <span> — {c.description}</span>
                        </div>
                        <div className="mt-2 md:mt-0 flex gap-2">
                          <Link href={`/lms/courses/${c.id}/materials`} className="bg-purple-100 hover:bg-purple-200 rounded px-3 py-1 text-purple-700 font-semibold text-sm transition-all">Kelola Materi</Link>
                          <Link href={`/lms/courses/${c.id}/edit`} className="bg-blue-100 hover:bg-blue-200 rounded px-3 py-1 text-blue-700 font-semibold text-sm transition-all">Edit Course</Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Statistik Peserta dihapus, badge peserta dipindahkan ke Courses Anda */}
          </>
        )}
        </section>
      </main>
    </>
  );
}
