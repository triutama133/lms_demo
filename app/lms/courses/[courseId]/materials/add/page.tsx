"use client";
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const SectionEditor = dynamic(() => import('../../../../../components/SectionEditor'), { ssr: false });

export default function AddMaterial() {
  const { courseId } = useParams();
  const router = useRouter();
  const [type, setType] = useState<'pdf' | 'markdown'>('pdf');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sections, setSections] = useState<{ title: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [uploadPercent, setUploadPercent] = useState<number>(0); // removed unused

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  // setUploadPercent(0); // removed unused
    if (type === 'pdf') {
      if (!pdfFile) {
        setError('File PDF wajib diisi');
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('course_id', courseId as string);
      formData.append('pdf', pdfFile);
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/materials');
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              // setUploadPercent(percent); // removed unused
            }
          };
          xhr.onload = () => {
            setLoading(false);
            // setUploadPercent(0); // removed unused
            if (xhr.status >= 200 && xhr.status < 300) {
              router.push(`/lms/courses/${courseId}/materials`);
              resolve();
            } else {
              try {
                const data = JSON.parse(xhr.responseText);
                setError(data.error || 'Gagal menambah materi');
              } catch {
                setError('Gagal menambah materi');
              }
              reject();
            }
          };
          xhr.onerror = () => {
            setLoading(false);
            // setUploadPercent(0); // removed unused
            setError('Gagal menambah materi');
            reject();
          };
          xhr.send(formData);
        });
      } catch {
        // error already handled above
      }
      setLoading(false);
      return;
    } else {
      if (sections.length === 0) {
        setError('Minimal 1 section materi wajib diisi');
        setLoading(false);
        return;
      }
      // Kirim data markdown dan sections ke API
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('type', type);
        formData.append('course_id', courseId as string);
        // Kirim sections sebagai JSON string
        formData.append('sections', JSON.stringify(sections));
        const res = await fetch('/api/materials', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          router.push(`/lms/courses/${courseId}/materials`);
        } else {
          setError(data.error || 'Gagal menambah materi');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Gagal menambah materi');
        } else {
          setError('Gagal menambah materi');
        }
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
      <section className="max-w-xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Tambah Materi</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1">Judul Materi</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Deskripsi Materi</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border rounded px-3 py-2" placeholder="Deskripsi singkat materi" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Tipe Materi</label>
            <select value={type} onChange={e => setType(e.target.value as 'pdf' | 'markdown')} className="w-full border rounded px-3 py-2">
              <option value="pdf">PDF</option>
              <option value="markdown">Artikel/Markdown</option>
            </select>
          </div>
          {type === 'pdf' ? (
            <div>
              <label className="block font-semibold mb-1">Upload PDF</label>
              <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="w-full" />
              {loading && (
                <div className="w-full flex justify-center mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-purple-500 border-solid" />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block font-semibold mb-1">Section Materi</label>
              <div className="flex flex-col gap-4">
                {sections.map((section, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50 mb-2">
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
          {error && <div className="text-red-600 text-center">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={() => router.push(`/lms/courses/${courseId}/materials`)}>Batal</button>
            <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition-all">
              {loading ? 'Menyimpan...' : 'Tambah Materi'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
