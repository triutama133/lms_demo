"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditCourse() {
  const router = useRouter();
  const { courseId } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses?course_id=${courseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.course) {
          setTitle(data.course.title);
          setDescription(data.course.description);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch data');
        setLoading(false);
      });
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch(`/api/courses`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: courseId,
        title,
        description,
      }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/lms/teacher/courses/manage');
    } else {
      setError(data.error || 'Gagal update course');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
      <section className="max-w-xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Edit Course</h1>
        {loading ? (
          <div className="text-center text-gray-500">Loading data...</div>
        ) : (
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
            <div className="flex gap-2 justify-center">
              <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition-all">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded shadow transition-all" onClick={() => router.push('/lms/teacher/courses/manage')}>Batal</button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
