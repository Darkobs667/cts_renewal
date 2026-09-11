import { useEffect, useState } from 'react';
import { Save, PlusCircle } from 'lucide-react';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';
import Modal from './Modal';

export default function CreateElectionModal({ close, initialData = null }) {
  const isEdit = Boolean(initialData);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [isActive,    setIsActive]    = useState(true);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setIsActive(initialData.is_active == 1);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Le titre est obligatoire.'); return; }

    const payload = { title: title.trim(), description: description.trim() || null, is_active: isActive };

    try {
      setLoading(true);
      if (isEdit) {
        await adminService.updatePosition(initialData.id, payload);
      } else {
        await adminService.createPosition(payload);
      }
      toast.success(isEdit ? 'Scrutin modifié.' : 'Scrutin créé.');
      close();
    } catch (err) {
      const msg = err.response?.data?.errors?.title?.[0]
        || err.response?.data?.message
        || 'Erreur lors de l\'enregistrement.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={close}
      size="md"
      title={isEdit ? 'Modifier le scrutin' : 'Nouveau scrutin'}
      subtitle="Définissez le titre et la description du poste."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="modal-label">Intitulé du poste *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="modal-field"
            placeholder="ex : Président du Bureau Exécutif"
          />
        </div>

        <div>
          <label className="modal-label">Description <span className="normal-case tracking-normal font-normal text-slate-400">(optionnelle)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="modal-field resize-none"
            placeholder="Décrivez l'enjeu de ce scrutin…"
          />
        </div>

        {isEdit && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border
            border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-500
                focus:ring-emerald-400 accent-emerald-500"
            />
            <span className="text-sm font-semibold text-slate-700">Scrutin actif</span>
          </label>
        )}

        <div className="flex gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={close} className="modal-secondary-action flex-1">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="modal-primary-action flex-1 flex items-center justify-center gap-2"
          >
            {isEdit ? <Save size={15} /> : <PlusCircle size={15} />}
            {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
