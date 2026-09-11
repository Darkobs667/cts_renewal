import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import authService from '../services/authService';
import logocts from '../assets/logo-cts2-removebg-preview.png';
import { useAuth } from '../hooks/useAuth';

export default function LoginCTS() {
  const navigate = useNavigate();
  const { refreshUser, user, loading: sessionLoading } = useAuth();
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm]           = useState({ email: '', password: '' });
  const [errors, setErrors]       = useState({ email: '', password: '' });

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
      const res = await authService.login({ email: form.email, password: form.password });
      const session = res.data;
      if (!session?.access_token || !session?.user) throw new Error('Session non reçue.');
      await refreshUser();
      navigate(session.user.role === 'admin' ? '/admin' : '/voterDashboard', { replace: true });
    } catch (err) {
      setServerError(
        err?.error || err?.message || err?.response?.data?.message || 'Identifiants incorrects.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/voterDashboard'} replace />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Left panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-[420px] lg:flex-col lg:justify-between
        bg-slate-900 p-10 text-white shrink-0">
        <div className="flex items-center gap-3">
          <img src={logocts} alt="CTS" className="h-9 w-9 object-contain brightness-0 invert" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cyber Tech</p>
            <p className="text-sm font-black uppercase text-white leading-none">Squad</p>
          </div>
        </div>

        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700
            bg-slate-800 px-4 py-2">
            <span className="status-dot-live" />
            <span className="text-[10px] font-semibold text-slate-300">
              Plateforme électorale active
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-white">
            Élections du<br />
            <span className="text-emerald-400">2ème Bureau</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Votez en toute sécurité et transparence. Chaque voix compte.
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-800 pt-6">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Sécurisé · Anonymisé · Auditable
          </span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <img src={logocts} alt="CTS" className="h-8 w-8 object-contain mix-blend-multiply" />
          <span className="text-sm font-black text-slate-900">
            Cyber Tech <span className="text-emerald-600">Squad</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Connexion</h2>
            <p className="mt-1 text-sm text-slate-500">
              Accédez à votre espace électoral.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3
                text-xs font-semibold text-red-700">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="modal-label">Adresse institutionnelle</label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2
                  -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="prenom.nom@uadb.edu.sn"
                  className="modal-field pl-10"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="modal-label">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2
                  -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="modal-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                    hover:text-slate-600 transition-colors"
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] font-medium text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(errors.email || errors.password) || !form.email}
              className="btn-primary w-full py-3 text-sm"
            >
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Connexion…</>
                : <><LogIn size={16} />Se connecter</>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Pas encore inscrit ?{' '}
            <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-700">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
