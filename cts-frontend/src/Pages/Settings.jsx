import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Camera, Save, CheckCircle2 } from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import Modal from '../Components/Modal';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import candidateService from '../services/candidateService';
import api from '../services/api';
import { candidatePhotoUrl } from '../utils/media';
import toast from 'react-hot-toast';

const candidateName = (c) =>
  c.user?.nom ||
  [c.user?.first_name, c.user?.last_name].filter(Boolean).join(' ').trim() ||
  `Utilisateur #${c.user_id}`;

const BLANK_FORM = {
  user_id: '', position_id: '', slogan: '', bio: '', photo: null, preview: null,
};

export default function Candidats() {
  const [candidats,  setCandidats]  = useState([]);
  const [users,      setUsers]      = useState([]);
  const [positions,  setPositions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(BLANK_FORM);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, uRes, pRes] = await Promise.all([
        candidateService.getAll(),
        api.get('/users'),
        api.get('/positions'),
      ]);
      setCandidats(Array.isArray(cRes) ? cRes : []);
      setUsers(uRes.data?.data || []);
      setPositions(pRes.data?.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(BLANK_FORM); setShowModal(true); };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      user_id: c.user_id || c.user?.id || '',
      position_id: c.position_id || c.position?.id || '',
      slogan: c.slogan || '',
      bio:    c.bio    || '',
      photo:  null,
      preview: candidatePhotoUrl(c.photo_url || c.photo_path) || null,
    });
    setShowModal(true);
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((p) => ({ ...p, photo: file, preview: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.position_id) {
      toast.error('Sélectionnez un électeur et un poste.'); return;
    }
    const fd = new FormData();
    fd.append('user_id',     form.user_id);
    fd.append('position_id', form.position_id);
    fd.append('slogan', form.slogan || '');
    fd.append('bio',    form.bio    || '');
    if (form.photo) fd.append('photo', form.photo);

    setSaving(true);
    try {
      if (editing) {
        const res = await candidateService.update(editing.id, fd);
        setCandidats((p) => p.map((c) => c.id === res?.data?.id ? res.data : c));
      } else {
        await candidateService.create(fd);
      }
      toast.success(editing ? 'Candidat modifié.' : 'Candidat ajouté.');
      setShowModal(false);
      load();
    } catch { toast.error('Impossible d\'enregistrer le candidat.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await candidateService.delete(deletingId);
      setCandidats((p) => p.filter((c) => c.id !== deletingId));
      toast.success('Candidat supprimé.');
      setDeletingId(null);
    } catch { toast.error('Impossible de supprimer ce candidat.'); }
    finally { setDeleting(false); }
  };

  return (
    <AdminLayout>
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => !deleting && setDeletingId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        tone="danger"
        title="Supprimer ce candidat ?"
        description="La candidature sera supprimée définitivement."
        confirmLabel="Supprimer"
      />

      {/* Modale ajout / édition */}
      {showModal && (
        <Modal isOpen onClose={() => setShowModal(false)} size="lg"
          title={editing ? 'Modifier le candidat' : 'Ajouter un candidat'}
          subtitle="Rattachez un électeur à un poste et personnalisez sa fiche.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="modal-label">Électeur *</label>
              <select required value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="modal-select">
                <option value="">-- Choisir un électeur --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.nom} — {u.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="modal-label">Poste (scrutin) *</label>
              <select required value={form.position_id}
                onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                className="modal-select">
                <option value="">-- Choisir un poste --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.is_active == 1 ? 'Actif' : 'Inactif'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="modal-label">Slogan</label>
              <input value={form.slogan}
                onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                className="modal-field" placeholder="Une phrase percutante…" />
            </div>

            <div>
              <label className="modal-label">Bio <span className="font-normal text-slate-400 normal-case tracking-normal">(optionnelle)</span></label>
              <textarea value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3} className="modal-field resize-none"
                placeholder="Présentez le candidat en quelques mots…" />
            </div>

            <div>
              <label className="modal-label">Photo</label>
              <div className="flex items-center gap-4">
                <button type="button"
                  onClick={() => document.getElementById('cand-photo-input').click()}
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden
                    rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400
                    transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600">
                  {form.preview
                    ? <img src={form.preview} className="h-full w-full object-cover" alt="Preview" />
                    : <Camera size={22} />
                  }
                </button>
                <input id="cand-photo-input" type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])} />
                {form.preview && (
                  <button type="button"
                    onClick={() => setForm({ ...form, photo: null, preview: null })}
                    className="text-xs font-semibold text-red-500 hover:text-red-700">
                    Supprimer la photo
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setShowModal(false)}
                className="modal-secondary-action flex-1">Annuler</button>
              <button type="submit" disabled={saving}
                className="modal-primary-action flex-1 flex items-center justify-center gap-2">
                {editing ? <Save size={15} /> : <CheckCircle2 size={15} />}
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Page */}
      <div className="mx-auto max-w-6xl space-y-5">

        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-xl font-black text-slate-900">Candidats & scrutins</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Gérez les candidats et leur rattachement aux postes
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} />Ajouter un candidat
          </button>
        </div>

        <div className="content-card animate-fade-up delay-50">
          {loading ? (
            <Loading text="Chargement des candidats…" className="py-16" />
          ) : candidats.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Aucun candidat"
              description="Ajoutez le premier candidat à un scrutin."
              action={<button onClick={openCreate} className="btn-primary"><Plus size={14} />Ajouter</button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidat</th>
                    <th>Poste</th>
                    <th>Slogan</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidats.map((c) => {
                    const name   = candidateName(c);
                    const photo  = candidatePhotoUrl(c.photo_url || c.photo_path);
                    const active = c.position?.is_active == 1;
                    return (
                      <tr key={c.id}>
                        {/* Candidat */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg
                              border border-slate-200 bg-slate-100">
                              {photo
                                ? <img src={photo} alt={name} className="h-full w-full object-cover" />
                                : <div className="flex h-full w-full items-center justify-center
                                    text-xs font-bold text-slate-500">
                                    {name[0]}
                                  </div>
                              }
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{name}</p>
                              <p className="text-[10px] text-slate-400">{c.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Poste */}
                        <td>
                          <p className="text-sm font-semibold text-slate-700">
                            {c.position?.title || `Poste #${c.position_id}`}
                          </p>
                          <span className={`badge mt-1 ${active ? 'badge-green' : 'badge-slate'}`}>
                            {active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        {/* Slogan */}
                        <td>
                          <p className="max-w-xs truncate text-xs italic text-slate-500">
                            {c.slogan || '—'}
                          </p>
                        </td>
                        {/* Status candidature */}
                        <td>
                          <span className={`badge ${
                            c.status === 'valide'     ? 'badge-green' :
                            c.status === 'en_attente' ? 'badge-amber' : 'badge-red'
                          }`}>
                            {c.status === 'valide'     ? 'Validé' :
                             c.status === 'en_attente' ? 'En attente' : 'Refusé'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(c)} className="action-btn-edit" title="Modifier">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => setDeletingId(c.id)} className="action-btn-delete" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
