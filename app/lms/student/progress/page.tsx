"use client";
import Link from 'next/link';
import StudentHeader from '../../../components/StudentHeader';

const mockMilestones = [
  { title: 'Mulai Course', description: 'Menyelesaikan onboarding dan memahami tujuan belajar.', status: 'complete', date: '12 Mei' },
  { title: 'Progress 50%', description: 'Sudah menyelesaikan setengah materi utama.', status: 'active', date: '20 Mei' },
  { title: 'Sertifikasi', description: 'Siapkan catatan untuk presentasi akhir.', status: 'upcoming', date: '28 Mei' },
];

export default function ProgressPage() {
  const completed = mockMilestones.filter((m) => m.status === 'complete').length;
  const total = mockMilestones.length;
  const completionPercent = Math.round((completed / total) * 100);

  return (
    <>
      <StudentHeader />
      <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-100 px-4 pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl">
            <div className="grid gap-8 p-8 md:grid-cols-[1.6fr,1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-400">Learning Tracker</p>
                <h1 className="mt-3 text-3xl font-bold text-purple-900 md:text-4xl">Progress belajarmu terlihat apik! Pertahankan ritmenya.</h1>
                <p className="mt-3 text-sm text-slate-600 md:text-base">
                  Gunakan halaman ini untuk melihat milestone, catatan penting, dan target mingguan. Tandai materi sebagai selesai agar progress bar terus bergerak.
                </p>
                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
                  <Link href="/lms/student/courses" className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-purple-700">Lanjutkan Course</Link>
                  <Link href="/lms/student/materials" className="rounded-xl border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50">Catatan Materi</Link>
                </div>
              </div>
              <div className="rounded-3xl border border-purple-100 bg-purple-50/70 p-6">
                <h2 className="text-sm font-semibold text-purple-700">Progress Keseluruhan</h2>
                <p className="mt-2 text-xs text-slate-500">Total milestone yang sudah kamu capai.</p>
                <div className="mt-6 flex items-center gap-5">
                  <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow">
                    <span className="text-xl font-bold text-purple-700">{completionPercent}%</span>
                    <span className="absolute inset-0 rounded-full border-4 border-transparent" style={{ borderTopColor: '#7c3aed', transform: `rotate(${completionPercent / 100 * 360}deg)` }} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Milestone</p>
                    <p className="text-sm font-semibold text-purple-800">{completed} dari {total} selesai</p>
                    <p className="text-xs text-slate-500">Capai semua milestone untuk memperoleh sertifikat penyelesaian.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-[1.6fr,1fr]">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md">
              <h2 className="text-lg font-semibold text-blue-800">Milestone Perjalanan</h2>
              <p className="mt-2 text-sm text-slate-500">Pantau tahapan belajar yang sudah dan akan kamu tempuh.</p>
              <div className="mt-6 space-y-4">
                {mockMilestones.map((item, index) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${item.status === 'complete' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : item.status === 'active' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                        {index + 1}
                      </span>
                      {index !== mockMilestones.length - 1 && <span className="h-full w-px bg-gradient-to-b from-slate-200 to-transparent" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-blue-900">{item.title}</h3>
                        <span className="text-[11px] text-slate-400">{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow">
                <h3 className="text-sm font-semibold text-blue-800">Target Mingguan</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li>• Selesaikan 2 materi communication skill</li>
                  <li>• Ikuti sesi mentoring hari Kamis</li>
                  <li>• Buat ringkasan untuk modul leadership</li>
                </ul>
                <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700">Kelola Target</button>
              </div>
              <div className="rounded-3xl border border-purple-100 bg-purple-50/70 p-6 shadow">
                <h3 className="text-sm font-semibold text-purple-800">Catatan Pribadi</h3>
                <p className="mt-2 text-xs text-slate-500">Catat insight penting saat belajar agar mudah direview.</p>
                <button className="mt-4 rounded-xl border border-purple-200 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50">Buka Catatan</button>
              </div>
            </aside>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-md text-center text-sm text-slate-500">
            Butuh bantuan? Hubungi mentor atau tim support kami melalui menu chat untuk mendapatkan saran belajar personal.
          </section>
        </div>
      </main>
    </>
  );
}
