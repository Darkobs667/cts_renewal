import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Vote, CheckCircle2, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logocts from '../assets/logo-cts2-removebg-preview.png';

const MENU = [
  { id: 'dashboard', to: '/voterDashboard', label: 'Tableau de bord',   icon: LayoutDashboard },
  { id: 'scrutins',  to: '/scrutins',       label: 'Postes disponibles', icon: Vote            },
  { id: 'votes',     to: '/voterHistory',   label: 'Mes votes',          icon: CheckCircle2    },
];

function NavItem({ item, active }) {
  return (
    <Link
      to={item.to}
      className={`relative mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5
        text-xs font-semibold transition-all duration-150 group ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-emerald-500" />
      )}
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
        transition-colors ${
        active
          ? 'bg-emerald-100 text-emerald-600'
          : 'text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
      }`}>
        <item.icon size={14} strokeWidth={2} />
      </span>
      {item.label}
    </Link>
  );
}

export default function VoterLayout({ children, activePage }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout, loading } = useAuth();
  const [open, setOpen]           = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '?';
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Électeur';

  if (loading) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r
        border-slate-100 bg-white transition-transform duration-300
        md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            <img src={Logocts} alt="CTS" className="h-8 w-8 object-contain mix-blend-multiply" />
            <div className="leading-none">
              <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">
                Cyber Tech
              </span>
              <span className="block text-xs font-black uppercase text-emerald-600">
                Squad
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg
              text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-5 pb-2">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            Menu
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto pb-4">
          {MENU.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activePage === item.id || location.pathname === item.to}
            />
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-100 p-3 space-y-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="avatar-initials h-8 w-8 text-[11px] shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">{fullName}</p>
              <p className="text-[9px] font-semibold text-emerald-600">Électeur</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs
              font-semibold text-slate-500 transition-all
              hover:bg-red-50 hover:text-red-600 active:scale-[0.98]
              disabled:opacity-60 group"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
              bg-slate-100 group-hover:bg-red-100 transition-colors">
              <LogOut size={13} />
            </span>
            {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b
          border-slate-100 bg-white px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg
                text-slate-500 hover:bg-slate-100 transition md:hidden"
            >
              <Menu size={18} />
            </button>
            {/* Live badge */}
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200
              bg-slate-50 px-3 py-1.5 md:flex">
              <span className="status-dot-live" />
              <span className="text-[10px] font-semibold text-slate-500 tracking-wide">
                Session sécurisée
              </span>
            </div>
          </div>

          {/* User chip */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200
            bg-slate-50 px-3 py-1.5">
            <div className="avatar-initials h-6 w-6 text-[10px]">{initials}</div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{fullName}</p>
              <p className="mt-0.5 text-[9px] font-semibold text-emerald-600">Électeur</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-5 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
