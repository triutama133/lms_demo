"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
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
  }
  interface Course {
    id: string;
    teacher_name?: string;
    title: string;
    enrolled_count?: number;
  }
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '' });
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
                <input
                  type="text"
                  placeholder="Cari user..."
                  className="w-full md:w-1/3 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto mb-8 rounded-lg shadow">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Nama</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u =>
                      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchUser.toLowerCase())
                    ).map((u) => (
                      <tr key={u.id} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-2 border-b">{u.name}</td>
                        <td className="px-4 py-2 border-b">{u.email}</td>
                        <td className="px-4 py-2 border-b">{u.role}</td>
                        <td className="px-4 py-2 border-b">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 font-semibold text-sm mr-2 shadow" onClick={() => { setEditUser(u); setEditForm({ name: u.name, email: u.email, role: u.role, password: '' }); setShowEditModal(true); }}>Edit</button>
                          <button className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 font-semibold text-sm shadow" onClick={() => { setDeleteUser(u); setShowDeleteModal(true); }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setUsers(prev => prev.map((u: any) => u.id === editUser.id ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role } : u));
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
                              setUsers(prev => prev.filter((u: any) => u.id !== deleteUser.id));
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
                        {participants.map((p) => (
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
