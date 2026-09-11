import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Vote, CheckSquare, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import VoterLayout from '../Components/VoterLayout';
import Loading from '../Components/Loading';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

function ScrutinRow({ election, hasVoted, onVote, index }) {
  const active = election.is_active == 1;
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-white p-4 transition-all
        sm:flex-row sm:items-center animate-fade-up ${
        hasVoted ? 'border-slate-100' : 'border-slate-200 hover:border-emerald-200 hover:shadow-sm'
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        hasVoted ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'
      }`}>
        {hasVoted ? <CheckSquare size={18} strokeWidth={2} /> : <Vote size={18} strokeWidth={2} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{election.titre}</p>
        <p className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={10} />{election.date}
        </p>
      </div>

      {hasVoted ? (
        <span className="badge badge-green w-fit"><CheckSquare size={10} />Voté</span>
      ) : active ? (
        <span className="badge badge-green w-fit"><span className="status-dot-live" />En cours</span>
      ) : (
        <span className="badge badge-slate w-fit">Terminé</span>
      )}

      {active && !hasVoted ? (
        <button onClick={() => onVote()} className="btn-primary shrink-0">
          Voter <ArrowRight size={13} />
        </button>
      ) : hasVoted ? (
        <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100
          px-3 py-2 text-[10px] font-semibold text-slate-400">
          <CheckSquare size={12} />Enregistré
        </span>
      ) : (
        <span className="text-[10px] font-semibold text-slate-300">Fermé</span>
      )}
    </div>
  );
}

export default function VoterDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading,   setLoading]   = useState(true);
  const [elections, setElections] = useState([]);
  const [votedIds,  setVotedIds]  = useState([]);
  const [stats,     setStats]     = useState({ total: 0, completed: 0 });

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
              id: p.id, titre: p.title, is_active: p.is_active,
              date: p.updated_at
                ? new Date(p.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : '—',
            }));
          setElections(active);
          setStats({ total: active.length, completed: active.filter((e) => voted.includes(e.id)).length });
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const percent  = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const fullName = user ? `${user.first_name} ${user.last_name}` : '';

  if (authLoading || loading) return <VoterLayout activePage="dashboard"><Loading text="Chargement…" className="min-h-[60vh]" /></VoterLayout>;

  return (
    <VoterLayout activePage="dashboard">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-xl font-black text-slate-900">Tableau de bord</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Bienvenue{fullName ? `, ${fullName}` : ''} — espace de vote sécurisé
          </p>
        </div>

        {/* Progress */}
        <div className="content-card p-5 animate-fade-up delay-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                Votre progression
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {stats.completed} / {stats.total} vote{stats.total > 1 ? 's' : ''}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {stats.completed === stats.total && stats.total > 0
                  ? 'Tous vos votes sont à jour ✓'
                  : `${stats.total - stats.completed} scrutin${stats.total - stats.completed > 1 ? 's' : ''} restant${stats.total - stats.completed > 1 ? 's' : ''}`
                }
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center
              rounded-2xl border border-emerald-100 bg-emerald-50">
              <span className="text-lg font-black text-emerald-700 tabular-nums">{percent}%</span>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Scrutins */}
        <div className="content-card animate-fade-up delay-100">
          <div className="content-card-header">
            <div>
              <p className="text-sm font-bold text-slate-800">Scrutins disponibles</p>
              <p className="mt-0.5 text-xs text-slate-400">{elections.length} ouvert{elections.length > 1 ? 's' : ''}</p>
            </div>
            {elections.length > 0 && (
              <span className="badge badge-green"><Zap size={10} />Live</span>
            )}
          </div>

          <div className="space-y-2 p-4">
            {elections.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl
                  border-2 border-dashed border-slate-200 bg-slate-50">
                  <Vote size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Aucun scrutin ouvert</p>
                <p className="text-xs text-slate-400">Revenez plus tard.</p>
              </div>
            ) : elections.map((el, i) => (
              <ScrutinRow
                key={el.id} election={el} index={i}
                hasVoted={votedIds.includes(el.id)}
                onVote={() => navigate('/voterBallot')}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
            <ShieldCheck size={12} className="text-emerald-500" />
            <p className="text-[10px] text-slate-400">Votes anonymisés · Registre audité CTS</p>
          </div>
        </div>
      </div>
    </VoterLayout>
  );
}
