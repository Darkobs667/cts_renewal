import { useEffect, useState } from 'react';
import {
  UserPlus, Search, ShieldCheck, ShieldAlert,
  Trash2, Link2, KeyRound, UserCheck, Check,
} from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import AddElectorModal from '../Components/AddElectorModal';
import Modal from '../Components/Modal';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import { electeurService } from '../services/electeurService';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Electeurs() {
  const [electeurs,    setElecteurs]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [actionLoading,setActionLoading]= useState(false);
  const [tmpPassword,  setTmpPassword]  = useState(null);

  // Associate modal
  const [positions,      setPositions]      = useState([]);
  const [showAssociate,  setShowAssociate]  = useState(false);
  const [assocPosition,  setAssocPosition]  = useState('');
  const [assocUsers,     setAssocUsers]     = useState([]);
  const [assocSearch,    setAssocSearch]    = useState('');

  const loadElecteurs = async () => {
    setLoading(true);
    try { setElecteurs(await electeurService.getAll()); }
    catch { toast.error('Erreur lors du chargement.'); }
    finally { setLoading(false); }
  };

  const loadPositions = async () => {
    try {
      const res = await api.get('/positions');
      if (res.data?.success) setPositions(res.data.data || []);
    } catch {}
  };

  useEffect(() => { loadElecteurs(); loadPositions(); }, []);

  /* ── Actions ── */
  const confirmAction = async () => {
    if (!confirmation) return;
    setActionLoading(true);
    try {
      if (confirmation.type === 'delete') {
        await electeurService.delete(confirmation.id);
        setElecteurs((p) => p.filter((e) => e.id !== confirmation.id));
        toast.success('Électeur supprimé.');
      } else {
        const res = await api.put(`/users/${confirmation.id}/reset-password`);
        setTmpPassword(res.data.new_password);
      }
      setConfirmation(null);
    } catch {
      toast.error(confirmation.type === 'delete'
        ? 'Impossible de supprimer.'
        : 'Impossible de réinitialiser le mot de passe.');
    } finally { setActionLoading(false); }
  };

  const handleAssociate = async () => {
    if (!assocPosition || !assocUsers.length) {
      toast.error('Sélectionnez un poste et au moins un électeur.'); return;
    }
    try {
      for (const uid of assocUsers)
        await api.post('/candidates', { user_id: uid, position_id: assocPosition });
      toast.success(`${assocUsers.length} candidature(s) créée(s).`);
      setShowAssociate(false);
      setAssocUsers([]);
    } catch { toast.error('Impossible d\'associer.'); }
  };

  /* ── Filters ── */
  const filtered = electeurs.filter((e) => {
    const q = search.toLowerCase();
    const matchName  = e.nom?.toLowerCase().includes(q);
    const matchEmail = e.email?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || e.status === statusFilter;
    return (matchName || matchEmail) && matchStatus;
  });

  const assocFiltered = electeurs.filter((e) => {
    const q = assocSearch.toLowerCase();
    return e.nom?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q);
  });

  /* ── Avatar ── */
  const initials = (nom) => nom?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <AdminLayout>
      {/* Confirm delete / reset */}
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => !actionLoading && setConfirmation(null)}
        onConfirm={confirmAction}
        loading={actionLoading}
        tone={confirmation?.type === 'delete' ? 'danger' : 'default'}
        title={confirmation?.type === 'delete' ? 'Supprimer cet électeur ?' : 'Réinitialiser le mot de passe ?'}
        description={confirmation?.type === 'delete'
          ? 'Cet électeur sera supprimé définitivement, ainsi que ses votes.'
          : 'Un mot de passe temporaire sera généré. Communiquez-le par un canal sécurisé.'}
        confirmLabel={confirmation?.type === 'delete' ? 'Supprimer' : 'Générer'}
      />

      {/* Temp password */}
      <Modal isOpen={Boolean(tmpPassword)} onClose={() => setTmpPassword(null)} size="sm"
        title="Mot de passe temporaire" subtitle="Transmettez-le par un canal sécurisé.">
        <div className="space-y-4">
          <code className="block break-all rounded-xl border border-emerald-100 bg-emerald-50
            px-4 py-4 text-center text-base font-black text-emerald-900 tracking-widest">
            {tmpPassword}
          </code>
          <button onClick={() => setTmpPassword(null)} className="btn-primary w-full justify-center">
            J'ai noté le mot de passe
          </button>
        </div>
      </Modal>

      {/* Add modal */}
      {showAdd && (
        <AddElectorModal
          close={() => setShowAdd(false)}
          onAdd={() => loadElecteurs()}
        />
      )}

      {/* Associate modal */}
      <Modal isOpen={showAssociate} onClose={() => setShowAssociate(false)} size="lg"
        title="Associer à un scrutin"
        subtitle="Sélectionnez un poste et les électeurs à inscrire comme candidats.">
        <div className="space-y-5">
          <div>
            <label className="modal-label">Poste (scrutin)</label>
            <select value={assocPosition} onChange={(e) => setAssocPosition(e.target.value)} className="modal-select">
              <option value="">-- Sélectionnez un poste --</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.is_active == 1 ? 'Actif' : 'Inactif'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="modal-label">Électeurs</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={assocSearch} onChange={(e) => setAssocSearch(e.target.value)}
                className="modal-field pl-9" placeholder="Rechercher…" />
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {assocFiltered.map((u) => {
                const checked = assocUsers.includes(u.id);
                return (
                  <label key={u.id} className={`flex cursor-pointer items-center gap-3
                    rounded-lg px-3 py-2 transition-colors ${
                    checked ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}>
                    <input type="checkbox" checked={checked}
                      onChange={() => setAssocUsers((p) =>
                        p.includes(u.id) ? p.filter((id) => id !== u.id) : [...p, u.id]
                      )}
                      className="accent-emerald-500 h-4 w-4 rounded" />
                    <div className="avatar-initials h-7 w-7 text-[10px] shrink-0">
                      {initials(u.nom)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{u.nom}</p>
                      <p className="truncate text-[10px] text-slate-400">{u.email}</p>
                    </div>
                    {checked && <Check size={13} className="ml-auto shrink-0 text-emerald-500" />}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <button onClick={() => setShowAssociate(false)} className="modal-secondary-action flex-1">
              Annuler
            </button>
            <button onClick={handleAssociate}
              className="modal-primary-action flex-1 flex items-center justify-center gap-2">
              <UserCheck size={15} />Associer
            </button>
          </div>
        </div>
      </Modal>

      {/* Page */}
      <div className="mx-auto max-w-6xl space-y-5">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
          <div>
            <h1 className="text-xl font-black text-slate-900">Registre Électoral</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {electeurs.length} électeur{electeurs.length > 1 ? 's' : ''} inscrits
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setAssocUsers([]); setAssocPosition(''); setShowAssociate(true); }}
              className="btn-secondary">
              <Link2 size={14} />Associer à un scrutin
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <UserPlus size={14} />Ajouter
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row animate-fade-up delay-50">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className="search-input w-full pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="modal-select w-full sm:w-44">
            <option value="">Tous les statuts</option>
            <option value="Validé">Validé</option>
            <option value="Suspendu">Suspendu</option>
          </select>
        </div>

        {/* Table */}
        <div className="content-card animate-fade-up delay-100">
          {loading ? (
            <Loading text="Chargement des électeurs…" className="py-16" />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Électeur</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <EmptyState icon={UserCheck} title="Aucun électeur trouvé"
                          description="Modifiez vos critères de recherche." />
                      </td>
                    </tr>
                  ) : filtered.map((u) => (
                    <tr key={u.id}>
                      {/* Electeur */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar-initials h-9 w-9 text-xs shrink-0">
                            {initials(u.nom)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{u.nom}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${
                          u.status === 'Validé' ? 'badge-green' : 'badge-amber'
                        }`}>
                          {u.status === 'Validé'
                            ? <><ShieldCheck size={10} />Validé</>
                            : <><ShieldAlert size={10} />{u.status}</>
                          }
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setConfirmation({ type: 'reset-password', id: u.id })}
                            className="action-btn-key" title="Réinitialiser le mot de passe">
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => { setAssocUsers([u.id]); setAssocPosition(''); setShowAssociate(true); }}
                            className="action-btn-link" title="Associer à un scrutin">
                            <Link2 size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmation({ type: 'delete', id: u.id })}
                            className="action-btn-delete" title="Supprimer">
                            <Trash2 size={14} />
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
}
