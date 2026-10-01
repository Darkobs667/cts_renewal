/**
 * Page publique des résultats — /resultats
 * Accessible sans authentification. Affiche les résultats des scrutins clôturés
 * et met à jour via polling toutes les 10s (simule un effet temps-réel).
 *
 * WebSocket note: Render free tier ne supporte pas les WebSockets persistants.
 * On utilise du long-polling (setInterval) qui donne le même effet visuel
 * pour une app à faible volume. Migrable vers Laravel Reverb/Pusher facilement.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  BarChart2, Crown, Radio, RefreshCw,
  ShieldCheck, Trophy, Users, Wifi, WifiOff,
} from 'lucide-react';
import api from '../services/api';
import logocts from '../assets/logo-cts2-removebg-preview.png';

/* ── Barre candidat ── */
function CandidateBar({ candidate, index, totalVotes }) {
  const votes   = Number(candidate.votes_count || 0);
  const pct     = totalVotes ? Math.round((votes / totalVotes) * 1000) / 10 : 0;
  const isFirst = index === 0 && votes > 0;

  return (
    <div className={`rp-cand-row ${isFirst ? 'rp-cand-row-first' : ''}`}>
      <div className="rp-cand-rank">
        {isFirst ? <Crown size={12} /> : index + 1}
      </div>
      <div className="rp-cand-photo">
        {(candidate.photo_path || candidate.photo_url)
          ? <img src={candidate.photo_url || candidate.photo_path} alt={candidate.name} className="h-full w-full object-cover" />
          : <span className="text-xs font-black text-slate-400">{candidate.name?.[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="rp-cand-info">
        <p className="rp-cand-name">{candidate.name}</p>
        <div className="rp-cand-bar-wrap">
          <div className="rp-cand-bar-bg">
            <div
              className={`rp-cand-bar-fill ${isFirst ? 'rp-cand-bar-fill-first' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`rp-cand-pct ${isFirst ? 'rp-cand-pct-first' : ''}`}>{pct}%</span>
        </div>
      </div>
      <span className="rp-cand-votes">{votes.toLocaleString('fr-FR')} voix</span>
    </div>
  );
}

/* ── Carte scrutin ── */
function ElectionCard({ election }) {
  const total      = Number(election.total_votes || 0);
  const candidates = [...(election.candidates || [])].sort(
    (a, b) => Number(b.votes_count || 0) - Number(a.votes_count || 0)
  );

  return (
    <article className="rp-election-card">
      <div className="rp-election-header">
        <div className="min-w-0">
          <span className={`badge mb-2 ${election.is_active ? 'badge-green' : 'badge-slate'}`}>
            {election.is_active ? <><span className="status-dot-live" />En cours</> : 'Clôturé'}
          </span>
          <h2 className="rp-election-title">{election.title}</h2>
          <p className="rp-election-meta">{total.toLocaleString('fr-FR')} votes exprimés</p>
        </div>
        {candidates[0]?.votes_count > 0 && (
          <div className="rp-leader-badge">
            <Trophy size={14} className="text-amber-500" />
            <div>
              <p className="text-[8px] font-black uppercase text-amber-600">En tête</p>
              <p className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                {candidates[0].name}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rp-election-body">
        {candidates.length === 0 ? (
          <p className="rp-empty">Aucun candidat validé.</p>
        ) : (
          candidates.map((c, i) => (
            <CandidateBar key={c.id} candidate={c} index={i} totalVotes={total} />
          ))
        )}
      </div>
    </article>
  );
}

/* ── Page principale ── */
export default function ResultatsPublics() {
  const [elections,  setElections]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected,  setConnected]  = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchResults = useCallback(async () => {
    try {
      const res = await api.get('/votes/results');
      if (res.data?.success) {
        const data = res.data.data || [];
        setElections(data);
        setTotalVotes(data.reduce((s, e) => s + Number(e.total_votes || 0), 0));
        setLastUpdate(new Date());
        setConnected(true);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    // Polling toutes les 10s — simule le temps réel (WebSocket-ready)
    const id = setInterval(fetchResults, 10_000);
    return () => clearInterval(id);
  }, [fetchResults]);

  const activeCount  = elections.filter((e) => e.is_active).length;
  const closedCount  = elections.length - activeCount;

  return (
    <div className="rp-root">

      {/* Header */}
      <header className="rp-header">
        <div className="rp-header-inner">
          <Link to="/" className="rp-brand">
            <img src={logocts} alt="CTS" className="rp-brand-logo" />
            <div>
              <span className="rp-brand-name">Cyber Tech Squad</span>
              <span className="rp-brand-sub">Résultats électoraux</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
              connected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {connected ? 'En direct' : 'Hors ligne'}
            </span>
            <button onClick={fetchResults} className="btn-secondary text-xs gap-1.5">
              <RefreshCw size={12} />Actualiser
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="rp-main">
        <div className="rp-container">

          {/* KPI */}
          <div className="rp-kpi-row">
            {[
              { icon: BarChart2, value: elections.length, label: 'Scrutins',     color: 'bg-slate-100 text-slate-600' },
              { icon: Radio,     value: activeCount,       label: 'En cours',     color: 'bg-emerald-50 text-emerald-600' },
              { icon: ShieldCheck, value: closedCount,     label: 'Clôturés',    color: 'bg-blue-50 text-blue-500' },
              { icon: Users,     value: totalVotes.toLocaleString('fr-FR'), label: 'Total votes', color: 'bg-violet-50 text-violet-600' },
            ].map(({ icon: Icon, value, label, color }) => (
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

          {/* Last update */}
          {lastUpdate && (
            <p className="text-[10px] text-slate-400 text-right -mt-2">
              Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR')} · actualisation auto toutes les 10s
            </p>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
            </div>
          ) : elections.length === 0 ? (
            <div className="rp-empty-state">
              <BarChart2 size={40} className="text-slate-200" />
              <p className="text-slate-500 font-semibold">Aucun résultat disponible</p>
              <p className="text-slate-400 text-sm">Les résultats apparaîtront dès l'ouverture des scrutins.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {elections.map((el) => <ElectionCard key={el.id} election={el} />)}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="rp-footer">
        <ShieldCheck size={12} className="text-emerald-500" />
        <span>Votes anonymisés · Registre audité · Cyber Tech Squad UADB</span>
        <span className="mx-2 text-slate-300">·</span>
        <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
          Espace électeur
        </Link>
      </footer>
    </div>
  );
}
