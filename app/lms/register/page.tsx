
"use client";

import Link from 'next/link';
import { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', provinsi: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Get captcha token
    const token = recaptchaRef.current?.getValue();
    if (!token) {
      setError('Please complete the captcha verification.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captchaToken: token }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setForm({ name: '', email: '', password: '', provinsi: '' });
        // Reset captcha
        recaptchaRef.current?.reset();
        setCaptchaVerified(false);
      } else {
        setError(data.error || 'Gagal mendaftar.');
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
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-sm text-center">Pendaftaran berhasil! Silakan cek email untuk verifikasi.</div>}
        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">Sudah punya akun?</span>{' '}
          <Link href="/lms/login" className="text-blue-600 hover:underline text-sm font-medium">Login</Link>
        </div>
      </section>
    </main>
  );
}
