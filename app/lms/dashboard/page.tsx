
"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
type Material = {
  id: string;
  title: string;
  type: string;
  course_id: string;
};

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
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

  // Tutup dropdown jika klik di luar area menu
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      const menu = document.getElementById('profile-menu');
      if (menu && !menu.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  useEffect(() => {
    // Cek apakah user sudah login, jika tidak redirect ke login
    const userData = typeof window !== 'undefined' ? localStorage.getItem('lms_user') : null;
    if (!userData) {
      router.replace('/lms/login');
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);
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

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  const greeting = greetings[Math.floor(Math.random() * greetings.length)](user.name);
  return (
    <>
      <header className="w-full py-4 bg-white/90 shadow flex items-center justify-between px-8 fixed top-0 left-0 z-10">
        <div className="flex items-center gap-8">
          <Image src="/ILMI logo new.png" alt="ILMI Logo" width={48} height={48} className="h-12 w-12 object-contain" />
          <span className="text-xl font-bold text-blue-700">LMS</span>
          <nav className="flex gap-6">
            <Link href="/lms/dashboard" className="text-blue-700 hover:underline font-medium">Home</Link>
            <Link href="/lms/courses" className="text-blue-700 hover:underline font-medium">Courses</Link>
            <Link href="/lms/progress" className="text-blue-700 hover:underline font-medium">Tracking Progress</Link>
          </nav>
          {/* Back button for admin/teacher */}
          {user?.role === 'admin' && (
            <Link href="/lms/admin" className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded shadow transition-all ml-4">Kembali ke Admin</Link>
          )}
          {user?.role === 'teacher' && (
            <Link href="/lms/teacher/dashboard" className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-4 py-2 rounded shadow transition-all ml-4">Kembali ke Teacher</Link>
          )}
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="User menu"
          >
            <span className="inline-block w-10 h-10 rounded-full border-2 border-blue-500 bg-gray-200 overflow-hidden">
              {/* Avatar placeholder, bisa diganti dengan foto user */}
              <svg className="w-full h-full text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
              </svg>
            </span>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showMenu && (
            <div id="profile-menu" className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border z-20">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-gray-800">{user.name}</span>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Role: {user.role}</span>
              </div>
              <ul className="py-2">
                <li><a href="#" className="flex items-center gap-2 px-6 py-2 hover:bg-gray-100 text-gray-700"><span>👤</span>Profil Saya</a></li>
                <li><a href="#" className="flex items-center gap-2 px-6 py-2 hover:bg-gray-100 text-gray-700"><span>📚</span>My Course</a></li>
                <li><a href="#" className="flex items-center gap-2 px-6 py-2 hover:bg-gray-100 text-gray-700"><span>⚙️</span>Pengaturan</a></li>
                <li>
                  <button onClick={() => { localStorage.removeItem('lms_user'); router.replace('/lms/login'); }} className="w-full flex items-center gap-2 px-6 py-2 text-red-600 hover:bg-gray-100 font-semibold">
                    <span>🚪</span>Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center px-4 pt-24">
        <section className="max-w-2xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">{greeting}</h2>
            <div className="flex gap-4 mb-8">
              <Link href="/lms/courses" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Course</Link>
              <Link href="/lms/progress" className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition">Tracking Progress</Link>
            </div>
            {/* Card list enrolled courses */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-purple-700 mb-4">Course yang Sudah Di-Enroll</h3>
              {enrolledCourses.length === 0 ? (
                <div className="text-gray-500">Belum ada course yang di-enroll.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {enrolledCourses.map(course => (
                    <div key={course.id} className="bg-blue-50 rounded-lg shadow p-4 flex flex-col">
                      <h4 className="text-blue-800 font-bold text-lg mb-1">{course.title}</h4>
                      <p className="text-gray-700 mb-2">{course.description}</p>
                      <Link href={`/lms/courses/${course.id}`} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-all">Lihat Detail</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
