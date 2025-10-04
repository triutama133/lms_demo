import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const authLinks = (
    <div className="flex items-center gap-4">
      <Link href="/lms/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
        Masuk
      </Link>
      <Link href="/lms/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
        Daftar
      </Link>
    </div>
  );

  return (
    <>
      {/* Header */}
      <header className="w-full bg-white/95 backdrop-blur-sm shadow-sm border-b border-blue-100 fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/ilmi-logo.png"
                alt="ILMI LMS Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-xl font-bold text-gray-900">ILMI LMS</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Tentang</a>
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Fitur</a>
              <Link href="/lms/courses" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Kursus</Link>
            </nav>
            {authLinks}
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <Image
                  src="/ilmi-logo.png"
                  alt="ILMI LMS"
                  width={120}
                  height={120}
                  className="rounded-2xl shadow-lg"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Learning Management System
                <span className="block text-blue-600">ILMI</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Platform pembelajaran modern untuk pengembangan kompetensi profesional.
                Tingkatkan skill Anda dengan materi interaktif, tracking progress, dan sertifikasi yang diakui.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/lms/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all text-lg transform hover:scale-105">
                  Mulai Belajar Sekarang
                </Link>
                <Link href="/lms/courses" className="text-blue-600 hover:text-blue-800 font-semibold text-lg transition-colors">
                  Jelajahi Kursus →
                </Link>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Belajar Terstruktur</h3>
                <p className="text-gray-600">Kurikulum yang dirancang oleh para ahli untuk hasil maksimal</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">�</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">Pantau perkembangan belajar Anda secara real-time</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">�</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sertifikasi</h3>
                <p className="text-gray-600">Dapatkan sertifikat yang meningkatkan nilai karir Anda</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Tentang ILMI LMS</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              ILMI Learning Management System adalah platform pembelajaran digital yang dirancang khusus untuk
              memfasilitasi pengembangan kompetensi profesional di era industri 4.0. Dengan teknologi terkini
              dan kurikulum yang relevan, kami membantu individu dan organisasi mencapai tujuan pembelajaran mereka.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">🎓 Untuk Peserta</h3>
                <ul className="text-blue-800 space-y-2">
                  <li>• Akses materi 24/7 dari mana saja</li>
                  <li>• Pembelajaran interaktif dan engaging</li>
                  <li>• Tracking progress otomatis</li>
                  <li>• Sertifikat digital terverifikasi</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">👨‍🏫 Untuk Instruktur</h3>
                <ul className="text-purple-800 space-y-2">
                  <li>• Tools lengkap untuk membuat kursus</li>
                  <li>• Analytics peserta detail</li>
                  <li>• Manajemen konten yang mudah</li>
                  <li>• Monetisasi kursus Anda</li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Siap Memulai Perjalanan Belajar Anda?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Bergabunglah dengan komunitas pembelajar profesional dan tingkatkan kompetensi Anda hari ini.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/lms/register" className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-gray-50 transition-colors">
                Daftar Sekarang
              </Link>
              <Link href="/lms/login" className="border-2 border-white text-white font-semibold py-4 px-8 rounded-xl hover:bg-white hover:text-blue-600 transition-colors">
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <Image
                  src="/ilmi-logo.png"
                  alt="ILMI LMS"
                  width={40}
                  height={40}
                  className="rounded"
                />
                <div>
                  <div className="text-lg font-bold">ILMI LMS</div>
                  <div className="text-sm text-gray-400">Learning Management System</div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-400 text-sm">
                  &copy; 2025 ILMI LMS. Platform pembelajaran modern untuk era digital.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Visi: Membantu generasi muda siap berkarir di era digital
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
