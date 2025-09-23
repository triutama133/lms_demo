"use client";
import { useState } from 'react';

export default function UploadMaterialPage() {
  const [type, setType] = useState<'pdf' | 'text'>('pdf');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      if (type === 'pdf') {
        if (!file) throw new Error('File PDF wajib diisi');
        formData.append('file', file);
      } else {
        formData.append('content', content);
      }
      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Gagal upload materi.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center px-4 pt-24">
      <section className="max-w-lg w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">Upload Materi Baru</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Materi</label>
            <select value={type} onChange={e => setType(e.target.value as 'pdf' | 'text')} className="w-full px-3 py-2 border border-blue-200 rounded-lg">
              <option value="pdf">PDF</option>
              <option value="text">Text/Markdown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-blue-200 rounded-lg" />
          </div>
          {type === 'pdf' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF</label>
              <input type="file" accept="application/pdf" onChange={handleFileChange} required className="w-full" />
              {file && <span className="text-xs text-gray-500 mt-1">{file.name}</span>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Isi Materi (Markdown)</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} required className="w-full px-3 py-2 border border-blue-200 rounded-lg" placeholder="Tulis materi di sini..." />
            </div>
          )}
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-md transition-all mt-2">
            {loading ? 'Mengupload...' : 'Upload Materi'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-sm text-center">Materi berhasil diupload (dummy, belum ke database/storage).</div>}
      </section>
    </main>
  );
}
