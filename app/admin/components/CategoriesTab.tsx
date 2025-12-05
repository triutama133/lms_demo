import { Fragment } from 'react';
import { Category } from '../page';

interface CategoriesTabProps {
  categories: Category[];
  catLoading: boolean;
  catForm: { id: string; name: string; description: string };
  catError: string;

  onCatFormChange: (field: string, value: string) => void;
  onSaveCategory: () => Promise<void>;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => Promise<void>;
}

export default function CategoriesTab({
  categories,
  catLoading,
  catForm,
  catError,
  onCatFormChange,
  onSaveCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoriesTabProps) {
  return (
    <Fragment>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Kategori</h2>
          <p className="text-sm text-slate-500">Kelola kategori (hanya admin). Teacher hanya dapat memilih kategori yang dibuat admin.</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Tambah / Edit Kategori</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={catForm.name}
              onChange={e => onCatFormChange('name', e.target.value)}
              placeholder="Nama kategori (mis. Premium, Gratis)"
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm shadow-sm"
            />
            <textarea
              value={catForm.description}
              onChange={e => onCatFormChange('description', e.target.value)}
              placeholder="Deskripsi (opsional)"
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm shadow-sm"
              rows={3}
            />
            {catError && <div className="text-red-600 text-sm">{catError}</div>}
            <div className="flex gap-2">
              <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700" onClick={onSaveCategory} disabled={catLoading}>
                {catForm.id ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </button>
              {catForm.id && (
                <button className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300" onClick={() => onCatFormChange('id', '')}>
                  Batalkan Edit
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Daftar Kategori</h3>
          {catLoading ? (
            <div className="text-slate-500">Memuat...</div>
          ) : categories.length === 0 ? (
            <div className="text-slate-500">Belum ada kategori.</div>
          ) : (
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <div>
                    <p className="font-semibold text-slate-800">{cat.name}</p>
                    {cat.description && <p className="text-xs text-slate-500">{cat.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200" onClick={() => onEditCategory(cat)}>Edit</button>
                    <button className="rounded bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200" onClick={() => onDeleteCategory(cat.id)}>Hapus</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Fragment>
  );
}