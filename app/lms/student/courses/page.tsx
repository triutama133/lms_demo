"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import StudentHeader from '../../../components/StudentHeader';

type Course = {
  id: string;
  title: string;
  description: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
      <StudentHeader />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-100 px-4 pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl">
            <div className="grid gap-6 p-8 md:grid-cols-[1.8fr,1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-400">Eksplorasi Pengetahuan</p>
                <h1 className="mt-3 text-3xl font-bold text-blue-900 md:text-4xl">Bangun skill baru bersama mentor terbaik.</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                  Kuasai komunikasi, leadership, manajemen karir, dan soft skill lain melalui kursus interaktif yang dirancang oleh praktisi.
                </p>
                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari course (mis. communication, leadership)"
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 md:w-80"
                    aria-label="Cari course"
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />
                    {courses.length} course siap diikuti
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md">
            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading courses...</div>
            ) : error ? (
              <div className="py-12 text-center text-red-600">{error}</div>
            ) : (
              <CoursesGrid courses={courses} search={search} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}

type CoursesGridProps = {
  courses: Course[];
  search: string;
};

function CoursesGrid({ courses, search }: CoursesGridProps) {
  const keyword = search.trim().toLowerCase();
  const filtered = courses.filter((course) => {
    const matchesKeyword =
      !keyword ||
      course.title.toLowerCase().includes(keyword) ||
      course.description.toLowerCase().includes(keyword);
    return matchesKeyword;
  });

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-8 text-center text-slate-500">
        Belum ada course sesuai filter. Coba ubah kata kunci atau tingkat kesulitan.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((course) => (
        <div key={course.id} className="flex flex-col rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <h2 className="text-xl font-bold text-blue-900">{course.title}</h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">{course.description}</p>
          <Link
            href={`/lms/student/courses/${course.id}`}
            className="mt-6 inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-blue-700 hover:to-purple-700"
          >
            Lihat Detail
            <span aria-hidden>→</span>
          </Link>
        </div>
      ))}
    </div>
  );
}
