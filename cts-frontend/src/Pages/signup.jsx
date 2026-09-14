import { Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import authService from '../services/authService';
import logocts from '../assets/logo-cts2-removebg-preview.png';
import toast from 'react-hot-toast';

const normalizeError = (err) => {
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) return err.filter(Boolean).join(' ');
  if (err && typeof err === 'object') {
    const msgs = Object.values(err).flatMap((v) => (Array.isArray(v) ? v : [v]));
    return msgs.filter((v) => typeof v === 'string' && v.trim()).join(' ') || 'Informations invalides.';
  }
  return 'Une erreur est survenue.';
};

export default function SignUp() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm]               = useState({ prenom: '', nom: '', email: '', password: '' });
  const [errors, setErrors]           = useState({ email: '', password: '' });

  const validate = (name, value) => {
    if (name === 'email' && value && !/^[^\s@]+@uadb\.edu\.sn$/.test(value))
      return 'Seules les adresses @uadb.edu.sn sont autorisées.';
    if (name === 'password' && value && value.length < 12)
      return 'Minimum 12 caractères.';
    return '';
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (name === 'email' || name === 'password')
      setErrors((p) => ({ ...p, [name]: validate(name, value) }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setServerError('');

    let browserId = '';
    try {
      const { default: FP } = await import('@fingerprintjs/fingerprintjs');
      const fp = await FP.load();
      browserId = (await fp.get()).visitorId;
    } catch { /* signal anti-abus, non bloquant */ }

    try {
      const res = await authService.register({
        first_name:            form.prenom,
        last_name:             form.nom,
        email:                 form.email,
        password:              form.password,
        password_confirmation: form.password,
        code:                  null,
        browserId,
      });

      if (res?.error || res?.errors) {
        setServerError(normalizeError(res.error || res.errors));
        return;
      }

      toast.success('Compte créé avec succès.');
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      const msg =
        err?.error ?? err?.errors ??
        err?.response?.data?.error  ?? err?.response?.data?.errors ??
        err?.response?.data?.message ?? err?.message ?? err;
      setServerError(normalizeError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* ════════════ LEFT PANEL ════════════ */}
      <div className="auth-panel-left">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img
              src={logocts}
              alt="CTS"
              style={{ height: '1.5rem', width: '1.5rem', objectFit: 'contain' }}
            />
          </div>
          <div>
            <p className="auth-logo-sub">Cyber Tech</p>
            <p className="auth-logo-name">Squad</p>
          </div>
        </div>

        {/* Hero */}
        <div className="auth-hero">
          <h1 className="auth-hero-title">
            Rejoignez la<br />
            <span className="auth-hero-accent">plateforme électorale</span>
          </h1>
          <p className="auth-hero-sub">
            Créez votre compte avec votre adresse institutionnelle UADB pour participer aux élections.
          </p>
        </div>

        {/* Footer */}
        <div className="auth-panel-footer">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Sécurisé · Anonymisé · Auditable</span>
        </div>
      </div>

      {/* ════════════ RIGHT PANEL ════════════ */}
      <div className="auth-panel-right">
        {/* Mobile logo */}
        <div className="auth-mobile-logo">
          <img
            src={logocts}
            alt="CTS"
            style={{ height: '2rem', width: '2rem', objectFit: 'contain' }}
          />
          <span className="auth-mobile-logo-text">
            Cyber Tech <span style={{ color: '#059669' }}>Squad</span>
          </span>
        </div>
          <span className="auth-mobile-logo-text">
            Cyber Tech <span className="text-emerald-600">Squad</span>
          </span>
        </div>

        {/* Mobile hero */}
        <div className="auth-mobile-hero">
          <h2 className="auth-mobile-hero-title">
            Rejoignez la{' '}
            <span className="text-emerald-600">plateforme électorale</span>
          </h2>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Créer un compte</h2>
            <p className="auth-card-sub">Élection du 2ème Bureau — UADB</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {serverError && (
              <div className="auth-error-box" role="alert">
                {serverError}
              </div>
            )}

            {/* Name row */}
            <div className="auth-name-row">
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="signup-prenom">Prénom</label>
                <input
                  id="signup-prenom"
                  name="prenom"
                  type="text"
                  autoComplete="given-name"
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Alioune"
                  className="auth-input"
                  required
                />
              </div>
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="signup-nom">Nom</label>
                <input
                  id="signup-nom"
                  name="nom"
                  type="text"
                  autoComplete="family-name"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Diop"
                  className="auth-input"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="signup-email">
                Adresse institutionnelle
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={handleChange}
                placeholder="prenom.nom@uadb.edu.sn"
                className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                required
              />
              {errors.email && <p className="auth-field-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="signup-password">
                Mot de passe
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="12 caractères minimum"
                  className={`auth-input pr-12 ${errors.password ? 'auth-input-error' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="auth-eye-btn"
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="auth-field-error">{errors.password}</p>}

              {/* Password strength hint */}
              {form.password.length > 0 && (
                <div className="auth-pwd-hint">
                  <div className="auth-pwd-bar">
                    {[4, 8, 12].map((threshold) => (
                      <div
                        key={threshold}
                        className={`auth-pwd-segment ${
                          form.password.length >= threshold
                            ? form.password.length >= 12
                              ? 'auth-pwd-strong'
                              : 'auth-pwd-medium'
                            : 'auth-pwd-weak'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`auth-pwd-label ${
                    form.password.length >= 12
                      ? 'text-emerald-600'
                      : form.password.length >= 8
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }`}>
                    {form.password.length >= 12 ? 'Fort' : form.password.length >= 8 ? 'Moyen' : 'Faible'}
                  </span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || Boolean(errors.email || errors.password) || !form.email || !form.prenom || !form.nom}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Création en cours…
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Déjà inscrit ?{' '}
            <Link to="/login" className="auth-switch-link">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Mobile footer */}
        <div className="auth-mobile-footer">
          <ShieldCheck size={11} className="text-emerald-500" />
          <span>Sécurisé · Anonymisé · Auditable</span>
        </div>
      </div>
    </div>
  );
}
