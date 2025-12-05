"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TutorDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Legacy route — redirect to new teacher dashboard
    router.replace('/teacher/dashboard');
  }, [router]);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Halaman dipindahkan</h2>
        <p className="mt-2 text-gray-600">Anda akan diarahkan ke Teacher Dashboard...</p>
      </div>
    </main>
  );
}
