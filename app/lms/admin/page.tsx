"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  // State untuk import excel
  const [showImportModal, setShowImportModal] = useState(false);
  interface ImportRow {
    idx: number;
    errors: string[];
    row: Record<string, unknown>;
  }
  const [importUsers, setImportUsers] = useState<User[]>([]);
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [invalidRows, setInvalidRows] = useState<ImportRow[]>([]);
  const [incompleteRows, setIncompleteRows] = useState<ImportRow[]>([]);
  const [invalidValueRows, setInvalidValueRows] = useState<ImportRow[]>([]);
  // State untuk modal tambah user
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForms, setAddForms] = useState([
    { name: '', email: '', role: 'student', password: '', provinsi: '' }
  ]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  // Role check: only allow admin
  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('lms_user') : null;
    if (!userData) {
      router.replace('/lms/login');
      return;
    }
    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
      router.replace('/lms/student/dashboard');
      }
    } catch {
      router.replace('/lms/login');
    }
  }, [router]);
  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_user');
      localStorage.removeItem('user_id');
    }
    router.replace('/lms/login');
  };

  const handleEnrollSubmit = async () => {
    if (!enrollCourseIds.length) {
      setEnrollError('Silakan pilih minimal satu course.');
      setEnrollSuccess('');
      return;
    }
    if (enrollOption === 'selected' && selectedUserIds.length === 0) {
      setEnrollError('Pilih minimal satu user untuk didaftarkan.');
      setEnrollSuccess('');
      return;
    }
    setEnrollLoading(true);
    setEnrollError('');
    setEnrollSuccess('');
    try {
      let totalEnrolled = 0;
      for (const courseId of enrollCourseIds) {
        const payload = enrollOption === 'all'
          ? { course_id: courseId, all_users: true }
          : { course_id: courseId, user_ids: selectedUserIds };
        const res = await fetch('/api/admin/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          totalEnrolled += data.enrolled_count ?? 0;
        } else {
          setEnrollError(data.error || 'Gagal mendaftarkan user ke course.');
          setEnrollSuccess('');
          setEnrollLoading(false);
          return;
        }
      }
      if (enrollOption === 'selected') {
        setSelectedUserIds([]);
      }
      await reloadCourses();
      setEnrollSuccess(`Berhasil mendaftarkan user ke ${enrollCourseIds.length} course (total ${totalEnrolled} pendaftaran baru).`);
      setEnrollError('');
    } catch (error) {
      console.error('Enroll error', error);
      setEnrollError('Gagal mendaftarkan user ke course.');
      setEnrollSuccess('');
    }
    setEnrollLoading(false);
  };
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    provinsi?: string;
  }
  interface Course {
    id: string;
    teacher_name?: string;
    title: string;
    enrolled_count?: number;
  }
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 15;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '', provinsi: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchUser, setSearchUser] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'courses'>('users');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollOption, setEnrollOption] = useState<'selected' | 'all'>('selected');
  const [enrollCourseIds, setEnrollCourseIds] = useState<string[]>([]);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [searchCourse, setSearchCourse] = useState('');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', teacher_id: '' });
  const [courseError, setCourseError] = useState('');
  const [courseLoading, setCourseLoading] = useState(false);

  const selectedCount = selectedUserIds.length;

  const roleSummary = useMemo(() => {
    const summary = { admin: 0, teacher: 0, student: 0 };
    users.forEach((user) => {
      if (user.role === 'admin') summary.admin += 1;
      if (user.role === 'teacher') summary.teacher += 1;
      if (user.role === 'student') summary.student += 1;
    });
    return summary;
  }, [users]);

  const totalCourses = courses.length;
  const totalEnrollments = useMemo(
    () => courses.reduce((acc, course) => acc + (course.enrolled_count ?? 0), 0),
    [courses]
  );

  const selectedLabel = useMemo(
    () => (selectedCount > 0 ? `${selectedCount} user dipilih` : 'Belum ada user dipilih'),
    [selectedCount]
  );

  const filteredUsers = useMemo(() => {
    const keyword = searchUser.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(keyword) ||
      u.email.toLowerCase().includes(keyword)
    );
  }, [users, searchUser]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
  }, [filteredUsers]);

  const totalUsers = sortedUsers.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalUsers / usersPerPage)), [totalUsers]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return sortedUsers.slice(start, start + usersPerPage);
  }, [sortedUsers, currentPage, usersPerPage]);

  const pageUserIds = useMemo(() => paginatedUsers.map((u) => u.id), [paginatedUsers]);
  const allPageSelected = pageUserIds.length > 0 && pageUserIds.every((id) => selectedUserIds.includes(id));
  const filteredEnrollCourses = useMemo(() => {
    const keyword = enrollSearch.trim().toLowerCase();
    if (!keyword) return courses;
    return courses.filter((course) =>
      course.title.toLowerCase().includes(keyword) ||
      (course.teacher_name || '').toLowerCase().includes(keyword)
    );
  }, [courses, enrollSearch]);

  const filteredCourseList = useMemo(() => {
    const keyword = searchCourse.trim().toLowerCase();
    if (!keyword) return courses;
    return courses.filter((course) =>
      course.title.toLowerCase().includes(keyword) ||
      (course.teacher_name || '').toLowerCase().includes(keyword)
    );
  }, [courses, searchCourse]);

  const teacherOptions = useMemo(() => users.filter((u) => u.role === 'teacher'), [users]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectPage = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageUserIds])));
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => !pageUserIds.includes(id)));
    }
  };

  const handleOpenEnrollModal = () => {
    setEnrollOption(selectedUserIds.length > 0 ? 'selected' : 'all');
    setEnrollCourseIds([]);
    setEnrollSearch('');
    setEnrollError('');
    setEnrollSuccess('');
    setShowEnrollModal(true);
  };

  const reloadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setSelectedUserIds((prev) => prev.filter((id) => (data.users || []).some((u: User) => u.id === id)));
      }
    } catch (err) {
      console.error('Gagal memuat data user', err);
    }
  }, []);

  const reloadCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
      } else {
        setError(data.error || 'Gagal fetch data');
      }
    } catch {
      setError('Gagal fetch data');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([reloadUsers(), reloadCourses()]);
      setLoading(false);
    };
    loadData();
  }, [reloadUsers, reloadCourses]);

  // ...existing code for UI and modals...
  return (
    <>
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-indigo-800 via-blue-700 to-purple-700 shadow-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image src="/ILMI logo new.png" alt="ILMI Logo" width={52} height={52} className="h-12 w-12 object-contain drop-shadow" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-indigo-200">ILMI LMS</p>
              <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/lms/student/dashboard" className="mx-1 rounded-full px-3 py-1.5 text-sm font-medium text-indigo-100 transition hover:bg-white/10">Student</Link>
            <Link href="/lms/teacher/dashboard" className="mx-1 rounded-full px-3 py-1.5 text-sm font-medium text-indigo-100 transition hover:bg-white/10">Teacher</Link>
            <Link href="/lms/admin" className="mx-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white shadow-inner">Admin</Link>
            <button
              onClick={handleLogout}
              className="ml-3 inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            >Logout</button>
          </nav>
        </div>
      </header>
      <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4 pb-16">
        <div className="mx-auto w-full max-w-6xl space-y-8 pt-10">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase text-slate-500">Total User</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalUsers}</p>
              <p className="mt-2 text-xs text-slate-500">Admin {roleSummary.admin} · Teacher {roleSummary.teacher} · Student {roleSummary.student}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase text-slate-500">Total Course</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalCourses}</p>
              <p className="mt-2 text-xs text-slate-500">Kelola kurikulum dan materi untuk setiap course aktif.</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase text-slate-500">Total Enrollment</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalEnrollments}</p>
              <p className="mt-2 text-xs text-slate-500">Akumulasi peserta dari seluruh course berjalan.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <span className="text-2xl" aria-hidden>⌛</span>
              <p className="text-sm font-medium">Sedang memuat data terbaru...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-center text-red-600 font-semibold">{error}</div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-1 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600'}`}
                  >Manajemen User</button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('courses')}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${activeTab === 'courses' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-purple-600'}`}
                  >Manajemen Course</button>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 shadow-sm md:max-w-sm">
                  Gunakan tab untuk berpindah antar manajemen. Setiap aksi dilengkapi tooltip dan hint agar lebih cepat dipahami.
                </div>
              </div>
              {activeTab === 'users' && (
                <>
              {/* User Management Table */}
              <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Manajemen User</h2>
                  <p className="text-sm text-slate-500">Kelola akun, atur akses, dan proses administrasi secara instan.</p>
                </div>
                <span className="inline-flex items-center self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {selectedLabel}
                </span>
              </div>
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative md:w-80">
                      <input
                        type="text"
                        placeholder="Cari user berdasarkan nama atau email..."
                        className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        value={searchUser}
                        onChange={e => setSearchUser(e.target.value)}
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-slate-400 md:inline">⌕</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-blue-600 hover:to-blue-700"
                        onClick={() => { setShowAddModal(true); setAddForms([{ name: '', email: '', role: 'student', password: '', provinsi: '' }]); setAddError(''); }}
                        title="Tambah akun user baru secara manual"
                      >Tambah Akun</button>
                      <button
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-emerald-600 hover:to-emerald-700"
                        onClick={() => { setShowImportModal(true); setImportUsers([]); setImportError(''); }}
                        title="Import user massal dari file Excel"
                      >Import User</button>
                      <button
                        className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-amber-500 hover:to-amber-600"
                        onClick={async () => {
                          const XLSX = await import('xlsx');
                          const exportData = users.map(u => ({
                            Nama: u.name,
                            Email: u.email,
                            Role: u.role,
                            Provinsi: u.provinsi || ''
                          }));
                          const worksheet = XLSX.utils.json_to_sheet(exportData);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
                          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                          const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'users.xlsx';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        }}
                        title="Unduh daftar user dalam format Excel"
                      >Export User</button>
                      <button
                        className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-fuchsia-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleOpenEnrollModal}
                        title="Enroll user terpilih atau semua user ke course"
                        disabled={courses.length === 0}
                      >Enroll ke Course</button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-700 shadow-sm md:max-w-xs">
                    <p className="mb-1 font-semibold">Petunjuk Singkat</p>
                    <p>Pilih user lewat kolom pertama atau gunakan pencarian. Tekan tombol aksi untuk menjalankan fitur yang diinginkan.</p>
                  </div>
                </div>
              {/* Modal Import Excel */}
              {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
                    <h2 className="text-lg font-bold mb-4 text-green-700">Import User dari Excel</h2>
                    <div className="mb-3 p-3 bg-green-50 border border-green-300 rounded text-green-900 text-sm">
                      <b>Petunjuk Format Excel:</b><br />
                      File harus memiliki kolom berikut:<br />
                      <span className="font-mono">nama, email, role, provinsi</span><br />
                      <span className="text-xs text-green-700">Contoh baris:</span><br />
                      <span className="font-mono text-xs">Solih,solihun@gmail.com,student,Jawa Barat</span>
                      <br />Role harus salah satu dari: <span className="font-mono">student</span>, <span className="font-mono">teacher</span>, <span className="font-mono">admin</span>
                    </div>
                    <label className="mb-4 block">
                      <span className="inline-block mb-2 font-semibold">Pilih file Excel:</span><br />
                      <span className="relative inline-block">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          id="import-excel-file"
                          onChange={async e => {
                            setImportError('');
                            setImportUsers([]);
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const XLSX = await import('xlsx');
                              const data = await file.arrayBuffer();
                              const workbook = XLSX.read(data, { type: 'array' });
                              const sheet = workbook.Sheets[workbook.SheetNames[0]];
                              const rows = XLSX.utils.sheet_to_json<{ [key: string]: string }>(sheet);
                              // Validasi kolom & error detail
                              const validRows: User[] = [];
                              const incompleteRows: { idx: number; errors: string[]; row: { [key: string]: string } }[] = [];
                              const invalidRows: { idx: number; errors: string[]; row: { [key: string]: string } }[] = [];
                              rows.forEach((row, idx) => {
                                const errors: string[] = [];
                                if (!row.nama) errors.push('Kolom "nama" kosong');
                                if (!row.email) errors.push('Kolom "email" kosong');
                                if (!row.role) errors.push('Kolom "role" kosong');
                                if (!row.provinsi) errors.push('Kolom "provinsi" kosong');
                                if (errors.length > 0) {
                                  incompleteRows.push({ idx: idx+2, errors, row });
                                  return;
                                }
                                // Validasi value
                                const valueErrors: string[] = [];
                                if (row.role && !['student','teacher','admin'].includes(row.role.toLowerCase())) valueErrors.push('Role harus student/teacher/admin');
                                if (valueErrors.length > 0) {
                                  invalidRows.push({ idx: idx+2, errors: valueErrors, row });
                                } else {
                                  // Map Excel row to User type
                                  validRows.push({
                                    id: '', // id will be set by backend
                                    name: row.nama,
                                    email: row.email,
                                    role: row.role,
                                    provinsi: row.provinsi
                                  });
                                }
                              });
                              setImportUsers(validRows);
                              setInvalidRows([...incompleteRows, ...invalidRows]);
                              setIncompleteRows(incompleteRows);
                              setInvalidValueRows(invalidRows);
                              if (validRows.length === 0) {
                                setImportError('File tidak valid atau kosong. Kolom wajib: nama, email, role, provinsi');
                              } else {
                                setImportError('');
                              }
                            } catch {
                              setImportError('Gagal membaca file. Pastikan format Excel benar.');
                            }
                          }}
                        />
                        <label htmlFor="import-excel-file" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow cursor-pointer">
                          Choose File
                        </label>
                      </span>
                    </label>
                    {importError && <div className="text-red-600 mb-2">{importError}</div>}
                    {(typeof incompleteRows !== 'undefined' && incompleteRows.length > 0) && (
                      <div className="mb-4">
                        <div className="font-semibold text-red-700 mb-1">Baris berikut <b>tidak lengkap</b> dan tidak akan diimport:</div>
                        <table className="min-w-full text-xs mb-2 border border-red-200">
                          <thead className="bg-red-50">
                            <tr>
                              <th className="px-2 py-1">Baris</th>
                              <th className="px-2 py-1">Error</th>
                              <th className="px-2 py-1">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {incompleteRows.map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1">{row.idx}</td>
                                <td className="px-2 py-1 text-red-700">{row.errors.join(', ')}</td>
                                <td className="px-2 py-1 font-mono">{JSON.stringify(row.row)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {(typeof invalidValueRows !== 'undefined' && invalidValueRows.length > 0) && (
                      <div className="mb-4">
                        <div className="font-semibold text-red-700 mb-1">Baris berikut <b>tidak valid</b> dan tidak akan diimport:</div>
                        <table className="min-w-full text-xs mb-2 border border-red-200">
                          <thead className="bg-red-50">
                            <tr>
                              <th className="px-2 py-1">Baris</th>
                              <th className="px-2 py-1">Error</th>
                              <th className="px-2 py-1">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invalidValueRows.map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1">{row.idx}</td>
                                <td className="px-2 py-1 text-red-700">{row.errors.join(', ')}</td>
                                <td className="px-2 py-1 font-mono">{JSON.stringify(row.row)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {typeof invalidRows !== 'undefined' && invalidRows.length > 0 && (
                      <div className="mb-4">
                        <div className="font-semibold text-red-700 mb-1">Detail Error Baris:</div>
                        <table className="min-w-full text-xs mb-2 border border-red-200">
                          <thead className="bg-red-50">
                            <tr>
                              <th className="px-2 py-1">Baris</th>
                              <th className="px-2 py-1">Error</th>
                              <th className="px-2 py-1">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invalidRows.map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1">{row.idx}</td>
                                <td className="px-2 py-1 text-red-700">{row.errors.join(', ')}</td>
                                <td className="px-2 py-1 font-mono">{JSON.stringify(row.row)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {importUsers.length > 0 && (
                      <div className="mb-4">
                        <div className="font-semibold mb-2">Preview Data User:</div>
                        <table className="min-w-full text-sm mb-2">
                          <thead>
                            <tr>
                              <th className="px-2 py-1">Nama</th>
                              <th className="px-2 py-1">Email</th>
                              <th className="px-2 py-1">Role</th>
                              <th className="px-2 py-1">Provinsi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importUsers.map((u, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1">{u.name}</td>
                                <td className="px-2 py-1">{u.email}</td>
                                <td className="px-2 py-1">{u.role}</td>
                                <td className="px-2 py-1">{u.provinsi}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={() => setShowImportModal(false)}>Batal</button>
                      <button
                        type="button"
                        disabled={importLoading || importUsers.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
                        onClick={async () => {
                          setImportLoading(true);
                          setImportError('');
                          try {
                            // Map data ke format bulk API
                            const usersToImport = importUsers.map(u => ({
                              name: u.name,
                              email: u.email,
                              role: u.role,
                              provinsi: u.provinsi,
                              password: '', // backend set default
                            }));
                            const payload = { users: usersToImport };
                            console.log('Import payload:', payload);
                            const res = await fetch('/api/users/bulk', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload),
                            });
                            let data;
                            try {
                              data = await res.json();
                            } catch {
                              setImportError('Gagal membaca response backend.');
                              setImportLoading(false);
                              return;
                            }
                            if (data && data.success) {
                              setUsers(prev => [...prev, ...data.created]);
                              setShowImportModal(false);
                            } else {
                              if (!data || (Object.keys(data).length === 0)) {
                                setImportError('Gagal import user: Response backend kosong atau tidak sesuai.');
                                console.error('Import error: Response backend kosong atau tidak sesuai.', data);
                              } else {
                                setImportError((data.error ? data.error : 'Gagal import user') + (data.detail ? ' | Detail: ' + JSON.stringify(data.detail) : ''));
                                console.error('Import error:', data);
                              }
                            }
                          } catch (error) {
                            console.error('Gagal import user:', error);
                            setImportError('Gagal import user.');
                          }
                          setImportLoading(false);
                        }}
                      >{importLoading ? 'Mengimpor...' : 'Import User'}</button>
                    </div>
                  </div>
                </div>
              )}
              </div>
              {/* Modal Tambah User */}
              {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
                    <h2 className="text-lg font-bold mb-4 text-blue-700">Tambah User</h2>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setAddLoading(true);
                        setAddError('');
                        try {
                          const res = await fetch('/api/users/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ users: addForms }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setUsers(prev => [...prev, ...data.created]);
                            setShowAddModal(false);
                          } else {
                            setAddError(data.error || 'Gagal tambah user');
                          }
                        } catch {
                          setAddError('Gagal tambah user');
                        }
                        setAddLoading(false);
                      }}
                      className="flex flex-col gap-4"
                    >
                      {addForms.map((form, idx) => (
                        <div key={idx} className="border rounded-lg p-4 mb-2 bg-blue-50">
                          <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                              <label className="block font-semibold mb-1">Nama</label>
                              <input type="text" value={form.name} onChange={e => setAddForms(f => f.map((v, i) => i === idx ? { ...v, name: e.target.value } : v))} required className="w-full border rounded px-3 py-2" />
                            </div>
                            <div className="flex-1">
                              <label className="block font-semibold mb-1">Email</label>
                              <input type="email" value={form.email} onChange={e => setAddForms(f => f.map((v, i) => i === idx ? { ...v, email: e.target.value } : v))} required className="w-full border rounded px-3 py-2" />
                            </div>
                          </div>
                          <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                              <label className="block font-semibold mb-1">Role</label>
                              <select value={form.role} onChange={e => setAddForms(f => f.map((v, i) => i === idx ? { ...v, role: e.target.value } : v))} required className="w-full border rounded px-3 py-2">
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block font-semibold mb-1">Provinsi Domisili</label>
                              <select value={form.provinsi} onChange={e => setAddForms(f => f.map((v, i) => i === idx ? { ...v, provinsi: e.target.value } : v))} required className="w-full border rounded px-3 py-2">
                                <option value="">Pilih Provinsi</option>
                                <option value="Aceh">Aceh</option>
                                <option value="Sumatera Utara">Sumatera Utara</option>
                                <option value="Sumatera Barat">Sumatera Barat</option>
                                <option value="Riau">Riau</option>
                                <option value="Jambi">Jambi</option>
                                <option value="Sumatera Selatan">Sumatera Selatan</option>
                                <option value="Bengkulu">Bengkulu</option>
                                <option value="Lampung">Lampung</option>
                                <option value="Bangka Belitung">Bangka Belitung</option>
                                <option value="Kepulauan Riau">Kepulauan Riau</option>
                                <option value="DKI Jakarta">DKI Jakarta</option>
                                <option value="Jawa Barat">Jawa Barat</option>
                                <option value="Jawa Tengah">Jawa Tengah</option>
                                <option value="DI Yogyakarta">DI Yogyakarta</option>
                                <option value="Jawa Timur">Jawa Timur</option>
                                <option value="Banten">Banten</option>
                                <option value="Bali">Bali</option>
                                <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
                                <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
                                <option value="Kalimantan Barat">Kalimantan Barat</option>
                                <option value="Kalimantan Tengah">Kalimantan Tengah</option>
                                <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                                <option value="Kalimantan Timur">Kalimantan Timur</option>
                                <option value="Kalimantan Utara">Kalimantan Utara</option>
                                <option value="Sulawesi Utara">Sulawesi Utara</option>
                                <option value="Sulawesi Tengah">Sulawesi Tengah</option>
                                <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                                <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
                                <option value="Gorontalo">Gorontalo</option>
                                <option value="Sulawesi Barat">Sulawesi Barat</option>
                                <option value="Maluku">Maluku</option>
                                <option value="Maluku Utara">Maluku Utara</option>
                                <option value="Papua">Papua</option>
                                <option value="Papua Barat">Papua Barat</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Password</label>
                            <input type="password" value={form.password} onChange={e => setAddForms(f => f.map((v, i) => i === idx ? { ...v, password: e.target.value } : v))} required className="w-full border rounded px-3 py-2" />
                          </div>
                          {addForms.length > 1 && (
                            <button type="button" className="mt-2 text-red-600 hover:underline text-sm" onClick={() => setAddForms(f => f.filter((_, i) => i !== idx))}>Hapus Form Ini</button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded shadow mb-2" onClick={() => setAddForms(f => [...f, { name: '', email: '', role: 'student', password: '', provinsi: '' }])}>Tambah Form User</button>
                      {addError && <div className="text-red-600 text-center">{addError}</div>}
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={() => setShowAddModal(false)}>Batal</button>
                        <button type="submit" disabled={addLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">
                          {addLoading ? 'Menyimpan...' : 'Simpan User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
                <table className="w-full bg-white text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-center font-semibold">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                          checked={paginatedUsers.length > 0 && allPageSelected}
                          onChange={e => toggleSelectPage(e.target.checked)}
                          aria-label="Pilih semua user di halaman ini"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Nama</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-left font-semibold">Provinsi</th>
                      <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Belum ada user untuk ditampilkan.</td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => (
                        <tr key={u.id} className="odd:bg-white even:bg-slate-50/80 hover:bg-indigo-50 transition">
                          <td className="px-4 py-3 border-b border-slate-200 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={() => toggleUserSelection(u.id)}
                              aria-label={`Pilih user ${u.name}`}
                            />
                          </td>
                          <td className="px-4 py-3 border-b border-slate-200 font-medium text-slate-800">{u.name}</td>
                          <td className="px-4 py-3 border-b border-slate-200">{u.email}</td>
                          <td className="px-4 py-3 border-b border-slate-200 capitalize">{u.role}</td>
                          <td className="px-4 py-3 border-b border-slate-200">{u.provinsi || '-'}</td>
                          <td className="px-4 py-3 border-b border-slate-200">
                            <div className="flex flex-wrap gap-2">
                              <button className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-600" onClick={() => { setEditUser(u); setEditForm({ name: u.name, email: u.email, role: u.role, password: '', provinsi: u.provinsi || '' }); setShowEditModal(true); }}>Edit</button>
                              <button className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600" onClick={() => { setDeleteUser(u); setShowDeleteModal(true); }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>Menampilkan {totalUsers === 0 ? 'tidak ada data' : `${(currentPage - 1) * usersPerPage + 1}-${Math.min((currentPage - 1) * usersPerPage + paginatedUsers.length, totalUsers)} dari ${totalUsers}`} user</span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" /> {selectedCount} user dipilih
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-4">
                  {totalUsers === 0 ? null : Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >{i + 1}</button>
                  ))}
                </div>
              </div>
              </>
              )}
              {activeTab === 'courses' && (
                <>
              {/* Course Table */}
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
                      onChange={(e) => setSearchCourse(e.target.value)}
                    />
                    <button
                      className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-purple-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => {
                        setCourseForm({ title: '', description: '', teacher_id: teacherOptions[0]?.id || '' });
                        setCourseError('');
                        setShowAddCourseModal(true);
                      }}
                      disabled={teacherOptions.length === 0}
                    >Buat Course</button>
                  </div>
                  <span className="inline-flex items-center self-start rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600 md:self-end">
                    Total {totalCourses} course
                  </span>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
                <table className="w-full bg-white text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Nama Teacher</th>
                      <th className="px-4 py-3 text-left font-semibold">Judul Course</th>
                      <th className="px-4 py-3 text-left font-semibold">Jumlah Peserta</th>
                      <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourseList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                          {courses.length === 0 ? 'Belum ada course yang aktif.' : 'Course tidak ditemukan.'}
                        </td>
                      </tr>
                    ) : (
                      filteredCourseList.map((c) => (
                        <tr key={c.id} className="odd:bg-white even:bg-slate-50/80 hover:bg-fuchsia-50 transition">
                          <td className="px-4 py-3 border-b border-slate-200 font-medium">{c.teacher_name || '-'}</td>
                          <td className="px-4 py-3 border-b border-slate-200">{c.title}</td>
                          <td className="px-4 py-3 border-b border-slate-200">{c.enrolled_count || 0}</td>
                          <td className="px-4 py-3 border-b border-slate-200">
                            <div className="flex flex-wrap gap-2">
                              <button className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600" onClick={async () => {
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
                          }}>Lihat Peserta</button>
                              <Link href={`/lms/courses/${c.id}/materials`} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-600">Kelola Materi</Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {activeTab === 'courses' && showParticipantsModal && (
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
                        {participants.map((p: User) => (
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
              {activeTab === 'courses' && showAddCourseModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                  <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                    <h2 className="mb-4 text-lg font-bold text-purple-700">Buat Course Baru</h2>
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!courseForm.title || !courseForm.description || !courseForm.teacher_id) {
                          setCourseError('Semua field wajib diisi.');
                          return;
                        }
                        setCourseLoading(true);
                        setCourseError('');
                        try {
                          const res = await fetch('/api/courses', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(courseForm),
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            setShowAddCourseModal(false);
                            setCourseForm({ title: '', description: '', teacher_id: '' });
                            await reloadCourses();
                          } else {
                            setCourseError(data.error || 'Gagal membuat course.');
                          }
                        } catch (error) {
                          console.error('Create course error', error);
                          setCourseError('Gagal membuat course.');
                        }
                        setCourseLoading(false);
                      }}
                    >
                      <div>
                        <label className="mb-1 block font-semibold text-slate-700">Judul Course</label>
                        <input
                          type="text"
                          value={courseForm.title}
                          onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-semibold text-slate-700">Deskripsi</label>
                        <textarea
                          value={courseForm.description}
                          onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          rows={4}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-semibold text-slate-700">Pengajar</label>
                        <select
                          value={courseForm.teacher_id}
                          onChange={(e) => setCourseForm((prev) => ({ ...prev, teacher_id: e.target.value }))}
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
                          onClick={() => {
                            setShowAddCourseModal(false);
                            setCourseError('');
                          }}
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
              </>
              )}
              {showEnrollModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
                    <h2 className="text-lg font-bold mb-4 text-purple-700">Enroll User ke Course</h2>
                    <div className="mb-4 text-sm text-gray-600">
                      Pilih mode enroll dan course tujuan. Admin dapat mendaftarkan user yang dipilih atau seluruh user sekaligus.
                    </div>
                    <div className="mb-4">
                      <span className="block font-semibold mb-2">Mode Enroll</span>
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center gap-2 ${selectedUserIds.length === 0 ? 'text-gray-400' : ''}`}>
                          <input
                            type="radio"
                            name="enroll-mode"
                            value="selected"
                            checked={enrollOption === 'selected'}
                            onChange={() => setEnrollOption('selected')}
                            disabled={selectedUserIds.length === 0}
                          />
                          Enroll user yang dipilih ({selectedUserIds.length})
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="enroll-mode"
                            value="all"
                            checked={enrollOption === 'all'}
                            onChange={() => setEnrollOption('all')}
                          />
                          Enroll semua user aktif
                        </label>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block font-semibold mb-1">Cari & Pilih Course</label>
                      <input
                        type="text"
                        value={enrollSearch}
                        onChange={e => setEnrollSearch(e.target.value)}
                        placeholder="Cari berdasarkan judul atau nama teacher"
                        className="w-full border rounded px-3 py-2 mb-2"
                      />
                      <div className="max-h-48 overflow-y-auto border rounded">
                        {filteredEnrollCourses.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">Course tidak ditemukan.</div>
                        ) : (
                          filteredEnrollCourses.map(course => {
                            const checked = enrollCourseIds.includes(course.id);
                            return (
                              <label key={course.id} className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${checked ? 'bg-purple-100' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={e => {
                                    setEnrollCourseIds(prev =>
                                      e.target.checked
                                        ? [...prev, course.id]
                                        : prev.filter(id => id !== course.id)
                                    );
                                  }}
                                />
                                <span className="flex-1">
                                  <span className="font-semibold text-purple-700">{course.title}</span>
                                  {course.teacher_name && (
                                    <span className="ml-1 text-gray-500 text-xs">- {course.teacher_name}</span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500">{course.enrolled_count || 0} peserta</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Course terpilih: {enrollCourseIds.length}</div>
                    </div>
                    {enrollError && <div className="mb-3 text-red-600 text-sm">{enrollError}</div>}
                    {enrollSuccess && <div className="mb-3 text-green-600 text-sm">{enrollSuccess}</div>}
                    <div className="flex justify-end gap-2">
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
                        onClick={() => {
                          setShowEnrollModal(false);
                          setEnrollError('');
                          setEnrollSuccess('');
                          setEnrollCourseIds([]);
                          setEnrollLoading(false);
                        }}
                      >Batal</button>
                      <button
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded"
                        onClick={handleEnrollSubmit}
                        disabled={enrollLoading || courses.length === 0}
                      >
                        {enrollLoading ? 'Memproses...' : 'Enroll Sekarang'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Edit User Modal */}
              {activeTab === 'users' && showEditModal && editUser && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                    <h2 className="text-lg font-bold mb-4 text-blue-700">Edit User</h2>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setEditLoading(true);
                        setEditError('');
                        try {
                          const res = await fetch('/api/users', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: editUser.id,
                              name: editForm.name,
                              email: editForm.email,
                              role: editForm.role,
                              password: editForm.password || undefined,
                              provinsi: editForm.provinsi,
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setUsers(prev => prev.map((u: User) => u.id === editUser.id ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role, provinsi: editForm.provinsi } : u));
                            setShowEditModal(false);
                            setEditUser(null);
                          } else {
                            setEditError(data.error || 'Gagal update user');
                          }
                        } catch {
                          setEditError('Gagal update user');
                        }
                        setEditLoading(false);
                      }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="block font-semibold mb-1">Nama</label>
                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required className="w-full border rounded px-3 py-2" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Email</label>
                        <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required className="w-full border rounded px-3 py-2" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Role</label>
                        <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} required className="w-full border rounded px-3 py-2">
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Provinsi Domisili</label>
                        <select value={editForm.provinsi} onChange={e => setEditForm({ ...editForm, provinsi: e.target.value })} required className="w-full border rounded px-3 py-2">
                          <option value="">Pilih Provinsi</option>
                          <option value="Aceh">Aceh</option>
                          <option value="Sumatera Utara">Sumatera Utara</option>
                          <option value="Sumatera Barat">Sumatera Barat</option>
                          <option value="Riau">Riau</option>
                          <option value="Jambi">Jambi</option>
                          <option value="Sumatera Selatan">Sumatera Selatan</option>
                          <option value="Bengkulu">Bengkulu</option>
                          <option value="Lampung">Lampung</option>
                          <option value="Bangka Belitung">Bangka Belitung</option>
                          <option value="Kepulauan Riau">Kepulauan Riau</option>
                          <option value="DKI Jakarta">DKI Jakarta</option>
                          <option value="Jawa Barat">Jawa Barat</option>
                          <option value="Jawa Tengah">Jawa Tengah</option>
                          <option value="DI Yogyakarta">DI Yogyakarta</option>
                          <option value="Jawa Timur">Jawa Timur</option>
                          <option value="Banten">Banten</option>
                          <option value="Bali">Bali</option>
                          <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
                          <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
                          <option value="Kalimantan Barat">Kalimantan Barat</option>
                          <option value="Kalimantan Tengah">Kalimantan Tengah</option>
                          <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                          <option value="Kalimantan Timur">Kalimantan Timur</option>
                          <option value="Kalimantan Utara">Kalimantan Utara</option>
                          <option value="Sulawesi Utara">Sulawesi Utara</option>
                          <option value="Sulawesi Tengah">Sulawesi Tengah</option>
                          <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                          <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
                          <option value="Gorontalo">Gorontalo</option>
                          <option value="Sulawesi Barat">Sulawesi Barat</option>
                          <option value="Maluku">Maluku</option>
                          <option value="Maluku Utara">Maluku Utara</option>
                          <option value="Papua">Papua</option>
                          <option value="Papua Barat">Papua Barat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Password (kosongkan jika tidak ingin ganti)</label>
                        <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className="w-full border rounded px-3 py-2" />
                      </div>
                      {editError && <div className="text-red-600 text-center">{editError}</div>}
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded" onClick={() => { setShowEditModal(false); setEditUser(null); }}>Batal</button>
                        <button type="submit" disabled={editLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">
                          {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              {/* Delete User Modal */}
              {activeTab === 'users' && showDeleteModal && deleteUser && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                    <h2 className="text-lg font-bold mb-4 text-red-700">Konfirmasi Hapus User</h2>
                    <p className="mb-6 text-gray-700">Yakin ingin menghapus user <span className="font-semibold text-blue-700">{deleteUser.name}</span>?</p>
                    <div className="flex gap-3 justify-end">
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
                        onClick={() => { setShowDeleteModal(false); setDeleteUser(null); }}
                      >Batal</button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/users', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: deleteUser.id }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              setUsers(prev => prev.filter((u: User) => u.id !== deleteUser.id));
                              setSelectedUserIds(prev => prev.filter(id => id !== deleteUser.id));
                              setShowDeleteModal(false);
                              setDeleteUser(null);
                            } else {
                              alert(data.error || 'Gagal hapus user');
                            }
                          } catch {
                            alert('Gagal hapus user');
                          }
                        }}
                      >Ya, hapus</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
        </div>
      </main>
    </>
  );
}
