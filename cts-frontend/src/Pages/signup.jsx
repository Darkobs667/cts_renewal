import React, { useState } from 'react';
import { MailQuestionMark, Lock, Eye, EyeOff, UserPlus, ShieldCheck, Vote } from 'lucide-react';
import { Link, useNavigate } from "react-router";
import logocts from "../assets/logo-cts2-removebg-preview.png";
import authService from '../services/authService';
import toast from 'react-hot-toast';

const errorToMessage = (error) => {
    if (typeof error === 'string') return error;
    if (Array.isArray(error)) return error.filter(Boolean).join(' ');
    if (error && typeof error === 'object') {
        const messages = Object.values(error).flatMap((value) => Array.isArray(value) ? value : [value]);
        return messages.filter((value) => typeof value === 'string' && value.trim()).join(' ') || 'Les informations saisies sont invalides.';
    }
    return 'Une erreur est survenue. Réessayez.';
};

const SignUp = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });

    const validateField = (name, value) => {
        let errorMsg = '';
        if (name === 'email') {
            const uadbRegex = /^[^\s@]+@uadb\.edu\.sn$/;
            if (value && !uadbRegex.test(value)) {
                errorMsg = "Seules les adresses @uadb.edu.sn sont autorisées.";
            }
        }
        if (name === 'password') {
            if (value && value.length < 12) {
                errorMsg = "Le mot de passe doit contenir au moins 12 caractères.";
            }
        }
        setErrors(prev => ({ ...prev, [name]: errorMsg }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
        setServerError('');
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setServerError('');

    // Le calcul d'empreinte est nécessaire seulement à l'inscription : le
    // charger ici garde la page initiale légère et ne bloque pas sa saisie.
    let browserId = '';
    try {
        const { default: FingerprintJS } = await import('@fingerprintjs/fingerprintjs');
        const fingerprint = await FingerprintJS.load();
        browserId = (await fingerprint.get()).visitorId;
    } catch {
        // L'empreinte est un signal anti-abus, jamais une preuve d'identité.
        // Le serveur conserve ses propres contrôles de sécurité.
    }

    const dataForLaravel = {
        first_name: formData.prenom || '',
        last_name: formData.nom || '',
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password,
        code: null,
        browserId: browserId
    };

    

    try {
        const response = await authService.register(dataForLaravel);

        // 1. Vérifier si la réponse contient une erreur (singulier ou pluriel)
        if (response && (response.error || response.errors)) {
            setServerError(errorToMessage(response.error || response.errors));
            return;
        }

        // 2. Pas d'erreur -> succès
        toast.success("Votre compte électoral est créé.");
        navigate('/login', { replace: true, state: { registered: true } });

    } catch (err) {
        // 3. Gestion de toute erreur levée (réseau, HTTP, ou objet retourné)
        

        let message = "Erreur de connexion au serveur.";

        // Si l'erreur a directement une propriété 'error' ou 'errors'
        if (err?.error) message = err.error;
        else if (err?.errors) message = err.errors;
        // Si c'est une erreur Axios avec response
        else if (err?.response?.data?.error) message = err.response.data.error;
        else if (err?.response?.data?.errors) message = err.response.data.errors;
        else if (err?.response?.data?.message) message = err.response.data.message;
        // Si c'est une erreur JavaScript classique
        else if (err?.message) message = err.message;
        else if (typeof err === 'string') message = err;

        setServerError(errorToMessage(message));
    } finally {
        setLoading(false);
    }
};

    return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-24 text-slate-800">
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-emerald-50 blur-3xl" />
        <header className="fixed inset-x-0 top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link to="/login" className="flex items-center gap-2.5"><img src={logocts} alt="Cyber Tech Squad" className="h-9 w-9 object-contain mix-blend-multiply" /><span className="whitespace-nowrap text-sm font-black text-slate-900">Cyber Tech <span className="text-emerald-600">Squad</span></span></Link><span className="text-[10px] font-bold text-slate-400 sm:text-xs">Election du 2 ème Bureau</span></div></header>
        <section className="relative w-full max-w-[500px]">
            <header className="mb-5 text-center"><h1 className="text-2xl font-black tracking-tight text-slate-900">Créer un <span className="text-emerald-600">compte</span></h1><p className="mt-2 text-sm text-slate-500">Rejoignez la plateforme électorale.</p></header>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
                {serverError && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-semibold text-red-700">{serverError}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-3"><span className="h-px flex-1 bg-slate-100" /><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600"><Vote size={22} /></span><span className="h-px flex-1 bg-slate-100" /></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Prénom</label><input name="prenom" value={formData.prenom} onChange={handleChange} type="text" autoComplete="given-name" placeholder="Alioune" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" required /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nom</label><input name="nom" value={formData.nom} onChange={handleChange} type="text" autoComplete="family-name" placeholder="Diop" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" required /></div></div>
                    <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Adresse institutionnelle</label><div className="relative"><MailQuestionMark size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="email" value={formData.email} onChange={handleChange} type="email" autoComplete="email" placeholder="prenom.nom@uadb.edu.sn" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" required /></div>{errors.email && <p className="mt-1.5 text-[11px] font-medium text-red-600">{errors.email}</p>}</div>
                    <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Mot de passe</label><div className="relative"><Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="password" value={formData.password} onChange={handleChange} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="12 caractères minimum" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-14 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-0 flex h-full w-14 items-center justify-center text-slate-400 hover:text-emerald-600" aria-label="Afficher ou masquer le mot de passe">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <p className="mt-1.5 text-[11px] font-medium text-red-600">{errors.password}</p>}</div>
                    <button disabled={loading || Boolean(errors.email || errors.password) || !formData.email} type="submit" className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <UserPlus size={17} />}{loading ? 'Création…' : 'Créer mon compte'}</button>
                </form>
                <p className="mt-5 text-center text-xs text-slate-500">Déjà inscrit ? <Link to="/login" className="font-bold text-emerald-700 hover:underline">Se connecter</Link></p>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><ShieldCheck size={13} className="text-emerald-500" /> Technologie · Sécurité · Innovation</p>
        </section>
    </main>;
};

export default SignUp;
