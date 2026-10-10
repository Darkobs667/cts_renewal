/**
 * Landing page publique — /
 * Présentation du CTS, postes, club, et formulaire de candidature sans compte.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, BookOpen, Camera, CheckCircle2, ChevronDown,
  ClipboardList, Crown, FilePlus, Globe, Handshake,
  Lock, MessageSquare, Shield, ShieldCheck, Trophy,
  Upload, Users, Vote, X, Loader2, Menu, Zap,
} from 'lucide-react';
import logocts from '../assets/logo-cts2-removebg-preview.png';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ────────────────────────────────────────────────────────────────────────────
   Postes du bureau
   ────────────────────────────────────────────────────────────────────────── */
const POSTES = [
  {
    titre: 'Président(e)',
    Icon: Crown,
    role: 'Représente le club, coordonne les activités, assure la vision stratégique et porte la voix du CTS auprès des instances de l\'université.',
    accent: '#f59e0b',
    bg:     '#fffbeb',
    border: '#fde68a',
  },
  {
    titre: 'Vice-Président(e)',
    Icon: Handshake,
    role: 'Seconde le président, coordonne les équipes internes, assure la continuité des projets et prend la relève en cas d\'absence.',
    accent: '#3b82f6',
    bg:     '#eff6ff',
    border: '#bfdbfe',
  },
  {
    titre: 'Responsable Organisation',
    Icon: ClipboardList,
    role: 'Planifie et organise les événements, ateliers, CTF et hackathons. Gère la logistique des activités du club.',
    accent: '#16a34a',
    bg:     '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    titre: 'Responsable Pédagogie',
    Icon: BookOpen,
    role: 'Conçoit les programmes de formation, organise les sessions d\'apprentissage et veille au développement des compétences des membres.',
    accent: '#7c3aed',
    bg:     '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    titre: 'Responsable Communication',
    Icon: MessageSquare,
    role: 'Gère la présence en ligne du club, produit les contenus visuels, anime les réseaux sociaux et assure la visibilité du CTS.',
    accent: '#e11d48',
    bg:     '#fff1f2',
    border: '#fecdd3',
  },
  {
    titre: 'Relations Extérieures',
    Icon: Globe,
    role: 'Développe les partenariats avec d\'autres clubs, entreprises tech et institutions. Représente le club lors d\'événements externes.',
    accent: '#0891b2',
    bg:     '#ecfeff',
    border: '#a5f3fc',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   Formulaire candidature publique
   ────────────────────────────────────────────────────────────────────────── */
function CandidaturePublique({ positions }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '',
    position_id: '', slogan: '', bio: '',
    photo: null, preview: null,
  });
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

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nom.trim())    e.nom    = 'Obligatoire';
    if (!form.prenom.trim()) e.prenom = 'Obligatoire';
    if (!form.email.trim() || !/^[^\s@]+@uadb\.edu\.sn$/.test(form.email))
      e.email = 'Adresse @uadb.edu.sn requise';
    if (!form.position_id) e.position_id = 'Sélectionnez un poste';
    if (!form.slogan.trim()) e.slogan = 'Le slogan est obligatoire';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const tempPwd = Math.random().toString(36).slice(2) + 'Aa1!CTS';
      await api.post('/register', {
        first_name: form.prenom, last_name: form.nom,
        email: form.email, password: tempPwd,
        password_confirmation: tempPwd, browserId: '', website: '',
      });
      const loginRes = await api.post('/login', { email: form.email, password: tempPwd });
      const token = loginRes.data?.data?.access_token;
      if (!token) throw new Error('Authentification échouée');
      const fd = new FormData();
      fd.append('position_id', form.position_id);
      fd.append('slogan',      form.slogan.trim());
      fd.append('bio',         form.bio.trim());
      if (form.photo) fd.append('photo', form.photo);
      await api.post('/apply', fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
      });
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors
        || 'Erreur. Vérifiez vos informations ou créez un compte.';
      toast.error(typeof msg === 'string' ? msg : Object.values(msg).flat().join(' '));
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="land-done">
      <div className="land-done-icon">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="land-done-title">Candidature soumise !</h3>
      <p className="land-done-text">
        Votre dossier est en cours d'examen. Un compte électeur a été créé avec votre adresse email.
      </p>
      <Link to="/login" className="land-done-btn">
        Accéder à mon espace <ArrowRight size={15} />
      </Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="land-cand-form" noValidate>

      {/* Nom / Prénom */}
      <div className="land-name-row">
        {[['prenom','Prénom','given-name'],['nom','Nom','family-name']].map(([key, label, ac]) => (
          <div key={key} className="cand-field">
            <label className="cand-label" htmlFor={`lc-${key}`}>{label} *</label>
            <input id={`lc-${key}`} type="text" autoComplete={ac}
              value={form[key]} onChange={set(key)}
              className={`cand-input${errors[key] ? ' cand-input-error' : ''}`}
              placeholder={label} required />
            {errors[key] && <p className="cand-field-error">{errors[key]}</p>}
          </div>
        ))}
      </div>

      {/* Email */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-email">Email institutionnel *</label>
        <input id="lc-email" type="email" autoComplete="email" inputMode="email"
          value={form.email} onChange={set('email')}
          className={`cand-input${errors.email ? ' cand-input-error' : ''}`}
          placeholder="prenom.nom@uadb.edu.sn" required />
        {errors.email && <p className="cand-field-error">{errors.email}</p>}
      </div>

      {/* Poste */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-pos">Poste souhaité *</label>
        <div className="relative">
          <select id="lc-pos" value={form.position_id} onChange={set('position_id')}
            className={`cand-select${errors.position_id ? ' cand-input-error' : ''}`}>
            <option value="">Sélectionner un poste…</option>
            {positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {errors.position_id && <p className="cand-field-error">{errors.position_id}</p>}
      </div>

      {/* Slogan */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-slogan">Slogan de campagne *</label>
        <input id="lc-slogan" type="text" maxLength={255}
          value={form.slogan} onChange={set('slogan')}
          className={`cand-input${errors.slogan ? ' cand-input-error' : ''}`}
          placeholder="Votre slogan phare…" />
        {errors.slogan && <p className="cand-field-error">{errors.slogan}</p>}
      </div>

      {/* Bio */}
      <div className="cand-field">
        <label className="cand-label" htmlFor="lc-bio">
          Présentation <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>(optionnelle)</span>
        </label>
        <textarea id="lc-bio" rows={3} maxLength={5000}
          value={form.bio} onChange={(e) => setForm(p => ({...p, bio: e.target.value}))}
          className="cand-input cand-textarea"
          placeholder="Présentez-vous brièvement…" />
      </div>

      {/* Photo */}
      <div className="cand-field">
        <label className="cand-label">
          Photo <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>(optionnelle · max 2 Mo)</span>
        </label>
        <div className="cand-photo-zone"
          onClick={() => document.getElementById('lc-photo').click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          {form.preview ? (
            <div className="cand-photo-preview">
              <img src={form.preview} alt="preview" className="cand-photo-img" />
              <div className="cand-photo-preview-overlay">
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); setForm(p => ({...p, photo: null, preview: null})); }}
                  className="cand-photo-remove"><X size={14} /></button>
              </div>
            </div>
          ) : (
            <div className="cand-photo-placeholder">
              <div className="cand-photo-icon"><Camera size={20} /></div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Glissez ou cliquez</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>JPG, PNG, WEBP</p>
              </div>
              <div className="cand-photo-upload-btn"><Upload size={12} />Parcourir</div>
            </div>
          )}
        </div>
        <input id="lc-photo" type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {/* Submit */}
      <button type="submit" disabled={submitting} className="land-submit-btn">
        {submitting
          ? <><span className="authv2-spinner" />Envoi en cours…</>
          : <><FilePlus size={17} />Soumettre ma candidature</>
        }
      </button>
    </form>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Landing page
   ────────────────────────────────────────────────────────────────────────── */
export default function Landing() {
  const [positions, setPositions] = useState([]);
  const [menuOpen, setMenuOpen]   = useState(false);

  // Fix: useEffect (pas useState) pour charger les postes
  useEffect(() => {
    api.get('/positions')
      .then((res) => { if (res.data?.success) setPositions(res.data.data || []); })
      .catch(() => {});
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
          {/* Desktop nav */}
          <div className="land-nav-actions">
            <a href="#postes" className="land-nav-link">Postes</a>
            <a href="#candidater" className="land-nav-link">Candidater</a>
            <Link to="/resultats" className="land-nav-link">Résultats</Link>
            <Link to="/login" className="land-nav-cta">
              Espace électeur <ArrowRight size={13} />
            </Link>
          </div>
          {/* Mobile hamburger */}
          <button className="land-nav-burger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <Menu size={20} />
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="land-mobile-menu">
            <a href="#postes"      className="land-mobile-link" onClick={() => setMenuOpen(false)}>Postes</a>
            <a href="#candidater" className="land-mobile-link" onClick={() => setMenuOpen(false)}>Candidater</a>
            <Link to="/resultats" className="land-mobile-link" onClick={() => setMenuOpen(false)}>Résultats</Link>
            <Link to="/login"     className="land-mobile-cta"  onClick={() => setMenuOpen(false)}>
              Espace électeur <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero — fond clair, pas de vert/noir ── */}
      <section className="land-hero">
        <div className="land-hero-inner">
          <div className="land-hero-badge">
            <span className="status-dot-live" />
            Élections du 2ème Bureau — 2026
          </div>
          <h1 className="land-hero-title">
            Élisez le bureau du{' '}
            <span className="land-hero-accent">Cyber Tech Squad</span>
          </h1>
          <p className="land-hero-sub">
            Plateforme électorale sécurisée et anonyme pour les membres du club
            de cybersécurité de l'UADB. Votez, candidatez et suivez les résultats
            en toute transparence.
          </p>
          <div className="land-hero-ctas">
            <Link to="/login" className="land-cta-primary">
              <Vote size={18} />Accéder au vote
            </Link>
            <a href="#candidater" className="land-cta-secondary">
              <FilePlus size={16} />Candidater
            </a>
          </div>
          <div className="land-hero-trust">
            {['Anonymisé', 'Sécurisé', 'Auditable', 'Transparent'].map((t) => (
              <span key={t} className="land-trust-item">
                <ShieldCheck size={12} />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── À propos ── */}
      <section className="land-section">
        <div className="land-container">
          <div className="land-section-header">
            <h2 className="land-section-title">Le Cyber Tech Squad</h2>
            <p className="land-section-sub">
              Club étudiant de cybersécurité de l'Université Alioune Diop de Bambey (UADB), Sénégal.
            </p>
          </div>
          <div className="land-about-grid">
            {[
              { Icon: Shield,  title: 'Notre mission',    text: 'Former et sensibiliser les étudiants aux enjeux de la cybersécurité, aux bonnes pratiques numériques et aux métiers de la sécurité informatique.' },
              { Icon: Users,   title: 'Notre communauté', text: 'Une communauté dynamique d\'étudiants passionnés par la tech, la sécurité offensive et défensive, le pentesting et les compétitions CTF.' },
              { Icon: Trophy,  title: 'Nos activités',   text: 'CTF mensuels, ateliers pratiques, mentorat, veille technologique, certifications, conférences et partenariats avec l\'industrie.' },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="land-about-card">
                <div className="land-about-icon"><Icon size={20} strokeWidth={1.75} /></div>
                <h3 className="land-about-title">{title}</h3>
                <p className="land-about-text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Postes ── */}
      <section id="postes" className="land-section land-section-tinted">
        <div className="land-container">
          <div className="land-section-header">
            <div className="land-section-pill">
              <Zap size={13} />6 postes à pourvoir
            </div>
            <h2 className="land-section-title">Les postes du bureau</h2>
            <p className="land-section-sub">
              Chaque poste joue un rôle clé dans le fonctionnement et le rayonnement du club.
            </p>
          </div>
          <div className="land-postes-grid">
            {POSTES.map((p) => (
              <div key={p.titre} className="land-poste-card"
                style={{ borderColor: p.border, background: p.bg }}>
                <div className="land-poste-icon"
                  style={{ background: p.border, color: p.accent }}>
                  <p.Icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="land-poste-title" style={{ color: '#0f172a' }}>{p.titre}</h3>
                <p className="land-poste-desc">{p.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Candidater ── */}
      <section id="candidater" className="land-section">
        <div className="land-container land-container-narrow">
          <div className="land-section-header">
            <div className="land-section-pill">
              <FilePlus size={13} />Candidature ouverte
            </div>
            <h2 className="land-section-title">Postulez dès maintenant</h2>
            <p className="land-section-sub">
              Soumettez votre candidature avec votre email institutionnel. Un compte électeur
              sera créé automatiquement.
            </p>
          </div>

          <div className="land-cand-card">
            <div className="land-cand-info">
              <Lock size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.8125rem', color: '#166534', lineHeight: 1.6 }}>
                Votre candidature sera soumise à validation avant publication.
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
          <div className="land-footer-brand">
            <span>Cyber Tech Squad · UADB Bambey · 2026</span>
          </div>
          <div className="land-footer-links">
            <Link to="/resultats">Résultats</Link>
            <Link to="/login">Connexion</Link>
            <a href="#candidater">Candidater</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
