// ─────────────────────────────────────────────────────────────
// Sidebar.jsx
// ─────────────────────────────────────────────────────────────
import { LayoutDashboard, Users, Vote, ExternalLink, LogOut, ChartPie, MailOpen, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import Logocts from "../assets/logo-cts2-removebg-preview.png";
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const SidebarItem = ({ icon: Icon, label, to, active }) => (
  <Link
    to={to}
    className={`relative flex items-center gap-3.5 mx-3 px-4 py-3 rounded-2xl
      transition-all duration-200 group ${
      active
        ? 'bg-emerald-50 text-emerald-600'
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
    }`}
  >
    {/* active pill */}
    {active && (
      <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full shadow-[2px_0_10px_rgba(16,185,129,0.35)]" />
    )}

    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
      active ? 'bg-white shadow-sm shadow-emerald-100' : 'group-hover:bg-white group-hover:shadow-sm'
    }`}>
      <Icon size={15} className={active ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'} />
    </div>

    <span className="text-[11px] font-[900] leading-tight">{label}</span>
  </Link>
);

const Sidebar = ({ isOpen, toggle, activePage }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const adminMenuItems = [
    { id: 'dashboard',        label: 'Tableau de bord',         icon: LayoutDashboard, to: '/admin'            },
    { id: 'electeurs',        label: 'Électeurs',               icon: Users,           to: '/electeurs'        },
    { id: 'votes',            label: 'Scrutins ou postes',      icon: Vote,            to: '/votes-elections'  },
    { id: 'parametres',       label: 'Candidats & scrutins',    icon: ExternalLink,    to: '/candidats'        },
    { id: 'candidatures',     label: 'Gestions des candidatures', icon: MailOpen,      to: '/candidatures'     },
    { id: 'adminresultsPage', label: 'Résultats',               icon: ChartPie,        to: '/adminresultsPage' },
  ];

  return (
    <>
      {/* backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggle}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-50
          flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ── logo ── */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-3">
            <img src={Logocts} className="h-10 w-10 shrink-0 object-contain mix-blend-multiply" alt="logo cts" />
            <div className="leading-tight">
              <span className="block text-[9px] font-[900] uppercase text-slate-300 tracking-widest">
                Cyber Tech
              </span>
              <span className="block text-sm font-[900] uppercase text-emerald-500">
                Squad
              </span>
            </div>
          </div>
          <button className="lg:hidden p-2 text-slate-300 hover:text-slate-500 transition-colors" onClick={toggle}>
            <X size={20} />
          </button>
        </div>

        {/* ── nav ── */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {adminMenuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              to={item.to}
              active={activePage === item.id || location.pathname === item.to}
            />
          ))}
        </nav>

        {/* ── logout ── */}
        <div className="px-3 py-4 border-t border-slate-50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl
              text-red-400 hover:bg-red-50 hover:text-red-500
              transition-all duration-200 active:scale-95 group disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
              <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] font-[900]">
              {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
