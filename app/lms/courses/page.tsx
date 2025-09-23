"use client";
import Link from 'next/link';


import { useEffect, useState } from 'react';

type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourses(data.courses);
        } else {
          setError(data.error || 'Gagal fetch courses');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch courses');
        setLoading(false);
      });
  }, []);

  return (
    <>
      <header className="w-full py-4 bg-white/90 shadow flex items-center justify-between px-8 fixed top-0 left-0 z-10">
        <div className="flex items-center gap-8">
          <img src="/ILMI logo new.png" alt="ILMI Logo" className="h-12 w-12 object-contain" />
          <span className="text-xl font-bold text-blue-700">LMS</span>
          <nav className="flex gap-6">
            <a href="/lms/dashboard" className="text-blue-700 hover:underline font-medium">Home</a>
            <a href="/lms/courses" className="text-blue-700 hover:underline font-medium">Courses</a>
            <a href="/lms/progress" className="text-blue-700 hover:underline font-medium">Tracking Progress</a>
          </nav>
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
          <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">Daftar Courses</h1>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map(course => (
                <div key={course.id} className="bg-blue-50 rounded-lg shadow p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-blue-800 mb-2">{course.title}</h2>
                    <p className="text-gray-700 mb-4">{course.description}</p>
                  </div>
                  <Link href={`/lms/courses/${course.id}`} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-all">Lihat Detail</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
