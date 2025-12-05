"use client";
import Link from 'next/link';
import TeacherHeader from '../../../components/TeacherHeader';
import { useEffect, useState } from 'react';

export default function ManageCourses() {
  type Course = { id: string; title: string; description: string; enrolled_count?: number; categories?: string[] };
  type Participant = { id: string; name: string; email: string };
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Category states for edit modal
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
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
    fetch(`/api/teacher/dashboard?teacher_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourses(data.courses || []);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch data');
        setLoading(false);
      });
  }, []);

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
        // Ignore error for categories
      });
  }, []);

  useEffect(() => {
    if (categories.length > 0 && courseCategories.length >= 0) {
      // Initialize selectedCats based on course categories
      const catIds = categories
        .filter(cat => courseCategories.includes(cat.name))
        .map(cat => cat.id);
      setSelectedCats(new Set(catIds));
    }
  }, [categories, courseCategories]);

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
    if (!courseToEdit) return;
    setEditLoading(true);
    setEditError('');
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
          body: JSON.stringify({ course_id: courseToEdit.id, category_id: catId }),
        }).then(res => res.json())
      );

      // Perform unassignments
      const unassignPromises = toRemove.map(catId =>
        fetch('/api/categories/assign-course', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseToEdit.id, category_id: catId }),
        }).then(res => res.json())
      );

      const allPromises = [...assignPromises, ...unassignPromises];
      const results = await Promise.all(allPromises);

      const failedCount = results.filter(result => !result.success).length;

      if (failedCount > 0) {
        setEditError(`Gagal menyimpan ${failedCount} perubahan kategori. Coba lagi.`);
        return;
      }

      // Update local state - convert selected IDs back to names
      const updatedCatNames = categories
        .filter(cat => newCatSet.has(cat.id))
        .map(cat => cat.name);
      setCourseCategories(updatedCatNames);

      // Update course in courses list
      setCourses(prev => prev.map(course =>
        course.id === courseToEdit.id
          ? { ...course, categories: updatedCatNames }
          : course
      ));

      setEditError('Kategori berhasil disimpan!');
      setTimeout(() => setEditError(''), 3000);
    } catch {
      setEditError('Gagal menyimpan kategori');
    }
    setEditLoading(false);
  };

  return (
    <>
      <TeacherHeader />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
        <section className="max-w-3xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
          <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Kelola Courses</h1>
          <div className="mb-6 text-center">
            <Link href="/teacher/courses/add" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition-all">Tambah Course</Link>
          </div>
          {loading ? (
            <div className="text-center text-gray-500">Loading data...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : (
            <ul className="list-disc pl-6">
              {courses.length === 0 ? (
                <div className="text-gray-500">Belum ada course.</div>
              ) : (
                courses.map((c: Course) => (
                  <li key={c.id} className="mb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <span className="font-semibold text-blue-700">{c.title}</span>
                        {c.categories && c.categories.length > 0 && (
                          <div className="inline-flex flex-wrap gap-1 ml-2">
                            {c.categories.map((cat, idx) => (
                              <span key={idx} className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold text-xs border border-purple-200">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-sm ml-2">
                          {c.enrolled_count ? `${c.enrolled_count} peserta` : '0 peserta'}
                        </span>
                        <span> — {c.description}</span>
                      </div>
                      <div className="mt-2 md:mt-0 flex gap-2">
                        <Link href={`/teacher/courses/${c.id}/materials`} className="bg-purple-100 hover:bg-purple-200 rounded px-3 py-1 text-purple-700 font-semibold text-sm transition-all">Kelola Materi</Link>
                        <button
                          className="bg-green-100 hover:bg-green-200 rounded px-3 py-1 text-green-700 font-semibold text-sm transition-all"
                          onClick={async () => {
                            setSelectedCourse(c);
                            setShowParticipantsModal(true);
                            setParticipantsLoading(true);
                            setParticipantsError('');
                            try {
                              const res = await fetch(`/api/courses/participants?course_id=${c.id}`);
                              const data = await res.json();
                              if (data.success) {
                                setParticipants(data.participants || []);
                              } else {
                                setParticipantsError(data.error || 'Gagal fetch peserta');
                              }
                            } catch {
                              setParticipantsError('Gagal fetch peserta');
                            }
                            setParticipantsLoading(false);
                          }}
                        >Lihat Peserta</button>
                        <button
                          className="bg-blue-100 hover:bg-blue-200 rounded px-3 py-1 text-blue-700 font-semibold text-sm transition-all"
                          onClick={() => {
                            setCourseToEdit(c);
                            setEditTitle(c.title);
                            setEditDescription(c.description);
                            setCourseCategories(c.categories || []);
                            setEditError('');
                            setShowEditModal(true);
                          }}
                        >Edit</button>
                        <button
                          className="bg-red-100 hover:bg-red-200 rounded px-3 py-1 text-red-700 font-semibold text-sm transition-all"
                          onClick={() => {
                            setCourseToDelete(c);
                            setShowModal(true);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}

          {/* Category Summary Section */}
          {courses.length > 0 && categories.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-purple-700 mb-4">Ringkasan Kategori</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const courseCount = courses.filter(c => c.categories?.includes(cat.name)).length;
                  if (courseCount === 0) return null;
                  return (
                    <div key={cat.id} className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-800 text-sm">{cat.name}</span>
                        <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          {courseCount}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {courseCount} course{courseCount !== 1 ? 's' : ''} dalam kategori ini
                      </div>
                      {cat.description && (
                        <div className="text-xs text-gray-500 mt-1 italic">{cat.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Modal Peserta */}
          {showParticipantsModal && (
            <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h2 className="text-lg font-bold mb-4 text-green-700">Daftar Peserta</h2>
                <div className="mb-2 text-gray-700 font-semibold">Course: {selectedCourse?.title}</div>
                <div className="mb-4 text-gray-600">Jumlah Peserta: <span className="font-bold text-green-700">{participants.length}</span></div>
                {participantsLoading ? (
                  <div className="text-center text-gray-500">Loading...</div>
                ) : participantsError ? (
                  <div className="text-center text-red-600">{participantsError}</div>
                ) : participants.length === 0 ? (
                  <div className="text-gray-500">Belum ada peserta yang enroll.</div>
                ) : (
                  <ul className="mb-4">
                    {participants.map((p: Participant) => (
                      <li key={p.id} className="mb-2">
                        <span className="font-semibold text-blue-700">{p.name}</span>
                        <span className="ml-2 text-gray-600">{p.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end gap-2">
                  <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={() => { setShowParticipantsModal(false); setParticipants([]); setSelectedCourse(null); }}>
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Modal edit course */}
          {showEditModal && courseToEdit && (
            <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold mb-4 text-blue-700">Edit Course</h2>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    setEditLoading(true);
                    setEditError('');
                    try {
                      const res = await fetch('/api/courses', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: courseToEdit.id,
                          title: editTitle,
                          description: editDescription,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setCourses(prev => prev.map((course: Course) => course.id === courseToEdit.id ? { ...course, title: editTitle, description: editDescription } : course));
                        setShowEditModal(false);
                        setCourseToEdit(null);
                      } else {
                        setEditError(data.error || 'Gagal update course');
                      }
                    } catch {
                      setEditError('Gagal update course');
                    }
                    setEditLoading(false);
                  }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="block font-semibold mb-1">Judul Course</label>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Deskripsi</label>
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} required className="w-full border rounded px-3 py-2" />
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-purple-700">Kategori Course</h3>
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
                  {editError && <div className="text-red-600 text-center">{editError}</div>}
                  <div className="flex gap-2 justify-end">
                    <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={() => { setShowEditModal(false); setCourseToEdit(null); }}>Batal</button>
                    <button type="submit" disabled={editLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">
                      {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modal konfirmasi hapus */}
          {showModal && courseToDelete && (
            <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold mb-4 text-red-700">Konfirmasi Hapus Course</h2>
                <p className="mb-6 text-gray-700">Yakin ingin menghapus course <span className="font-semibold text-blue-700">{courseToDelete.title}</span>?</p>
                <div className="flex gap-3 justify-end">
                  <button
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
                    onClick={() => { setShowModal(false); setCourseToDelete(null); }}
                  >Batal</button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/courses', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: courseToDelete.id }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setCourses(prev => prev.filter((course: Course) => course.id !== courseToDelete.id));
                          setShowModal(false);
                          setCourseToDelete(null);
                        } else {
                          alert(data.error || 'Gagal hapus course');
                        }
                      } catch {
                        alert('Gagal hapus course');
                      }
                    }}
                  >Ya, hapus</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
