import React, { useState, useEffect } from 'react';
import VoterLayout from "../Components/VoterLayout";
import { ChevronDown, ChevronUp, Loader2, User, Vote, FilePlus, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { candidatePhotoUrl } from '../utils/media';
import toast from 'react-hot-toast';
import Modal from '../Components/Modal';
import Loading from '../Components/Loading';

const ElecteurScrutins = () => {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [candidatesByPos, setCandidatesByPos] = useState({});
  const [loadingCandidates, setLoadingCandidates] = useState({});
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyPosition, setApplyPosition] = useState(null);
  const [form, setForm] = useState({ bio: '', slogan: '', photo: null, preview: null });
  const [submitting, setSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState({});

  const fetchPositions = async () => {
    try {
      const response = await api.get('/positions');
      if (response.data?.success) {
        const all = [...(response.data.data || []), ...(response.data.failed || [])];
        setPositions(all);
      }
    } catch (error) {
      console.error("Erreur chargement des postes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPositions(); }, []);

  const toggleCandidates = async (positionId) => {
    if (expandedId === positionId) { setExpandedId(null); return; }
    setExpandedId(positionId);
    if (!candidatesByPos[positionId]) {
      setLoadingCandidates(prev => ({ ...prev, [positionId]: true }));
      try {
        const res = await api.get('/candidates', { params: { position_id: positionId } });
        const data = (res.data.data || []).filter(c => c.status === 'valide');
        const formatted = data.map(c => ({
          id: c.id,
          nom: c.user ? `${c.user.first_name ?? ''} ${c.user.last_name ?? ''}`.trim() : `Utilisateur #${c.user_id}`,
          role: c.user?.role || 'electeur',
          slogan: c.slogan || c.bio || 'Pas de profession de foi',
          photo: candidatePhotoUrl(c.photo_url || c.photo_path),
        }));
        setCandidatesByPos(prev => ({ ...prev, [positionId]: formatted }));
      } catch (error) {
        console.error("Erreur chargement candidats", error);
      } finally {
        setLoadingCandidates(prev => ({ ...prev, [positionId]: false }));
      }
    }
  };

  const openApplyModal = (position) => {
    setApplyPosition(position);
    setForm({ bio: '', slogan: '', photo: null, preview: null });
    setShowApplyModal(true);
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, photo: file, preview: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyPosition) return;
    const payload = new FormData();
    payload.append('position_id', applyPosition.id);
    payload.append('bio', form.bio || '');
    payload.append('slogan', form.slogan || '');
    if (form.photo) payload.append('photo', form.photo);
    try {
      setSubmitting(true);
      const res = await api.post('/apply', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setApplicationStatus(prev => ({ ...prev, [applyPosition.id]: 'submitted' }));
      setShowApplyModal(false);
      toast.success(res.data.message || 'Candidature envoyée avec succès');
    } catch (error) {
      const message = error.response?.data?.message || "Erreur lors de l'envoi";
      toast.error(message);
      if (error.response?.status === 409) {
        setApplicationStatus(prev => ({ ...prev, [applyPosition.id]: 'exists' }));
        setShowApplyModal(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VoterLayout activePage="scrutins">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .42s ease both; }

      `}</style>

      <div className="max-w-3xl mx-auto pb-20">

        {/* ── header ── */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between fade-up">
          <div>
          <h1 className="text-xl md:text-2xl font-[900] text-slate-900">Tous les scrutins</h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            Consultez les postes et leurs candidats, et postulez si vous le souhaitez
          </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700"><Vote size={13} /> {positions.length} poste{positions.length > 1 ? 's' : ''}</span>
        </div>

        {/* ── loading ── */}
        {loading ? (
          <Loading text="Chargement des scrutins…" className="py-24" />

        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm fade-up">
            <div className="w-16 h-16 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
              <Vote size={24} className="text-slate-200" />
            </div>
            <p className="font-black text-slate-400 text-sm">Aucun scrutin trouvé.</p>
          </div>

        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-black text-slate-900">Postes disponibles</h2><p className="mt-0.5 text-[10px] text-slate-400">Ouvrez un poste pour consulter les candidats.</p></div>
          <div className="flex flex-col gap-3 p-4">
            {positions.map((pos, i) => {
              const isActive = pos.is_active == 1;
              const isExpanded = expandedId === pos.id;
              const appStatus = applicationStatus[pos.id];

              return (
                <div
                  key={pos.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                    transition-all duration-300 fade-up
                    ${isExpanded ? 'border-emerald-300 shadow-md shadow-emerald-950/5' : 'border-slate-200 hover:border-emerald-200'}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* ── row header ── */}
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5 md:p-6">

                    {/* icon */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}><Vote size={17} /></div>
                      {/* title + desc — clickable */}
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => toggleCandidates(pos.id)}>
                        <h3 className="break-words text-sm font-[900] leading-tight text-slate-900 md:text-base">{pos.title}</h3>
                        {pos.description && <p className="mt-1 line-clamp-2 break-words text-[11px] font-medium leading-relaxed text-slate-400">{pos.description}</p>}
                      </div>
                    </div>

                    {/* right controls */}
                    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0 sm:flex-wrap sm:justify-end">

                      {/* status badge */}
                      {isActive ? (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl
                          text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          En cours
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-xl
                          text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          Inactif
                        </span>
                      )}

                      {/* apply / status */}
                      {appStatus === 'submitted' ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                          <CheckCircle2 size={13} /> <span className="hidden sm:inline">Candidature envoyée</span>
                        </span>
                      ) : appStatus === 'exists' ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-500">
                          <AlertCircle size={13} /> <span className="hidden sm:inline">Déjà postulé</span>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); openApplyModal(pos); }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black
                            text-slate-600 shadow-sm sm:flex-none
                            hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100
                            active:scale-95 transition-all duration-200"
                        >
                          <FilePlus size={14} />
                          <span className="inline">Postuler</span>
                        </button>
                      )}

                      {/* expand toggle */}
                      <button
                        onClick={() => toggleCandidates(pos.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200
                          text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        {isExpanded
                          ? <ChevronUp size={16} />
                          : <ChevronDown size={16} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* ── candidates panel ── */}
                  {isExpanded && (
                    <div className="border-t border-slate-50 bg-slate-50/40 p-5 md:p-6">
                      {loadingCandidates[pos.id] ? (
                        <Loading text="Chargement des candidats…" className="py-8" />

                      ) : candidatesByPos[pos.id]?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-12 h-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-3">
                            <User size={18} className="text-slate-200" />
                          </div>
                          <p className="text-[11px] font-black text-slate-400">
                            Aucun candidat officiel pour ce poste.
                          </p>
                        </div>

                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {candidatesByPos[pos.id]?.map((cand) => (
                            <div
                              key={cand.id}
                              className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                            >
                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                                {cand.photo ? (
                                  <img src={cand.photo} alt={cand.nom} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User size={18} className="text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-[900] text-sm text-slate-800 leading-tight truncate">{cand.nom}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cand.slogan}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </section>
        )}
      </div>

      <Modal
        isOpen={showApplyModal && Boolean(applyPosition)}
        onClose={() => !submitting && setShowApplyModal(false)}
        title={applyPosition?.title || 'Déposer une candidature'}
        subtitle="Présentez votre projet aux électeurs. Votre profil restera privé jusqu’à validation."
      >
        <form onSubmit={handleSubmitApplication} className="space-y-5">
          <div>
            <label className="modal-label">Slogan de campagne</label>
            <input required value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} className="modal-field" placeholder="Votre slogan phare…" />
          </div>
          <div>
            <label className="modal-label">Bio / Présentation <span className="font-normal text-slate-400">(optionnelle)</span></label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="modal-field resize-none" placeholder="Présentez-vous en quelques mots…" />
          </div>
          <div>
            <label className="modal-label">Photo <span className="font-normal text-slate-400">(optionnelle)</span></label>
            <div className="flex items-center gap-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
              <button type="button" onClick={() => document.getElementById('apply-photo').click()} className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-emerald-300 bg-white text-emerald-600 transition hover:bg-emerald-50">
                {form.preview ? <img src={form.preview} className="h-full w-full object-cover" alt="Aperçu de la photo" /> : <Camera size={20} />}
              </button>
              <input id="apply-photo" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files[0])} />
              <div className="min-w-0"><p className="text-xs font-bold text-slate-700">Photo de campagne</p><p className="mt-1 text-[11px] text-slate-400">Cliquez sur le cadre pour sélectionner une image.</p>{form.preview && <button type="button" onClick={() => setForm({ ...form, photo: null, preview: null })} className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900">Supprimer</button>}</div>
            </div>
          </div>
          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => setShowApplyModal(false)} disabled={submitting} className="modal-secondary-action flex-1">Annuler</button>
            <button type="submit" disabled={submitting || !form.slogan} className="modal-primary-action flex-[1.35]">{submitting ? 'Envoi…' : 'Envoyer'}</button>
          </div>
        </form>
      </Modal>
    </VoterLayout>
  );
};

export default ElecteurScrutins;
