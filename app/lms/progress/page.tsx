"use client";
import Link from 'next/link';

export default function ProgressPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
      <section className="max-w-2xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">Tracking Progress</h1>
        <div className="text-center text-gray-600 mb-8">
          Fitur tracking progress akan segera hadir!
        </div>
        <div className="text-center">
          <Link href="/lms/dashboard" className="text-blue-600 hover:underline font-semibold">Kembali ke Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
