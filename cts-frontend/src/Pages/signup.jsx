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
    } catch { /* non bloquant */ }

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
    <div className="authv2-root">

      {/* ── Logo + nom centré ── */}
      <div className="authv2-brand">
        <img src={logocts} alt="CTS" className="authv2-brand-logo" />
        <div className="authv2-brand-text">
          <span className="authv2-brand-name">Cyber Tech Squad</span>
          <span className="authv2-brand-sub">Plateforme électorale UADB</span>
        </div>
      </div>

      {/* ── Carte ── */}
      <div className="authv2-card">

        <div className="authv2-card-header">
          <h1 className="authv2-card-title">Créer un compte</h1>
          <p className="authv2-card-sub">Élection du 2ème Bureau — UADB</p>
        </div>

        {serverError && (
          <div className="authv2-error" role="alert">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} className="authv2-form">

          {/* Prénom + Nom */}
          <div className="authv2-name-row">
            <div className="authv2-field">
              <label className="authv2-label" htmlFor="su-prenom">Prénom</label>
              <input
                id="su-prenom" name="prenom" type="text"
                autoComplete="given-name"
                value={form.prenom} onChange={handleChange}
                placeholder="Alioune" className="authv2-input" required
              />
            </div>
            <div className="authv2-field">
              <label className="authv2-label" htmlFor="su-nom">Nom</label>
              <input
                id="su-nom" name="nom" type="text"
                autoComplete="family-name"
                value={form.nom} onChange={handleChange}
                placeholder="Diop" className="authv2-input" required
              />
            </div>
          </div>

          {/* Email */}
          <div className="authv2-field">
            <label className="authv2-label" htmlFor="su-email">
              Adresse institutionnelle
            </label>
            <input
              id="su-email" name="email" type="email"
              autoComplete="email" inputMode="email"
              value={form.email} onChange={handleChange}
              placeholder="prenom.nom@uadb.edu.sn"
              className={`authv2-input${errors.email ? ' authv2-input-err' : ''}`}
              required
            />
            {errors.email && <p className="authv2-field-err">{errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div className="authv2-field">
            <label className="authv2-label" htmlFor="su-password">
              Mot de passe
            </label>
            <div className="authv2-input-wrap">
              <input
                id="su-password" name="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password} onChange={handleChange}
                placeholder="12 caractères minimum"
                className={`authv2-input authv2-input-pr${errors.password ? ' authv2-input-err' : ''}`}
                required
              />
              <button
                type="button" onClick={() => setShowPwd((v) => !v)}
                className="authv2-eye"
                aria-label={showPwd ? 'Masquer' : 'Afficher'}
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="authv2-field-err">{errors.password}</p>}

            {/* Force du mot de passe */}
            {form.password.length > 0 && (
              <div className="authv2-pwd-hint">
                <div className="authv2-pwd-bar">
                  {[4, 8, 12].map((t) => (
                    <div key={t} className={`authv2-pwd-seg ${
                      form.password.length >= t
                        ? form.password.length >= 12 ? 'authv2-pwd-strong'
                          : 'authv2-pwd-medium'
                        : 'authv2-pwd-weak'
                    }`} />
                  ))}
                </div>
                <span className={`authv2-pwd-lbl ${
                  form.password.length >= 12 ? 'authv2-pwd-lbl-strong'
                  : form.password.length >= 8 ? 'authv2-pwd-lbl-medium'
                  : 'authv2-pwd-lbl-weak'
                }`}>
                  {form.password.length >= 12 ? 'Fort'
                   : form.password.length >= 8 ? 'Moyen' : 'Faible'}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(errors.email || errors.password)
              || !form.email || !form.prenom || !form.nom}
            className="authv2-submit"
          >
            {loading
              ? <><span className="authv2-spinner" />Création…</>
              : <><UserPlus size={18} />Créer mon compte</>
            }
          </button>
        </form>

        <p className="authv2-switch">
          Déjà inscrit ?{' '}
          <Link to="/login" className="authv2-switch-link">Se connecter</Link>
        </p>
      </div>

      <div className="authv2-footer">
        <ShieldCheck size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
        Sécurisé · Anonymisé · Auditable
      </div>
    </div>
  );
}
