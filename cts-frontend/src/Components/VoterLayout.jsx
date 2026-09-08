import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import Logocts from "../assets/logo-cts2-removebg-preview.png";
import { LayoutDashboard, CheckCircle, LogOut, Menu, X, Vote } from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; // ← IMPORTANT : utiliser useAuth

/* ── nav item ── */
const NavItem = ({ item, isActive }) => (
  <Link
    to={item.to || '#'}
    className={`relative flex items-center gap-3.5 mx-3 px-4 py-3 rounded-2xl
      transition-all duration-200 group ${
      isActive
        ? 'bg-emerald-50 text-emerald-600'
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
    }`}
  >
    {/* active pill */}
    {isActive && (
      <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full
        shadow-[2px_0_10px_rgba(16,185,129,0.35)]" />
    )}

    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
      isActive
        ? 'bg-white shadow-sm shadow-emerald-100'
        : 'group-hover:bg-white group-hover:shadow-sm'
    }`}>
      <item.icon
        size={15}
        className={isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'}
      />
    </div>

    <span className="text-[11px] font-[900] leading-tight">{item.label}</span>
  </Link>
);

const VoterLayout = ({ children, activePage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // ← UTILISER useAuth au lieu de getConnectedUser
  const { user, loading, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard',        label: 'Tableau de bord',            icon: LayoutDashboard, to: '/voterDashboard' },
    { id: 'scrtins & postes', label: 'Postes disponibles', icon: Vote,         to: '/scrutins'      },
    { id: 'votes',            label: 'Mes Votes',                  icon: CheckCircle,     to: '/voterHistory'  },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsSidebarOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  // Données utilisateur sécurisées (viennent du serveur, pas du localStorage modifiable)
  const userFullName = user ? `${user.first_name} ${user.last_name}` : 'Chargement...';
  const userInitials = user ? `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase() : '??';
  const userRole = user?.role === 'admin' ? 'Administrateur' : 'Électeur';

  // La vérification de session reste silencieuse pour ne pas interrompre le parcours.
  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ── mobile backdrop ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100
          flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* logo */}
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
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activePage === item.id || location.pathname === item.to}
            />
          ))}
        </nav>

        {/* user mini-card (sécurisé) */}
        <div className="px-4 py-3 mx-3 mb-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm
              flex items-center justify-center font-[900] text-slate-400 text-xs shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-[900] text-slate-800 truncate leading-tight">
                {userFullName}
              </p>
              <p className="text-[9px] font-bold text-emerald-500 mt-0.5">{userRole}</p>
            </div>
          </div>
        </div>

        {/* logout */}
        <div className="px-3 pb-4 border-t border-slate-50 pt-3">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl
              text-red-400 hover:bg-red-50 hover:text-red-500
              transition-all duration-200 active:scale-95 group disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0
              group-hover:bg-red-100 transition-colors">
              <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] font-[900]">
              {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
            </span>
          </button>
        </div>
      </aside>

      {/* ── main ── */}
      <div className="md:pl-64 flex flex-col min-h-screen">

        {/* topbar */}
        <header className="h-16 px-5 md:px-8 flex items-center justify-between sticky top-0
          bg-white border-b border-slate-100 z-40">

          {/* left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 bg-slate-50 rounded-xl border border-slate-100
                text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Menu size={18} />
            </button>

            {/* live badge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100
              px-4 py-2 rounded-2xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-black text-slate-400 tracking-wide">
                Technologie-Sécurité-Innovation
              </span>
            </div>
          </div>

          {/* right — user chip (sécurisé) */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-[900] text-slate-900 leading-tight">
                {userFullName}
              </p>
              <p className="text-[9px] font-bold text-emerald-500 mt-0.5">
                {userRole}
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200
              flex items-center justify-center font-[900] text-slate-500 text-xs shrink-0">
              {userInitials}
            </div>
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default VoterLayout;
