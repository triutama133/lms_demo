"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Get captcha token for v2
    const token = recaptchaRef.current?.getValue();
    if (!token) {
      setError('Please complete the captcha verification.');
      setLoading(false);
      return;
    }    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, captchaToken: token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setForm({ email: '', password: '', role: 'student' });
        // Reset captcha
        recaptchaRef.current?.reset();
        setCaptchaVerified(false);

        // Simpan user ke localStorage dan redirect sesuai role
        if (data.user) {
          console.debug('login response user:', data.user);
           // Keep role as returned by server (use 'teacher' consistently)
           const userToStore = {
             ...data.user
           };
          if (typeof window !== 'undefined') {
            localStorage.setItem('lms_user', JSON.stringify(userToStore));
              localStorage.setItem('user_id', data.user.id); // Ensure user_id is available for enroll
          }
          // Redirect berdasarkan normalized role — only allow internal, safe routes
            const safeRoutes = ['/lms/student/dashboard', '/lms/teacher/dashboard', '/lms/admin', '/'];
            const target = data.user.role === 'student' ? '/lms/student/dashboard' : data.user.role === 'teacher' ? '/lms/teacher/dashboard' : data.user.role === 'admin' ? '/lms/admin' : '/';
          if (safeRoutes.includes(target)) {
            router.replace(target);
          } else {
            console.warn('Blocked unsafe redirect target:', target);
            router.replace('/');
          }
        }
      } else {
        setError(data.error || 'Gagal login');
        // Reset captcha on error
        recaptchaRef.current?.reset();
        setCaptchaVerified(false);
      }
    } catch {
      setError('Terjadi kesalahan.');
      // Reset captcha on error
      recaptchaRef.current?.reset();
      setCaptchaVerified(false);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex flex-col items-center justify-center px-4 pt-24">
      <section className="max-w-md w-full bg-white/90 rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/ilmi-logo.png"
            alt="ILMI Logo"
            width={144}
            height={144}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">Login</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="password" name="password" required value={form.password} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Login sebagai</label>
            <select id="role" name="role" value={form.role} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
              onChange={(token) => setCaptchaVerified(!!token)}
              onExpired={() => setCaptchaVerified(false)}
              size="compact"
            />
          </div>

          <button type="submit" disabled={loading || !captchaVerified} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 rounded-lg shadow-md transition-all mt-2">
            {loading ? 'Login...' : 'Login'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-sm text-center">Login berhasil!</div>}
        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">Belum punya akun?</span>{' '}
          <Link href="/lms/register" className="text-blue-600 hover:underline text-sm font-medium">Daftar</Link>
        </div>
      </section>
    </main>
  );
}
