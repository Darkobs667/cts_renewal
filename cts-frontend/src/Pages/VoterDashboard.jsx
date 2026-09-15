import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Vote, CheckSquare, ArrowRight, ShieldCheck,
  FilePlus, Trophy, Clock, Zap, ChevronRight,
} from 'lucide-react';
import VoterLayout from '../Components/VoterLayout';
import Loading from '../Components/Loading';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

/* ── Scrutin row ── */
function ScrutinRow({ election, hasVoted, onVote, index }) {
  const active = election.is_active == 1;
  return (
    <div
      className={`voter-scrutin-row animate-fade-up ${
        hasVoted ? 'voter-scrutin-row-done' : active ? 'voter-scrutin-row-active' : 'voter-scrutin-row-closed'
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Icon */}
      <div className={`voter-scrutin-icon ${
        hasVoted ? 'voter-scrutin-icon-done' : active ? 'voter-scrutin-icon-active' : 'voter-scrutin-icon-closed'
      }`}>
        {hasVoted
          ? <CheckSquare size={17} strokeWidth={2} />
          : <Vote size={17} strokeWidth={2} />
        }
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-slate-800">{election.titre}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={9} />
          {election.date}
        </p>
      </div>

      {/* Status + CTA */}
      <div className="flex shrink-0 items-center gap-2">
        {hasVoted ? (
          <span className="badge badge-green">
            <CheckSquare size={9} />Voté
          </span>
        ) : active ? (
          <button onClick={onVote} className="voter-vote-btn">
            Voter <ArrowRight size={12} />
          </button>
        ) : (
          <span className="badge badge-slate">Fermé</span>
        )}
      </div>
    </div>
  );
}

/* ── Stat mini card ── */
function MiniStat({ value, label, icon: Icon, color }) {
  return (
    <div className={`voter-mini-stat ${color}`}>
      <Icon size={18} />
      <div>
        <p className="text-xl font-black tabular-nums leading-none">{value}</p>
        <p className="mt-0.5 text-[10px] font-semibold opacity-80">{label}</p>
      </div>
    </div>
  );
}

export default function VoterDashboard() {
  const navigate                = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [elections, setElections] = useState([]);
  const [votedIds, setVotedIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [posRes, votesRes] = await Promise.all([
          api.get('/positions'),
          api.get('/votes/my'),
        ]);
        const voted = Array.isArray(votesRes.data)
          ? votesRes.data.map((v) => v.position_id)
          : [];
        setVotedIds(voted);
        if (posRes.data?.success) {
          const active = (posRes.data.data || [])
            .filter((p) => p.is_active == 1)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((p) => ({
              id:       p.id,
              titre:    p.title,
              is_active: p.is_active,
              date:     p.updated_at
                ? new Date(p.updated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short',
                  })
                : '—',
            }));
          setElections(active);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const completed = elections.filter((e) => votedIds.includes(e.id)).length;
  const remaining = elections.length - completed;
  const percent   = elections.length ? Math.round((completed / elections.length) * 100) : 0;
  const fullName  = user ? `${user.first_name} ${user.last_name}` : '';

  const handleVote = () => navigate('/voterBallot');

  if (authLoading || loading) {
    return (
      <VoterLayout activePage="dashboard">
        <Loading text="Chargement…" className="min-h-[60vh]" />
      </VoterLayout>
    );
  }

  return (
    <VoterLayout activePage="dashboard">
      <div className="voter-page-wrapper">

        {/* ── Welcome banner ── */}
        <div className="voter-welcome-banner animate-fade-up">
          <div>
            <p className="voter-welcome-greeting">
              Bonjour{fullName ? `, ${user.first_name}` : ''}
            </p>
            <h1 className="voter-welcome-title">Votre espace électoral</h1>
          </div>
          <div className="voter-welcome-badge">
            <span className="status-dot-live" />
            Élection active
          </div>
        </div>

        {/* ── Mini stats ── */}
        <div className="voter-stats-row animate-fade-up delay-50">
          <MiniStat
            value={elections.length}
            label="Scrutins ouverts"
            icon={Zap}
            color="voter-mini-stat-emerald"
          />
          <MiniStat
            value={completed}
            label="Votes émis"
            icon={CheckSquare}
            color="voter-mini-stat-blue"
          />
          <MiniStat
            value={`${percent}%`}
            label="Progression"
            icon={Trophy}
            color="voter-mini-stat-violet"
          />
        </div>

        {/* ── Progress card ── */}
        <div className="content-card p-5 animate-fade-up delay-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                Ma progression
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {completed} / {elections.length} scrutin{elections.length > 1 ? 's' : ''} voté{completed > 1 ? 's' : ''}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {remaining === 0 && elections.length > 0
                  ? '✓ Tous vos votes sont enregistrés'
                  : remaining > 0
                  ? `${remaining} scrutin${remaining > 1 ? 's' : ''} en attente`
                  : 'Aucun scrutin ouvert pour le moment'
                }
              </p>
            </div>
            <div className="voter-progress-circle">
              <span className="text-lg font-black text-emerald-700 tabular-nums">{percent}%</span>
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600
                transition-all duration-1000 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          {remaining > 0 && (
            <button
              onClick={handleVote}
              className="voter-cta-btn mt-4"
            >
              <Vote size={15} />
              Accéder au bulletin de vote
              <ArrowRight size={14} className="ml-auto" />
            </button>
          )}
        </div>

        {/* ── Scrutins list ── */}
        <div className="content-card animate-fade-up delay-150">
          <div className="content-card-header">
            <div>
              <p className="text-sm font-bold text-slate-800">Scrutins disponibles</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {elections.length} ouvert{elections.length > 1 ? 's' : ''}
              </p>
            </div>
            {elections.length > 0 && (
              <span className="badge badge-green"><Zap size={9} />Live</span>
            )}
          </div>

          <div className="p-4 space-y-2">
            {elections.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl
                  border-2 border-dashed border-slate-200 bg-slate-50">
                  <Vote size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Aucun scrutin ouvert</p>
                <p className="text-xs text-slate-400">Revenez plus tard.</p>
              </div>
            ) : (
              elections.map((el, i) => (
                <ScrutinRow
                  key={el.id}
                  election={el}
                  index={i}
                  hasVoted={votedIds.includes(el.id)}
                  onVote={handleVote}
                />
              ))
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
            <ShieldCheck size={12} className="text-emerald-500" />
            <p className="text-[10px] text-slate-400">Votes anonymisés · Registre audité CTS</p>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-fade-up delay-200">
          <button
            onClick={() => navigate('/candidature')}
            className="voter-quick-action voter-quick-action-green"
          >
            <div className="voter-quick-action-icon bg-emerald-100 text-emerald-600">
              <FilePlus size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Déposer ma candidature</p>
              <p className="text-[11px] text-slate-400">Postuler pour un poste</p>
            </div>
            <ChevronRight size={15} className="ml-auto text-slate-300" />
          </button>

          <button
            onClick={() => navigate('/voterHistory')}
            className="voter-quick-action voter-quick-action-blue"
          >
            <div className="voter-quick-action-icon bg-blue-50 text-blue-500">
              <CheckSquare size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Mes votes</p>
              <p className="text-[11px] text-slate-400">Historique &amp; reçus PDF</p>
            </div>
            <ChevronRight size={15} className="ml-auto text-slate-300" />
          </button>
        </div>
      </div>
    </VoterLayout>
  );
}
