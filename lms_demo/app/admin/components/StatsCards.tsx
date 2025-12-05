interface StatsCardsProps {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  roleSummary: {
    admin: number;
    teacher: number;
    student: number;
  };
}

export default function StatsCards({ totalUsers, totalCourses, totalEnrollments, roleSummary }: StatsCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase text-slate-500">Total User</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">{totalUsers}</p>
        <p className="mt-2 text-xs text-slate-500">Admin {roleSummary.admin} · Teacher {roleSummary.teacher} · Student {roleSummary.student}</p>
      </div>
      <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase text-slate-500">Total Course</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">{totalCourses}</p>
        <p className="mt-2 text-xs text-slate-500">Kelola kurikulum dan materi untuk setiap course aktif.</p>
      </div>
      <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase text-slate-500">Total Enrollment</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">{totalEnrollments}</p>
        <p className="mt-2 text-xs text-slate-500">Akumulasi peserta dari seluruh course berjalan.</p>
      </div>
    </section>
  );
}