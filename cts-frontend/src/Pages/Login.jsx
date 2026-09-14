import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import authService from '../services/authService';
import logocts from '../assets/logo-cts2-removebg-preview.png';
import { useAuth } from '../hooks/useAuth';

export default function LoginCTS() {
  const navigate = useNavigate();
  const { refreshUser, user, loading: sessionLoading } = useAuth();
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm]               = useState({ email: '', password: '' });
  const [errors, setErrors]           = useState({ email: '', password: '' });

  const validate = (name, value) => {
    if (name === 'email' && value && !/^[^\s@]+@uadb\.edu\.sn$/.test(value))
      return 'Adresse @uadb.edu.sn requise.';
    if (name === 'password' && value && value.length < 12)
      return 'Minimum 12 caractères.';
    return '';
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: validate(name, value) }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setServerError('');
    try {
      const res     = await authService.login({ email: form.email, password: form.password });
      const session = res.data;
      if (!session?.access_token || !session?.user) throw new Error('Session non reçue.');
      await refreshUser();
      navigate(session.user.role === 'admin' ? '/admin' : '/voterDashboard', { replace: true });
    } catch (err) {
      setServerError(
        err?.error || err?.message || err?.response?.data?.message || 'Identifiants incorrects.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/voterDashboard'} replace />;

  return (
    <div className="auth-root">
      {/* ════════════ LEFT PANEL ════════════ */}
      <div className="auth-panel-left">
        {/* Logo — ancré en haut à gauche */}
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

        {/* Hero text */}
        <div className="auth-hero">
          <div className="auth-live-badge">
            <span className="status-dot-live" />
            Plateforme électorale active
          </div>
          <h1 className="auth-hero-title">
            Élections du<br />
            <span className="auth-hero-accent">2ème Bureau</span>
          </h1>
          <p className="auth-hero-sub">
            Votez en toute sécurité et transparence.<br />Chaque voix compte.
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

        {/* Mobile hero */}
        <div className="auth-mobile-hero">
          <div className="auth-mobile-live-badge">
            <span className="status-dot-live" />
            Plateforme électorale active
          </div>
          <h2 className="auth-mobile-hero-title">
            Élections du <span className="text-emerald-600">2ème Bureau</span>
          </h2>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Connexion</h2>
            <p className="auth-card-sub">Accédez à votre espace électoral.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {serverError && (
              <div className="auth-error-box" role="alert">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="login-email">
                Adresse institutionnelle
              </label>
              <input
                id="login-email"
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
              <label className="auth-label" htmlFor="login-password">
                Mot de passe
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || Boolean(errors.email || errors.password) || !form.email}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Pas encore inscrit ?{' '}
            <Link to="/signup" className="auth-switch-link">
              Créer un compte
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
