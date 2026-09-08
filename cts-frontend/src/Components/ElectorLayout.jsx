import React, { useState } from 'react';
import { LayoutDashboard, CheckCircle, User, LogOut, Menu, X } from 'lucide-react';

// Sidebar Item réutilisable avec style dynamique (Mobile-first)
const SidebarItem = ({ icon: Icon, label, active }) => (
  <button className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}>
    <Icon size={18} />
    {label}
  </button>
);

const ElectorLayout = ({ children, activePage = 'dashboard' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans"> {/* Utilise --font-sans Poppins définie en v4 */}
      {/* Sidebar - Mobile-first Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white p-6 flex flex-col gap-10 border-r border-slate-100 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex justify-between items-center md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-100">CTS</div>
            <span className="font-black tracking-tighter uppercase text-sm">CyberTech<span className="text-emerald-500">Squad</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 md:hidden hover:text-red-500"><X /></button>
        </div>

        <nav className="flex-1 space-y-3">
          <SidebarItem icon={LayoutDashboard} label="Tableau de bord" active={activePage === 'dashboard'} />
          <SidebarItem icon={CheckCircle} label="Mes Votes" active={activePage === 'votes'} />
          <SidebarItem icon={User} label="Profil" active={activePage === 'profile'} />
        </nav>

        <button className="flex items-center gap-3 p-4 text-red-400 font-bold text-xs uppercase tracking-widest mt-auto border-t border-slate-50 pt-6 active:scale-95 transition-transform">
          <LogOut size={18} />
          Déconnexion
        </button>
      </aside>

      {/* Main Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header commun */}
        <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 p-6 md:px-12 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white rounded-xl text-slate-400 md:hidden border border-slate-100"><Menu /></button>
          
          <h1 className="hidden md:block text-xs font-black text-slate-900 uppercase tracking-[0.2em]">electionName</h1>

          <div className="flex items-center gap-4 bg-white p-1.5 pr-6 rounded-full shadow-sm border border-slate-100 group cursor-pointer hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-400 uppercase font-black text-sm shadow-inner">MD</div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-800 leading-none">Marc Dupon</p>
              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Électeur</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ElectorLayout;