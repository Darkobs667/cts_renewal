import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';
import Modal from './Modal';

const CreateElectionModal = ({ close, initialData = null }) => {
  const isEditing = !!initialData;
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitre(initialData.title || '');
      setDescription(initialData.description || '');
      setIsActive(initialData.is_active == 1);
    } else {
      setIsActive(true);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!titre.trim()) return toast.error("Le titre du poste est obligatoire.");

  const payload = {
    title: titre,
    description: description || "Scrutin officiel",
    is_active: isActive,
  };

  try {
    setLoading(true);
    let response;
    if (isEditing) {
      response = await adminService.updatePosition(initialData.id, payload);
    } else {
      response = await adminService.createPosition(payload);
    }

    // ✔️ Succès : soit la réponse contient un id, soit un message, soit un success:true
    const data = response.data;
    if (data && (data.id || data.success || data.message)) {
      toast.success(isEditing ? "Scrutin modifié avec succès." : "Scrutin créé avec succès.");
      close();
    } else {
      // Cas peu probable où la réponse est bizarre
      toast.error("Réponse inattendue du serveur.");
    }
  } catch (error) {
    console.error("Erreur :", error.response?.data || error.message);
    const serverMessage = error.response?.data?.errors?.title?.[0];
    if (serverMessage) toast.error(serverMessage);
    else toast.error("Erreur lors de l'enregistrement.");
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal
      isOpen
      onClose={close}
      size="lg"
      title={isEditing ? 'Modifier le scrutin' : 'Créer un poste / scrutin'}
      subtitle={isEditing ? 'Modifiez les informations du scrutin' : 'Définissez le titre et la description'}
    >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="modal-label">Intitulé du poste / scrutin</label>
            <input required value={titre} onChange={(e) => setTitre(e.target.value)}
              className="modal-field"
              placeholder="ex: Président du Bureau des Étudiants" />
          </div>
          <div>
            <label className="modal-label">Description <span className="normal-case tracking-normal text-slate-400">(optionnelle)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="modal-field resize-none"
              placeholder="Décrivez rapidement l'enjeu de ce scrutin..." />
          </div>
          {isEditing && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="rounded border-emerald-300 text-emerald-500 focus:ring-emerald-400" />
              <label htmlFor="is_active" className="text-sm font-bold text-emerald-950">Scrutin actif</label>
            </div>
          )}
          <div className="flex gap-3 border-t border-emerald-100 pt-5">
          <button type="button" onClick={close} className="modal-secondary-action flex-1">Annuler</button>
          <button type="submit" disabled={loading}
            className="modal-primary-action flex-1 flex items-center justify-center gap-3">
            {loading ? 'Enregistrement...' : (isEditing ? <Save size={20} /> : <CheckCircle2 size={20} />)}
            {isEditing ? 'Enregistrer' : 'Enregistrer'}
          </button>
          </div>
        </form>
    </Modal>
  );
};

export default CreateElectionModal;
