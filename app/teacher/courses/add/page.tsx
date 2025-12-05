"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TeacherHeader from '../../../components/TeacherHeader';

export default function AddCourse() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      })
      .catch(() => {
        // Ignore error for categories, course can still be created without categories
      });
  }, []);

  const toggleCat = (id: string) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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

    // Get selected category IDs
    const selectedCatIds = Array.from(selectedCats);

    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        teacher_id: user.id,
        categories: selectedCatIds,
      }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/teacher/courses/manage');
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
          <div className="rounded-xl border p-4">
            <h2 className="font-semibold text-purple-700 mb-3">Kategori Course</h2>
            <p className="text-sm text-gray-600 mb-3">Jika tidak pilih kategori, course akan otomatis public untuk semua user terdaftar.</p>
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada kategori. Minta admin untuk membuat kategori terlebih dahulu.</p>
            ) : (
              <>
                <input
                  type="text"
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  placeholder="Cari kategori..."
                  className="w-full border rounded px-3 py-2 mb-3 text-sm"
                />
                <ul className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredCategories.map(cat => (
                    <li key={cat.id}>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedCats.has(cat.id)} onChange={() => toggleCat(cat.id)} />
                        <span>{cat.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                {filteredCategories.length === 0 && categorySearch && (
                  <p className="text-sm text-slate-500 mt-2">Tidak ada kategori yang cocok dengan &quot;{categorySearch}&quot;</p>
                )}
              </>
            )}
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
