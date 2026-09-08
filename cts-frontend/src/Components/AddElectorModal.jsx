import React, { useState } from 'react';
import { UserPlus, Mail, Fingerprint, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

const AddElectorModal = ({ close, onAdd }) => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    identifiant: `CTS-2026-${Math.floor(Math.random() * 900) + 100}`, // Génération auto d'un ID par défaut
    status: 'Validé'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...formData, id: Date.now() });
    close();
  };

  return (
    <Modal isOpen onClose={close} title="Inscrire un électeur" subtitle="Ajout manuel au registre" size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Champ Nom */}
          <div className="space-y-2">
            <label className="modal-label">Nom complet</label>
            <div className="relative">
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
              <input 
                required
                className="modal-field pl-12"
                placeholder="ex: Moussa Traoré"
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
              />
            </div>
          </div>

          {/* Champ Email */}
          <div className="space-y-2">
            <label className="modal-label">Adresse e-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
              <input 
                required
                type="email"
                className="modal-field pl-12"
                placeholder="m.traore@uadb.edu.sn"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Champ Identifiant (Lecture seule ou modifiable) */}
          <div className="space-y-2">
            <label className="modal-label">Identifiant unique</label>
            <div className="relative">
              <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
              <input 
                required
                className="modal-field pl-12 font-mono text-emerald-200"
                value={formData.identifiant}
                onChange={(e) => setFormData({...formData, identifiant: e.target.value})}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={close} 
              className="modal-secondary-action flex-1"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="modal-primary-action flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> Valider
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default AddElectorModal;
