"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherHeader from '../../../../components/TeacherHeader';

export default function AddCourse() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        teacher_id: user.id,
      }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/lms/teacher/courses/manage');
    } else {
      setError(data.error || 'Gagal tambah course');
      setLoading(false);
    }
  };

  return (
    <>
      <TeacherHeader />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
        <section className="max-w-xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Tambah Course Baru</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1">Judul Course</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Deskripsi</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          {error && <div className="text-red-600 text-center">{error}</div>}
          <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition-all">
            {loading ? 'Menyimpan...' : 'Tambah Course'}
          </button>
        </form>
        </section>
      </main>
    </>
  );
}
