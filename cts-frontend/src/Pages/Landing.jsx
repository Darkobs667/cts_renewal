/**
 * Landing page publique — /
 * Présentation du CTS, postes, club, et formulaire de candidature sans compte.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, Camera, CheckCircle2, ChevronDown,
  FilePlus, Lock, Shield, Upload, Users, Vote, X, Loader2,
} from 'lucide-react';
import logocts from '../assets/logo-cts2-removebg-preview.png';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ────────────────────── Données statiques du club ──────────────────────── */
const POSTES = [
  {
    titre: 'Président(e)',
    emoji: '👑',
    role: 'Représente le club, coordonne les activités, assure la vision stratégique et porte la voix du CTS auprès des instances de l\'université.',
    couleur: 'from-amber-50 to-yellow-50 border-amber-200',
    iconColor: 'text-amber-600 bg-amber-100',
  },
  {
    titre: 'Vice-Coordinateur(trice) — Vice-Président(e)',
    emoji: '🤝',
    role: 'Seconde le président, coordonne les équipes internes, assure la continuité des projets et prend la relève en cas d\'absence.',
    couleur: 'from-blue-50 to-indigo-50 border-blue-200',
    iconColor: 'text-blue-600 bg-blue-100',
  },
  {
    titre: 'Responsable Organisation',
    emoji: '📋',
    role: 'Planifie et organise les événements, ateliers, CTF et hackathons. Gère la logistique des activités du club.',
    couleur: 'from-emerald-50 to-green-50 border-emerald-200',
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
  {
    titre: 'Responsable Pédagogie',
    emoji: '📚',
    role: 'Conçoit les programmes de formation, organise les sessions d\'apprentissage et veille au développement des compétences des membres.',
    couleur: 'from-violet-50 to-purple-50 border-violet-200',
    iconColor: 'text-violet-600 bg-violet-100',
  },
  {
    titre: 'Responsable Communication',
    emoji: '📢',
    role: 'Gère la présence en ligne du club, produit les contenus visuels, anime les réseaux sociaux et assure la visibilité du CTS.',
    couleur: 'from-rose-50 to-pink-50 border-rose-200',
    iconColor: 'text-rose-600 bg-rose-100',
  },
  {
    titre: 'Adjoint(e) Responsable Relations Extérieures',
    emoji: '🌐',
    role: 'Développe les partenariats avec d\'autres clubs, entreprises tech et institutions. Représente le club lors d\'événements externes.',
    couleur: 'from-cyan-50 to-teal-50 border-cyan-200',
    iconColor: 'text-cyan-600 bg-cyan-100',
  },
];

/* ────────────────────── Formulaire candidature publique ─────────────────── */
function CandidaturePublique({ positions }) {
  const [form, setForm]         = useState({ nom: '', prenom: '', email: '', position_id: '', slogan: '', bio: '', photo: null, preview: null });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Image uniquement.'); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Max 2 Mo.'); return; }
    const r = new FileReader();
    r.onloadend = () => setForm((p) => ({ ...p, photo: file, preview: r.result }));
    r.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.nom.trim())       e.nom       = 'Obligatoire';
    if (!form.prenom.trim())    e.prenom    = 'Obligatoire';
    if (!form.email.trim() || !/^[^\s@]+@uadb\.edu\.sn$/.test(form.email))
                                e.email     = 'Adresse @uadb.edu.sn requise';
    if (!form.position_id)      e.position_id = 'Sélectionnez un poste';
    if (!form.slogan.trim())    e.slogan    = 'Le slogan est obligatoire';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // 1. Créer un compte temporaire + login, ou utiliser un endpoint public dédié
    // Ici on utilise le flux register → login → apply pour la candidature publique
    setSubmitting(true);
    try {
      // Inscription automatique avec un mot de passe temporaire
      const tempPwd = Math.random().toString(36).slice(2) + 'Aa1!';
      await api.post('/register', {
        first_name: form.prenom,
        last_name:  form.nom,
        email:      form.email,
        password:   tempPwd,
        password_confirmation: tempPwd,
        browserId:  '',
        website:    '', // honeypot
      });

      // Login pour obtenir le token
      const loginRes = await api.post('/login', { email: form.email, password: tempPwd });
      const token = loginRes.data?.data?.access_token;
      if (!token) throw new Error('Authentification échouée');

      // Soumettre la candidature
      const fd = new FormData();
      fd.append('position_id', form.position_id);
      fd.append('slogan',      form.slogan.trim());
      fd.append('bio',         form.bio.trim());
      if (form.photo) fd.append('photo', form.photo);

      await api.post('/apply', fd, {
        headers: {
          'Content-Type':  'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors
        || 'Erreur. Vérifiez vos informations ou créez un compte.';
      toast.error(typeof msg === 'string' ? msg : Object.values(msg).flat().join(' '));
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="land-cand-success animate-zoom-in">
      <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
      <h3 className="text-xl font-black text-slate-900 mt-4">Candidature soumise !</h3>
      <p className="text-slate-500 mt-2 text-sm">
        Votre dossier sera examiné par l'administration du CTS. Un compte électeur a été créé avec votre adresse email.
      </p>
      <Link to="/login" className="btn-primary mt-6 inline-flex">
        Accéder à mon espace électeur <ArrowRight size={15} />
      </Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="land-cand-form" noValidate>
      {/* Nom / Prénom */}
      <div className="grid grid-cols-2 gap-4">
        {[['prenom','Prénom','given-name'],['nom','Nom','family-name']].map(([key, label, ac]) => (
          <div key={key} className="cand-field">
            <label className="cand-label" htmlFor={`lc-${key}`}>{label} *</label>
            <input id={`lc-${key}`} type="text" autoComplete={ac}
              value={form[key]} onChange={(e) => { setForm(p => ({...p, [key]: e.target.value})); setErrors(p => ({...p, [key]:''})); }}
              className={`cand-input ${errors[key] ? 'cand-input-error' : ''}`} placeholder={label} required />
            {errors[key] && <p className="cand-field-error">{errors[key]}</p>}
          </div>
        ))}
      </div>

      {/* Email */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-email">Email institutionnel *</label>
        <input id="lc-email" type="email" autoComplete="email" inputMode="email"
          value={form.email} onChange={(e) => { setForm(p => ({...p, email: e.target.value})); setErrors(p => ({...p, email:''})); }}
          className={`cand-input ${errors.email ? 'cand-input-error' : ''}`}
          placeholder="prenom.nom@uadb.edu.sn" required />
        {errors.email && <p className="cand-field-error">{errors.email}</p>}
      </div>

      {/* Poste */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-position">Poste souhaité *</label>
        <div className="relative">
          <select id="lc-position" value={form.position_id}
            onChange={(e) => { setForm(p => ({...p, position_id: e.target.value})); setErrors(p => ({...p, position_id:''})); }}
            className={`cand-select ${errors.position_id ? 'cand-input-error' : ''}`}>
            <option value="">Sélectionner un poste…</option>
            {positions.map((pos) => <option key={pos.id} value={pos.id}>{pos.title}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {errors.position_id && <p className="cand-field-error">{errors.position_id}</p>}
      </div>

      {/* Slogan */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-slogan">Slogan *</label>
        <input id="lc-slogan" type="text" maxLength={255}
          value={form.slogan} onChange={(e) => { setForm(p => ({...p, slogan: e.target.value})); setErrors(p => ({...p, slogan:''})); }}
          className={`cand-input ${errors.slogan ? 'cand-input-error' : ''}`}
          placeholder="Votre slogan de campagne…" />
        {errors.slogan && <p className="cand-field-error">{errors.slogan}</p>}
      </div>

      {/* Bio */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-bio">Présentation <span className="font-normal text-slate-400 normal-case">(optionnelle)</span></label>
        <textarea id="lc-bio" rows={3} maxLength={5000}
          value={form.bio} onChange={(e) => setForm(p => ({...p, bio: e.target.value}))}
          className="cand-input cand-textarea" placeholder="Présentez-vous brièvement…" />
      </div>

      {/* Photo */}
      <div className="cand-field">
        <label className="cand-label">Photo <span className="font-normal text-slate-400 normal-case">(optionnelle · max 2 Mo)</span></label>
        <div className="cand-photo-zone"
          onClick={() => document.getElementById('lc-photo').click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          {form.preview ? (
            <div className="cand-photo-preview">
              <img src={form.preview} alt="preview" className="cand-photo-img" />
              <div className="cand-photo-preview-overlay">
                <button type="button" onClick={(e) => { e.stopPropagation(); setForm(p => ({...p, photo: null, preview: null})); }} className="cand-photo-remove">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="cand-photo-placeholder">
              <div className="cand-photo-icon"><Camera size={20} /></div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Glissez ou cliquez</p>
                <p className="text-xs text-slate-400">JPG, PNG, WEBP</p>
              </div>
              <div className="cand-photo-upload-btn"><Upload size={13} />Parcourir</div>
            </div>
          )}
        </div>
        <input id="lc-photo" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      <button type="submit" disabled={submitting} className="authv2-submit">
        {submitting
          ? <><span className="authv2-spinner" />Envoi en cours…</>
          : <><FilePlus size={17} />Soumettre ma candidature</>
        }
      </button>
    </form>
  );
}

/* ────────────────────── Landing page ────────────────────────────────────── */
export default function Landing() {
  const [positions, setPositions] = useState([]);

  // Charger les postes pour le formulaire
  useState(() => {
    api.get('/positions').then((res) => {
      if (res.data?.success) setPositions(res.data.data || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="land-root">

      {/* ── Navbar ── */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <div className="land-nav-brand">
            <img src={logocts} alt="CTS" className="land-nav-logo" />
            <div>
              <span className="land-nav-name">Cyber Tech Squad</span>
              <span className="land-nav-sub">UADB · Bambey</span>
            </div>
          </div>
          <div className="land-nav-actions">
            <Link to="/resultats" className="btn-secondary text-xs gap-1.5">
              <Vote size={13} />Résultats
            </Link>
            <Link to="/login" className="btn-primary text-xs gap-1.5">
              Espace électeur <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land-hero">
        <div className="land-hero-inner">
          <div className="land-hero-badge">
            <span className="status-dot-live" />
            Élections du 2ème Bureau — 2026
          </div>
          <h1 className="land-hero-title">
            Élisez le bureau du<br />
            <span className="land-hero-accent">Cyber Tech Squad</span>
          </h1>
          <p className="land-hero-sub">
            Plateforme électorale sécurisée et anonyme pour les membres du club de cybersécurité de l'UADB.
            Votez, candidatez et suivez les résultats en toute transparence.
          </p>
          <div className="land-hero-ctas">
            <Link to="/login" className="authv2-submit land-hero-cta-primary">
              <Vote size={18} />Accéder au vote
            </Link>
            <a href="#candidater" className="btn-secondary land-hero-cta-secondary">
              <FilePlus size={16} />Candidater
            </a>
          </div>
          <div className="land-hero-trust">
            {['Anonymisé','Sécurisé','Auditable','Transparent'].map((t) => (
              <span key={t} className="land-trust-item">
                <Shield size={11} className="text-emerald-500" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── À propos du club ── */}
      <section className="land-section land-section-alt">
        <div className="land-container">
          <div className="land-section-header">
            <h2 className="land-section-title">Le Cyber Tech Squad</h2>
            <p className="land-section-sub">
              Club étudiant de cybersécurité de l'Université Alioune Diop de Bambey (UADB), Sénégal.
            </p>
          </div>
          <div className="land-about-grid">
            {[
              { icon: Shield,  title: 'Notre mission',  text: 'Former et sensibiliser les étudiants aux enjeux de la cybersécurité, aux bonnes pratiques numériques et aux métiers de la sécurité informatique.' },
              { icon: Users,   title: 'Notre communauté', text: 'Une communauté dynamique d\'étudiants passionnés par la tech, la sécurité offensive et défensive, le pentesting et les compétitions CTF.' },
              { icon: Trophy,  title: 'Nos activités',  text: 'CTF mensuels, ateliers pratiques, mentorat, veille technologique, certifications, conférences et partenariats avec l\'industrie.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="land-about-card">
                <div className="land-about-icon"><Icon size={22} /></div>
                <h3 className="land-about-title">{title}</h3>
                <p className="land-about-text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Postes ── */}
      <section className="land-section">
        <div className="land-container">
          <div className="land-section-header">
            <h2 className="land-section-title">Les postes à pourvoir</h2>
            <p className="land-section-sub">
              Le bureau du CTS est composé de 6 postes. Chaque poste joue un rôle clé dans le fonctionnement du club.
            </p>
          </div>
          <div className="land-postes-grid">
            {POSTES.map((p) => (
              <div key={p.titre} className={`land-poste-card bg-gradient-to-br ${p.couleur}`}>
                <div className={`land-poste-icon ${p.iconColor}`}>
                  <span className="text-2xl">{p.emoji}</span>
                </div>
                <h3 className="land-poste-title">{p.titre}</h3>
                <p className="land-poste-desc">{p.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Candidater sans compte ── */}
      <section id="candidater" className="land-section land-section-alt">
        <div className="land-container land-container-narrow">
          <div className="land-section-header">
            <div className="land-section-badge">
              <FilePlus size={14} />Candidature ouverte
            </div>
            <h2 className="land-section-title">Postulez dès maintenant</h2>
            <p className="land-section-sub">
              Soumettez votre candidature directement avec votre email institutionnel.
              Un compte électeur sera créé automatiquement.
            </p>
          </div>
          <div className="land-cand-card">
            <div className="land-cand-info">
              <Lock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-emerald-800 leading-relaxed">
                Votre candidature sera soumise à validation par l'administration avant publication.
                Réservé aux membres de l'UADB (email @uadb.edu.sn requis).
              </p>
            </div>
            <CandidaturePublique positions={positions} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="flex items-center gap-2">
            <img src={logocts} alt="CTS" style={{ height: '1.5rem', width: '1.5rem', objectFit: 'contain' }} />
            <span className="font-bold text-slate-700">Cyber Tech Squad · UADB</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/resultats" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
              Résultats
            </Link>
            <Link to="/login" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
