"use client";
import Link from 'next/link';
import TeacherHeader from '../../../../components/TeacherHeader';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function CourseMaterials() {
  const [editOrderMode, setEditOrderMode] = useState(false);
  const { courseId } = useParams();
  type Material = { id: string; title: string; type: string; order?: number };
  type Course = { id: string; title: string; description: string };
  const [materials, setMaterials] = useState<Material[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses?course_id=${courseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Sort by order ascending
          const sorted = (data.materials || []).slice().sort((a: Material, b: Material) => (a.order ?? 0) - (b.order ?? 0));
          setCourse(data.course);
          setMaterials(sorted);
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
  // Drag-and-drop logic
  const moveMaterial = (fromIdx: number, toIdx: number) => {
    const updated = [...materials];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    // Update order property
    updated.forEach((mat, idx) => { mat.order = idx + 1; });
    setMaterials(updated);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await fetch('/api/materials/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, order: materials.map(m => ({ id: m.id, order: m.order })) }),
      });
    } catch {}
    setSavingOrder(false);
  };

  function DraggableMaterial({ material, index }: { material: Material; index: number }) {
    const ref = useRef<HTMLLIElement>(null);
    const [, drop] = useDrop({
      accept: 'material',
      hover(item: unknown, monitor: import('react-dnd').DropTargetMonitor) {
        if (!ref.current) return;
        const dragItem = item as { index: number };
        if (typeof dragItem === 'object' && dragItem !== null && 'index' in dragItem && typeof dragItem.index === 'number') {
          const dragIdx = dragItem.index as number;
          const hoverIdx = index;
          if (dragIdx === hoverIdx) return;
          moveMaterial(dragIdx, hoverIdx);
          dragItem.index = hoverIdx;
        }
      },
    });
    const [{ isDragging }, drag] = useDrag({
      type: 'material',
      item: { index },
      collect: (monitor: import('react-dnd').DragSourceMonitor) => ({ isDragging: monitor.isDragging() }),
    });
    drag(drop(ref));
    return (
      <li ref={ref} className={`mb-4`} style={{ cursor: 'move', listStyle: 'none' }}>
        <div className={`flex items-center gap-3 p-4 bg-white border-2 rounded-xl shadow transition-all ${isDragging ? 'opacity-50 border-purple-400' : 'border-gray-200'}`}>
          <span className="text-2xl text-purple-500 mr-2 select-none" title="Drag untuk mengatur urutan">☰</span>
          <div className="flex-1">
            <div className="font-semibold text-blue-700 text-lg">{material.title}</div>
            <div className="text-sm text-gray-500">{material.type === 'pdf' ? 'PDF' : 'Artikel/Markdown'}</div>
          </div>
          <div className="flex gap-2">
            <Link href={`/lms/courses/${courseId}/materials/${material.id}/view`} className="bg-green-100 hover:bg-green-200 rounded px-3 py-1 text-green-700 font-semibold text-sm transition-all">Lihat</Link>
            <Link href={`/lms/courses/${courseId}/materials/${material.id}/edit`} className="bg-blue-100 hover:bg-blue-200 rounded px-3 py-1 text-blue-700 font-semibold text-sm transition-all">Edit</Link>
            <button
              className="bg-red-100 hover:bg-red-200 rounded px-3 py-1 text-red-700 font-semibold text-sm transition-all"
              onClick={() => {
                setSelectedMaterial(material);
                setShowModal(true);
              }}
            >Hapus</button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <TeacherHeader />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
        <section className="max-w-2xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Materi Course</h1>
        {course && (
          <div className="mb-4 text-center">
            <span className="font-semibold text-blue-700 text-lg">{course.title}</span> — {course.description}
          </div>
        )}
        <div className="mb-6 text-center">
          <Link href={`/lms/courses/${courseId}/materials/add`} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition-all">Tambah Materi</Link>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading data...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                className={`px-4 py-2 rounded font-semibold shadow transition-all ${editOrderMode ? 'bg-gray-300 text-gray-800 hover:bg-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                onClick={() => setEditOrderMode(mode => !mode)}
              >{editOrderMode ? 'Selesai Atur Urutan' : 'Atur Urutan'}</button>
            </div>
            {editOrderMode ? (
              <DndProvider backend={HTML5Backend}>
                <ul className="pl-0">
                  {materials.length === 0 ? (
                    <div className="text-gray-500">Belum ada materi.</div>
                  ) : (
                    materials.map((m, idx) => (
                      <DraggableMaterial key={m.id} material={m} index={idx} />
                    ))
                  )}
                </ul>
                {materials.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition-all"
                      onClick={saveOrder}
                      disabled={savingOrder}
                    >{savingOrder ? 'Menyimpan urutan...' : 'Simpan Urutan'}</button>
                  </div>
                )}
              </DndProvider>
            ) : (
              <ul className="list-disc pl-6">
                {materials.length === 0 ? (
                  <div className="text-gray-500">Belum ada materi.</div>
                ) : (
                  materials.map((m, idx) => (
                    <li key={m.id} className="mb-4 bg-white">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <span className="font-semibold text-blue-700">{m.title}</span> — {m.type === 'pdf' ? 'PDF' : 'Artikel/Markdown'}
                        </div>
                        <div className="mt-2 md:mt-0 flex gap-2">
                          <Link href={`/lms/courses/${courseId}/materials/${m.id}/view`} className="bg-green-100 hover:bg-green-200 rounded px-3 py-1 text-green-700 font-semibold text-sm transition-all">Lihat</Link>
                          <Link href={`/lms/courses/${courseId}/materials/${m.id}/edit`} className="bg-blue-100 hover:bg-blue-200 rounded px-3 py-1 text-blue-700 font-semibold text-sm transition-all">Edit</Link>
                          <button
                            className="bg-red-100 hover:bg-red-200 rounded px-3 py-1 text-red-700 font-semibold text-sm transition-all"
                            onClick={() => {
                              setSelectedMaterial(m);
                              setShowModal(true);
                            }}
                          >Hapus</button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </>
        )}
        {/* Modal konfirmasi hapus - render outside the list */}
        {showModal && selectedMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4 text-red-700">Konfirmasi Hapus Materi</h2>
              <p className="mb-4">Yakin ingin menghapus materi <span className="font-semibold">{selectedMaterial.title}</span>?</p>
              <div className="flex gap-2 justify-end">
                <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold" onClick={() => setShowModal(false)}>Batal</button>
                <button
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      const res = await fetch('/api/materials', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedMaterial.id })
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        setMaterials(materials.filter((mat: Material) => mat.id !== selectedMaterial.id));
                        setShowModal(false);
                        setSelectedMaterial(null);
                      } else {
                        setError(data.error || 'Gagal hapus materi');
                      }
                    } catch (err: unknown) {
                      const errorMsg = err instanceof Error ? err.message : 'Gagal hapus materi';
                      setError(errorMsg);
                    }
                    setLoading(false);
                  }}
                >Hapus</button>
              </div>
            </div>
          </div>
        )}
        {/* Tombol Kembali di bagian bawah section */}
        <div className="mt-8 text-center">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded shadow"
            onClick={() => window.history.back()}
          >Kembali</button>
        </div>
        </section>
      </main>
    </>
  );
}
