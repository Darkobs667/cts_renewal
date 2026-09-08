// ─────────────────────────────────────────────────────────────
// Navbar.jsx
// ─────────────────────────────────────────────────────────────
import { Menu, Bell } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between
      px-4 md:px-8 sticky top-0 z-30">

      {/* left */}
      <div className="flex items-center gap-4">
        {/* burger */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* live badge */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black text-slate-400 tracking-wide">
            Technologie-Sécurité-Innovation
          </span>
        </div>
      </div>

      {/* right */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center
          text-slate-400 hover:text-emerald-500 hover:bg-slate-50
          rounded-2xl border border-slate-100 transition-all duration-200">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* user chip */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-100">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-[900] text-slate-900 leading-tight">Admin CTS</p>
            <p className="text-[9px] font-bold text-emerald-500">En ligne</p>
          </div>
          {/* avatar */}
          <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-black text-slate-500">A</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;