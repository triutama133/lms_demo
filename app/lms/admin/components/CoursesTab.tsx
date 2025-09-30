import { Fragment } from 'react';
import Link from 'next/link';
import { Course, User, Category } from '../page';

interface CoursesTabProps {
  // State props
  visibleCourses: Course[];
  coursesLoading: boolean;
  totalCourses: number;
  courseCurrentPage: number;
  coursesPerPage: number;
  coursesPerPageOptions: number[];
  selectedCourseIds: string[];
  selectedCourseLabel: string;
  searchCourse: string;
  courseTotalPages: number;
  teacherOptions: User[];
  courseForm: { title: string; description: string; teacher_id: string };
  courseError: string;
  courseLoading: boolean;
  categories: Category[];
  showCourseCatsModal: boolean;
  showParticipantsModal: boolean;
  showAddCourseModal: boolean;
  selectedCourse: Course | null;
  participants: User[];
  participantsLoading: boolean;
  participantsError: string;
  courseCatsOption: 'selected' | 'all';
  courseCatSearch: string;
  courseBulkCatSet: Set<string>;
  // Individual course category editing props
  showCourseCatModal: boolean;
  selectedCourseForCat: Course | null;
  courseCatSet: Set<string>;

  // Event handlers
  onSearchChange: (value: string) => void;
  onAddCourseClick: () => void;
  onCourseCatsModalOpen: () => void;
  onSelectAllCoursesToggle: (checked: boolean) => void;
  onCourseSelectionToggle: (courseId: string) => void;
  onCoursesPerPageChange: (value: number) => void;
  onCoursePageChange: (page: number) => void;
  onParticipantsModalOpen: (course: Course) => void;
  onCourseFormChange: (field: string, value: string) => void;
  onCourseSubmit: (e: React.FormEvent) => Promise<void>;
  onAddCourseModalClose: () => void;
  onParticipantsModalClose: () => void;
  onCourseCatsModalClose: () => void;
  onSaveBulkCourseCats: () => Promise<void>;
  onCourseCatsOptionChange: (option: 'selected' | 'all') => void;
  onCourseCatSearchChange: (search: string) => void;
  onCourseBulkCatSetChange: (set: Set<string>) => void;
  // Individual course category editing handlers
  onCourseCatModalToggle: (course: Course | null) => void;
  onCourseCatSetChange: (set: Set<string>) => void;
  onSaveCourseCats: () => Promise<void>;
}

