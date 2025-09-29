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
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses?course_id=${courseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.course) {
          setTitle(data.course.title);
          setDescription(data.course.description);
          setCourseCategories(data.course.categories || []);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
      })
      .catch(() => {
        setError('Gagal fetch data');
      });
    // fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (categories.length > 0 && courseCategories.length >= 0) {
      // Initialize selectedCats based on course categories
      const catIds = categories
        .filter(cat => courseCategories.includes(cat.name))
        .map(cat => cat.id);
      setSelectedCats(new Set(catIds));
    }
  }, [categories, courseCategories]);

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

  const handleSaveCategories = async () => {
    if (!courseId) return;
    setLoading(true);
    setError('');
    try {
      // Get current category names from course
      const currentCatNames = courseCategories;
      // Convert current category names to IDs
      const currentCatIds = categories
        .filter(cat => currentCatNames.includes(cat.name))
        .map(cat => cat.id);

      const currentCatSet = new Set(currentCatIds);
      const newCatSet = selectedCats;

      // Categories to add (in new set but not in current)
      const toAdd = Array.from(newCatSet).filter(id => !currentCatSet.has(id));

      // Categories to remove (in current but not in new)
      const toRemove = Array.from(currentCatSet).filter(id => !newCatSet.has(id));

      // Perform assignments
      const assignPromises = toAdd.map(catId =>
        fetch('/api/categories/assign-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId, category_id: catId }),
        }).then(res => res.json())
      );

      // Perform unassignments
      const unassignPromises = toRemove.map(catId =>
        fetch('/api/categories/assign-course', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId, category_id: catId }),
        }).then(res => res.json())
      );

      const allPromises = [...assignPromises, ...unassignPromises];
      const results = await Promise.all(allPromises);

      const failedCount = results.filter(result => !result.success).length;

      if (failedCount > 0) {
        setError(`Gagal menyimpan ${failedCount} perubahan kategori. Coba lagi.`);
        return;
      }

      // Update local state
      const updatedCatNames = categories
        .filter(cat => newCatSet.has(cat.id))
        .map(cat => cat.name);
      setCourseCategories(updatedCatNames);

      setError('Kategori berhasil disimpan!');
      setTimeout(() => setError(''), 3000);
    } catch {
      setError('Gagal menyimpan kategori');
    }
    setLoading(false);
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
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-purple-700">Kategori Course</h2>
                <button type="button" onClick={handleSaveCategories} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                  Simpan Kategori
                </button>
              </div>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">Belum ada kategori. Minta admin untuk membuat kategori terlebih dahulu.</p>
              ) : (
                <>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    placeholder="Cari kategori..."
                    className="w-full border rounded px-3 py-2 mt-3 mb-3 text-sm"
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
