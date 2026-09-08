import { Eye, EyeOff, Lock, LogIn, Mail, Phone, ShieldCheck, Vote } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import authService from '../services/authService';
import logocts from '../assets/logo-cts2-removebg-preview.png';
import { useAuth } from '../hooks/useAuth';

export default function LoginCTS() {
  const navigate = useNavigate();
  const { refreshUser, user, loading: sessionLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [formData, setFormData] = useState({ identifiant: '', password: '' });
  const [errors, setErrors] = useState({ identifiant: '', password: '' });

  const validateField = (name, value) => {
    const error = name === 'identifiant' && value && !/^[^\s@]+@uadb\.edu\.sn$/.test(value)
      ? 'Utilisez votre adresse @uadb.edu.sn.'
      : name === 'password' && value && value.length < 8 ? 'Minimum 8 caractères requis.' : '';
    setErrors((current) => ({ ...current, [name]: error }));
  };

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
    validateField(name, value);
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setServerError('');
    try {
      const response = await authService.login({ email: formData.identifiant, password: formData.password });
      const session = response.data;
      if (!session?.access_token || !session?.user) throw new Error('Session non reçue.');
      await refreshUser();
      navigate(session.user.role === 'admin' ? '/admin' : '/voterDashboard', { replace: true });
    } catch (error) {
      setServerError(error?.error || error?.message || error?.response?.data?.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/voterDashboard'} replace />;

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-24 text-slate-800">
    <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full bg-emerald-50 blur-3xl" />
    <header className="fixed inset-x-0 top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link to="/login" className="flex items-center gap-2.5"><img src={logocts} alt="Cyber Tech Squad" className="h-9 w-9 object-contain mix-blend-multiply" /><span className="whitespace-nowrap text-sm font-black text-slate-900">Cyber Tech <span className="text-emerald-600">Squad</span></span></Link><span className="text-[10px] font-bold text-slate-400 sm:text-xs">Election du 2 ème Bureau</span></div></header>
    <section className="relative w-full max-w-[460px]">
      <header className="mb-5 text-center"><h1 className="text-2xl font-black tracking-tight text-slate-900">Bon <span className="text-emerald-600">retour</span></h1><p className="mt-2 text-sm text-slate-500">Accédez à votre espace électoral.</p></header>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
        {serverError && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-semibold text-red-700">{serverError}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3"><span className="h-px flex-1 bg-slate-100" /><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600"><Vote size={22} /></span><span className="h-px flex-1 bg-slate-100" /></div>
          <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Adresse institutionnelle</label><div className="relative"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="identifiant" value={formData.identifiant} onChange={handleChange} type="email" autoComplete="email" placeholder="prenom.nom@uadb.edu.sn" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" required /></div>{errors.identifiant && <p className="mt-1.5 text-[11px] font-medium text-red-600">{errors.identifiant}</p>}</div>
          <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Mot de passe</label><div className="relative"><Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="password" value={formData.password} onChange={handleChange} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••••••" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-14 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-0 flex h-full w-14 items-center justify-center text-slate-400 hover:text-emerald-600" aria-label="Afficher ou masquer le mot de passe">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <p className="mt-1.5 text-[11px] font-medium text-red-600">{errors.password}</p>}</div>
          <button disabled={loading || Boolean(errors.identifiant || errors.password) || !formData.identifiant} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <LogIn size={17} />}{loading ? 'Connexion…' : 'Se connecter'}</button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">Pas encore inscrit ? <Link to="/signup" className="font-bold text-emerald-700 hover:underline">Créer un compte</Link></p>
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><ShieldCheck size={13} className="text-emerald-500" /> Technologie · Sécurité · Innovation</p>
    </section>
  </main>;
}
