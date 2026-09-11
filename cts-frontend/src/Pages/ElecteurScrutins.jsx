import { useEffect, useState } from 'react';
import {
  ChevronDown, ChevronUp, User, Vote,
  FilePlus, CheckCircle2, AlertCircle, Camera,
} from 'lucide-react';
import VoterLayout from '../Components/VoterLayout';
import Modal from '../Components/Modal';
import Loading from '../Components/Loading';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ElecteurScrutins() {
  const [loading,       setLoading]       = useState(true);
  const [positions,     setPositions]     = useState([]);
  const [expandedId,    setExpandedId]    = useState(null);
  const [candByPos,     setCandByPos]     = useState({});
  const [loadingCand,   setLoadingCand]   = useState({});
  const [appStatus,     setAppStatus]     = useState({});
  const [showApply,     setShowApply]     = useState(false);
  const [applyPos,      setApplyPos]      = useState(null);
  const [form,          setForm]          = useState({ bio: '', slogan: '', photo: null, preview: null });
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => {
    api.get('/positions')
      .then((res) => { if (res.data?.success) setPositions(res.data.data || []); })
      .finally(() => setLoading(false));
  }, []);

  const togglePos = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (candByPos[id]) return;
    setLoadingCand((p) => ({ ...p, [id]: true }));
    try {
      const res = await api.get('/candidates', { params: { position_id: id } });
      setCandByPos((p) => ({
        ...p,
        [id]: (res.data.data || []).filter((c) => c.status === 'valide').map((c) => ({
          id:     c.id,
          nom:    `${c.user?.first_name ?? ''} ${c.user?.last_name ?? ''}`.trim() || `#${c.user_id}`,
          slogan: c.slogan || c.bio || '—',
        })),
      }));
    } finally { setLoadingCand((p) => ({ ...p, [id]: false })); }
  };

  const handleFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onloadend = () => setForm((p) => ({ ...p, photo: file, preview: r.result }));
    r.readAsDataURL(file);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!applyPos) return;
    const fd = new FormData();
    fd.append('position_id', applyPos.id);
    fd.append('slogan', form.slogan || '');
    fd.append('bio',    form.bio    || '');
    if (form.photo) fd.append('photo', form.photo);
    setSubmitting(true);
    try {
      await api.post('/apply', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAppStatus((p) => ({ ...p, [applyPos.id]: 'submitted' }));
      setShowApply(false);
      toast.success('Candidature envoyée. Elle sera examinée par l\'administration.');
    } catch (err) {
      if (err.response?.status === 409) {
        setAppStatus((p) => ({ ...p, [applyPos.id]: 'exists' }));
        setShowApply(false);
      }
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally { setSubmitting(false); }
  };

  return (
    <VoterLayout activePage="scrutins">
      <div className="mx-auto max-w-3xl space-y-5 pb-10">

        {/* Header */}
        <div className="animate-fade-up flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Tous les scrutins</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Consultez les postes et leurs candidats
            </p>
          </div>
          <span className="badge badge-green">
            <Vote size={10} />{positions.length} poste{positions.length > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <Loading text="Chargement…" className="py-24" />
        ) : positions.length === 0 ? (
          <div className="content-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center
              rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
              <Vote size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Aucun scrutin trouvé.</p>
          </div>
        ) : (
          <div className="content-card animate-fade-up delay-50">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-bold text-slate-800">Postes disponibles</p>
              <p className="mt-0.5 text-xs text-slate-400">Cliquez sur un poste pour voir les candidats.</p>
            </div>
            <div className="divide-y divide-slate-50">
              {positions.map((pos) => {
                const active    = pos.is_active == 1;
                const expanded  = expandedId === pos.id;
                const status    = appStatus[pos.id];
                return (
                  <div key={pos.id}>
                    {/* Row header */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Vote size={16} strokeWidth={2} />
                      </div>

                      <button className="min-w-0 flex-1 text-left" onClick={() => togglePos(pos.id)}>
                        <p className="text-sm font-semibold text-slate-800">{pos.title}</p>
                        {pos.description && (
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{pos.description}</p>
                        )}
                      </button>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`badge hidden sm:inline-flex ${active ? 'badge-green' : 'badge-slate'}`}>
                          {active ? <><span className="status-dot-live" />En cours</> : 'Inactif'}
                        </span>

                        {status === 'submitted' ? (
                          <span className="badge badge-green"><CheckCircle2 size={10} />Envoyée</span>
                        ) : status === 'exists' ? (
                          <span className="badge badge-amber"><AlertCircle size={10} />Déjà postulé</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setApplyPos(pos); setForm({ bio: '', slogan: '', photo: null, preview: null }); setShowApply(true); }}
                            className="btn-secondary text-[11px] py-1.5 px-3 gap-1">
                            <FilePlus size={12} />Postuler
                          </button>
                        )}

                        <button
                          onClick={() => togglePos(pos.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg
                            border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Candidates panel */}
                    {expanded && (
                      <div className="border-t border-slate-50 bg-slate-50/50 px-5 py-4">
                        {loadingCand[pos.id] ? (
                          <Loading text="Chargement des candidats…" className="py-6" />
                        ) : !candByPos[pos.id]?.length ? (
                          <div className="flex flex-col items-center gap-2 py-6 text-center">
                            <User size={18} className="text-slate-300" />
                            <p className="text-[11px] text-slate-400">Aucun candidat officiel pour ce poste.</p>
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {candByPos[pos.id].map((c) => (
                              <div key={c.id} className="flex items-center gap-3
                                rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                <div className="avatar-initials h-9 w-9 text-xs shrink-0">
                                  {c.nom[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-800">{c.nom}</p>
                                  <p className="truncate text-[10px] text-slate-400">{c.slogan}</p>
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
          </div>
        )}
      </div>

      {/* Apply modal */}
      <Modal
        isOpen={showApply && Boolean(applyPos)}
        onClose={() => !submitting && setShowApply(false)}
        title={applyPos?.title || 'Déposer une candidature'}
        subtitle="Présentez votre projet. Votre profil sera examiné avant publication."
      >
        <form onSubmit={submitApplication} className="space-y-4">
          <div>
            <label className="modal-label">Slogan de campagne *</label>
            <input required value={form.slogan}
              onChange={(e) => setForm({ ...form, slogan: e.target.value })}
              className="modal-field" placeholder="Votre slogan phare…" />
          </div>
          <div>
            <label className="modal-label">Bio <span className="font-normal text-slate-400 normal-case tracking-normal">(optionnelle)</span></label>
            <textarea value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3} className="modal-field resize-none"
              placeholder="Présentez-vous en quelques mots…" />
          </div>
          <div>
            <label className="modal-label">Photo <span className="font-normal text-slate-400 normal-case tracking-normal">(optionnelle)</span></label>
            <div className="flex items-center gap-4 rounded-xl border border-dashed
              border-slate-300 bg-slate-50 p-3">
              <button type="button"
                onClick={() => document.getElementById('apply-photo').click()}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden
                  rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400
                  hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                {form.preview
                  ? <img src={form.preview} className="h-full w-full object-cover" alt="preview" />
                  : <Camera size={20} />
                }
              </button>
              <input id="apply-photo" type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
              <div>
                <p className="text-xs font-semibold text-slate-700">Photo de campagne</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Cliquez pour sélectionner.</p>
                {form.preview && (
                  <button type="button"
                    onClick={() => setForm({ ...form, photo: null, preview: null })}
                    className="mt-1 text-[11px] font-semibold text-red-500 hover:text-red-700">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setShowApply(false)} disabled={submitting}
              className="modal-secondary-action flex-1">Annuler</button>
            <button type="submit" disabled={submitting || !form.slogan}
              className="modal-primary-action flex-[1.3] flex items-center justify-center gap-2">
              {submitting ? 'Envoi…' : 'Envoyer la candidature'}
            </button>
          </div>
        </form>
      </Modal>
    </VoterLayout>
  );
}
