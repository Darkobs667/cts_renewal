import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar({ toggleSidebar }) {
  const { user } = useAuth();
  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'A';
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Admin';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b
      border-slate-100 bg-white px-5 md:px-6">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg
            text-slate-500 transition hover:bg-slate-100 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>

        {/* Live badge */}
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200
          bg-slate-50 px-3 py-1.5 md:flex">
          <span className="status-dot-live" />
          <span className="text-[10px] font-semibold text-slate-500 tracking-wide">
            Technologie · Sécurité · Innovation
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative flex h-8 w-8 items-center justify-center
          rounded-lg border border-slate-200 text-slate-500 transition
          hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800">
          <Bell size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full
            bg-red-500 ring-1 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User chip */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200
          bg-slate-50 px-3 py-1.5">
          <div className="avatar-initials h-6 w-6 text-[10px]">{initials}</div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">{fullName}</p>
            <p className="mt-0.5 text-[9px] font-semibold text-emerald-600">En ligne</p>
          </div>
        </div>
      </div>
    </header>
  );
}
