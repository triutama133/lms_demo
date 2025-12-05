import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogoImage } from './OptimizedImage';

export default function TeacherHeader() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_user');
      localStorage.removeItem('user_id');
      localStorage.removeItem('token');
    }
    router.push('/login');
  };
  return (
    <header className="w-full bg-purple-700 text-white shadow flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
  <LogoImage src="/ilmi-logo.png" alt="ILMI Logo" size="md" />
        <span className="text-2xl font-bold text-white">LMS</span>
        <nav className="flex gap-6 items-center">
          <Link href="/teacher/dashboard" className="font-bold hover:underline">Home</Link>
          <Link href="/teacher/courses/manage" className="hover:underline">My Courses</Link>
          <Link href="/teacher/track" className="hover:underline">Track Belajar Siswa</Link>
        </nav>
      </div>
      <div className="flex gap-2 items-center">
        <Link href="/student/dashboard" className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded shadow transition-all">Student Dashboard</Link>
        <button onClick={handleLogout} className="bg-white text-purple-700 font-semibold px-4 py-2 rounded shadow hover:bg-purple-100">Logout</button>
      </div>
    </header>
  );
}
