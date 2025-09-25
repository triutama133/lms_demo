"use client";
import { Children, type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

type StudentHeaderProps = {
  extraNavItems?: ReactNode;
  rightSlot?: ReactNode;
};

type User = {
  id: string;
  name: string;
  role: string;
};

export default function StudentHeader({ extraNavItems, rightSlot }: StudentHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lms_user') : null;
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to read lms_user from storage', error);
    }
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    setShowMobileNav(false);
  }, [pathname]);

  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error', error);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_user');
      localStorage.removeItem('user_id');
      localStorage.removeItem('token');
      localStorage.removeItem('enrollment_id');
    }
    router.replace('/lms/login');
    setLoggingOut(false);
  };

  const navLinks = [
    { href: '/lms/student/dashboard', label: 'Home' },
    { href: '/lms/student/courses', label: 'Courses' },
    { href: '/lms/student/progress', label: 'Tracking Progress' },
  ];

  const extraItemsArray = extraNavItems ? Children.toArray(extraNavItems) : [];

  return (
    <header className="fixed top-0 left-0 z-10 w-full bg-white/90 shadow">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-6">
          <Image src="/ILMI logo new.png" alt="ILMI Logo" width={48} height={48} className="h-12 w-12 object-contain" />
          <span className="text-xl font-bold text-blue-700">LMS</span>
        </div>

        <div className="hidden w-full items-center justify-between gap-4 md:flex md:w-auto">
          <nav className="flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${pathname?.startsWith(link.href) ? 'text-blue-800 underline' : 'text-blue-700 hover:underline'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {extraItemsArray.length > 0 && (
            <div className="flex items-center gap-3">
              {extraItemsArray.map((item, index) => (
                <div key={index} className="inline-flex items-center">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {rightSlot}
          <button
            type="button"
            onClick={() => setShowMobileNav((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-700 shadow-sm md:hidden"
            aria-label="Toggle navigation"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="User menu"
            >
              <span className="inline-block h-10 w-10 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-200">
                <svg className="h-full w-full text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
                </svg>
              </span>
              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg z-20">
                <div className="border-b px-6 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-800">{user?.name ?? 'Student'}</span>
                  </div>
                  {user?.role && (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">Role: {user.role}</span>
                  )}
                </div>
                <ul className="py-2">
                  <li><a href="#" className="flex items-center gap-2 px-6 py-2 text-gray-700 hover:bg-gray-100"><span>👤</span>Profil Saya</a></li>
                  <li><a href="#" className="flex items-center gap-2 px-6 py-2 text-gray-700 hover:bg-gray-100"><span>📚</span>My Course</a></li>
                  <li><a href="#" className="flex items-center gap-2 px-6 py-2 text-gray-700 hover:bg-gray-100"><span>⚙️</span>Pengaturan</a></li>
                  <li>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-6 py-2 font-semibold text-red-600 hover:bg-gray-100 relative" disabled={loggingOut}>
                      <span>🚪</span>Logout
                      {loggingOut && (
                        <span className="absolute right-4 flex items-center">
                          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {showMobileNav && (
          <div className="mt-3 w-full rounded-2xl border border-slate-100 bg-white/95 p-4 shadow md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  onClick={() => setShowMobileNav(false)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${pathname?.startsWith(link.href) ? 'bg-blue-600 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {extraItemsArray.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {extraItemsArray.map((item, index) => (
                  <div key={`mobile-extra-${index}`} className="flex items-center">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
