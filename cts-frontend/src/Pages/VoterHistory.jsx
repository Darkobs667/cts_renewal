import { useEffect, useRef, useState } from 'react';
import {
  Download, History, RefreshCw,
  CheckCircle2, CalendarDays, Hash, ReceiptText, ShieldCheck,
} from 'lucide-react';
import VoterLayout from '../Components/VoterLayout';
import Loading from '../Components/Loading';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ── Animated counter ── */
function AnimatedNumber({ value, duration = 600 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const end = Number(value);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <>{display < 10 ? `0${display}` : display}</>;
}

/* ── Vote card ── */
function VoteCard({ v, index, onDownload }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    await onDownload(v.id);
    setTimeout(() => setBusy(false), 1500);
  };

  const date = new Date(v.date_voted).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white
        shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300
        animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Left accent */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />

      <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:p-5 sm:pl-6">

        {/* Index badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
          border border-emerald-100 bg-emerald-50 text-[11px] font-black tabular-nums text-emerald-700">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle2 size={13} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">
              Participation certifiée
            </span>
          </div>
          <p className="truncate text-sm font-bold text-slate-900">{v.election_title}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Bulletin scellé dans le registre CTS</p>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-400">
              <CalendarDays size={9} />Date
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-700">{date}</span>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600">
              <Hash size={9} />Réf.
            </span>
            <code className="mt-0.5 block text-[10px] font-black tracking-wide text-emerald-800">
              {v.transaction_ref}
            </code>
          </div>
        </div>

        {/* Download */}
        <button
          onClick={handleClick}
          disabled={busy}
          className="btn-primary shrink-0"
        >
          {busy
            ? <><RefreshCw size={13} className="animate-spin" />Préparation…</>
            : <><Download size={13} />Reçu PDF</>
          }
        </button>
      </div>
    </article>
  );
}

/* ── Page ── */
export default function VoterHistory() {
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [votes,    setVotes]    = useState([]);

  const load = async (soft = false) => {
    if (soft) setSyncing(true); else setLoading(true);
    try {
      const res = await api.get('/votes/my');
      setVotes(Array.isArray(res.data) ? res.data : []);
    } finally { setLoading(false); setSyncing(false); }
  };

  useEffect(() => { load(); }, []);

  const downloadReceipt = async (id) => {
    try {
      const res = await api.get(`/voter/receipt/${id}`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = Object.assign(document.createElement('a'), {
        href: url, download: `Recu_Vote_${id}.pdf`,
      });
      link.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Impossible de générer le reçu.'); }
  };

  return (
    <VoterLayout activePage="votes">
      {loading ? (
        <Loading text="Chargement de vos votes…" className="min-h-[70vh]" />
      ) : (
        <div className="mx-auto max-w-3xl space-y-5 pb-10">

          {/* Header card */}
          <div className="content-card p-5 sm:p-6 animate-fade-up">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center
                  rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">
                    Registre personnel
                  </p>
                  <h1 className="mt-0.5 text-xl font-black text-slate-900">Mes votes</h1>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Consultez et téléchargez vos preuves de participation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start">
                <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm text-right">
                  <span className="block text-2xl font-black text-emerald-600 tabular-nums leading-none">
                    <AnimatedNumber value={votes.length} />
                  </span>
                  <span className="mt-0.5 block text-[8px] font-black uppercase tracking-widest text-slate-400">
                    Vote{votes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => load(true)}
                  disabled={syncing}
                  className="btn-secondary h-11 w-11 p-0 justify-center"
                  aria-label="Actualiser"
                >
                  <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          {votes.length > 0 ? (
            <div className="space-y-3">
              {votes.map((v, i) => (
                <VoteCard key={v.id} v={v} index={i} onDownload={downloadReceipt} />
              ))}
            </div>
          ) : (
            <div className="content-card p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center
                rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                <History size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-600">Aucune activité</p>
              <p className="mt-1 text-xs text-slate-400">
                Vous n'avez pas encore participé à un scrutin.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-emerald-500" />
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              Registre audité par Cyber Tech Squad
            </p>
          </div>
        </div>
      )}
    </VoterLayout>
  );
}
