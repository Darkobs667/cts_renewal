import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Check, Loader2, Send, ShieldAlert, User } from 'lucide-react';
import VoterLayout from './VoterLayout';
import Modal from './Modal';
import Loading from './Loading';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function VoterChoice() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const election  = location.state?.election || { titre: 'Scrutin inconnu', id: null };

  const [candidates,    setCandidates]    = useState([]);
  const [loadingCand,   setLoadingCand]   = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => {
    if (!election.id) { setLoadingCand(false); return; }
    api.get('/candidates', { params: { position_id: election.id } })
      .then((res) => setCandidates(
        (res.data.data || []).map((c) => ({
          id:      c.id,
          nom:     `${c.user?.first_name ?? ''} ${c.user?.last_name ?? ''}`.trim() || `#${c.user_id}`,
          slogan:  c.slogan || c.bio || 'Pas de slogan',
          initial: (c.user?.first_name?.[0] ?? 'C').toUpperCase(),
        }))
      ))
      .finally(() => setLoadingCand(false));
  }, [election.id]);

  const selectedCand = useMemo(() => {
    if (selected === 'blanc') return { id: 'blanc', nom: 'Vote blanc', initial: '—' };
    return candidates.find((c) => c.id === selected) || null;
  }, [candidates, selected]);

  const submitVote = async () => {
    if (!election.id || !selectedCand || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/votes', {
        position_id:  election.id,
        candidate_id: selectedCand.id === 'blanc' ? null : selectedCand.id,
      });
      toast.success('Vote enregistré.');
      navigate('/voterHistory', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Le vote n\'a pas pu être enregistré.');
    } finally { setSubmitting(false); }
  };

  return (
    <VoterLayout activePage="dashboard">
      <div className="mx-auto max-w-3xl space-y-5 pb-20">

        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-xl font-black text-slate-900">
            Vote&nbsp;: <span className="text-emerald-600">{election.titre}</span>
          </h1>
          {/* Stepper */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg
                bg-emerald-500 text-[9px] font-black text-white">1</span>
              <span className="text-[10px] font-bold text-emerald-600">Sélection</span>
            </div>
            <div className="h-px flex-1 max-w-16 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg
                bg-slate-100 text-[9px] font-bold text-slate-400">2</span>
              <span className="text-[10px] font-bold text-slate-400">Confirmation</span>
            </div>
          </div>
        </div>

        {loadingCand ? (
          <Loading text="Chargement des candidats…" className="py-24" />
        ) : candidates.length === 0 ? (
          <div className="content-card p-12 text-center">
            <User size={24} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Aucun candidat pour ce scrutin.</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 animate-fade-up delay-50">
              {candidates.map((c, i) => {
                const isSel = selected === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setSelected(c.id)}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${
                      isSel
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-emerald-200'
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center
                          rounded-xl text-base font-black select-none ${
                          isSel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.initial}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{c.nom}</p>
                        </div>
                      </div>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center
                        rounded-full border-2 transition-all mt-0.5 ${
                        isSel ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {isSel && <Check size={12} strokeWidth={3} />}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Profession de foi
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-600">{c.slogan}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Vote blanc */}
            <button type="button" onClick={() => setSelected('blanc')}
              className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 transition-all animate-fade-up delay-100 ${
                selected === 'blanc'
                  ? 'border-slate-700 bg-slate-900'
                  : 'border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                selected === 'blanc' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <ShieldAlert size={16} />
              </span>
              <span className={`text-sm font-semibold ${selected === 'blanc' ? 'text-white' : 'text-slate-600'}`}>
                S'abstenir / Vote blanc
              </span>
            </button>

            {/* CTA */}
            <div className="pt-2 animate-fade-up delay-150">
              {selected ? (
                <button type="button" onClick={() => setConfirmOpen(true)}
                  className="btn-primary w-full justify-center py-3">
                  Continuer vers la confirmation
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200
                  bg-amber-50 px-4 py-3">
                  <ShieldAlert size={14} className="shrink-0 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">
                    Sélectionnez un candidat pour continuer.
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm modal */}
      <Modal isOpen={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)}
        size="sm" title="Confirmer mon vote"
        subtitle="Vérifiez votre choix avant l'enregistrement définitif.">
        {selectedCand && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Scrutin</p>
              <p className="mt-0.5 text-sm font-bold text-emerald-900">{election.titre}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center
                rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">
                {selectedCand.initial}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Votre choix</p>
                <p className="text-sm font-bold text-slate-900">{selectedCand.nom}</p>
              </div>
            </div>
            <p className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3
              text-[11px] leading-relaxed text-amber-800">
              Cette action est irréversible. Votre bulletin sera enregistré de manière sécurisée.
            </p>
            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting}
                className="modal-secondary-action flex-1">Retour</button>
              <button type="button" onClick={submitVote} disabled={submitting}
                className="modal-primary-action flex-[1.4] flex items-center justify-center gap-2">
                {submitting
                  ? <><Loader2 size={14} className="animate-spin" />Enregistrement…</>
                  : <><Send size={14} />Voter</>
                }
              </button>
            </div>
          </div>
        )}
      </Modal>
    </VoterLayout>
  );
}
