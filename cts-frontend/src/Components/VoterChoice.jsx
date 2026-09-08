import { useState, useEffect, useMemo } from "react";
import VoterLayout from "../Components/VoterLayout";
import { useLocation, useNavigate } from "react-router";
import { User, ShieldAlert, Check, Loader2, Vote, ShieldCheck, Send } from "lucide-react";
import api from "../services/api";
import { candidatePhotoUrl } from '../utils/media';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Loading from './Loading';

const VoterChoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const election = location.state?.election || {
    titre: "Scrutin inconnu",
    id: null,
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!election.id) { setLoadingCandidates(false); return; }
      try {
        setLoadingCandidates(true);
        const response = await api.get('/candidates', { params: { position_id: election.id } });
        const data = response.data.data || [];
        const formatted = data.map((c) => ({
          id: c.id,
          nom: c.user
            ? `${c.user.first_name ?? ''} ${c.user.last_name ?? ''}`.trim()
            : `Utilisateur #${c.user_id}`,
          profession: 'Candidat',
          slogan: c.slogan || c.bio || 'Pas de slogan',
          photo: candidatePhotoUrl(c.photo_url || c.photo_path),
          preview: candidatePhotoUrl(c.photo_url || c.photo_path),
        }));
        setCandidates(formatted);
      } catch (error) {
        console.error("Erreur chargement candidats", error);
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, [election.id]);

  const selectedCandidate = useMemo(() => {
    if (selected === 'blanc') return { id: 'blanc', nom: 'Vote blanc' };
    return candidates.find((candidate) => candidate.id === selected) || null;
  }, [candidates, selected]);

  const submitVote = async () => {
    if (!election.id || !selectedCandidate || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await api.post('/votes', {
        position_id: election.id,
        candidate_id: selectedCandidate.id === 'blanc' ? null : selectedCandidate.id,
      });
      toast.success('Votre vote a été enregistré.');
      navigate('/voterHistory', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Le vote n’a pas pu être enregistré.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VoterLayout activePage="dashboard">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .42s ease both; }
      `}</style>

      <div className="max-w-3xl mx-auto pb-20">

        {/* ── header ── */}
        <div className="mb-8 fade-up">
          <h1 className="text-xl md:text-2xl font-[900] text-slate-900 mb-4">
            Vote en cours&nbsp;: <span className="text-emerald-600">{election.titre}</span>
          </h1>

          {/* stepper */}
          <div className="flex items-center gap-3">
            {/* step 1 — active */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-black text-white">1</span>
              </div>
              <span className="text-[10px] font-black text-emerald-600">Sélection</span>
            </div>
            {/* connector */}
            <div className="flex-1 h-0.5 bg-slate-100 rounded-full max-w-[60px]">
              <div className="h-full w-1/2 bg-emerald-400 rounded-full" />
            </div>
            {/* step 2 — pending */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-black text-slate-400">2</span>
              </div>
              <span className="text-[10px] font-black text-slate-400">Confirmation</span>
            </div>
          </div>
        </div>

        {/* ── loading ── */}
        {loadingCandidates ? (
          <Loading text="Chargement des candidats…" className="py-24" />

        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
              <User size={26} className="text-slate-200" />
            </div>
            <p className="font-black text-slate-400 text-sm">Aucun candidat pour ce scrutin.</p>
          </div>

        ) : (
          <>
            {/* ── candidate grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {candidates.map((c, i) => {
                const isSelected = selected === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`group relative bg-white rounded-3xl border-2 cursor-pointer
                      transition-all duration-300 p-6 fade-up
                      ${isSelected
                        ? 'border-emerald-500 shadow-lg shadow-emerald-50 scale-[1.01]'
                        : 'border-slate-100 hover:border-emerald-200 hover:shadow-md'
                      }`}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    {/* selected accent stripe */}
                    {isSelected && (
                      <span className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-b-full" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* avatar */}
                      <div className={`w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${
                        isSelected ? 'border-emerald-300 shadow-md shadow-emerald-50' : 'border-slate-100'
                      }`}>
                        {c.photo || c.preview ? (
                          <img src={c.photo || c.preview} className="w-full h-full object-cover" alt={c.nom} />
                        ) : (
                          <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                            <User size={24} className="text-emerald-300" />
                          </div>
                        )}
                      </div>

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="text-[9px] font-black text-emerald-500 mt-0.5 tracking-wide uppercase">
                              {c.profession}
                            </p>
                            <h3 className="font-[900] text-slate-900 text-sm leading-tight">{c.nom}</h3>
                            
                          </div>
                          {/* check bubble */}
                          <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-slate-200 group-hover:border-emerald-300'
                          }`}>
                            {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                          </div>
                        </div>

                        {/* slogan */}
                        <div className="mt-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-300 tracking-widest uppercase mb-1">
                            Profession de foi
                          </p>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed ">
                            {c.slogan}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── vote blanc ── */}
            <div
              onClick={() => setSelected('blanc')}
              className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer
                transition-all duration-200 mb-8 fade-up
                ${selected === 'blanc'
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  selected === 'blanc' ? 'bg-white/10' : 'bg-slate-100'
                }`}>
                  <ShieldAlert size={16} className={selected === 'blanc' ? 'text-white' : 'text-slate-400'} />
                </div>
                <span className={`text-xs font-[900] ${selected === 'blanc' ? 'text-white' : 'text-slate-600'}`}>
                  S'abstenir / Vote Blanc
                </span>
              </div>
              <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                selected === 'blanc' ? 'border-white bg-white' : 'border-slate-200'
              }`}>
                {selected === 'blanc' && <Check size={13} className="text-slate-900" strokeWidth={3} />}
              </div>
            </div>

            {/* ── CTA ── */}
            <div className="flex flex-col items-center gap-4 pt-6 border-t border-slate-50 fade-up">
              {selected ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  className="w-full md:w-2/3 py-4 text-center bg-emerald-500 hover:bg-emerald-600
                    text-white rounded-2xl font-[900] text-sm
                    shadow-lg shadow-emerald-100 active:scale-[0.98]
                    transition-all duration-200"
                >
                  Continuer vers la confirmation
                </button>
              ) : (
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100
                  rounded-2xl px-5 py-3">
                  <ShieldAlert size={15} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] font-black text-amber-500">
                    Veuillez sélectionner un candidat pour continuer
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => !isSubmitting && setIsConfirmOpen(false)}
        size="sm"
        title="Confirmer mon vote"
        subtitle="Vérifiez votre choix avant son enregistrement définitif."
      >
        {selectedCandidate && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">Scrutin</p>
              <p className="mt-1 text-sm font-black text-emerald-950">{election.titre}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-600">
                {selectedCandidate.photo ? <img src={selectedCandidate.photo} alt="" className="h-full w-full object-cover" /> : <User size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Votre choix</p>
                <p className="truncate text-sm font-black text-emerald-950">{selectedCandidate.nom}</p>
              </div>
              <ShieldCheck size={19} className="ml-auto shrink-0 text-emerald-500" />
            </div>
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-[11px] font-medium leading-relaxed text-emerald-900">
              Cette action est irréversible. Votre bulletin sera enregistré de manière sécurisée.
            </p>
            <div className="flex gap-3 border-t border-emerald-100 pt-5">
              <button type="button" onClick={() => setIsConfirmOpen(false)} disabled={isSubmitting} className="modal-secondary-action flex-1">Retour</button>
              <button type="button" onClick={submitVote} disabled={isSubmitting} className="modal-primary-action flex-[1.4] flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSubmitting ? 'Enregistrement…' : 'Voter'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </VoterLayout>
  );
};

export default VoterChoice;
