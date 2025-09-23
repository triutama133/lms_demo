import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherHeader() {
  const router = useRouter();
  const handleLogout = () => {
  // Implementasi logout sesuai kebutuhan (misal clear token, redirect)
  // Contoh:
  localStorage.removeItem('token');
  router.push('/lms/login');
  };
  return (
    <header className="w-full bg-purple-700 text-white shadow flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <img src="/ILMI logo new.png" alt="ILMI Logo" className="h-12 w-12 object-contain" />
        <span className="text-2xl font-bold text-white">LMS</span>
        <nav className="flex gap-6 items-center">
          <Link href="/lms/teacher/dashboard" className="font-bold hover:underline">Home</Link>
          <Link href="/lms/courses/manage" className="hover:underline">My Courses</Link>
          <Link href="/lms/teacher/track" className="hover:underline">Track Belajar Siswa</Link>
        </nav>
      </div>
      <div className="flex gap-2 items-center">
        <Link href="/lms/dashboard" className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded shadow transition-all">Student Dashboard</Link>
        <button onClick={handleLogout} className="bg-white text-purple-700 font-semibold px-4 py-2 rounded shadow hover:bg-purple-100">Logout</button>
      </div>
    </header>
  );
}
