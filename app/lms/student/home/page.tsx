import Link from 'next/link';
import StudentHeader from '../../../components/StudentHeader';

export default function Home() {
  const authLinks = (
    <div className="flex items-center gap-3">
      <Link href="/lms/register" className="text-blue-700 hover:underline font-medium">Register</Link>
      <Link href="/lms/login" className="text-blue-700 hover:underline font-medium">Login</Link>
    </div>
  );
  return (
    <>
      <StudentHeader rightSlot={authLinks} />
      <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex flex-col items-center justify-center px-4 pt-24">
        <section className="max-w-2xl w-full text-center py-12">
          <h1 className="text-5xl font-extrabold text-blue-700 mb-4 drop-shadow-lg">Level Up Your Career!</h1>
          <p className="text-lg text-gray-700 mb-8">
            Platform LMS modern untuk pengembangan <span className="font-semibold text-purple-600">soft skill</span> dan karir profesional. Dapatkan materi, mentoring, dan tracking progress belajar secara interaktif.
          </p>
          <div className="flex flex-col gap-4 items-center">
            <Link href="/lms/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all text-xl">
              Daftar Sekarang
            </Link>
            <Link href="/lms/login" className="text-blue-600 hover:underline text-base font-medium">
              Sudah punya akun? Login
            </Link>
          </div>
        </section>
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <span className="text-3xl mb-2">💡</span>
            <h2 className="font-bold text-lg mb-1">Materi Soft Skill</h2>
            <p className="text-gray-600 text-sm">Kurikulum terstruktur untuk komunikasi, leadership, problem solving, dan lainnya.</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <span className="text-3xl mb-2">👨‍🏫</span>
            <h2 className="font-bold text-lg mb-1">Mentoring & Komunitas</h2>
            <p className="text-gray-600 text-sm">Belajar bersama mentor dan komunitas, diskusi, serta networking karir.</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <span className="text-3xl mb-2">📈</span>
            <h2 className="font-bold text-lg mb-1">Tracking Progress</h2>
            <p className="text-gray-600 text-sm">Pantau perkembangan belajar dan raih sertifikat untuk portofolio karir.</p>
          </div>
        </section>
        {/* Footer About */}
        <footer className="w-full bg-white/90 shadow-inner py-3 px-4 fixed bottom-0 left-0 z-10 flex flex-col md:flex-row items-center justify-between text-center md:text-left border-t border-blue-100 text-xs">
          <div>
            <h2 className="text-base font-semibold text-blue-700 mb-0.5">Tentang LMS Demo</h2>
            <p className="text-gray-700 mb-0.5">
              LMS Demo adalah platform pembelajaran modern untuk pengembangan soft skill dan karir profesional. Versi MVP — fitur utama: akses materi.
            </p>
          </div>
          <div className="text-gray-600 mt-1 md:mt-0">
            Kontak: <span className="font-medium">info@lmsdemo.com</span> | Visi: <span className="italic">Membantu generasi muda siap berkarir</span>
          </div>
        </footer>
      </main>
    </>
  );
}
