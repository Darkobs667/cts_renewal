import React, { useState, useEffect } from 'react';
import AdminLayout from '../Components/AdminLayout';
import {
  Plus,
  Trash2,
  Edit3,
  Camera,
  Loader2,
  CheckCircle2,
  Save,
  Quote,
} from 'lucide-react';
import candidateService from '../services/candidateService';
import api from '../services/api'; // on garde api uniquement pour récupérer users et positions
import { candidatePhotoUrl } from '../utils/media';
import Modal from '../Components/Modal';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import toast from 'react-hot-toast';

const candidateName = (candidate) => {
  const user = candidate.user;
  return user?.nom || [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || `Utilisateur #${candidate.user_id}`;
};

const Candidats = () => {
  const [candidats, setCandidats] = useState([]);
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour la modale
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [form, setForm] = useState({
    user_id: '',
    position_id: '',
    slogan: '',
    bio: '',
    photo: null,
    preview: null,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCandidats = async () => {
    try {
      const data = await candidateService.getAll();
      setCandidats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement candidats', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await api.get('/positions');
      if (res.data && res.data.success) {
        setPositions(res.data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement postes', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCandidats(), fetchUsers(), fetchPositions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, photo: file, preview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({
      user_id: '',
      position_id: '',
      slogan: '',
      bio: '',
      photo: null,
      preview: null,
    });
    setEditingCandidate(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (candidate) => {
  setEditingCandidate(candidate);
  setForm({
    user_id: candidate.user_id || candidate.user?.id || '',
    position_id: candidate.position_id || candidate.position?.id || '',
    slogan: candidate.slogan || '',
    bio: candidate.bio || '',
    photo: null,
    preview: candidate.photo_path
      ? candidatePhotoUrl(candidate.photo_url || candidate.photo_path)
      : candidate.user?.photo
      ? `${import.meta.env.VITE_STORAGE_URL}/${candidate.user.photo}`
      : null,
  });
  setShowModal(true);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.position_id) {
      toast.error('Sélectionnez un électeur et un poste.');
      return;
    }

    const payload = new FormData();
    payload.append('user_id', form.user_id);
    payload.append('position_id', form.position_id);
    payload.append('slogan', form.slogan || '');
    payload.append('bio', form.bio || '');
    if (form.photo) {
      payload.append('photo', form.photo);
    }

    try {
      setSaving(true);
      if (editingCandidate) {
        const updated = await candidateService.update(editingCandidate.id, payload);
        if (!updated?.data) throw new Error('La candidature mise à jour est absente de la réponse serveur.');
        setCandidats((prev) => prev.map((candidate) => candidate.id === updated.data.id ? updated.data : candidate));
      } else {
        await candidateService.create(payload);
      }
      toast.success(editingCandidate ? 'Candidat modifié avec succès.' : 'Candidat ajouté avec succès.');
      setShowModal(false);
      resetForm();
      fetchCandidats();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le candidat.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await candidateService.delete(deletingId);
      setCandidats((previous) => previous.filter((candidate) => candidate.id !== deletingId));
      toast.success('Candidat supprimé.');
      setDeletingId(null);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de supprimer ce candidat.');
    } finally {
      setDeleting(false);
    }
  };


  return (
    <AdminLayout activePage="candidats">
      <ConfirmDialog isOpen={Boolean(deletingId)} onClose={() => !deleting && setDeletingId(null)} onConfirm={handleDelete} loading={deleting} tone="danger" title="Supprimer ce candidat ?" description="La candidature et ses informations associées seront supprimées définitivement." confirmLabel="Supprimer" />
      {/* Modale d'ajout / modification */}
      {showModal && (
        <Modal isOpen onClose={() => setShowModal(false)} size="lg"
          title={editingCandidate ? 'Modifier le candidat' : 'Ajouter un candidat'}
          subtitle="Rattachez un électeur à un poste et personnalisez sa fiche">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Sélection utilisateur */}
              <div>
                <label className="modal-label">Électeur</label>
                <select
                  required
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                  className="modal-select"
                >
                  <option value="">-- Choisir un électeur --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection poste */}
              <div>
                <label className="modal-label">Poste (scrutin)</label>
                <select
                  required
                  value={form.position_id}
                  onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                  className="modal-select"
                >
                  <option value="">-- Choisir un poste --</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title} ({pos.is_active == 1 ? 'Actif' : 'Inactif'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Slogan */}
              <div>
                <label className="modal-label flex items-center gap-1">
                  <Quote size={10} className="text-emerald-500" /> Slogan de campagne
                </label>
                <input
                  value={form.slogan}
                  onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                  placeholder="Une phrase qui claque..."
                  className="modal-field"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="modal-label">Bio <span className="normal-case tracking-normal text-slate-400">(optionnelle)</span></label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="modal-field resize-none"
                  placeholder="Présentez le candidat en quelques mots..."
                />
              </div>

              {/* Photo */}
              <div>
                <label className="modal-label">Photo du candidat</label>
                <div className="flex items-center gap-6">
                  <div
                    onClick={() => document.getElementById('cand-photo').click()}
                    className="w-24 h-24 rounded-[30px] bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center cursor-pointer overflow-hidden hover:border-emerald-400 transition-all"
                  >
                    {form.preview ? (
                      <img src={form.preview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center">
                        <Camera className="mx-auto text-emerald-500" size={28} />
                        <span className="text-[8px] font-black text-emerald-600 uppercase mt-1 block">Ajouter</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="cand-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                  />
                  {form.preview && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photo: null, preview: null })}
                      className="text-emerald-700 text-xs font-bold hover:text-emerald-950"
                    >
                      Supprimer la photo
                    </button>
                  )}
                </div>
              </div>
            <div className="flex gap-3 border-t border-emerald-100 pt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="modal-secondary-action flex-1"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="modal-primary-action flex-1 flex items-center justify-center gap-3"
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : editingCandidate ? (
                  <Save size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                {editingCandidate ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
            </form>
        </Modal>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Candidats & scrutins</h1>
            <p className="text-slate-500 text-xs font-medium mt-1">
              Gérez les candidats et leur rattachement aux postes
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn h-14 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-2xl flex items-center gap-3 px-8 shadow-xl shadow-emerald-100 transition-all font-black text-xs"
          >
            <Plus size={20} /> Ajouter un candidat
          </button>
        </div>

        {/* Liste des candidats */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {loading ? (
            <Loading text="Chargement des candidats…" />
          ) : candidats.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Aucun candidat enregistré" description="Ajoutez le premier candidat à un scrutin." action={<button onClick={openCreateModal} className="modal-primary-action">Ajouter un candidat</button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Photo</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Candidat</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Poste</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Slogan</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {candidats.map((candidat) => (
                    <tr key={candidat.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200">
                          {candidat.photo_path ? (
                            <img
                              src={candidatePhotoUrl(candidat.photo_url || candidat.photo_path)}
                              alt={candidateName(candidat)}
                              className="w-full h-full object-cover"
                            />
                          ) : candidat.user?.photo ? (
                            <img
                              src={candidatePhotoUrl(candidat.photo_url || candidat.photo_path)}
                              alt={candidateName(candidat)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 font-black text-sm">
                              {candidateName(candidat).charAt(0)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">
                          {candidateName(candidat)}
                        </p>
                        <p className="text-[11px] text-slate-400">{candidat.user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-slate-800">
                          {candidat.position?.title || `Poste #${candidat.position_id}`}
                        </p>
                        <span className={`mt-1 px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                          candidat.position?.is_active == 1
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {candidat.position?.is_active == 1 ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 italic max-w-xs truncate">
                          {candidat.slogan || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(candidat)}
                            className="p-2.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => setDeletingId(candidat.id)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Candidats;
