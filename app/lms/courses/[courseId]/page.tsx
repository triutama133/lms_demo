"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CourseDetailPage() {
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
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
            const enrolledCourseIds = data.courses.map((c: any) => c.id);
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
              const completed = data.progress.filter((p: any) => p.status === 'completed').length;
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

  return (
    <>
      <header className="w-full py-4 bg-white/90 shadow flex items-center justify-between px-8 fixed top-0 left-0 z-10">
        <div className="flex items-center gap-8">
          <img src="/ILMI logo new.png" alt="ILMI Logo" className="h-12 w-12 object-contain" />
          <span className="text-xl font-bold text-blue-700">LMS</span>
          <nav className="flex gap-6">
            <Link href="/lms/dashboard" className="text-blue-700 hover:underline font-medium">Home</Link>
            <Link href="/lms/courses" className="text-blue-700 hover:underline font-medium">Courses</Link>
            <Link href="/lms/progress" className="text-blue-700 hover:underline font-medium">Tracking Progress</Link>
          </nav>
          {progressPercent !== null && (
            <div className="mt-2 text-sm text-blue-800 font-semibold">
              Progress: {progressPercent}%
            </div>
          )}
        </div>
        <div className="relative">
          <span className="inline-block w-10 h-10 rounded-full border-2 border-blue-500 bg-gray-200 overflow-hidden">
            {/* Avatar placeholder, bisa diganti dengan foto user */}
            <svg className="w-full h-full text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
            </svg>
          </span>
        </div>
      </header>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center px-4 pt-24">
        <section className="max-w-3xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : course ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-blue-700 mb-2">{course.title}</h1>
                <p className="text-lg text-gray-700 mb-2">{course.description}</p>
                {progressPercent !== null && (
                  <div className="mt-2 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">Progress: {progressPercent}%</span>
                  </div>
                )}
              </div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-purple-700 mb-4">Materi Pembelajaran</h2>
                {!enrolled ? (
                  <div className="text-center">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow"
                      onClick={handleEnroll}
                    >Enroll untuk mengakses materi</button>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-gray-500">Belum ada materi tersedia.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {materials.map((m: any) => (
                      <div key={m.id} className="bg-gradient-to-br from-blue-100 via-white to-purple-100 rounded-lg shadow p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-blue-800 mb-2">{m.title}</h3>
                        </div>
                        <Link href={`/lms/materials/${m.id}`} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-all">Buka Materi</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-8 text-center">
                <Link href="/lms/courses" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-all">
                  ← Kembali ke daftar course
                </Link>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </>
  );
}
