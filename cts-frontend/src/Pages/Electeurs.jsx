import React, { useState, useEffect } from 'react';
import AdminLayout from '../Components/AdminLayout';
import {
  UserPlus,
  Search,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Trash2,
  Link2,
  Check,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import AddElectorModal from '../Components/AddElectorModal';
import { electeurService } from '../services/electeurService';
import api from '../services/api';
import Modal from '../Components/Modal';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import toast from 'react-hot-toast';

const Electeurs = () => {
  const [electeurs, setElecteurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Tous les statuts');

  // États pour l'association à un scrutin
  const [positions, setPositions] = useState([]);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [associateSearch, setAssociateSearch] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState(null);

  // Récupération des électeurs
  const fetchElecteurs = async () => {
    setIsLoading(true);
    try {
      const data = await electeurService.getAll();
      setElecteurs(data);
    } catch (error) {
      console.error("Erreur lors de la récupération :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupération des postes pour l'association
  const fetchPositions = async () => {
    try {
      const response = await api.get('/positions');
      if (response.data && response.data.success) {
        setPositions(response.data.data || []);
      }
    } catch (error) {
      console.error("Erreur chargement des postes", error);
    }
  };

  useEffect(() => {
    fetchElecteurs();
    fetchPositions();
  }, []);

  // Ajout d'un électeur
  const handleAddElector = async (newElectorData) => {
    try {
      const savedElector = await electeurService.create(newElectorData);
      setElecteurs([savedElector, ...electeurs]);
      setShowAddModal(false);
    } catch (error) {
      toast.error("Impossible d'ajouter l'électeur.");
    }
  };

  // Suppression d'un électeur
  const handleDelete = (id) => {
    setConfirmation({ type: 'delete', id });
  };

  // Réinitialisation du mot de passe
  const handleResetPassword = (userId) => {
    setConfirmation({ type: 'reset-password', id: userId });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    setActionLoading(true);
    try {
      if (confirmation.type === 'delete') {
        await electeurService.delete(confirmation.id);
        setElecteurs((current) => current.filter((electeur) => electeur.id !== confirmation.id));
        toast.success('Électeur supprimé.');
      } else {
        const response = await api.put(`/users/${confirmation.id}/reset-password`);
        setTemporaryPassword(response.data.new_password);
      }
      setConfirmation(null);
    } catch (error) {
      toast.error(confirmation.type === 'delete' ? 'Impossible de supprimer cet électeur.' : 'Impossible de réinitialiser le mot de passe.');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssociate = async () => {
    if (!selectedPosition || selectedUsers.length === 0) {
      toast.error('Sélectionnez un poste et au moins un électeur.');
      return;
    }
    try {
      for (const userId of selectedUsers) {
        await api.post('/candidates', {
          user_id: userId,
          position_id: selectedPosition,
        });
      }
      toast.success(`${selectedUsers.length} électeur(s) associé(s) avec succès.`);
      setShowAssociateModal(false);
      setSelectedPosition('');
      setSelectedUsers([]);
      setAssociateSearch('');
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'associer les électeurs. Vérifiez les droits administrateur.");
    }
  };

  // Filtrage principal
  const filteredElecteurs = electeurs.filter((e) => {
    const matchesSearch =
      e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'Tous les statuts') return matchesSearch;
    return matchesSearch && e.status === statusFilter;
  });

  // Filtrage pour la modale d'association
  const filteredAssociationUsers = electeurs.filter((e) => {
    return (
      e.nom.toLowerCase().includes(associateSearch.toLowerCase()) ||
      e.email.toLowerCase().includes(associateSearch.toLowerCase())
    );
  });

  return (
    <AdminLayout>
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => !actionLoading && setConfirmation(null)}
        onConfirm={confirmAction}
        loading={actionLoading}
        tone={confirmation?.type === 'delete' ? 'danger' : 'default'}
        title={confirmation?.type === 'delete' ? 'Supprimer cet électeur ?' : 'Réinitialiser le mot de passe ?'}
        description={confirmation?.type === 'delete' ? 'Cet électeur sera supprimé définitivement de la plateforme.' : 'Un mot de passe temporaire sera généré. Vous devrez le communiquer à l’utilisateur de façon sécurisée.'}
        confirmLabel={confirmation?.type === 'delete' ? 'Supprimer' : 'Générer le mot de passe'}
      />
      <Modal isOpen={Boolean(temporaryPassword)} onClose={() => setTemporaryPassword(null)} size="sm" title="Mot de passe temporaire" subtitle="Communiquez-le à l’utilisateur par un canal sécurisé.">
        <div className="space-y-5">
          <code className="block break-all rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center text-base font-black text-emerald-950">{temporaryPassword}</code>
          <button type="button" onClick={() => setTemporaryPassword(null)} className="modal-primary-action w-full">J’ai noté le mot de passe</button>
        </div>
      </Modal>
      {/* Modal Ajouter un électeur */}
      {showAddModal && (
        <AddElectorModal
          close={() => setShowAddModal(false)}
          onAdd={handleAddElector}
        />
      )}

      {/* Modal Association à un scrutin */}
      {showAssociateModal && (
        <Modal isOpen onClose={() => setShowAssociateModal(false)} size="lg"
          title="Associer à un scrutin"
          subtitle="Sélectionnez un poste et les électeurs à inscrire comme candidats">
            <div className="flex flex-col gap-6">
              <div>
                <label className="modal-label">
                  Choisir un poste (scrutin)
                </label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="modal-select"
                >
                  <option value="">-- Sélectionnez un poste --</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title} ({pos.is_active == 1 ? 'En ligne' : 'Inactif'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="modal-label">
                  Sélectionner les électeurs
                </label>
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                  <input
                    type="text"
                    placeholder="Rechercher un électeur..."
                    value={associateSearch}
                    onChange={(e) => setAssociateSearch(e.target.value)}
                    className="modal-field rounded-xl pl-12"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 bg-emerald-50/70 rounded-2xl p-2 border border-emerald-100">
                  {filteredAssociationUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? 'bg-emerald-400/15 border border-emerald-300/30'
                          : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => {
                          setSelectedUsers((prev) =>
                            prev.includes(user.id)
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id]
                          );
                        }}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-emerald-400/15 flex items-center justify-center text-emerald-200 font-black text-xs border border-emerald-300/20">
                          {user.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-emerald-950">{user.nom}</p>
                          <p className="text-[11px] text-emerald-800/60">{user.email}</p>
                        </div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check size={16} className="text-emerald-300" />
                      )}
                    </label>
                  ))}
                  {filteredAssociationUsers.length === 0 && (
                    <p className="text-center text-emerald-800/60 text-sm py-8">Aucun électeur trouvé</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-emerald-100 pt-5">
              <button
                onClick={() => setShowAssociateModal(false)}
                className="modal-secondary-action flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleAssociate}
                className="modal-primary-action flex-1 flex items-center justify-center gap-3"
              >
                <UserCheck size={20} /> Associer
              </button>
            </div>
        </Modal>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Registre Électoral</h1>
            <p className="text-slate-500 text-xs font-medium mt-1">Gérez la liste des membres</p>
          </div>
          <div className="flex gap-3">
            {/* Bouton Associer à un scrutin */}
            <button
              onClick={() => {
                setSelectedPosition('');
                setSelectedUsers([]);
                setAssociateSearch('');
                setShowAssociateModal(true);
              }}
              className="flex-1 md:flex-none p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 font-bold text-xs"
            >
              <Link2 size={18} /> Associer à un scrutin
            </button>
            {/* Bouton Ajouter un électeur */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 md:flex-none p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 font-bold text-xs"
            >
              <UserPlus size={18} /> Ajouter un électeur
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtre */}
        <div className="bg-white p-4 rounded-[28px] border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 font-medium"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-emerald-400"
          >
            <option>Tous les statuts</option>
            <option>Validé</option>
            <option>En attente</option>
          </select>
        </div>

        {/* Tableau des électeurs */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <Loading text="Chargement des électeurs…" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Électeur</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Status Security</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredElecteurs.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm border border-emerald-200/50 shadow-sm">
                            {user.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{user.nom}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === 'Validé' ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[9px] font-black">
                              <ShieldCheck size={14} /> {user.status}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1 rounded-full text-[9px] font-black">
                              <ShieldAlert size={14} /> {user.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Réinitialiser le mot de passe */}
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound size={18} />
                          </button>
                          {/* Supprimer */}
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                          {/* Associer cette personne à un scrutin (pré-sélectionné) */}
                          <button
                            onClick={() => {
                              setSelectedUsers([user.id]);
                              setSelectedPosition('');
                              setAssociateSearch('');
                              setShowAssociateModal(true);
                            }}
                            className="p-2.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Associer à un scrutin"
                          >
                            <Link2 size={18} />
                          </button>
                          <button className="p-2.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredElecteurs.length === 0 && (
                    <tr>
                      <td colSpan="3"><EmptyState icon={UserCheck} title="Aucun électeur trouvé" description="Modifiez vos critères de recherche ou ajoutez un électeur." /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Electeurs;
