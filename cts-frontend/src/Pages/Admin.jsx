import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Users, CheckCircle2, Clock, TrendingUp,
  ArrowRight, Vote, Calendar, RefreshCw,
} from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import StatCard from '../Components/StatCard';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import adminService from '../services/adminService';
import api from '../services/api';

/* ── Election row (dashboard admin) ── */
function ElectionRow({ election }) {
  const active = election.is_active == 1 || election.statut === 'Actif';
  return (
    <div className={`election-card ${active ? 'election-card-active' : ''}`}>
      <div className="election-card-header">
        <div className={`election-card-icon ${active ? 'election-card-icon-active' : 'election-card-icon-inactive'}`}>
          <Vote size={16} strokeWidth={2} />
        </div>
        <div className="election-card-body">
          <p className="truncate text-sm font-semibold text-slate-900 leading-tight">
            {election.titre}
          </p>
          <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
            <Calendar size={9} />
            {new Date(election.date_fin).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge ${active ? 'badge-green' : 'badge-slate'}`}>
            {active ? <><span className="status-dot-live" />En ligne</> : 'Inactif'}
          </span>
          <Link
            to="/votes-elections"
            className="flex items-center gap-1 rounded-lg border border-slate-200
              bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-500
              hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700
              transition-all group"
          >
            Voir
            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalInscrits: 0, votesClotures: 0, votesEnCours: 0, participation: 0,
  });
  const [elections, setElections] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);

  const load = async (soft = false) => {
    if (soft) setSyncing(true); else setLoading(true);
    try {
      const [sRes, eRes] = await Promise.all([
        adminService.getStats(),
        api.get('/positions'),
      ]);
      if (sRes.data?.data) setStats(sRes.data.data);
      if (eRes.data?.success) {
        const all = [...(eRes.data.data || [])];
        all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setElections(
          all.slice(0, 5).map((p) => ({
            id:       p.id,
            titre:    p.title,
            statut:   p.is_active == 1 ? 'Actif' : 'Inactif',
            is_active: p.is_active,
            date_fin: p.created_at,
            description: p.description,
          }))
        );
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 120_000);
    return () => clearInterval(id);
  }, []);

  const CARDS = [
    {
      label: 'Électeurs inscrits',
      value: stats.totalInscrits.toLocaleString('fr-FR'),
      icon: Users,
      accent: 'bg-emerald-500',
    },
    {
      label: 'Votes clôturés',
      value: stats.votesClotures,
      icon: CheckCircle2,
      accent: 'bg-blue-500',
    },
    {
      label: 'Scrutins en cours',
      value: stats.votesEnCours,
      icon: Clock,
      accent: 'bg-amber-500',
    },
    {
      label: 'Participation',
      value: `${stats.participation}%`,
      icon: TrendingUp,
      accent: 'bg-violet-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-xl font-black text-slate-900">Tableau de bord</h1>
            <p className="mt-0.5 text-xs text-slate-500">Vue d'ensemble de la plateforme</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={syncing}
            className="btn-secondary gap-1.5"
            aria-label="Actualiser"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-fade-up delay-50">
          {CARDS.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>

        {/* Body */}
        <div className="grid gap-5 xl:grid-cols-[1fr_280px] animate-fade-up delay-100">

          {/* Scrutins récents */}
          <div className="content-card">
            <div className="content-card-header">
              <div>
                <p className="text-sm font-bold text-slate-800">Scrutins récents</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {elections.length} derniers scrutins
                </p>
              </div>
              <Link
                to="/votes-elections"
                className="flex items-center gap-1 text-[11px] font-semibold
                  text-emerald-600 hover:text-emerald-700 group"
              >
                Tout voir
                <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="p-4 space-y-2">
              {loading ? (
                <Loading text="Chargement…" className="py-10" />
              ) : elections.length === 0 ? (
                <EmptyState
                  icon={Vote}
                  title="Aucun scrutin"
                  description="Créez votre premier scrutin."
                />
              ) : (
                elections.map((el) => <ElectionRow key={el.id} election={el} />)
              )}            </div>
          </div>

          {/* Pilotage rapide */}
          <div className="content-card p-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Pilotage</p>
              <p className="mt-0.5 text-xs text-slate-400">Activité en temps réel</p>
            </div>

            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700">En cours</p>
                <p className="mt-1 text-3xl font-black text-emerald-800 tabular-nums">
                  {stats.votesEnCours}
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-600">scrutins ouverts</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-600">Participation</p>
                <p className="mt-1 text-3xl font-black text-slate-800 tabular-nums">
                  {stats.participation}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.min(Number(stats.participation), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              to="/votes-elections"
              className="btn-primary w-full justify-center text-xs py-2.5"
            >
              Gérer les scrutins
              <ArrowRight size={13} />
            </Link>

            <p className="text-[10px] text-slate-400 text-center">
              Mise à jour automatique toutes les 2 min.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
