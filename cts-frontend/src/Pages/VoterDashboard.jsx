import React, { useState, useEffect } from 'react';
import VoterLayout from "../Components/VoterLayout";
import { useNavigate } from "react-router";
import { Vote, CheckCircle, Clock, ArrowRight, Zap, CheckSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Loading from '../Components/Loading';

/* ── Election row avec bouton Déjà voté ── */
const ElectionRow = ({ election, index, onVote, hasVoted }) => {
  const isActive = election.type === 'active';

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/5 fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${hasVoted ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
          {hasVoted ? <CheckSquare size={20} /> : <Vote size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Scrutin disponible</p>
          <h3 className="mt-1 truncate text-base font-black text-slate-900">{election.titre}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400"><Clock size={12} /> Mis à jour le {election.date}</p>
        </div>
        {hasVoted ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-600">
            <CheckSquare size={10} />
            Déjà voté
          </span>
        ) : isActive ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            En Cours
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5 text-[9px] font-black text-amber-500">
            <Clock size={9} />
            Terminé
          </span>
        )}
        {isActive && !hasVoted ? (
          <button
            onClick={() => onVote(election)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black text-white shadow-lg shadow-emerald-500/20 transition-all
              hover:-translate-y-0.5 hover:bg-emerald-700
              active:scale-95 transition-all duration-200"
          >
            Voter maintenant
            <ArrowRight size={13} />
          </button>
        ) : hasVoted ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-3 text-slate-400
            rounded-2xl text-[10px] font-black cursor-not-allowed">
            <CheckSquare size={12} />
            Vote enregistré
          </span>
        ) : (
          <span className="text-slate-300 text-[10px] font-black">Fermé</span>
        )}
      </div>
    </article>
  );
};

/* ── Main page ── */
const VoterDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completed: 0,
    remaining: 0,
    total: 0,
  });
  const [elections, setElections] = useState([]);
  const [userVotedIds, setUserVotedIds] = useState([]);

  // Récupérer les votes déjà effectués par l'utilisateur
  const fetchUserVotes = async () => {
    try {
      const response = await api.get('/votes/my');
      if (Array.isArray(response.data)) {
        const votedIds = response.data.map(vote => vote.position_id);
        setUserVotedIds(votedIds);
        return votedIds;
      }
    } catch (error) {
      console.warn("Impossible de récupérer les votes:", error);
    }
    return [];
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Récupérer les élections actives et en déduire le suivi individuel.
        try {
          const posRes = await api.get('/positions');
          if (posRes.data?.success) {
            const allPositions = [
              ...(posRes.data.data || []),
              ...(posRes.data.failed || []),
            ];
            
            const activeElections = allPositions
              .filter(pos => pos.is_active == 1)
              .map(pos => ({
                id: pos.id,
                titre: pos.title,
                date: pos.updated_at
                  ? new Date(pos.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : 'Date inconnue',
                type: 'active',
                description: pos.description,
                created_at: pos.created_at,
              }))
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            const voted = await fetchUserVotes();
            const completed = activeElections.filter(({ id }) => voted.includes(id)).length;
            setStats({ completed, remaining: activeElections.length - completed, total: activeElections.length });
            setElections(activeElections);
          }
        } catch (error) {
          console.error("Erreur chargement des positions", error);
        }

      } catch (error) {
        console.error("Erreur de synchronisation :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleStartVote = (election) => {
    navigate('/voterBallot');
  };

  const userFullName = user ? `${user.first_name} ${user.last_name}` : 'Utilisateur';
  const isLoading = authLoading || loading;

  return (
    <VoterLayout activePage="dashboard">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .42s ease both; }
      `}</style>

      {isLoading ? (
        <Loading text="Chargement de vos scrutins…" className="py-24" />
      ) : (
        <div className="animate-in fade-in duration-500">

          {/* ── header ── */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end fade-up">
            <div>
            <h1 className="text-xl md:text-2xl font-[900] text-slate-900">
              Tableau de bord électeur
            </h1>
            <p className="text-slate-400 font-medium mt-1 text-xs">
              Bienvenue{' '}
              <span className="font-black text-slate-600">{userFullName}</span>
              {' '}dans votre espace de vote sécurisé
            </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700">
              <ShieldCheck size={14} /> Session sécurisée
            </div>
          </div>

          <section className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm fade-up">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Votre progression</p><h2 className="mt-1 text-lg font-black text-slate-900">{stats.completed} vote{stats.completed > 1 ? 's' : ''} enregistré{stats.completed > 1 ? 's' : ''} sur {stats.total}</h2><p className="mt-1 text-xs text-slate-500">{stats.remaining ? `${stats.remaining} scrutin${stats.remaining > 1 ? 's' : ''} reste${stats.remaining > 1 ? 'nt' : ''} à consulter.` : 'Vous êtes à jour pour les scrutins ouverts.'}</p></div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-emerald-700 shadow-sm ring-1 ring-emerald-100">{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }} /></div>
          </section>

          {/* ── Liste des scrutins ── */}
          <div className="fade-up" style={{ animationDelay: '220ms' }}>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-7 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-[900] text-slate-900">Scrutins disponibles</h2>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                  {elections.length} scrutin{elections.length !== 1 ? 's' : ''} ouvert{elections.length !== 1 ? 's' : ''}
                </p>
              </div>
              {elections.length > 0 && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                  <Zap size={9} className="text-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-600">Live</span>
                </div>
              )}
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {elections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
                    <Vote size={26} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black text-sm">Aucun scrutin ouvert</p>
                  <p className="text-slate-300 font-bold text-[10px] mt-1">
                    Revenez plus tard pour voter
                  </p>
                </div>
              ) : (
                elections.map((election, i) => (
                  <ElectionRow
                    key={election.id}
                    election={election}
                    index={i}
                    onVote={handleStartVote}
                    hasVoted={userVotedIds.includes(election.id)}
                  />
                ))
              )}
            </div>

            <div className="px-7 py-4 border-t border-slate-50 flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" />
              <p className="text-[9px] font-bold text-slate-300">
                Registre audité — votes anonymisés par Cyber Tech Squad
              </p>
            </div>
          </section>

          </div>

        </div>
      )}
    </VoterLayout>
  );
};

export default VoterDashboard;
