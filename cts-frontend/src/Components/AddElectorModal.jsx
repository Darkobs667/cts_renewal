import { useState } from 'react';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import Modal from './Modal';
import { electeurService } from '../services/electeurService';
import toast from 'react-hot-toast';

/**
 * Formulaire d'inscription d'un nouvel électeur via POST /register.
 * Correction : appel API réel (plus de id: Date.now() côté client).
 */
export default function AddElectorModal({ close, onAdd }) {
  const [form, setForm]     = useState({
    first_name: '', last_name: '', email: '', password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 12) {
      setError('Le mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    setLoading(true);
    try {
      const res = await electeurService.create({
        first_name:            form.first_name,
        last_name:             form.last_name,
        email:                 form.email,
        password:              form.password,
        password_confirmation: form.password,
        browserId:             '',
      });
      toast.success('Électeur inscrit avec succès.');
      onAdd?.(res);
      close();
    } catch (err) {
      const msg =
        err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err?.response?.data?.message || 'Impossible d\'inscrire cet électeur.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={close} title="Inscrire un électeur" subtitle="Création manuelle d'un compte électeur" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3
            text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="modal-label">Prénom</label>
            <div className="relative">
              <User size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="modal-field pl-9" placeholder="Alioune" />
            </div>
          </div>
          <div>
            <label className="modal-label">Nom</label>
            <div className="relative">
              <User size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="modal-field pl-9" placeholder="Diop" />
            </div>
          </div>
        </div>

        <div>
          <label className="modal-label">Email institutionnel</label>
          <div className="relative">
            <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input required type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="modal-field pl-9" placeholder="prenom.nom@uadb.edu.sn" />
          </div>
        </div>

        <div>
          <label className="modal-label">Mot de passe provisoire</label>
          <div className="relative">
            <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input required type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="modal-field pl-9" placeholder="12 caractères minimum"
              autoComplete="new-password" />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            L'électeur devra changer ce mot de passe à sa première connexion.
          </p>
        </div>

        <div className="flex gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={close} className="modal-secondary-action flex-1">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="modal-primary-action flex-1 flex items-center justify-center gap-2">
            <UserPlus size={15} />
            {loading ? 'Inscription…' : 'Inscrire'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
