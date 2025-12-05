interface TabNavigationProps {
  activeTab: 'users' | 'courses' | 'categories';
  onTabChange: (tab: 'users' | 'courses' | 'categories') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-1 py-1 shadow-sm">
        <button
          type="button"
          onClick={() => onTabChange('users')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600'}`}
        >Manajemen User</button>
        <button
          type="button"
          onClick={() => onTabChange('courses')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${activeTab === 'courses' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-purple-600'}`}
        >Manajemen Course</button>
        <button
          type="button"
          onClick={() => onTabChange('categories')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${activeTab === 'categories' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-emerald-600'}`}
        >Kategori</button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 shadow-sm md:max-w-sm">
        Gunakan tab untuk berpindah antar manajemen. Setiap aksi dilengkapi tooltip dan hint agar lebih cepat dipahami.
      </div>
    </div>
  );
}