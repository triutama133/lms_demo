
"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StudentHeader from '../../components/StudentHeader';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};
type Course = {
  id: string;
  title: string;
  description: string;
};

type LastMaterialRef = {
  materialId: string;
  materialTitle: string;
  courseId?: string | null;
};

export default function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [lastMaterial, setLastMaterial] = useState<LastMaterialRef | null>(null);
  const greetings = [
    (name: string) => `Hai, ${name}`,
    (name: string) => `Mau belajar apa hari ini, ${name}?`,
    (name: string) => `Yuk lanjutkan coursenya, ${name}!`,
    (name: string) => `Semangat belajar, ${name}!`,
    (name: string) => `Sudah siap upgrade skill hari ini, ${name}?`,
    (name: string) => `Selamat datang kembali, ${name}!`,
    (name: string) => `Ayo capai target belajarmu, ${name}!`,
    (name: string) => `Terus berkembang, ${name}!`,
    (name: string) => `Jangan lupa review materi, ${name}!`,
    (name: string) => `Waktunya belajar, ${name}!`,
  ];
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login, jika tidak redirect ke login
    const userData = typeof window !== 'undefined' ? localStorage.getItem('lms_user') : null;
    if (!userData) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    try {
      const storedLastMaterial = localStorage.getItem('lms_last_material');
      if (storedLastMaterial) {
        const parsed = JSON.parse(storedLastMaterial) as LastMaterialRef;
        if (parsed?.materialId) {
          setLastMaterial(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to read last material reference', error);
    }
    // Fetch semua courses (jika ingin tampilkan semua)
    // Fetch enrolled courses
    fetch(`/api/enroll?user_id=${userObj.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEnrolledCourses(data.courses || []);
        }
      });
  }, [router]);

  const extraNavItems = useMemo(() => (
    <>
      {user?.role === 'admin' && (
        <Link href="/admin" className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded shadow transition-all ml-4">Kembali ke Admin</Link>
      )}
      {user?.role === 'teacher' && (
        <Link href="/teacher/dashboard" className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-4 py-2 rounded shadow transition-all ml-4">Kembali ke Teacher</Link>
      )}
    </>
  ), [user?.role]);

  const activeCourse = enrolledCourses[0];
  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return enrolledCourses;
    return enrolledCourses.filter((course) =>
      course.title.toLowerCase().includes(keyword) ||
      course.description.toLowerCase().includes(keyword)
    );
  }, [search, enrolledCourses]);

  const quickActions = useMemo(() => ([
    {
      title: 'Lanjut Materi',
      href: lastMaterial ? `/student/materials/${lastMaterial.materialId}` : '/student/courses',
      description: lastMaterial?.materialTitle ?? (activeCourse ? `Mulai ${activeCourse.title}` : 'Belum ada materi yang dibuka'),
      icon: '▶️',
    },
    {
      title: 'Lihat Progress',
      href: '/student/progress',
      description: 'Pantau perkembangan belajarmu',
      icon: '📈',
    },
    {
      title: 'Eksplor Course Baru',
      href: '/student/courses',
      description: 'Temukan materi terbaru',
      icon: '🧭',
    },
  ]), [lastMaterial, activeCourse]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  const greeting = greetings[Math.floor(Math.random() * greetings.length)](user.name);
  return (
    <>
      <StudentHeader extraNavItems={extraNavItems} />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-100 px-4 pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
          <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-xl">
            <div className="rounded-[calc(1.5rem-1px)] bg-white/90 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-400">Dashboard Learning</p>
              <h2 className="mt-4 text-3xl font-bold text-blue-900 md:text-4xl">{greeting}</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Tetap konsisten dengan melanjutkan materi terakhir atau eksplor course baru yang tersedia.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="text-xl">{action.icon}</div>
                    <h3 className="mt-2 text-sm font-semibold text-blue-800">{action.title}</h3>
                    <p className="text-xs text-slate-500">{action.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Course yang Diikuti</h3>
                <p className="text-sm text-slate-500">Lanjutkan course yang sudah kamu mulai atau eksplor materi lainnya.</p>
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari course..."
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 md:w-64"
                  aria-label="Cari course"
                />
                <Link
                  href="/student/courses"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                >
                  Lihat Semua Course
                </Link>
              </div>
            </div>
            {filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center text-slate-500">
                Belum ada course yang cocok dengan pencarianmu. Coba kata kunci lain atau eksplor course baru.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-400">
                      <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" /> Course Aktif
                    </div>
                    <h4 className="mt-3 text-lg font-bold text-blue-800">{course.title}</h4>
                    <p className="mt-2 flex-1 text-sm text-slate-600">{course.description}</p>
                    <Link
                      href={`/student/courses/${course.id}`}
                      className="mt-4 inline-flex items-center justify-between rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                    >
                      Lanjutkan
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </>
  );
}
