"use client";
import Link from 'next/link';
import TeacherHeader from '../../../components/TeacherHeader';
import { useEffect, useState } from 'react';

export default function TeacherDashboard() {
  type Course = { id: string; title: string; description: string; enrolled_count?: number; categories?: string[]; teacher_name?: string };
  type Category = { id: string; name: string; description?: string };
  type User = { id: string; name: string; email: string; role: string };
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('lms_user') : null;
    if (!userData) {
      setError('User belum login');
      setLoading(false);
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Allow both teacher and admin to access this page
    if (parsedUser.role !== 'teacher' && parsedUser.role !== 'admin') {
      setError('Akses hanya untuk teacher dan admin');
      setLoading(false);
      return;
    }

    // If admin, fetch list of teachers for selection
    if (parsedUser.role === 'admin') {
      fetch('/api/users?role=teacher&limit=1000&include_summary=false')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTeachers(data.users || []);
          }
        })
        .catch(() => {
          // Ignore error for teachers list
        });
    }

    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      })
      .catch(() => {
        // Ignore error for categories, course data is more important
      });
  }, []);

  useEffect(() => {
    if (!user) return;

    const teacherId = user.role === 'admin' ? selectedTeacherId : user.id;
    // For admin, if no teacher selected (empty string), it means "All Courses"
    // If teacherId is empty string for admin, we still want to fetch all courses

    setLoading(true);
    setError('');

    // Fetch courses
    const url = user.role === 'admin' && selectedTeacherId ? `/api/teacher/dashboard?teacher_id=${teacherId}` : '/api/teacher/dashboard';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourses(data.courses || []);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
      })
      .catch(() => {
        setError('Gagal fetch data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, selectedTeacherId]);

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
  };

  return (
    <>
      <TeacherHeader />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
        <section className="max-w-4xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">
          {user?.role === 'admin' ? 'Admin - Teacher Dashboard' : 'Teacher Dashboard'}
        </h1>

        {user?.role === 'admin' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-blue-700 mb-2">Pilih Teacher untuk Melihat Dashboard:</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full md:w-auto rounded-lg border border-blue-300 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">-- Pilih Teacher --</option>
              <option value="">Semua Courses (Admin View)</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.email})</option>
              ))}
            </select>
            {selectedTeacherId && (
              <p className="text-xs text-blue-600 mt-1">
                Menampilkan dashboard untuk: {teachers.find(t => t.id === selectedTeacherId)?.name || 'Unknown'}
              </p>
            )}
            {!selectedTeacherId && (
              <p className="text-xs text-blue-600 mt-1">
                Menampilkan semua courses dari semua teacher
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Link href="/lms/teacher/courses/manage" className="bg-blue-100 hover:bg-blue-200 rounded-lg p-6 shadow text-center font-semibold text-blue-700 transition-all">
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
              <h2 className="text-lg font-bold text-purple-700 mb-2">
                {user?.role === 'admin' 
                  ? (selectedTeacherId ? `Courses ${teachers.find(t => t.id === selectedTeacherId)?.name || 'Teacher'}` : 'Semua Courses')
                  : 'Courses Anda'
                }
              </h2>
              {courses.length === 0 ? (
                <div className="text-gray-500">
                  {user?.role === 'admin' && !selectedTeacherId 
                    ? 'Belum ada course.' 
                    : 'Belum ada course.'
                  }
                </div>
              ) : (
                <ul className="list-disc pl-6">
                  {courses.map((c: Course) => (
                    <li key={c.id} className="mb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <span className="font-semibold text-blue-700">{c.title}</span>
                          {user?.role === 'admin' && c.teacher_name && (
                            <span className="ml-2 text-sm text-gray-600">by {c.teacher_name}</span>
                          )}
                          {c.categories && c.categories.length > 0 && (
                            <div className="inline-flex flex-wrap gap-1 ml-2">
                              {c.categories.map((cat, idx) => (
                                <span key={idx} className="inline-block bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-1 rounded-full font-semibold text-xs border border-purple-300 shadow-sm">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="inline-block bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full font-semibold text-sm ml-2 border border-green-300 shadow-sm">
                            {c.enrolled_count ? `${c.enrolled_count} peserta` : '0 peserta'}
                          </span>
                          <span> — {c.description}</span>
                        </div>
                        <div className="mt-2 md:mt-0 flex gap-2">
                          <Link href={`/lms/teacher/courses/${c.id}/materials`} className="bg-purple-100 hover:bg-purple-200 rounded px-3 py-1 text-purple-700 font-semibold text-sm transition-all">Kelola Materi</Link>
                          <Link href={`/lms/teacher/courses/${c.id}/edit`} className="bg-blue-100 hover:bg-blue-200 rounded px-3 py-1 text-blue-700 font-semibold text-sm transition-all">Edit Course</Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-purple-700 mb-2">Kategori Tersedia</h2>
              <p className="text-sm text-gray-600 mb-3">Kategori yang dapat dipilih saat membuat atau mengedit course</p>
              {categories.length === 0 ? (
                <div className="text-gray-500">Belum ada kategori. Minta admin untuk membuat kategori terlebih dahulu.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map((cat: Category) => {
                    const courseCount = courses.filter(c => c.categories?.includes(cat.name)).length;
                    return (
                      <div key={cat.id} className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="font-semibold text-purple-800 text-sm mb-1">{cat.name}</div>
                        {cat.description && (
                          <div className="text-xs text-gray-600 mb-2">{cat.description}</div>
                        )}
                        <div className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full inline-block">
                          {courseCount} course{courseCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
        </section>
      </main>
    </>
  );
}