export default function CoursesTab({
  visibleCourses,
  coursesLoading,
  totalCourses,
  courseCurrentPage,
  coursesPerPage,
  coursesPerPageOptions,
  selectedCourseIds,
  selectedCourseLabel,
  searchCourse,
  courseTotalPages,
  teacherOptions,
  courseForm,
  courseError,
  courseLoading,
  categories,
  showCourseCatsModal,
  showParticipantsModal,
  showAddCourseModal,
  selectedCourse,
  participants,
  participantsLoading,
  participantsError,
  courseCatsOption,
  courseCatSearch,
  courseBulkCatSet,
  showCourseCatModal,
  selectedCourseForCat,
  courseCatSet,
  onSearchChange,
  onAddCourseClick,
  onCourseCatsModalOpen,
  onSelectAllCoursesToggle,
  onCourseSelectionToggle,
  onCoursesPerPageChange,
  onCoursePageChange,
  onParticipantsModalOpen,
  onCourseFormChange,
  onCourseSubmit,
  onAddCourseModalClose,
  onParticipantsModalClose,
  onCourseCatsModalClose,
  onSaveBulkCourseCats,
  onCourseCatsOptionChange,
  onCourseCatSearchChange,
  onCourseBulkCatSetChange,
  onCourseCatModalToggle,
  onCourseCatSetChange,
  onSaveCourseCats,
}: CoursesTabProps) {
  const allCoursesSelected = visibleCourses.length > 0 && selectedCourseIds.length === visibleCourses.length && selectedCourseIds.length > 0;

  return (
    <Fragment>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Manajemen Course</h2>
          <p className="text-sm text-slate-500">Pantau materi, pengajar, dan jumlah peserta dalam setiap course.</p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
            <input
              type="text"
              placeholder="Cari course berdasarkan judul atau pengajar..."
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 md:w-72"
              value={searchCourse}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button
              className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-purple-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onAddCourseClick}
              disabled={teacherOptions.length === 0}
            >Buat Course</button>
            <button
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onCourseCatsModalOpen}
              disabled={totalCourses === 0}
            >Kategori</button>
          </div>
          <span className="inline-flex items-center self-start rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600 md:self-end">
            Total {totalCourses} course
          </span>
          <span className="inline-flex items-center self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 md:self-end">
            {selectedCourseLabel}
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
        <table className="w-full bg-white text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-center font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
                  checked={allCoursesSelected}
                  onChange={(e) => onSelectAllCoursesToggle(e.target.checked)}
                  aria-label="Pilih semua course pada daftar"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">Nama Teacher</th>
              <th className="px-4 py-3 text-left font-semibold">Judul Course</th>
              <th className="px-4 py-3 text-left font-semibold">Jumlah Peserta</th>
              <th className="px-4 py-3 text-left font-semibold">Kategori</th>
              <th className="px-4 py-3 text-left font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {coursesLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Memuat data course...</td>
              </tr>
            ) : visibleCourses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  {totalCourses === 0 ? 'Belum ada course yang aktif.' : 'Course tidak ditemukan.'}
                </td>
              </tr>
            ) : (
              visibleCourses.map((c) => (
                <tr key={c.id} className="odd:bg-white even:bg-slate-50/80 hover:bg-fuchsia-50 transition">
                  <td className="px-4 py-3 border-b border-slate-200 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
                      checked={selectedCourseIds.includes(c.id)}
                      onChange={() => onCourseSelectionToggle(c.id)}
                      aria-label={`Pilih course ${c.title}`}
                    />
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200 font-medium">{c.teacher_name || '-'}</td>
                  <td className="px-4 py-3 border-b border-slate-200">{c.title}</td>
                  <td className="px-4 py-3 border-b border-slate-200">{c.enrolled_count || 0}</td>
                  <td className="px-4 py-3 border-b border-slate-200">
                    <div className="flex flex-wrap gap-1">
                      {(c.categories || []).length === 0 ? (
                        <span className="text-xs text-slate-400">-</span>
                      ) : (
                        (c.categories || []).map((name) => (
                          <span key={name} className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-200">
                            {name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600" onClick={() => onParticipantsModalOpen(c)}>Lihat Peserta</button>
                      <button
                        className="rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-600"
                        onClick={() => onCourseCatModalToggle(c)}
                        title="Atur kategori course"
                      >
                        Kategori
                      </button>
                      <Link href={`/lms/courses/${c.id}/materials`} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-600">Kelola Materi</Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Menampilkan {totalCourses === 0 ? 'tidak ada data' : `${(courseCurrentPage - 1) * coursesPerPage + 1}-${Math.min((courseCurrentPage - 1) * coursesPerPage + visibleCourses.length, totalCourses)} dari ${totalCourses}`} course
        </span>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="uppercase tracking-wide">Baris per halaman</span>
          <select
            value={coursesPerPage}
            onChange={(e) => onCoursesPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {coursesPerPageOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" /> {selectedCourseIds.length} course dipilih
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-4">
        {totalCourses === 0 ? null : Array.from({ length: courseTotalPages }, (_, i) => (
          <button
            key={i}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${courseCurrentPage === i + 1 ? 'bg-purple-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => onCoursePageChange(i + 1)}
          >{i + 1}</button>
        ))}
      </div>

      {/* Course Categories Modal */}
      {showCourseCatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-2xl font-bold text-purple-700">Atur Kategori untuk Course</h2>
            <p className="mb-5 text-sm text-slate-600">Pilih mode penerapan dan kategori. Admin dapat menerapkan pada course yang dipilih atau seluruh course pada daftar saat ini.</p>
            <div className="mb-4 flex gap-2">
              <button
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${courseCatsOption === 'selected' ? 'bg-purple-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => onCourseCatsOptionChange('selected')}
              >Hanya di course terpilih</button>
              <button
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${courseCatsOption === 'all' ? 'bg-purple-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => onCourseCatsOptionChange('all')}
              >Di semua course pada daftar</button>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Cari Kategori</label>
              <input
                type="text"
                value={courseCatSearch}
                onChange={(e) => onCourseCatSearchChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Cari kategori..."
              />
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200">
              {categories.length === 0 ? (
                <div className="px-4 py-2 text-center text-sm text-slate-500">
                  Belum ada kategori yang tersedia.
                </div>
              ) : (
                <ul>
                  {categories.map((category) => (
                    <li key={category.id} className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
                          checked={courseBulkCatSet.has(category.id)}
                          onChange={(e) => {
                            const newSet = new Set(courseBulkCatSet);
                            if (e.target.checked) {
                              newSet.add(category.id);
                            } else {
                              newSet.delete(category.id);
                            }
                            onCourseBulkCatSetChange(newSet);
                          }}
                          aria-label={`Pilih kategori ${category.name}`}
                        />
                        <span className="font-medium text-slate-700">{category.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                onClick={onCourseCatsModalClose}
              >Batal</button>
              <button className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:from-purple-700 hover:to-indigo-700" onClick={onSaveBulkCourseCats}>Terapkan Sekarang</button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
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
                {participants.map((p) => (
                  <li key={p.id} className="mb-2">
                    <span className="font-semibold text-blue-700">{p.name}</span>
                    <span className="ml-2 text-gray-600">{p.email}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={onParticipantsModalClose}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Course Categories Modal */}
      {showCourseCatModal && selectedCourseForCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Atur Kategori Course</h3>
              <button
                onClick={() => onCourseCatModalToggle(null)}
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
                <p className="font-medium">Course: {selectedCourseForCat.title}</p>
                <p className="text-xs text-blue-600/80">Teacher: {selectedCourseForCat.teacher_name || 'N/A'}</p>
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
                          checked={courseCatSet.has(category.id)}
                          onChange={(e) => {
                            const newSet = new Set(courseCatSet);
                            if (e.target.checked) {
                              newSet.add(category.id);
                            } else {
                              newSet.delete(category.id);
                            }
                            onCourseCatSetChange(newSet);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <span className="ml-2 text-sm">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {courseCatSet.size} kategori dipilih
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => onCourseCatModalToggle(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={onSaveCourseCats}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Simpan Kategori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-purple-700">Buat Course Baru</h2>
            <form
              className="flex flex-col gap-4"
              onSubmit={onCourseSubmit}
            >
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Judul Course</label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => onCourseFormChange('title', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Deskripsi</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => onCourseFormChange('description', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Pengajar</label>
                <select
                  value={courseForm.teacher_id}
                  onChange={(e) => onCourseFormChange('teacher_id', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  required
                >
                  <option value="" disabled>Pilih teacher</option>
                  {teacherOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
              {courseError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {courseError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={onAddCourseModalClose}
                >Batal</button>
                <button
                  type="submit"
                  disabled={courseLoading}
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:from-purple-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                >{courseLoading ? 'Menyimpan...' : 'Simpan Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Fragment>
  );
}