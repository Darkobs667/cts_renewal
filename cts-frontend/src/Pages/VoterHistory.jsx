import React, { useState, useEffect, useRef } from 'react';
import VoterLayout from "../Components/VoterLayout";
import { ShieldCheck, Download, History, RefreshCw, CheckCircle2, Clock, Hash, CalendarDays, ReceiptText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loading from '../Components/Loading';

/* ── Animated counter ── */
const AnimatedNumber = ({ value, duration = 700 }) => {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = 0;
    const end = Number(value);
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{display < 10 ? `0${display}` : display}</>;
};

/* ── Vote card ── */
const VoteCard = ({ v, index, onDownload }) => {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    setDownloading(true);
    await onDownload(v.id);
    setTimeout(() => setDownloading(false), 1500);
  };

  const formattedDate = new Date(v.date_voted).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5 fade-up" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-700" />
      <div className="p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
              <span className="text-[11px] font-black tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500 text-white"><CheckCircle2 size={12} strokeWidth={3} /></span><span className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">Participation certifiée</span></div>
              <h3 className="truncate text-base font-black text-slate-900">{v.election_title}</h3>
              <p className="mt-1 text-[11px] font-medium text-slate-400">Bulletin scellé dans le registre CTS</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:flex lg:items-center">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5"><span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-400"><CalendarDays size={10} /> Date</span><span className="mt-1 block text-[11px] font-bold text-slate-700">{formattedDate}</span></div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5"><span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600"><Hash size={10} /> Référence</span><code className="mt-1 block text-[10px] font-black tracking-wide text-emerald-800">{v.transaction_ref}</code></div>
          </div>

          <button onClick={handleClick} disabled={downloading} className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-[10px] font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">
            {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />} {downloading ? 'Préparation…' : 'Télécharger le reçu'}
          </button>
        </div>
      </div>
    </article>
  );
};

/* ── Main page ── */
const VoterHistory = () => {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [votes, setVotes] = useState([]);

  const fetchHistory = async (showSync = false) => {
    try {
      if (showSync) setIsSyncing(true);
      else setLoading(true);
      const response = await api.get('/votes/my');
      setVotes(response.data);
    } catch (error) {
      console.error("Erreur historique :", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDownloadReceipt = async (voteId) => {
    try {
      const response = await api.get(`/voter/receipt/${voteId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Recu_Vote_${voteId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      toast.error('Impossible de générer le reçu pour le moment.');
      console.error(error);
    }
  };

  return (
    <VoterLayout activePage="votes">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .42s ease both; }

        @keyframes softGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          50%       { box-shadow: 0 0 16px 5px rgba(16,185,129,.1); }
        }
        .soft-glow { animation: softGlow 3s ease-in-out infinite; }
      `}</style>

      {loading ? (
        <Loading text="Chargement de vos votes…" className="min-h-[70vh]" />
      ) : (
        <div className="animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">

          {/* ── header ── */}
          <section className="mb-7 overflow-hidden rounded-[34px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-6 sm:p-8 fade-up">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"><ReceiptText size={22} /></div><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">Registre personnel</p><h1 className="mt-1 text-xl font-black text-emerald-950 sm:text-2xl">Mes votes enregistrés</h1><p className="mt-1 text-xs font-medium text-emerald-900/65">Consultez et téléchargez vos preuves de participation.</p></div></div>
              <div className="flex items-center gap-3 self-start"><div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-right shadow-sm"><span className="block text-2xl font-black leading-none text-emerald-600 tabular-nums"><AnimatedNumber value={votes.length} /></span><span className="mt-1 block text-[8px] font-black uppercase tracking-widest text-emerald-700">Vote{votes.length !== 1 ? 's' : ''}</span></div><button type="button" onClick={() => fetchHistory(true)} disabled={isSyncing} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-600 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60" aria-label="Actualiser le registre"> <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /></button></div>
            </div>
          </section>

          {/* ── list ── */}
          {votes.length > 0 ? (
            <div className="flex flex-col gap-4">
              {votes.map((v, i) => (
                <VoteCard key={v.id} v={v} index={i} onDownload={handleDownloadReceipt} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-28 text-center
              bg-white rounded-3xl border border-slate-100 shadow-sm fade-up">
              <div className="w-16 h-16 bg-slate-50 rounded-[24px] border-2 border-dashed
                border-slate-200 flex items-center justify-center mb-5">
                <History size={28} className="text-slate-200" />
              </div>
              <h3 className="text-slate-900 font-black text-base">Aucune activité</h3>
              <p className="text-slate-400 font-bold text-[10px] mt-1.5">
                Vous n'avez pas encore participé à un scrutin
              </p>
            </div>
          )}

          {/* ── footer ── */}
          <div className="mt-8 flex items-center gap-2 justify-center">
            <ShieldCheck size={12} className="text-emerald-500" />
            <p className="text-[9px] font-bold text-slate-300">
              Registre audité par Cyber Tech Squad
            </p>
          </div>

        </div>
      )}
    </VoterLayout>
  );
};

export default VoterHistory;
