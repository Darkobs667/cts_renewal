import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import AdminLayout from '../Components/AdminLayout';
import { Users, Vote, CheckCircle, Clock, Loader2, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import adminService from '../services/adminService';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth'; // ← Ajouté pour sécurité (optionnel)
import StatCard from '../Components/StatCard';

/* ── Stat card ── */
const ModernStatCard = ({ delay, ...props }) => <div className="fade-up" style={{ animationDelay: delay }}><StatCard {...props} /></div>;

/* ── Election row (desktop) ── */
const ElectionRow = ({ election, index }) => {
  const isActive = election.statut === 'Actif';
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/5 fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}><Vote size={20} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Scrutin</p>
          <h4 className="mt-1 break-words text-base font-black leading-snug text-slate-900">{election.titre}</h4>
          <p className="mt-1 line-clamp-2 max-w-2xl break-words text-[11px] font-medium leading-relaxed text-slate-500">{election.description || 'Aucune description renseignée pour ce scrutin.'}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400"><Calendar size={12} /> Créé le {new Date(election.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Actif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            Inactif
          </span>
        )}
        <Link
          to="/votes-elections"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 group/link"
        >
          Détails
          <ArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
};

/* ── Main page ── */
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInscrits: 0,
    votesClotures: 0,
    votesEnCours: 0,
    participation: '0',
  });
  const [recentElections, setRecentElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Optionnel : pour vérifier que l'utilisateur est bien admin
  const { isAdmin, loading: authLoading } = useAuth();

  // Si l'utilisateur n'est pas admin, on ne charge rien (déjà protégé par ProtectedRoute)
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      console.warn("Tentative d'accès admin non autorisée");
    }
  }, [isAdmin, authLoading]);

  const fetchStats = async () => {
    try {
      const response = await adminService.getStats();
      if (response.data && response.data.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats :", error);
    }
  };

  const fetchRecentElections = async () => {
    try {
      const response = await api.get('/positions');
      if (response.data && response.data.success) {
        const all = [...(response.data.data || []), ...(response.data.failed || [])];
        all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const recent = all.slice(0, 4).map((election) => ({
          id: election.id,
          titre: election.title,
          statut: election.is_active == 1 ? 'Actif' : 'Inactif',
          date_fin: election.created_at,
          description: election.description,
        }));
        setRecentElections(recent);
      }
    } catch (error) {
      console.error("Erreur chargement scrutins récents :", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchRecentElections()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Électeurs inscrits',    value: stats.totalInscrits.toLocaleString(), icon: Users,       accent: 'bg-emerald-500 shadow-lg shadow-emerald-100', delay: '0ms'   },
    { label: 'Votes clôturés',        value: stats.votesClotures,                  icon: CheckCircle, accent: 'bg-blue-500 shadow-lg shadow-blue-100',    delay: '60ms'  },
    { label: 'Votes en cours',        value: stats.votesEnCours,                   icon: Clock,       accent: 'bg-amber-500 shadow-lg shadow-amber-100',   delay: '120ms' },
    { label: 'Taux de participation', value: `${stats.participation}%`,            icon: TrendingUp,  accent: 'bg-purple-500 shadow-lg shadow-purple-100', delay: '180ms' },
  ];

  return (
    <AdminLayout>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .42s ease both; }
      `}</style>

      <div className="max-w-5xl mx-auto animate-in fade-in duration-500">

        <div className="flex flex-col justify-between gap-4 mb-8 sm:flex-row sm:items-end fade-up">
          <div>
            <h2 className="text-xl md:text-2xl font-[900] text-slate-900">Tableau de bord</h2>
            <p className="text-slate-400 font-medium text-xs mt-1">Vue d'ensemble de la plateforme</p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="animate-spin text-emerald-500" size={16} />
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">
                Actualisation…
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-8">
          {statCards.map((s, i) => (
            <ModernStatCard key={i} {...s} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] fade-up" style={{ animationDelay: '240ms' }}>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-7 py-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-[900] text-slate-900">
                Scrutins récents
                {recentElections.length > 0 && (
                  <span className="ml-2 text-[9px] font-black text-slate-300">
                    ({recentElections.length})
                  </span>
                )}
              </h3>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                Dernières élections enregistrées
              </p>
            </div>
            <Link
              to="/votes-elections"
              className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600
                hover:text-emerald-700 transition-colors group"
            >
              Voir tout
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 p-4">
            {isLoading && recentElections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-[9px] font-black text-slate-300 tracking-widest uppercase animate-pulse">
                  Chargement…
                </p>
              </div>
            ) : recentElections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-[22px] border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
                  <Vote size={22} className="text-slate-200" />
                </div>
                <p className="text-slate-400 font-black text-sm">Aucune élection</p>
                <p className="text-slate-300 font-bold text-[10px] mt-1">
                  Aucune élection enregistrée pour le moment
                </p>
              </div>
            ) : (
              <>
                <div className="md:hidden space-y-3 p-2">
                  {recentElections.map((election, i) => {
                    const isActive = election.statut === 'Actif';
                    return (
                      <div
                        key={election.id}
                        className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 fade-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="font-black text-sm text-slate-800 leading-tight">{election.titre}</span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black bg-slate-100 text-slate-400 shrink-0">
                              Inactif
                            </span>
                          )}
                        </div>
                        <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{election.description || 'Aucune description renseignée pour ce scrutin.'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(election.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <Link to="/votes-elections" className="text-emerald-500 font-black text-[10px] flex items-center gap-1">
                            Détails <ArrowRight size={10} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:contents">
                  {recentElections.map((election, i) => (
                    <ElectionRow key={election.id} election={election} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Pilotage rapide</h3>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">L’essentiel de l’activité électorale en un coup d’œil.</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3.5"><p className="text-[10px] font-bold text-emerald-700">Scrutins en cours</p><p className="mt-1 text-2xl font-black text-emerald-800">{stats.votesEnCours}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"><p className="text-[10px] font-bold text-slate-500">Participation globale</p><p className="mt-1 text-2xl font-black text-slate-800">{stats.participation}%</p></div>
          </div>
          <Link to="/votes-elections" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[11px] font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">Gérer les scrutins <ArrowRight size={13} /></Link>
          <div className="mt-5 border-t border-slate-100 pt-4 text-[10px] leading-relaxed text-slate-400"><span className="font-bold text-slate-600">Mise à jour automatique.</span> Les données sont actualisées toutes les deux minutes.</div>
        </aside>
        </div>

      </div>
    </AdminLayout>
  );
};

export default Dashboard;
