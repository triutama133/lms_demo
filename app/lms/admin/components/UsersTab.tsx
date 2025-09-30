import { Fragment } from 'react';
import { ImportRowIssue, ImportUserPayload, User, UserFiltersState, UserSearchField, Category } from '../page';
import { PROVINCE_OPTIONS } from '../constants';

interface UsersTabProps {
  // State props
  users: User[];
  usersLoading: boolean;
  totalUsers: number;
  currentPage: number;
  usersPerPage: number;
  usersPerPageOptions: number[];
  selectedUserIds: string[];
  selectedCount: number;
  selectedLabel: string;
  appliedUserFilters: UserFiltersState;
  userFilters: UserFiltersState;
  searchUser: string;
  searchField: UserSearchField;
  categories: Category[];
  userCatsMap: Record<string, string[]>;
  totalPages: number;

  // Modal states
  showFilterModal: boolean;
  showAddModal: boolean;
  showImportModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showBulkCatsModal: boolean;
  showEnrollModal: boolean;
  showUserCatModal: boolean;

  // Form states
  editUser: User | null;
  deleteUser: User | null;
  selectedUserForCat: User | null;

  // Import states
  importUsers: ImportUserPayload[];
  importIncompleteRows: ImportRowIssue[];
  importInvalidValueRows: ImportRowIssue[];
  importInvalidRows: ImportRowIssue[];
  importLoading: boolean;
  importError: string;
  importCategories: Set<string>;
  importCatSearch: string;

  // Add user states
  addForm: { name: string; email: string; role: string; password: string; provinsi: string };
  addLoading: boolean;
  addError: string;

    // Edit user handlers
  onEditFormChange: (field: string, value: string) => void;
  onEditUser: () => void;
  editForm: { name: string; email: string; role: string; provinsi: string; password?: string };
  editLoading: boolean;
  editError: string;

  // Delete states
  deleteLoading: boolean;

    // Enroll handlers
  onEnrollUsers: () => void;
  enrollCourses: Array<{ id: string; title: string; description: string }>;
  enrollLoading: boolean;
  enrollError: string;
  selectedEnrollCourseIds: Set<string>;
  onSelectedEnrollCourseIdsChange: (ids: Set<string>) => void;
  enrollOption: 'selected' | 'all';
  onEnrollOptionChange: (option: 'selected' | 'all') => void;

  // Bulk categories states
  catSearch: string;
  bulkCatSet: Set<string>;
  catsOption: 'selected' | 'all';
  bulkCatsLoading: boolean;
  userCatSet: Set<string>;

  // Event handlers
  onSearchChange: (value: string) => void;
  onSearchFieldChange: (value: UserSearchField) => void;
  onSearchSubmit: () => void;
  onFilterModalToggle: () => void;
  onAddModalToggle: () => void;
  onImportModalToggle: () => void;
  onEditModalToggle: (user: User | null) => void;
  onDeleteModalToggle: (user: User | null) => void;
  onBulkCatsModalToggle: () => void;
  onEnrollModalOpen: () => void;
  onUserCatModalToggle: (user: User | null) => void;
  onUserFiltersChange: (filters: UserFiltersState) => void;
  onAppliedUserFiltersChange: (filters: UserFiltersState) => void;
  onPageChange: (page: number) => void;
  onUsersPerPageChange: (value: number) => void;
  onSelectAllToggle: (checked: boolean) => void;
  onUserSelectionToggle: (userId: string) => void;
  onExportUsers: () => void;

  // Import handlers
  onImportFileChange: (file: File | null) => void;
  onImportConfirm: () => void;
  onImportModalClose: () => void;
  onImportCategoriesChange: (categories: Set<string>) => void;
  onImportCatSearchChange: (search: string) => void;

  // Add user handlers
  onAddFormChange: (field: string, value: string) => void;
  onAddUser: () => void;

  // Delete handlers
  onDeleteUser: () => void;

  // Bulk categories handlers
  onCatSearchChange: (value: string) => void;
  onBulkCatSetChange: (set: Set<string>) => void;
  onCatsOptionChange: (option: 'selected' | 'all') => void;
  onSaveBulkCats: () => void;
  onSaveUserCats: () => void;
  onUserCatSetChange: (set: Set<string>) => void;
};

