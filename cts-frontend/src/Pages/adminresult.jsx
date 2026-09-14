import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BarChart2, Check, ChevronDown, Crown,
  FileDown, Filter, Radio, RefreshCw, Search,
  ShieldCheck, Users, X, XCircle,
} from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import api from '../services/api';

/* ─── Constantes filtre ─────────────────────────────────────────── */
const FILTER_ALL    = 'all';
const FILTER_OPEN   = 'open';
const FILTER_CLOSED = 'closed';

/* ─── LiveBadge ─────────────────────────────────────────────────── */
function LiveBadge({ refreshing }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200
      bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
      <span className="status-dot-live" />
      {refreshing ? 'Actualisation…' : 'Résultats en direct'}
    </span>
  );
}

/* ─── CandidateRow ──────────────────────────────────────────────── */
function CandidateRow({ candidate, index, totalVotes }) {
  const votes   = Number(candidate.votes_count || 0);
  const percent = totalVotes ? Math.round((votes / totalVotes) * 1000) / 10 : 0;
  const isFirst = index === 0 && votes > 0;

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${
      isFirst
        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white shadow-sm'
        : 'border-slate-100 bg-white'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
          text-[10px] font-black ${
          isFirst ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
        }`}>
          {isFirst ? <Crown size={12} /> : index + 1}
        </span>

        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white bg-slate-100 shadow-sm">
          {(candidate.photo_path || candidate.photo_url)
            ? <img src={candidate.photo_url || candidate.photo_path} alt={candidate.name}
                className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-400">
                {candidate.name?.slice(0, 1)?.toUpperCase()}
              </div>
          }
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{candidate.name}</p>
          <p className="text-[10px] text-slate-400">{votes.toLocaleString('fr-FR')} voix</p>
        </div>

        <span className={`text-lg font-black tabular-nums ${
          isFirst ? 'text-emerald-700' : 'text-slate-500'
        }`}>
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            isFirst
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
              : 'bg-slate-300'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ─── ElectionCard ──────────────────────────────────────────────── */
function ElectionCard({ election, totalVoters, onClose }) {
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing,      setClosing]      = useState(false);

  const candidates   = [...(election.candidates || [])].sort(
    (a, b) => Number(b.votes_count || 0) - Number(a.votes_count || 0),
  );
  const totalVotes   = Number(election.total_votes || 0);
  const participation = totalVoters ? Math.round((totalVotes / totalVoters) * 100) : 0;
  const leader        = candidates[0];

  const closeElection = async () => {
    setClosing(true);
    try {
      await api.put(`/positions/${election.id}`, { is_active: false });
      await onClose();
    } finally { setClosing(false); setConfirmClose(false); }
  };

  return (
    <article className="content-card animate-fade-up">
      <ConfirmDialog
        isOpen={confirmClose} onClose={() => !closing && setConfirmClose(false)}
        onConfirm={closeElection} loading={closing} tone="danger"
        title="Clôturer ce scrutin ?"
        description={`Le scrutin « ${election.title} » ne recevra plus aucun vote.`}
        confirmLabel="Clôturer"
      />

      {/* Card header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`badge ${election.is_active ? 'badge-green' : 'badge-slate'}`}>
                {election.is_active
                  ? <><span className="status-dot-live" />Ouvert</>
                  : 'Clôturé'}
              </span>
              <span className="text-[10px] text-slate-400">
                {totalVotes.toLocaleString('fr-FR')} vote{totalVotes !== 1 ? 's' : ''}
                {' · '}
                {participation}% participation
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 leading-tight">{election.title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {leader?.votes_count > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-100
                bg-amber-50 px-3 py-2">
                <Crown size={13} className="text-amber-500" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-wider text-amber-600">
                    En tête
                  </p>
                  <p className="max-w-[8rem] truncate text-xs font-bold text-slate-800">
                    {leader.name}
                  </p>
                </div>
              </div>
            )}
            {election.is_active && (
              <button
                onClick={() => setConfirmClose(true)}
                className="btn-secondary text-red-600 hover:border-red-200 hover:bg-red-50 text-xs"
              >
                <XCircle size={13} />Clôturer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="results-card-body">
        {/* Candidates list */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Radio size={13} className="text-emerald-500" />
            <p className="text-sm font-bold text-slate-800">Classement des candidats</p>
          </div>
          {candidates.length ? (
            <div className="space-y-2">
              {candidates.map((c, i) => (
                <CandidateRow key={c.id} candidate={c} index={i} totalVotes={totalVotes} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 py-8
              text-center text-xs text-slate-400">
              Aucun candidat validé pour ce scrutin.
            </p>
          )}
        </div>

        {/* Participation sidebar */}
        <aside className="results-participation-aside">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
            Participation
          </p>
          <p className="mt-2 text-4xl font-black text-slate-900 tabular-nums">
            {participation}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600
                transition-all duration-1000"
              style={{ width: `${Math.min(participation, 100)}%` }}
            />
          </div>
          <div className="mt-4 space-y-2.5 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Votants</span>
              <span className="text-xs font-bold text-slate-800">
                {totalVotes.toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Inscrits</span>
              <span className="text-xs font-bold text-slate-800">
                {totalVoters.toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Candidats</span>
              <span className="text-xs font-bold text-slate-800">
                {candidates.length}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-white p-3">
            <ShieldCheck size={12} className="mt-0.5 shrink-0 text-emerald-500" />
            <p className="text-[10px] leading-relaxed text-slate-400">
              Résultats anonymisés et vérifiés côté serveur.
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

/* ─── MultiSelectDropdown ───────────────────────────────────────── */
function MultiSelectDropdown({ elections, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const allSelected     = selected.length === 0;

  // Fermer si clic dehors
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  const label = allSelected
    ? 'Tous les scrutins'
    : selected.length === 1
    ? elections.find((e) => e.id === selected[0])?.title ?? '1 scrutin'
    : `${selected.length} scrutins sélectionnés`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`results-filter-pill ${!allSelected ? 'results-filter-pill-active' : ''}`}
      >
        <Filter size={13} />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown
          size={13}
          className={`ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="results-dropdown animate-zoom-in">
          {/* Tout sélectionner */}
          <button
            type="button"
            onClick={() => onChange([])}
            className={`results-dropdown-item ${allSelected ? 'results-dropdown-item-active' : ''}`}
          >
            <span className={`results-dropdown-check ${allSelected ? 'opacity-100' : 'opacity-0'}`}>
              <Check size={11} strokeWidth={3} />
            </span>
            <span>Tous les scrutins</span>
            <span className="ml-auto text-[10px] text-slate-400">{elections.length}</span>
          </button>

          <div className="results-dropdown-divider" />

          {elections.map((el) => {
            const isSel = selected.includes(el.id);
            return (
              <button
                key={el.id}
                type="button"
                onClick={() => toggle(el.id)}
                className={`results-dropdown-item ${isSel ? 'results-dropdown-item-active' : ''}`}
              >
                <span className={`results-dropdown-check ${isSel ? 'opacity-100' : 'opacity-0'}`}>
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{el.title}</span>
                <span className={`badge ${el.is_active ? 'badge-green' : 'badge-slate'} ml-1`}>
                  {el.is_active ? 'Ouvert' : 'Clôturé'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────────── */
export default function AdminresultsPage() {
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [elections,      setElections]      = useState([]);
  const [totalVoters,    setTotalVoters]    = useState(0);
  const [lastRefresh,    setLastRefresh]    = useState(null);

  // Filtres
  const [statusFilter,   setStatusFilter]   = useState(FILTER_ALL);   // all | open | closed
  const [selectedIds,    setSelectedIds]    = useState([]);            // [] = tous
  const [searchQuery,    setSearchQuery]    = useState('');

  /* ── Chargement ── */
  const refresh = useCallback(async ({ initial = false } = {}) => {
    if (!initial) setRefreshing(true);
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/votes/results/all'),
        api.get('/admin/stats-globales'),
      ]);
      if (rRes.data?.success) setElections(rRes.data.data || []);
      if (sRes.data?.data)    setTotalVoters(Number(sRes.data.data.totalInscrits || 0));
      setLastRefresh(new Date());
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    refresh({ initial: true });
    const id = window.setInterval(() => refresh(), 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  /* ── Filtrage ── */
  const filtered = useMemo(() => {
    let list = elections;

    // Filtre statut
    if (statusFilter === FILTER_OPEN)   list = list.filter((e) => e.is_active);
    if (statusFilter === FILTER_CLOSED) list = list.filter((e) => !e.is_active);

    // Filtre multi-select scrutins
    if (selectedIds.length > 0) list = list.filter((e) => selectedIds.includes(e.id));

    // Filtre recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }

    return list;
  }, [elections, statusFilter, selectedIds, searchQuery]);

  /* ── Export PDF ── */
  const exportPdf = async () => {
    try {
      const res = await api.get('/votes/results/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = Object.assign(document.createElement('a'), {
        href: url, download: 'resultats-scrutins.pdf',
      });
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  /* ── KPI ── */
  const totalVotes  = elections.reduce((s, e) => s + Number(e.total_votes || 0), 0);
  const activeCount = elections.filter((e) => e.is_active).length;
  const hasFilters  = statusFilter !== FILTER_ALL || selectedIds.length > 0 || searchQuery.trim();

  const resetFilters = () => {
    setStatusFilter(FILTER_ALL);
    setSelectedIds([]);
    setSearchQuery('');
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-10">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
          <div>
            <LiveBadge refreshing={refreshing} />
            <h1 className="mt-2 text-xl font-black text-slate-900">Résultats des scrutins</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {lastRefresh
                ? `Mis à jour à ${lastRefresh.toLocaleTimeString('fr-FR')}`
                : 'Connexion…'}
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button onClick={() => refresh()} disabled={refreshing} className="btn-secondary">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button onClick={() => window.print()} className="btn-secondary">
              <FileDown size={13} />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
            <button onClick={exportPdf} className="btn-primary">
              <FileDown size={13} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up delay-50">
          {[
            {
              icon: BarChart2,
              color: 'bg-slate-100 text-slate-600',
              value: elections.length,
              label: 'Scrutins',
            },
            {
              icon: Radio,
              color: 'bg-emerald-50 text-emerald-600',
              value: activeCount,
              label: 'Ouverts',
            },
            {
              icon: Users,
              color: 'bg-blue-50 text-blue-500',
              value: totalVotes.toLocaleString('fr-FR'),
              label: 'Total votes',
            },
          ].map(({ icon: Icon, color, value, label }) => (
            <div key={label} className="kpi-card">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 tabular-nums">{value}</p>
                  <p className="text-[10px] text-slate-400">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Barre de filtres ── */}
        {!loading && elections.length > 0 && (
          <div className="results-filter-bar animate-fade-up delay-100">
            {/* Recherche */}
            <div className="results-search-wrapper">
              <Search size={14} className="results-search-icon" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un scrutin…"
                className="results-search-input"
              />
            </div>

            {/* Statut tabs */}
            <div className="results-status-tabs">
              {[
                { key: FILTER_ALL,    label: 'Tous'     },
                { key: FILTER_OPEN,   label: 'Ouverts'  },
                { key: FILTER_CLOSED, label: 'Clôturés' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`results-status-tab ${statusFilter === key ? 'results-status-tab-active' : ''}`}
                >
                  {key === FILTER_OPEN  && <span className="status-dot-live scale-75" />}
                  {label}
                  <span className={`results-count-badge ${statusFilter === key ? 'results-count-badge-active' : ''}`}>
                    {key === FILTER_ALL    ? elections.length
                    : key === FILTER_OPEN  ? elections.filter((e) =>  e.is_active).length
                                           : elections.filter((e) => !e.is_active).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Multi-select scrutins */}
            <MultiSelectDropdown
              elections={elections}
              selected={selectedIds}
              onChange={setSelectedIds}
            />

            {/* Reset filtres */}
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="results-reset-btn"
                title="Effacer les filtres"
              >
                <X size={13} />
                <span className="hidden sm:inline">Effacer</span>
              </button>
            )}
          </div>
        )}

        {/* ── Résultat du filtre ── */}
        {!loading && hasFilters && (
          <div className="flex items-center gap-2 text-xs text-slate-500 -mt-2 animate-fade-in">
            <Activity size={12} className="text-emerald-500" />
            <span>
              {filtered.length === 0
                ? 'Aucun scrutin ne correspond à vos filtres.'
                : `${filtered.length} scrutin${filtered.length > 1 ? 's' : ''} affiché${filtered.length > 1 ? 's' : ''}`}
              {selectedIds.length > 0 && (
                <> · <span className="font-semibold text-emerald-700">{selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}</span></>
              )}
            </span>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <Loading text="Chargement des résultats…" className="py-24" />
        ) : filtered.length === 0 ? (
          <div className="content-card p-8">
            <EmptyState
              icon={hasFilters ? Filter : Activity}
              title={hasFilters ? 'Aucun résultat' : 'Aucun scrutin à suivre'}
              description={
                hasFilters
                  ? 'Essayez de modifier vos filtres ou d\'élargir la recherche.'
                  : 'Les résultats apparaîtront dès qu\'un scrutin sera créé.'
              }
            />
            {hasFilters && (
              <div className="mt-4 flex justify-center">
                <button onClick={resetFilters} className="btn-secondary">
                  <X size={13} />Effacer les filtres
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((el) => (
              <ElectionCard
                key={el.id}
                election={el}
                totalVoters={totalVoters}
                onClose={refresh}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
