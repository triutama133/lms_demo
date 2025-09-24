"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  // State untuk import excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUsers, setImportUsers] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [invalidRows, setInvalidRows] = useState<any[]>([]);
    const [incompleteRows, setIncompleteRows] = useState<{ idx: number; errors: string[]; row: any }[]>([]);
    const [invalidValueRows, setInvalidValueRows] = useState<{ idx: number; errors: string[]; row: any }[]>([]);
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
        router.replace('/lms/dashboard');
      }
    } catch {
      router.replace('/lms/login');
    }
  }, [router]);
  // Logout handler
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_user');
      localStorage.removeItem('user_id');
    }
    router.replace('/lms/login');
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

  useEffect(() => {
    // Fetch users
    fetch('/api/users').then(res => res.json()).then(userData => {
      if (userData.success) setUsers(userData.users || []);
    });
    // Fetch courses with teacher & enrolled count
    fetch('/api/admin/courses').then(res => res.json()).then(courseData => {
      if (courseData.success) setCourses(courseData.courses || []);
      setLoading(false);
    }).catch(() => {
      setError('Gagal fetch data');
      setLoading(false);
    });
  }, []);

  // ...existing code for UI and modals...
  return (
    <>
      {/* Header */}
      <header className="w-full bg-blue-700 py-4 shadow-lg mb-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image src="/ILMI logo new.png" alt="ILMI Logo" width={48} height={48} className="h-12 w-12 object-contain" />
            <h1 className="text-2xl font-bold text-white">LMS Admin Dashboard</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/lms/dashboard" className="text-white hover:underline mx-2">Student</Link>
            <Link href="/lms/teacher/dashboard" className="text-white hover:underline mx-2">Teacher</Link>
            <Link href="/lms/admin" className="text-white font-bold underline mx-2">Admin</Link>
            <button
              onClick={handleLogout}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded shadow transition-all"
            >Logout</button>
          </nav>
        </div>
      </header>
      <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex flex-col items-center px-4 pt-0">
        <section className="max-w-5xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
          {loading ? (
            <div className="text-center text-gray-500">Loading data...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : (
            <>
              {/* User Management Table */}
              <h2 className="text-xl font-bold text-purple-700 mb-4">Manajemen User</h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Cari user..."
                    className="w-full md:w-1/3 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition-all"
                      onClick={() => { setShowAddModal(true); setAddForms([{ name: '', email: '', role: 'student', password: '', provinsi: '' }]); setAddError(''); }}
                    >Tambah Akun</button>
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow transition-all"
                      onClick={() => { setShowImportModal(true); setImportUsers([]); setImportError(''); }}
                    >Import User</button>
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded shadow transition-all"
                      onClick={async () => {
                        // Export users to Excel
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
                    >Export User</button>
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
                              const rows = XLSX.utils.sheet_to_json(sheet);
                              // Validasi kolom & error detail
                              const validRows: any[] = [];
                              const incompleteRows: { idx: number; errors: string[]; row: any }[] = [];
                              const invalidRows: { idx: number; errors: string[]; row: any }[] = [];
                              rows.forEach((row: any, idx: number) => {
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
                                if (row.role && !['student','teacher','admin'].includes((row.role+'').toLowerCase())) valueErrors.push('Role harus student/teacher/admin');
                                if (valueErrors.length > 0) {
                                  invalidRows.push({ idx: idx+2, errors: valueErrors, row });
                                } else {
                                  validRows.push(row);
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
                            } catch (err) {
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
                                <td className="px-2 py-1">{u.nama}</td>
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
                              name: u.nama,
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
                            } catch (err) {
                              setImportError('Gagal membaca response backend: ' + err);
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
                          } catch (err) {
                            setImportError('Gagal import user: ' + (typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : String(err)));
                            console.error('Import error:', err);
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
              <div className="overflow-x-auto mb-8 rounded-lg shadow">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Nama</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Provinsi</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Filter, sort, and paginate users
                      const filtered = users.filter(u =>
                        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchUser.toLowerCase())
                      );
                      const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
                      const startIdx = (currentPage - 1) * usersPerPage;
                      const paginated = sorted.slice(startIdx, startIdx + usersPerPage);
                      return paginated.map((u) => (
                        <tr key={u.id} className="hover:bg-blue-50 transition">
                          <td className="px-4 py-2 border-b">{u.name}</td>
                          <td className="px-4 py-2 border-b">{u.email}</td>
                          <td className="px-4 py-2 border-b">{u.role}</td>
                          <td className="px-4 py-2 border-b">{u.provinsi || '-'}</td>
                          <td className="px-4 py-2 border-b">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 font-semibold text-sm mr-2 shadow" onClick={() => { setEditUser(u); setEditForm({ name: u.name, email: u.email, role: u.role, password: '', provinsi: u.provinsi || '' }); setShowEditModal(true); }}>Edit</button>
                            <button className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 font-semibold text-sm shadow" onClick={() => { setDeleteUser(u); setShowDeleteModal(true); }}>Delete</button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                {/* User Table Statistics */}
                {(() => {
                  const filtered = users.filter(u =>
                    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchUser.toLowerCase())
                  );
                  const total = filtered.length;
                  const startIdx = (currentPage - 1) * usersPerPage + 1;
                  const endIdx = Math.min(currentPage * usersPerPage, total);
                  return (
                    <div className="flex justify-between items-center mt-2 mb-2 text-sm text-gray-700">
                      <span>menampilkan {total === 0 ? 'Tidak ada data' : `${startIdx}-${endIdx} dari ${total}`} user</span>
                    </div>
                  );
                })()}
                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-2 mt-2 mb-4">
                  {Array.from({ length: Math.ceil(users.filter(u =>
                    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchUser.toLowerCase())
                  ).length / usersPerPage) }, (_, i) => (
                    <button
                      key={i}
                      className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} font-semibold`}
                      onClick={() => setCurrentPage(i + 1)}
                    >{i + 1}</button>
                  ))}
                </div>
              </div>
              {/* Course Table */}
              <h2 className="text-xl font-bold text-purple-700 mb-4">Daftar Course</h2>
              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Nama Teacher</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Judul Course</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Jumlah Peserta</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.id} className="hover:bg-purple-50 transition">
                        <td className="px-4 py-2 border-b">{c.teacher_name || '-'}</td>
                        <td className="px-4 py-2 border-b">{c.title}</td>
                        <td className="px-4 py-2 border-b">{c.enrolled_count || 0}</td>
                        <td className="px-4 py-2 border-b flex gap-2">
                          <button className="bg-green-600 hover:bg-green-700 text-white rounded px-3 py-1 font-semibold text-sm shadow" onClick={async () => {
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
                          <Link href={`/lms/courses/${c.id}/materials`} className="bg-purple-600 hover:bg-purple-700 text-white rounded px-3 py-1 font-semibold text-sm shadow">Lihat Materi</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Edit User Modal */}
              {showEditModal && editUser && (
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
              {showDeleteModal && deleteUser && (
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
              {/* Modal Peserta Course */}
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
            </>
          )}
        </section>
      </main>
    </>
  );
}
