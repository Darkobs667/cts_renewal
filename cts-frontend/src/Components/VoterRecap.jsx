import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle, Lock, Send, ShieldCheck } from 'lucide-react';
import VoterLayout from './VoterLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function VoterRecap() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [loading,      setLoading]      = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [txRef,        setTxRef]        = useState('');

  const { election, selectedCandidate } = location.state || {};

  if (!election || !selectedCandidate) {
    return (
      <VoterLayout activePage="dashboard">
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-sm text-slate-500">Aucune donnée de vote trouvée.</p>
          <button onClick={() => navigate('/voterDashboard')} className="btn-primary">
            Retour au tableau de bord
          </button>
        </div>
      </VoterLayout>
    );
  }

  const isBlanc = selectedCandidate.id === 'blanc';

  const confirm = async () => {
    setLoading(true);
    try {
      await api.post('/votes', {
        position_id:  election.id,
        candidate_id: isBlanc ? null : selectedCandidate.id,
      });
      toast.success('Vote enregistré.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally { setLoading(false); }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <VoterLayout activePage="dashboard">
        <div className="mx-auto max-w-md py-10 animate-zoom-in">
          <div className="content-card p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl
                bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                <CheckCircle size={40} strokeWidth={2} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Vote enregistré</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                Votre voix a été comptabilisée
              </p>
            </div>

            {/* Receipt — référence réelle provenant du serveur */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
              <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                Récapitulatif
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scrutin</span>
                  <span className="font-semibold text-slate-800 max-w-40 truncate text-right">
                    {election.titre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidat</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCandidate.nom || selectedCandidate.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Vote anonymisé · Registre audité
              </span>
            </div>

            <button
              onClick={() => navigate('/voterDashboard')}
              className="btn-primary w-full justify-center py-3"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </VoterLayout>
    );
  }

  /* ── Confirmation screen ── */
  return (
    <VoterLayout activePage="dashboard">
      <div className="mx-auto max-w-lg space-y-5 pb-10">

        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-xl font-black text-slate-900">Récapitulatif</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg
                bg-emerald-100 text-emerald-600"><CheckCircle size={13} /></span>
              <span className="text-[10px] font-bold text-slate-400">Sélection</span>
            </div>
            <div className="h-px max-w-16 flex-1 bg-emerald-300" />
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg
                bg-emerald-500 text-[9px] font-black text-white">2</span>
              <span className="text-[10px] font-bold text-emerald-600">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="content-card p-5 sm:p-6 animate-fade-up delay-50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <ShieldCheck size={14} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-600">
              Scrutin&nbsp;: <span className="text-emerald-600">{election.titre}</span>
            </p>
          </div>

          <div className={`flex items-center gap-4 rounded-xl border-2 p-4 ${
            isBlanc ? 'border-slate-700 bg-slate-900' : 'border-emerald-200 bg-emerald-50/60'
          }`}>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
              text-base font-black select-none ${
              isBlanc ? 'bg-white/10 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {selectedCandidate.initial || selectedCandidate.name?.[0] || '?'}
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${
                isBlanc ? 'text-slate-400' : 'text-emerald-600'
              }`}>Candidat sélectionné</p>
              <p className={`text-base font-black ${isBlanc ? 'text-white' : 'text-slate-900'}`}>
                {selectedCandidate.nom || selectedCandidate.name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Lock size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-800">
              En confirmant, votre bulletin sera envoyé au serveur de façon irréversible.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row animate-fade-up delay-100">
          <button disabled={loading} onClick={() => navigate(-1)}
            className="btn-secondary flex-1 justify-center py-3">
            <ArrowLeft size={14} />Modifier le choix
          </button>
          <button disabled={loading} onClick={confirm}
            className="btn-primary flex-1 justify-center py-3">
            {loading
              ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Envoi…</>
              : <><Send size={14} />Confirmer le vote</>
            }
          </button>
        </div>
      </div>
    </VoterLayout>
  );
}
