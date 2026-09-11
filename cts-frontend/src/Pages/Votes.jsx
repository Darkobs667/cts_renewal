import { useEffect, useState } from 'react';
import {
  Plus, Play, StopCircle, Trash2, Edit3,
  Vote, CheckCircle2, XCircle,
} from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import CreateElectionModal from '../Components/CreateElectionModal';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ── Scrutin card ── */
function ElectionCard({ election, onEdit, onDelete, onToggle }) {
  const active = election.is_active == 1;

  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-slate-200
      bg-white p-5 shadow-sm transition-all duration-150
      hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center">

      {/* Left accent bar */}
      {active && (
        <span className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-emerald-500" />
      )}

      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
      }`}>
        <Vote size={18} strokeWidth={2} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">{election.title}</h3>
          <span className={`badge ${active ? 'badge-green' : 'badge-slate'}`}>
            {active ? (
              <><span className="status-dot-live" />En ligne</>
            ) : 'Inactif'}
          </span>
        </div>
        {election.description ? (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{election.description}</p>
        ) : (
          <p className="mt-1 text-xs italic text-slate-400">Aucune description.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => onEdit(election)} className="action-btn-edit" title="Modifier">
          <Edit3 size={15} />
        </button>
        <button onClick={() => onDelete(election.id)} className="action-btn-delete" title="Supprimer">
          <Trash2 size={15} />
        </button>
        <button
          onClick={() => onToggle(election)}
          title={active ? 'Désactiver' : 'Activer'}
          className={`ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px]
            font-bold transition-all active:scale-95 ${
            active
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {active
            ? <><StopCircle size={13} />Désactiver</>
            : <><Play size={13} fill="currentColor" />Activer</>
          }
        </button>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Votes() {
  const [elections,  setElections]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get('/positions');
      if (res.data?.success) setElections(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/positions/${deletingId}`);
      setElections((p) => p.filter((e) => e.id !== deletingId));
      toast.success('Scrutin supprimé.');
      setDeletingId(null);
    } catch { toast.error('Impossible de supprimer ce scrutin.'); }
    finally { setDeleting(false); }
  };

  const handleToggle = async (election) => {
    const next = election.is_active == 1 ? 0 : 1;
    try {
      await api.put(`/positions/${election.id}`, {
        title: election.title, description: election.description, is_active: next,
      });
      setElections((p) => p.map((e) => e.id === election.id ? { ...e, is_active: next } : e));
      toast.success(next ? 'Scrutin activé.' : 'Scrutin désactivé.');
    } catch { toast.error('Erreur lors du changement d\'état.'); }
  };

  const closeModal = () => { setShowModal(false); setEditing(null); fetch(); };

  const activeCount   = elections.filter((e) => e.is_active == 1).length;
  const inactiveCount = elections.length - activeCount;

  return (
    <AdminLayout>
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => !deleting && setDeletingId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        tone="danger"
        title="Supprimer ce scrutin ?"
        description="Cette suppression est définitive. Les candidats et votes associés seront également supprimés."
        confirmLabel="Supprimer"
      />

      {showModal && <CreateElectionModal close={closeModal} initialData={editing} />}

      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between
          animate-fade-up">
          <div>
            <h1 className="text-xl font-black text-slate-900">Élections & Scrutins</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Configurez et pilotez les périodes de vote
            </p>
          </div>

          <div className="flex items-center gap-2">
            {elections.length > 0 && (
              <>
                <span className="badge badge-green">
                  <CheckCircle2 size={10} />{activeCount} actif{activeCount > 1 ? 's' : ''}
                </span>
                <span className="badge badge-slate">
                  <XCircle size={10} />{inactiveCount} inactif{inactiveCount > 1 ? 's' : ''}
                </span>
              </>
            )}
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={15} />Nouveau scrutin
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Loading text="Chargement des scrutins…" className="py-24" />
        ) : elections.length === 0 ? (
          <div className="content-card p-8">
            <EmptyState
              icon={Vote}
              title="Aucun scrutin"
              description="Créez votre premier scrutin pour démarrer les votes."
              action={
                <button onClick={() => setShowModal(true)} className="btn-primary">
                  <Plus size={15} />Nouveau scrutin
                </button>
              }
            />
          </div>
        ) : (
          <div className="content-card animate-fade-up delay-50">
            <div className="content-card-header">
              <div>
                <p className="text-sm font-bold text-slate-800">Liste des scrutins</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {elections.length} scrutin{elections.length > 1 ? 's' : ''} configuré{elections.length > 1 ? 's' : ''}
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {elections.length}
              </span>
            </div>
            <div className="space-y-2 p-4">
              {elections.map((el) => (
                <ElectionCard
                  key={el.id}
                  election={el}
                  onEdit={(e) => { setEditing(e); setShowModal(true); }}
                  onDelete={setDeletingId}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