export default function UsersTab({
  users,
  usersLoading,
  totalUsers,
  currentPage,
  usersPerPage,
  usersPerPageOptions,
  selectedUserIds,
  selectedCount,
  selectedLabel,
  appliedUserFilters,
  userFilters,
  searchUser,
  searchField,
  categories,
  userCatsMap,
  totalPages,
  showFilterModal,
  showAddModal,
  showImportModal,
  showEditModal,
  showDeleteModal,
  showBulkCatsModal,
  showEnrollModal,
  showUserCatModal,
  editUser,
  deleteUser,
  selectedUserForCat,
  importUsers,
  importIncompleteRows,
  importInvalidValueRows,
  importInvalidRows,
  importLoading,
  importError,
  importCategories,
  importCatSearch,
  addForm,
  addLoading,
  addError,
  editForm,
  editLoading,
  editError,
  deleteLoading,
  enrollCourses,
  enrollLoading,
  enrollError,
  catSearch,
  bulkCatSet,
  catsOption,
  enrollOption,
  onEnrollOptionChange,
  selectedEnrollCourseIds,
  bulkCatsLoading,
  onSelectedEnrollCourseIdsChange,
  userCatSet,
  onSearchChange,
  onSearchFieldChange,
  onSearchSubmit,
  onFilterModalToggle,
  onAddModalToggle,
  onImportModalToggle,
  onEditModalToggle,
  onDeleteModalToggle,
  onBulkCatsModalToggle,
  onUserFiltersChange,
  onAppliedUserFiltersChange,
  onPageChange,
  onUsersPerPageChange,
  onSelectAllToggle,
  onUserSelectionToggle,
  onExportUsers,
  onEnrollModalOpen,
  onUserCatModalToggle,
  onImportFileChange,
  onImportConfirm,
  onImportModalClose,
  onImportCategoriesChange,
  onImportCatSearchChange,
  onAddFormChange,
  onAddUser,
  onEnrollUsers,
  onDeleteUser,
  onEditFormChange,
  onEditUser,
  onCatSearchChange,
  onBulkCatSetChange,
  onCatsOptionChange,
  onSaveBulkCats,
  onSaveUserCats,
  onUserCatSetChange,
}: UsersTabProps) {
  const allPageSelected = users.length > 0 && selectedUserIds.length === users.length && selectedUserIds.length > 0;

  return (
    <Fragment>
      <div className="space-y-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Manajemen User</h2>
            <p className="text-sm text-slate-500">Kelola akun, atur akses, dan proses administrasi secara instan.</p>
          </div>
          <span className="inline-flex items-center self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{selectedLabel}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative md:w-80">
                <input
                  type="text"
                  placeholder="Cari user..."
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={searchUser}
                  onChange={e => onSearchChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onSearchSubmit();
                    }
                  }}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-slate-400 md:inline">⌕</span>
              </div>
              <select
                value={searchField}
                onChange={e => onSearchFieldChange(e.target.value as UserSearchField)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                title="Pilih field yang akan dicari"
              >
                <option value="all">Semua</option>
                <option value="name">Nama</option>
                <option value="email">Email</option>
                <option value="provinsi">Provinsi</option>
                <option value="category">Kategori</option>
              </select>
              <button
                onClick={onSearchSubmit}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                title="Cari user berdasarkan kriteria yang dipilih"
              >
                Cari
              </button>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm">
              Filter aktif: {appliedUserFilters.roles.length + appliedUserFilters.provinces.length + appliedUserFilters.categories.length}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-gradient-to-r from-indigo-400 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-indigo-600 hover:to-blue-700"
              onClick={onFilterModalToggle}
              title="Filter user berdasarkan role, provinsi"
            >Filter</button>
            <button
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-blue-600 hover:to-blue-700"
              onClick={onAddModalToggle}
              title="Tambah akun user baru secara manual"
            >Tambah Akun</button>
            <button
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-emerald-600 hover:to-emerald-700"
              onClick={onImportModalToggle}
              title="Import user massal dari file Excel"
            >Import User</button>
            <button
              className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-teal-600 hover:to-teal-700"
              onClick={onBulkCatsModalToggle}
              title="Atur kategori untuk user terpilih atau semua user"
            >Kategori</button>
            <button
              className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-amber-500 hover:to-amber-600"
              onClick={onExportUsers}
              title="Unduh daftar user dalam format Excel"
            >Export User</button>
            <button
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-fuchsia-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onEnrollModalOpen}
              title="Enroll user terpilih atau semua user ke course"
              disabled={totalUsers === 0}
            >Enroll ke Course</button>
          </div>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-700 shadow-sm md:max-w-xs">
          <p className="mb-1 font-semibold">Petunjuk Singkat</p>
          <p>Pilih user lewat kolom pertama atau gunakan pencarian. Tekan tombol aksi untuk menjalankan fitur yang diinginkan.</p>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
        <table className="w-full bg-white text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-center font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                  checked={allPageSelected}
                  onChange={e => onSelectAllToggle(e.target.checked)}
                  aria-label="Pilih semua user di halaman ini"
                  title="Pilih semua user di halaman ini"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">Nama</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Provinsi</th>
              <th className="px-4 py-3 text-left font-semibold">Kategori</th>
              <th className="px-4 py-3 text-left font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">Memuat data pengguna...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">{totalUsers === 0 ? 'Belum ada user untuk ditampilkan.' : 'User tidak ditemukan.'}</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="odd:bg-white even:bg-slate-50/80 hover:bg-indigo-50 transition">
                  <td className="px-4 py-3 border-b border-slate-200 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => onUserSelectionToggle(u.id)}
                      aria-label={`Pilih user ${u.name}`}
                      title={`Pilih user ${u.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 border-b border-slate-200">{u.email}</td>
                  <td className="px-4 py-3 border-b border-slate-200 capitalize">{u.role}</td>
                  <td className="px-4 py-3 border-b border-slate-200">{u.provinsi || '-'}</td>
                  <td className="px-4 py-3 border-b border-slate-200">
                    <div className="flex flex-wrap gap-1">
                      {(userCatsMap[u.id] || []).length === 0 ? (
                        <span className="text-xs text-slate-400">-</span>
                      ) : (
                        (userCatsMap[u.id] || []).map((name) => (
                          <span key={name} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            {name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-600"
                        onClick={() => onEditModalToggle(u)}
                        title="Edit informasi user"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                        onClick={() => onUserCatModalToggle(u)}
                        title="Atur kategori user"
                      >
                        Kategori
                      </button>
                      <button
                        className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
                        onClick={() => onDeleteModalToggle(u)}
                        title="Hapus user secara permanen"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Menampilkan {totalUsers === 0 ? 'tidak ada data' : `${(currentPage - 1) * usersPerPage + 1}-${Math.min((currentPage - 1) * usersPerPage + users.length, totalUsers)} dari ${totalUsers}`} user</span>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-wide">Baris per halaman</span>
            <select
              value={usersPerPage}
              onChange={(e) => onUsersPerPageChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              title="Jumlah user yang ditampilkan per halaman"
            >
              {usersPerPageOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" /> {selectedCount} user dipilih
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-4">
          {totalUsers === 0 ? null : Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => onPageChange(i + 1)}
              title={`Ke halaman ${i + 1}`}
            >{i + 1}</button>
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filter User</h3>
              <button
                onClick={onFilterModalToggle}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <div className="space-y-2">
                  {['admin', 'teacher', 'student'].map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={userFilters.roles.includes(role)}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...userFilters.roles, role]
                            : userFilters.roles.filter(r => r !== role);
                          onUserFiltersChange({ ...userFilters, roles: newRoles });
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                      />
                      <span className="ml-2 text-sm capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Provinsi</label>
                <input
                  type="text"
                  placeholder="Cari provinsi..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-2"
                  onChange={() => {
                    // This would filter the provinces list, but for simplicity we'll keep all
                  }}
                />
                <select
                  multiple
                  value={userFilters.provinces}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    onUserFiltersChange({ ...userFilters, provinces: selected });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  size={6}
                >
                  {PROVINCE_OPTIONS.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-2"
                  onChange={() => {
                    // This would filter the categories list, but for simplicity we'll keep all
                  }}
                />
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate-500">Memuat kategori...</p>
                  ) : (
                    categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userFilters.categories.includes(category.id)}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...userFilters.categories, category.id]
                              : userFilters.categories.filter(id => id !== category.id);
                            onUserFiltersChange({ ...userFilters, categories: newCategories });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <span className="ml-2 text-sm">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onFilterModalToggle}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onAppliedUserFiltersChange(userFilters);
                  onFilterModalToggle();
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Tambah User Baru</h3>
              <button
                onClick={onAddModalToggle}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {addError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => onAddFormChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => onAddFormChange('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Masukkan alamat email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => onAddFormChange('role', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provinsi</label>
                <select
                  value={addForm.provinsi}
                  onChange={(e) => onAddFormChange('provinsi', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Pilih Provinsi</option>
                  {PROVINCE_OPTIONS.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => onAddFormChange('password', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Masukkan password"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onAddModalToggle}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={addLoading}
              >
                Batal
              </button>
              <button
                onClick={onAddUser}
                disabled={addLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {addLoading ? 'Menambah...' : 'Tambah User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import User Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Import User</h3>
              <button
                onClick={onImportModalClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {importError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {importError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">File Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => onImportFileChange(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori (Opsional)</label>
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-2"
                  value={importCatSearch}
                  onChange={(e) => onImportCatSearchChange(e.target.value)}
                />
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate-500">Memuat kategori...</p>
                  ) : (
                    categories
                      .filter(category => 
                        category.name.toLowerCase().includes(importCatSearch.toLowerCase())
                      )
                      .map((category) => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importCategories.has(category.id)}
                            onChange={(e) => {
                              const newSet = new Set(importCategories);
                              if (e.target.checked) {
                                newSet.add(category.id);
                              } else {
                                newSet.delete(category.id);
                              }
                              onImportCategoriesChange(newSet);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                          />
                          <span className="ml-2 text-sm">{category.name}</span>
                        </label>
                      ))
                  )}
                  {categories.length > 0 && categories.filter(category => 
                    category.name.toLowerCase().includes(importCatSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-sm text-slate-500">Tidak ada kategori yang cocok</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {importCategories.size} kategori dipilih (opsional)
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                <p className="font-medium">Format file yang didukung:</p>
                <ul className="mt-1 list-disc list-inside">
                  <li>File Excel (.xlsx, .xls)</li>
                  <li>Kolom: nama, email, role, provinsi</li>
                  <li>Password akan otomatis diatur ke &apos;ilmi123&apos;</li>
                </ul>
              </div>
            </div>
            {!!importInvalidRows.length && (
              <div className="mt-4 space-y-3">
                {importIncompleteRows.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    <p className="font-semibold">Baris dengan kolom kosong ({importIncompleteRows.length})</p>
                    <ul className="mt-2 space-y-1">
                      {importIncompleteRows.map((row) => (
                        <li key={`incomplete-${row.idx}`} className="rounded-md bg-white/60 px-3 py-2 text-xs text-amber-600">
                          <span className="font-semibold">Baris {row.idx}:</span> {row.errors.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {importInvalidValueRows.length > 0 && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <p className="font-semibold">Baris dengan nilai tidak valid ({importInvalidValueRows.length})</p>
                    <ul className="mt-2 space-y-1">
                      {importInvalidValueRows.map((row) => (
                        <li key={`invalid-${row.idx}`} className="rounded-md bg-white/60 px-3 py-2 text-xs text-rose-600">
                          <span className="font-semibold">Baris {row.idx}:</span> {row.errors.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {importUsers.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  <p className="font-semibold">Data valid ({importUsers.length} user)</p>
                  <p className="text-xs text-emerald-600/80">Pastikan kembali sebelum konfirmasi. Data valid akan ditambahkan dengan password default.</p>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Nama</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Provinsi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importUsers.map((user, idx) => (
                        <tr key={`${user.email}-${idx}`} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/70">
                          <td className="px-4 py-2 font-medium text-slate-800">{user.name}</td>
                          <td className="px-4 py-2 text-slate-600">{user.email}</td>
                          <td className="px-4 py-2 capitalize text-slate-600">{user.role}</td>
                          <td className="px-4 py-2 text-slate-600">{user.provinsi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onImportModalClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={importLoading}
              >
                Batal
              </button>
              <button
                onClick={onImportConfirm}
                disabled={importLoading || importUsers.length === 0 || importInvalidRows.length > 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importLoading ? 'Memproses...' : 'Konfirmasi Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit User</h3>
              <button
                onClick={() => onEditModalToggle(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {editError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => onEditFormChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => onEditFormChange('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => onEditFormChange('role', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provinsi</label>
                <select
                  value={editForm.provinsi || ''}
                  onChange={(e) => onEditFormChange('provinsi', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Pilih Provinsi</option>
                  {PROVINCE_OPTIONS.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru (Opsional)</label>
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => onEditFormChange('password', e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <p className="mt-1 text-xs text-slate-500">Biarkan kosong jika tidak ingin mengubah password</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => onEditModalToggle(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={editLoading}
              >
                Batal
              </button>
              <button
                onClick={onEditUser}
                disabled={editLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Hapus User</h3>
              <button
                onClick={() => onDeleteModalToggle(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Apakah Anda yakin ingin menghapus user ini?</p>
              <p className="mt-2">
                <strong>{deleteUser.name}</strong> ({deleteUser.email})
              </p>
              <p className="mt-2 text-xs">
                Tindakan ini tidak dapat dibatalkan. Semua data terkait user ini akan dihapus permanen.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => onDeleteModalToggle(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button
                onClick={onDeleteUser}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Course Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl relative">
            {enrollLoading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-medium text-slate-700">Mendaftarkan user ke course...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Enroll ke Course</h3>
              <button
                onClick={onEnrollModalOpen}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                disabled={enrollLoading}
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {enrollError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {enrollError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target User</label>
                <select
                  value={enrollOption}
                  onChange={(e) => onEnrollOptionChange(e.target.value as 'selected' | 'all')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="selected">User yang dipilih ({selectedUserIds.length})</option>
                  <option value="all">Semua user ({totalUsers})</option>
                </select>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                <p className="font-medium">User yang akan di-enroll:</p>
                <p className="mt-1">
                  {enrollOption === 'selected' 
                    ? `${selectedUserIds.length} user terpilih`
                    : `Semua user (${totalUsers})`
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Course</label>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
                  {enrollLoading ? (
                    <p className="text-sm text-slate-500">Memuat course...</p>
                  ) : enrollCourses.length === 0 ? (
                    <p className="text-sm text-slate-500">Tidak ada course tersedia</p>
                  ) : (
                    enrollCourses.map((course) => (
                      <label key={course.id} className="flex items-start space-x-3 p-2 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedEnrollCourseIds.has(course.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedEnrollCourseIds);
                            if (e.target.checked) {
                              newSet.add(course.id);
                            } else {
                              newSet.delete(course.id);
                            }
                            onSelectedEnrollCourseIdsChange(newSet);
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{course.title}</p>
                          <p className="text-xs text-slate-500">{course.description}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onEnrollModalOpen}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={enrollLoading}
              >
                Batal
              </button>
              <button
                onClick={onEnrollUsers}
                disabled={enrollLoading || enrollCourses.length === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {enrollLoading ? 'Mendaftarkan...' : 'Enroll User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Categories Modal */}
      {showBulkCatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
            {bulkCatsLoading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-medium text-slate-700">Menyimpan kategori...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Atur Kategori User</h3>
              <button
                onClick={onBulkCatsModalToggle}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                disabled={bulkCatsLoading}
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target User</label>
                <select 
                  value={catsOption}
                  onChange={(e) => onCatsOptionChange(e.target.value as 'selected' | 'all')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="selected">User yang dipilih ({selectedUserIds.length})</option>
                  <option value="all">Semua user ({totalUsers})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cari Kategori</label>
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-2"
                  value={catSearch}
                  onChange={(e) => onCatSearchChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate-500">Memuat kategori...</p>
                  ) : (
                    categories
                      .filter(category => 
                        category.name.toLowerCase().includes(catSearch.toLowerCase())
                      )
                      .map((category) => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={bulkCatSet.has(category.id)}
                            onChange={(e) => {
                              const newSet = new Set(bulkCatSet);
                              if (e.target.checked) {
                                newSet.add(category.id);
                              } else {
                                newSet.delete(category.id);
                              }
                              onBulkCatSetChange(newSet);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                          />
                          <span className="ml-2 text-sm">{category.name}</span>
                        </label>
                      ))
                  )}
                  {categories.length > 0 && categories.filter(category => 
                    category.name.toLowerCase().includes(catSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-sm text-slate-500">Tidak ada kategori yang cocok</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {bulkCatSet.size} kategori dipilih
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onBulkCatsModalToggle}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={bulkCatsLoading}
              >
                Batal
              </button>
              <button
                onClick={onSaveBulkCats}
                disabled={bulkCatsLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkCatsLoading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {bulkCatsLoading ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Categories Modal */}
      {showUserCatModal && selectedUserForCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Atur Kategori User</h3>
              <button
                onClick={() => onUserCatModalToggle(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                <p className="font-medium">User: {selectedUserForCat.name}</p>
                <p className="text-xs text-blue-600/80">{selectedUserForCat.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate-500">Memuat kategori...</p>
                  ) : (
                    categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userCatSet.has(category.id)}
                          onChange={(e) => {
                            const newSet = new Set(userCatSet);
                            if (e.target.checked) {
                              newSet.add(category.id);
                            } else {
                              newSet.delete(category.id);
                            }
                            onUserCatSetChange(newSet);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <span className="ml-2 text-sm">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {userCatSet.size} kategori dipilih
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => onUserCatModalToggle(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={onSaveUserCats}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Simpan Kategori
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}