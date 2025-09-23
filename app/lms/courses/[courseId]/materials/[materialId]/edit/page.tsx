"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
const SectionEditor = dynamic<{
  value: string;
  onChange: (val: string) => void;
}>(() => import('../../../../../../components/SectionEditor'), { ssr: false });

export default function EditMaterial() {
  const { courseId, materialId } = useParams();
  const router = useRouter();
  type Material = { id: string; title: string; description?: string; type: string; pdf_url?: string; sections?: Section[] };
  type Section = { id?: string; title: string; content: string; order?: number };
  const [material, setMaterial] = useState<Material | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sections, setSections] = useState<{ id?: string; title: string; content: string; order?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!materialId) return;
    fetch(`/api/materials/detail?material_id=${materialId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMaterial(data.material);
          setTitle(data.material.title);
          setDescription(data.material.description || '');
          if (Array.isArray(data.material.sections)) {
            setSections(data.material.sections.map((s: Section, idx: number) => ({
              id: s.id,
              title: s.title,
              content: s.content,
              order: s.order ?? idx + 1
            })));
          }
        } else {
          setError(data.error || 'Gagal fetch data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch data');
        setLoading(false);
      });
  }, [materialId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let res, data;
      if (material?.type === 'pdf') {
        const formData = new FormData();
        formData.append('id', materialId as string);
        formData.append('title', title);
        formData.append('description', description);
        if (pdfFile) formData.append('pdf', pdfFile);
        res = await fetch('/api/materials', {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Kirim sections ke backend
        res = await fetch('/api/materials', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: materialId,
            title,
            description,
            sections: sections.map((s, idx) => ({
              id: s.id,
              title: s.title,
              content: s.content,
              order: idx + 1
            }))
          })
        });
      }
      data = await res.json();
      if (res.ok && data.success) {
        router.push(`/lms/courses/${courseId}/materials`);
      } else {
        setError(data.error || 'Gagal update materi');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Gagal update materi');
      } else {
        setError('Gagal update materi');
      }
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mb-3"></div>
      <span className="text-purple-700 font-semibold text-lg">Memuat data materi...</span>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!material) return <div className="p-8 text-center">Materi tidak ditemukan.</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
      <section className="max-w-xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Edit Materi</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1">Judul Materi</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Deskripsi Materi</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border rounded px-3 py-2" placeholder="Deskripsi singkat materi" />
          </div>
          {material?.type === 'pdf' && (
            <div>
              <label className="block font-semibold mb-1">File PDF Saat Ini</label>
              {material.pdf_url ? (
                <a href={material.pdf_url} target="_blank" rel="noopener" className="text-blue-700 underline font-semibold">Download PDF Lama</a>
              ) : (
                <span className="text-gray-500">Tidak ada file PDF</span>
              )}
              <label className="block font-semibold mt-4 mb-1">Ganti PDF (opsional)</label>
              <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="w-full" />
            </div>
          )}
          {material?.type === 'markdown' && (
            <div>
              <label className="block font-semibold mb-1">Section Materi</label>
              <div className="flex flex-col gap-4">
                {sections.map((section, idx) => (
                  <div key={section.id ?? idx} className="border rounded p-3 bg-gray-50 mb-2">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={section.title}
                        onChange={e => {
                          const newSections = [...sections];
                          newSections[idx].title = e.target.value;
                          setSections(newSections);
                        }}
                        placeholder={`Judul Section ${idx + 1}`}
                        className="border rounded px-2 py-1 w-full"
                      />
                      <button type="button" className="text-red-600 font-bold px-2" onClick={() => setSections(secs => secs.filter((_, i) => i !== idx))}>Hapus</button>
                    </div>
                    <SectionEditor
                        key={section.id ?? idx}
                        value={section.content}
                        onChange={(val: string) => {
                          const newSections = [...sections];
                          newSections[idx].content = val;
                          setSections(newSections);
                        }}
                    />
                  </div>
                ))}
                <button type="button" className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-3 py-1 rounded shadow w-fit" onClick={() => setSections(secs => [...secs, { title: '', content: '' }])}>Tambah Section</button>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={() => router.back()}>Batal</button>
            <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition-all">
              Simpan Perubahan
            </button>
          </div>
          {loading && (
            <div className="flex flex-col items-center mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600 mb-2"></div>
              <span className="text-purple-700 font-semibold">Menyimpan perubahan...</span>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
