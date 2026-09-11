import { useState } from 'react';
import { Eye, EyeOff, Lock, MailQuestion, ShieldCheck, UserPlus } from 'lucide-react';
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
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm]             = useState({ prenom: '', nom: '', email: '', password: '' });
  const [errors, setErrors]         = useState({ email: '', password: '' });

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
        first_name: form.prenom,
        last_name:  form.nom,
        email:      form.email,
        password:   form.password,
        password_confirmation: form.password,
        code:       null,
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
        err?.error            ?? err?.errors                    ??
        err?.response?.data?.error  ?? err?.response?.data?.errors ??
        err?.response?.data?.message ?? err?.message             ?? err;
      setServerError(normalizeError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[420px] lg:flex-col lg:justify-between
        bg-slate-900 p-10 text-white shrink-0">
        <div className="flex items-center gap-3">
          <img src={logocts} alt="CTS" className="h-9 w-9 object-contain brightness-0 invert" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cyber Tech</p>
            <p className="text-sm font-black uppercase leading-none">Squad</p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black leading-tight text-white">
            Rejoignez la<br />
            <span className="text-emerald-400">plateforme électorale</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Créez votre compte avec votre adresse institutionnelle UADB pour participer aux élections.
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
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <img src={logocts} alt="CTS" className="h-8 w-8 object-contain mix-blend-multiply" />
          <span className="text-sm font-black text-slate-900">
            Cyber Tech <span className="text-emerald-600">Squad</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Créer un compte</h2>
            <p className="mt-1 text-sm text-slate-500">
              Élection du 2ème Bureau — UADB
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3
                text-xs font-semibold text-red-700">
                {serverError}
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="modal-label">Prénom</label>
                <input
                  name="prenom"
                  type="text"
                  autoComplete="given-name"
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Alioune"
                  className="modal-field"
                  required
                />
              </div>
              <div>
                <label className="modal-label">Nom</label>
                <input
                  name="nom"
                  type="text"
                  autoComplete="family-name"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Diop"
                  className="modal-field"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="modal-label">Adresse institutionnelle</label>
              <div className="relative">
                <MailQuestion size={15} className="pointer-events-none absolute left-3.5
                  top-1/2 -translate-y-1/2 text-slate-400" />
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
                <Lock size={15} className="pointer-events-none absolute left-3.5
                  top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="12 caractères minimum"
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
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Création…</>
                : <><UserPlus size={16} />Créer mon compte</>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
