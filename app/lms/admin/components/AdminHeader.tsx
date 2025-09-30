import Link from 'next/link';
import { LogoImage } from '../../../components/OptimizedImage';

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <header className="w-full bg-gradient-to-r from-indigo-800 via-blue-700 to-purple-700 shadow-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <LogoImage src="/ilmi-logo.png" alt="ILMI Logo" size="md" className="drop-shadow" />
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
            onClick={onLogout}
            className="ml-3 inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
          >Logout</button>
        </nav>
      </div>
    </header>
  );
}