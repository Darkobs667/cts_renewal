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
    <div className="authv2-root">

      {/* ── Logo + nom centré (comme UAD Deukouway) ── */}
      <div className="authv2-brand">
        <img src={logocts} alt="CTS" className="authv2-brand-logo" />
        <div className="authv2-brand-text">
          <span className="authv2-brand-name">Cyber Tech Squad</span>
          <span className="authv2-brand-sub">Plateforme électorale UADB</span>
        </div>
      </div>

      {/* ── Carte principale ── */}
      <div className="authv2-card">

        {/* En-tête carte */}
        <div className="authv2-card-header">
          <h1 className="authv2-card-title">Connexion</h1>
          <p className="authv2-card-sub">Accédez à votre espace électoral</p>
        </div>

        {/* Erreur serveur */}
        {serverError && (
          <div className="authv2-error" role="alert">{serverError}</div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="authv2-form">

          {/* Email */}
          <div className="authv2-field">
            <label className="authv2-label" htmlFor="login-email">
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
              className={`authv2-input${errors.email ? ' authv2-input-err' : ''}`}
              required
            />
            {errors.email && <p className="authv2-field-err">{errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div className="authv2-field">
            <label className="authv2-label" htmlFor="login-password">
              Mot de passe
            </label>
            <div className="authv2-input-wrap">
              <input
                id="login-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className={`authv2-input authv2-input-pr${errors.password ? ' authv2-input-err' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="authv2-eye"
                aria-label={showPwd ? 'Masquer' : 'Afficher'}
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="authv2-field-err">{errors.password}</p>}
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading || Boolean(errors.email || errors.password) || !form.email}
            className="authv2-submit"
          >
            {loading
              ? <><span className="authv2-spinner" />Connexion…</>
              : <><LogIn size={18} />Se connecter</>
            }
          </button>
        </form>

        {/* Lien inscription */}
        <p className="authv2-switch">
          Pas encore inscrit ?{' '}
          <Link to="/signup" className="authv2-switch-link">Créer un compte</Link>
        </p>
      </div>

      {/* Footer */}
      <div className="authv2-footer">
        <ShieldCheck size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
        Sécurisé · Anonymisé · Auditable
      </div>
    </div>
  );
}
