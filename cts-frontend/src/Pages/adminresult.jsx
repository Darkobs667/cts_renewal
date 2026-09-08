import { useCallback, useEffect, useState } from 'react';
import { Activity, Crown, FileDown, Printer, Radio, RefreshCw, ShieldCheck, Users, XCircle } from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import api from '../services/api';
import { candidatePhotoUrl } from '../utils/media';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';

const LiveIndicator = ({ refreshing }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
    {refreshing ? 'Actualisation…' : 'Résultats en direct'}
  </span>
);

const CandidateResult = ({ candidate, index, totalVotes }) => {
  const votes = Number(candidate.votes_count || 0);
  const percent = totalVotes ? Math.round((votes / totalVotes) * 1000) / 10 : 0;
  const isLeader = index === 0 && votes > 0;

  return (
    <div className={`rounded-2xl border p-3.5 transition-colors ${isLeader ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${isLeader ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{isLeader ? <Crown size={14} /> : index + 1}</span>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white bg-slate-100 shadow-sm">
          {candidate.photo_path || candidate.photo_url ? <img src={candidatePhotoUrl(candidate.photo_url || candidate.photo_path)} alt={candidate.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-400">{candidate.name?.slice(0, 1)}</div>}
        </div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-800">{candidate.name}</p><p className="mt-0.5 text-[10px] font-medium text-slate-400">{votes.toLocaleString('fr-FR')} voix</p></div>
        <span className={`text-right text-lg font-black tabular-nums ${isLeader ? 'text-emerald-700' : 'text-slate-700'}`}>{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${isLeader ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-slate-300'}`} style={{ width: `${percent}%` }} /></div>
    </div>
  );
};

const ElectionResultsCard = ({ election, totalVoters, onClose }) => {
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const candidates = [...(election.candidates || [])].sort((a, b) => Number(b.votes_count || 0) - Number(a.votes_count || 0));
  const votes = Number(election.total_votes || 0);
  const participation = totalVoters ? Math.round((votes / totalVoters) * 100) : 0;
  const leader = candidates[0];

  const closeElection = async () => {
    setClosing(true);
    try {
      await api.put(`/positions/${election.id}`, { is_active: false });
      await onClose();
    } finally {
      setClosing(false);
      setConfirmClose(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <ConfirmDialog isOpen={confirmClose} onClose={() => !closing && setConfirmClose(false)} onConfirm={closeElection} loading={closing} title="Clôturer ce scrutin ?" description={`Le scrutin « ${election.title} » ne recevra plus aucun vote.`} confirmLabel="Clôturer" tone="danger" />
      <header className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${election.is_active ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${election.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />{election.is_active ? 'Scrutin ouvert' : 'Scrutin clôturé'}</span><span className="text-[10px] font-medium text-slate-400">{votes.toLocaleString('fr-FR')} vote{votes !== 1 ? 's' : ''} comptabilisé{votes !== 1 ? 's' : ''}</span></div>
            <h2 className="break-words text-xl font-black leading-tight text-slate-900">{election.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Répartition actualisée automatiquement à chaque nouveau vote.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {leader?.votes_count > 0 && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 shadow-sm"><Crown size={16} className="text-amber-500" /><div><p className="text-[8px] font-black uppercase tracking-wider text-emerald-600">En tête</p><p className="max-w-36 truncate text-xs font-black text-slate-800">{leader.name}</p></div></div>}
            {election.is_active && <button type="button" onClick={() => setConfirmClose(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-[10px] font-black text-red-600 transition hover:bg-red-50"><XCircle size={15} /> Clôturer</button>}
          </div>
        </div>
      </header>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <section>
          <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Radio size={15} className="text-emerald-500" /><h3 className="text-sm font-black text-slate-800">Classement des candidats</h3></div><span className="text-[10px] font-bold text-slate-400">Part des voix</span></div>
          {candidates.length ? <div className="space-y-3">{candidates.map((candidate, index) => <CandidateResult key={candidate.id} candidate={candidate} index={index} totalVotes={votes} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs font-medium text-slate-400">Aucun candidat validé pour ce scrutin.</div>}
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Participation</p>
          <p className="mt-2 text-4xl font-black text-slate-900">{participation}%</p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white shadow-inner"><div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${participation}%` }} /></div>
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Votants</span><span className="font-black text-slate-800">{votes.toLocaleString('fr-FR')}</span></div><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Électeurs inscrits</span><span className="font-black text-slate-800">{totalVoters.toLocaleString('fr-FR')}</span></div></div>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-white p-3 text-[10px] leading-relaxed text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-500" />Les résultats sont anonymisés et contrôlés par le serveur.</div>
        </aside>
      </div>
    </article>
  );
};

export default function AdminresultsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [elections, setElections] = useState([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refreshResults = useCallback(async ({ initial = false } = {}) => {
    if (!initial) setRefreshing(true);
    try {
      const [resultsResponse, statsResponse] = await Promise.all([api.get('/votes/results/all'), api.get('/admin/stats-globales')]);
      if (resultsResponse.data?.success) setElections(resultsResponse.data.data || []);
      if (statsResponse.data?.data) setTotalVoters(Number(statsResponse.data.data.totalInscrits || 0));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Impossible d’actualiser les résultats.', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshResults({ initial: true });
    const interval = window.setInterval(() => refreshResults(), 5000);
    return () => window.clearInterval(interval);
  }, [refreshResults]);

  const exportPdf = async () => {
    const response = await api.get('/votes/results/pdf', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resultats-scrutins.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <AdminLayout activePage="adminresultsPage">
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><LiveIndicator refreshing={refreshing} /><h1 className="mt-3 text-2xl font-black text-slate-900">Résultats des scrutins</h1><p className="mt-1 text-xs text-slate-500">Les barres et les classements évoluent automatiquement, sans recharger la page.</p></div>
        <div className="flex items-center gap-2"><span className="hidden text-[10px] font-medium text-slate-400 lg:block">{lastRefresh ? `Mis à jour à ${lastRefresh.toLocaleTimeString('fr-FR')}` : 'Connexion aux résultats…'}</span><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[10px] font-black text-slate-600 hover:bg-slate-50"><Printer size={15} /> Imprimer</button><button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-[10px] font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"><FileDown size={15} /> Exporter</button></div>
      </header>
      <div className="mb-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-medium text-slate-500">Scrutins suivis</p><p className="mt-1 text-2xl font-black text-slate-900">{elections.length}</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-[10px] font-medium text-emerald-700">Scrutins ouverts</p><p className="mt-1 text-2xl font-black text-emerald-800">{elections.filter((election) => election.is_active).length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-medium text-slate-500">Total des votes</p><p className="mt-1 text-2xl font-black text-slate-900">{elections.reduce((sum, election) => sum + Number(election.total_votes || 0), 0).toLocaleString('fr-FR')}</p></div></div>
      {loading ? <Loading text="Chargement des résultats…" className="py-24" /> : elections.length ? <div className="space-y-5">{elections.map((election) => <ElectionResultsCard key={election.id} election={election} totalVoters={totalVoters} onClose={refreshResults} />)}</div> : <EmptyState icon={Activity} title="Aucun scrutin à suivre" description="Les résultats apparaîtront ici dès qu’un scrutin sera créé." />}
    </div>
  </AdminLayout>;
}
