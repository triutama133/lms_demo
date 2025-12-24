"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Captcha from '../../components/Captcha';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', provinsi: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Track hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Password criteria checks (computed on render for real-time feedback)
  const pw = form.password || '';
  const pwChecks = {
    min: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate captcha (basic check)
    if (!captchaValue || captchaValue.length < 4) {
      setError('Captcha belum diisi dengan benar.');
      setLoading(false);
      return;
    }

    // Validate password requirements: min 8, upper, lower, number, special
    const pw = form.password || '';
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwRegex.test(pw)) {
      setError('Password harus minimal 8 karakter, berisi huruf besar, huruf kecil, angka, dan karakter spesial.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captcha: captchaValue }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setForm({ name: '', email: '', password: '', provinsi: '' });
        // Reset captcha
        setCaptchaValue('');
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Gagal register');
        // Reset captcha on error
        setCaptchaValue('');
      }
    } catch {
      setError('Terjadi kesalahan.');
      // Reset captcha on error
      setCaptchaValue('');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 flex flex-col items-center justify-center px-4 pt-24">
      <section className="max-w-md w-full bg-white/90 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">Daftar Akun Baru</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" id="name" name="name" required value={form.name} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700 mb-1">Provinsi Domisili</label>
            <select id="provinsi" name="provinsi" required value={form.provinsi} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="password" name="password" required value={form.password} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <p className="mt-2 text-sm text-gray-600">Password harus minimal 8 karakter dan mengandung: huruf besar, huruf kecil, angka, dan karakter spesial.</p>

            {mounted && (
              <ul className="mt-2 grid grid-cols-1 gap-1 text-sm">
                <li className="flex items-center gap-2 text-gray-600">
                  {pwChecks.min ? (
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879A1 1 0 003.293 11.293l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg>
                  )}
                  <span className={pwChecks.min ? 'text-gray-800' : ''}>Minimal 8 karakter</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  {pwChecks.upper ? (
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879A1 1 0 003.293 11.293l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg>
                  )}
                  <span className={pwChecks.upper ? 'text-gray-800' : ''}>Mengandung huruf besar (A-Z)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  {pwChecks.lower ? (
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879A1 1 0 003.293 11.293l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg>
                  )}
                  <span className={pwChecks.lower ? 'text-gray-800' : ''}>Mengandung huruf kecil (a-z)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  {pwChecks.number ? (
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879A1 1 0 003.293 11.293l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg>
                  )}
                  <span className={pwChecks.number ? 'text-gray-800' : ''}>Mengandung angka (0-9)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  {pwChecks.special ? (
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879A1 1 0 003.293 11.293l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg>
                  )}
                  <span className={pwChecks.special ? 'text-gray-800' : ''}>Mengandung karakter spesial (contoh: !@#$%)</span>
                </li>
              </ul>
            )}
          </div>

          <Captcha onChange={setCaptchaValue} />

          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 rounded-lg shadow-md transition-all mt-2 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mendaftar...
              </>
            ) : (
              'Daftar'
            )}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-sm text-center">Pendaftaran berhasil! Mengarahkan ke halaman login...</div>}
        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">Sudah punya akun?</span>{' '}
          <Link href="/login" className="text-blue-600 hover:underline text-sm font-medium">Login</Link>
        </div>
      </section>
    </main>
  );
}
