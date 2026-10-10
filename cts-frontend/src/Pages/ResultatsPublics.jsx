/**
 * Page publique des résultats — /resultats
 * Polling toutes les 10s. WebSocket-ready (migrable vers Reverb/Pusher).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  BarChart2, Crown, Radio, RefreshCw,
  ShieldCheck, Trophy, Users, Wifi, WifiOff,
  ArrowLeft,
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
      {/* Rang */}
      <div className="rp-cand-rank">
        {isFirst ? <Crown size={11} /> : index + 1}
      </div>

      {/* Photo */}
      <div className="rp-cand-photo">
        {(candidate.photo_path || candidate.photo_url)
          ? <img
              src={candidate.photo_url || candidate.photo_path}
              alt={candidate.name}
              className="h-full w-full object-cover"
            />
          : <span style={{
              fontSize: '0.6875rem', fontWeight: 900, color: '#94a3b8',
            }}>
              {candidate.name?.[0]?.toUpperCase()}
            </span>
        }
      </div>

      {/* Info + barre */}
      <div className="rp-cand-info">
        <p className="rp-cand-name">{candidate.name}</p>
        <div className="rp-cand-bar-wrap">
          <div className="rp-cand-bar-bg">
            <div
              className={`rp-cand-bar-fill ${isFirst ? 'rp-cand-bar-fill-first' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`rp-cand-pct ${isFirst ? 'rp-cand-pct-first' : ''}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Votes */}
      <span className="rp-cand-votes">
        {votes.toLocaleString('fr-FR')}
        <span className="rp-cand-votes-label"> voix</span>
      </span>
    </div>
  );
}

/* ── Carte scrutin ── */
function ElectionCard({ election }) {
  const total      = Number(election.total_votes || 0);
  const candidates = [...(election.candidates || [])].sort(
    (a, b) => Number(b.votes_count || 0) - Number(a.votes_count || 0)
  );
  const leader = candidates[0];

  return (
    <article className="rp-election-card">
      {/* Header carte */}
      <div className="rp-election-header">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`badge ${election.is_active ? 'badge-green' : 'badge-slate'}`}>
              {election.is_active
                ? <><span className="status-dot-live" />En cours</>
                : 'Clôturé'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>
              {total.toLocaleString('fr-FR')} vote{total > 1 ? 's' : ''}
            </span>
          </div>
          <h2 className="rp-election-title">{election.title}</h2>
        </div>

        {leader?.votes_count > 0 && (
          <div className="rp-leader-badge">
            <Trophy size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.5625rem', fontWeight: 900, textTransform: 'uppercase', color: '#d97706', letterSpacing: '0.08em' }}>
                En tête
              </p>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '7rem' }}>
                {leader.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Corps candidats */}
      <div className="rp-election-body">
        {candidates.length === 0 ? (
          <p className="rp-empty">Aucun candidat validé pour ce scrutin.</p>
        ) : (
          candidates.map((c, i) => (
            <CandidateBar key={c.id} candidate={c} index={i} totalVotes={total} />
          ))
        )}
      </div>
    </article>
  );
}

/* ── KPI card ── */
function KpiCard({ icon: Icon, value, label, iconBg, iconColor }) {
  return (
    <div className="rp-kpi-card">
      <div className="rp-kpi-icon" style={{ background: iconBg }}>
        <Icon size={16} style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <div>
        <p className="rp-kpi-value">{value}</p>
        <p className="rp-kpi-label">{label}</p>
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function ResultatsPublics() {
  const [elections,  setElections]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected,  setConnected]  = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchResults = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    const id = setInterval(() => fetchResults(), 10_000);
    return () => clearInterval(id);
  }, [fetchResults]);

  const activeCount = elections.filter((e) => e.is_active).length;
  const closedCount = elections.length - activeCount;

  return (
    <div className="rp-root">

      {/* ── Navbar ── */}
      <header className="rp-header">
        <div className="rp-header-inner">

          {/* Gauche : logo + titre */}
          <Link to="/" className="rp-brand">
            <img
              src={logocts}
              alt="CTS"
              style={{ height: '2.25rem', width: '2.25rem', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <span className="rp-brand-name">Cyber Tech Squad</span>
              <span className="rp-brand-sub">Résultats électoraux</span>
            </div>
          </Link>

          {/* Droite : statut + bouton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            {/* Badge connexion */}
            <span className={`rp-status-badge ${connected ? 'rp-status-live' : 'rp-status-offline'}`}>
              {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
              <span className="rp-status-label">
                {connected ? 'En direct' : 'Hors ligne'}
              </span>
            </span>

            {/* Bouton actualiser */}
            <button
              onClick={() => fetchResults(true)}
              disabled={refreshing}
              className="rp-refresh-btn"
              aria-label="Actualiser"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="rp-refresh-label">Actualiser</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="rp-main">
        <div className="rp-container">

          {/* KPI row */}
          <div className="rp-kpi-row">
            <KpiCard icon={BarChart2}   value={elections.length}                      label="Scrutins"     iconBg="#f1f5f9" iconColor="#475569" />
            <KpiCard icon={Radio}       value={activeCount}                             label="En cours"     iconBg="#f0fdf4" iconColor="#16a34a" />
            <KpiCard icon={ShieldCheck} value={closedCount}                            label="Clôturés"     iconBg="#eff6ff" iconColor="#3b82f6" />
            <KpiCard icon={Users}       value={totalVotes.toLocaleString('fr-FR')}    label="Total votes"  iconBg="#f5f3ff" iconColor="#7c3aed" />
          </div>

          {/* Timestamp */}
          {lastUpdate && (
            <p className="rp-timestamp">
              Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR')} · actualisation auto toutes les 10s
            </p>
          )}

          {/* Résultats */}
          {loading ? (
            <div className="rp-loading">
              <div className="rp-spinner" />
            </div>
          ) : elections.length === 0 ? (
            <div className="rp-empty-state">
              <div className="rp-empty-icon">
                <BarChart2 size={28} style={{ color: '#cbd5e1' }} />
              </div>
              <p className="rp-empty-title">Aucun résultat disponible</p>
              <p className="rp-empty-sub">
                Les résultats apparaîtront dès l'ouverture des scrutins.
              </p>
            </div>
          ) : (
            <div className="rp-elections-list">
              {elections.map((el) => <ElectionCard key={el.id} election={el} />)}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="rp-footer">
        <div className="rp-footer-left">
          <ShieldCheck size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
          <span>Votes anonymisés · Registre audité · CTS UADB</span>
        </div>
        <Link to="/login" className="rp-footer-link">
          <ArrowLeft size={11} />Espace électeur
        </Link>
      </footer>
    </div>
  );
}
