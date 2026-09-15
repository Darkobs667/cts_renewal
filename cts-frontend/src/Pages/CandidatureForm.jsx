import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Camera, CheckCircle2, ChevronDown, FilePlus,
  Loader2, ShieldCheck, Upload, X,
} from 'lucide-react';
import VoterLayout from '../Components/VoterLayout';
import Loading from '../Components/Loading';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CandidatureForm() {
  const navigate = useNavigate();

  const [positions,  setPositions]  = useState([]);
  const [loadingPos, setLoadingPos] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const [form, setForm] = useState({
    position_id: '',
    slogan:      '',
    bio:         '',
    photo:       null,
    preview:     null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Charger TOUS les postes (actifs et inactifs) pour que l'électeur puisse postuler
    // même si aucun scrutin n'est encore ouvert au vote.
    api.get('/positions')
      .then((res) => {
        if (res.data?.success) {
          setPositions(res.data.data || []);
        }
      })
      .finally(() => setLoadingPos(false));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.position_id) e.position_id = 'Sélectionnez un poste.';
    if (!form.slogan.trim()) e.slogan = 'Le slogan est obligatoire.';
    if (form.slogan.length > 255) e.slogan = 'Maximum 255 caractères.';
    if (form.bio.length > 5000) e.bio = 'Maximum 5000 caractères.';
    return e;
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier image uniquement (jpg, png, webp).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde (max 2 Mo).');
      return;
    }
    const r = new FileReader();
    r.onloadend = () => setForm((p) => ({ ...p, photo: file, preview: r.result }));
    r.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const fd = new FormData();
    fd.append('position_id', form.position_id);
    fd.append('slogan', form.slogan.trim());
    fd.append('bio',    form.bio.trim());
    if (form.photo) fd.append('photo', form.photo);

    setSubmitting(true);
    try {
      await api.post('/apply', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'envoi.';
      if (err.response?.status === 409) {
        toast.error('Vous avez déjà postulé à ce poste.');
      } else {
        toast.error(msg);
      }
    } finally { setSubmitting(false); }
  };

  /* ── Succès ── */
  if (submitted) {
    return (
      <VoterLayout activePage="candidature">
        <div className="voter-page-wrapper">
          <div className="mx-auto max-w-md py-8 animate-zoom-in">
            <div className="content-card p-8 text-center space-y-5">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl
                bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                <CheckCircle2 size={38} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Candidature envoyée !</h2>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  Votre dossier est en cours d'examen par l'administration. Vous serez notifié de la décision.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Poste</span>
                  <span className="font-bold text-slate-800">
                    {positions.find((p) => p.id == form.position_id)?.title ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Statut</span>
                  <span className="badge badge-amber">En attente de validation</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Candidature sécurisée · CTS
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ position_id: '', slogan: '', bio: '', photo: null, preview: null });
                    setErrors({});
                  }}
                  className="btn-secondary flex-1"
                >
                  Nouvelle candidature
                </button>
                <button
                  onClick={() => navigate('/voterDashboard')}
                  className="btn-primary flex-1"
                >
                  Accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </VoterLayout>
    );
  }

  return (
    <VoterLayout activePage="candidature">
      <div className="voter-page-wrapper">

        {/* ── Header ── */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl
              bg-emerald-600 text-white shadow-sm">
              <FilePlus size={18} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Déposer ma candidature</h1>
              <p className="text-xs text-slate-400">
                Complétez le formulaire — votre dossier sera examiné par l'administration.
              </p>
            </div>
          </div>
        </div>

        {/* ── Info banner ── */}
        <div className="cand-info-banner animate-fade-up delay-50">
          <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-emerald-800 leading-relaxed">
            Votre candidature sera soumise à validation avant d'apparaître publiquement.
            Assurez-vous que vos informations sont correctes.
          </p>
        </div>

        {/* ── Form ── */}
        {loadingPos ? (
          <Loading text="Chargement des postes…" className="py-20" />
        ) : positions.length === 0 ? (
          <div className="content-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center
              rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
              <FilePlus size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">Aucun poste configuré</p>
            <p className="mt-1 text-xs text-slate-400">
              Aucun poste n'a encore été créé par l'administration.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="content-card animate-fade-up delay-100"
            noValidate
          >
            <div className="content-card-header">
              <p className="text-sm font-bold text-slate-800">Informations de candidature</p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">

              {/* Poste */}
              <div className="cand-field">
                <label className="cand-label" htmlFor="cand-position">
                  Poste souhaité <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="cand-position"
                    value={form.position_id}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, position_id: e.target.value }));
                      setErrors((p) => ({ ...p, position_id: '' }));
                    }}
                    className={`cand-select ${errors.position_id ? 'cand-input-error' : ''}`}
                  >
                    <option value="">Sélectionner un poste…</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>{pos.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5
                    top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {errors.position_id && (
                  <p className="cand-field-error">{errors.position_id}</p>
                )}
              </div>

              {/* Slogan */}
              <div className="cand-field">
                <label className="cand-label" htmlFor="cand-slogan">
                  Slogan de campagne <span className="text-red-500">*</span>
                </label>
                <input
                  id="cand-slogan"
                  type="text"
                  value={form.slogan}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, slogan: e.target.value }));
                    setErrors((p) => ({ ...p, slogan: '' }));
                  }}
                  placeholder="Votre slogan phare (max 255 caractères)"
                  maxLength={255}
                  className={`cand-input ${errors.slogan ? 'cand-input-error' : ''}`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.slogan
                    ? <p className="cand-field-error">{errors.slogan}</p>
                    : <span />
                  }
                  <span className={`text-[10px] font-semibold ml-auto ${
                    form.slogan.length > 240 ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {form.slogan.length}/255
                  </span>
                </div>
              </div>

              {/* Bio */}
              <div className="cand-field">
                <label className="cand-label" htmlFor="cand-bio">
                  Présentation{' '}
                  <span className="normal-case font-normal text-slate-400 tracking-normal">
                    (optionnelle)
                  </span>
                </label>
                <textarea
                  id="cand-bio"
                  value={form.bio}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, bio: e.target.value }));
                    setErrors((p) => ({ ...p, bio: '' }));
                  }}
                  rows={4}
                  placeholder="Présentez votre projet, vos motivations, vos engagements…"
                  maxLength={5000}
                  className={`cand-input cand-textarea ${errors.bio ? 'cand-input-error' : ''}`}
                />
                {errors.bio && <p className="cand-field-error">{errors.bio}</p>}
                <p className="text-[10px] text-slate-400 text-right mt-0.5">
                  {form.bio.length}/5000
                </p>
              </div>

              {/* Photo */}
              <div className="cand-field">
                <label className="cand-label">
                  Photo de campagne{' '}
                  <span className="normal-case font-normal text-slate-400 tracking-normal">
                    (optionnelle · max 2 Mo)
                  </span>
                </label>

                <div className="cand-photo-zone"
                  onClick={() => document.getElementById('cand-photo-input').click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                >
                  {form.preview ? (
                    <div className="cand-photo-preview">
                      <img src={form.preview} alt="Prévisualisation" className="cand-photo-img" />
                      <div className="cand-photo-preview-overlay">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm((p) => ({ ...p, photo: null, preview: null }));
                          }}
                          className="cand-photo-remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="cand-photo-placeholder">
                      <div className="cand-photo-icon">
                        <Camera size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Glissez une image ou cliquez
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          JPG, PNG, WEBP — max 2 Mo
                        </p>
                      </div>
                      <div className="cand-photo-upload-btn">
                        <Upload size={13} />
                        Parcourir
                      </div>
                    </div>
                  )}
                </div>
                <input
                  id="cand-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-3 sm:flex-row border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => navigate('/voterDashboard')}
                  className="btn-secondary flex-1 justify-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-[1.5] justify-center py-3"
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" />Envoi en cours…</>
                  ) : (
                    <><FilePlus size={15} />Soumettre ma candidature</>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </VoterLayout>
  );
}
