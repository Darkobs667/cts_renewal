import React, { useState, useEffect } from 'react';
import AdminLayout from '../Components/AdminLayout';
import { Plus, Play, Trash2, Edit3, StopCircle, Vote, Radio, CheckCircle2, XCircle } from 'lucide-react';
import CreateElectionModal from '../Components/CreateElectionModal';
import Logoscrutin from "../assets/scrutin.jpg";
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../Components/ConfirmDialog';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';

/* ── Status badge ── */
const StatusBadge = ({ isActive }) =>
  isActive == 1 ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      En ligne
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-100">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
      Inactif
    </span>
  );

/* ── Election card ── */
const ElectionCard = ({ election, index, onEdit, onDelete, onToggle }) => {
  const isActive = election.is_active == 1;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
        transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/5 fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* active left accent */}
      {isActive && (
        <span className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* left — logo + info */}
        <div className="flex items-center gap-4">
          {/* logo */}
          <div
            className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 transition-all duration-300
              ${isActive
                ? 'border-emerald-200 shadow-md shadow-emerald-50'
                : 'border-slate-100 group-hover:border-emerald-100'
              }`}
          >
            <img src={Logoscrutin} className="w-full h-full object-contain" alt="Logo scrutin" />
          </div>

          {/* text */}
          <div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Scrutin configuré</p>
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-[900] text-base md:text-lg text-slate-900 leading-tight">
                {election.title}
              </h4>
            </div>
            {election.description ? (
              <p className="mb-2 max-w-xl break-words text-xs font-medium leading-relaxed text-slate-500">{election.description}</p>
            ) : (
              <p className="mb-2 text-xs font-medium italic text-slate-400">Aucune description renseignée pour ce scrutin.</p>
            )}
            <div className="mt-2"><StatusBadge isActive={election.is_active} /></div>
          </div>
        </div>

        {/* right — actions */}
        <div className="flex w-full items-center gap-2 md:w-auto md:justify-end md:shrink-0">
          <button
            onClick={() => onEdit(election)}
            title="Modifier"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-transparent text-slate-300 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200"
          >
            <Edit3 size={17} />
          </button>

          {/* delete */}
          <button
            onClick={() => onDelete(election.id)}
            title="Supprimer"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-transparent text-slate-300
              hover:border-red-100 hover:bg-red-50 hover:text-red-400 transition-all duration-200"
          >
            <Trash2 size={17} />
          </button>

          {/* toggle active */}
          <button
            onClick={() => onToggle(election)}
            title={isActive ? 'Désactiver' : 'Activer'}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black md:flex-none
              shadow-sm active:scale-95 transition-all duration-200
              ${isActive
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-100'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'
              }`}
          >
            {isActive
              ? <><StopCircle size={15} /> Désactiver</>
              : <><Play size={15} fill="currentColor" /> Activer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ── */
const Votes = () => {
  const [showModal, setShowModal] = useState(false);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingElection, setEditingElection] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchElections = async () => {
    try {
      const response = await api.get('/positions');
      if (response.data && response.data.success) {
        const all = [...(response.data.data || []), ...(response.data.failed || [])];
        setElections(all);
      } else {
        setElections([]);
      }
    } catch (error) {
      console.error("Erreur chargement :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchElections(); }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/positions/${deletingId}`);
      setElections((previous) => previous.filter((election) => election.id !== deletingId));
      toast.success('Scrutin supprimé.');
      setDeletingId(null);
    } catch (error) {
      toast.error('Impossible de supprimer ce scrutin.');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (election) => {
    const newActive = election.is_active == 1 ? 0 : 1;
    try {
      await api.put(`/positions/${election.id}`, {
        title: election.title,
        description: election.description,
        is_active: newActive,
      });
      setElections(prev =>
        prev.map(el => el.id === election.id ? { ...el, is_active: newActive } : el)
      );
      toast.success(newActive ? 'Scrutin activé.' : 'Scrutin désactivé.');
    } catch (error) {
      toast.error("Erreur lors du changement d'état");
      console.error(error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingElection(null);
    fetchElections();
  };

  const activeCount = elections.filter(e => e.is_active == 1).length;
  const inactiveCount = elections.filter(e => e.is_active != 1).length;

  return (
    <AdminLayout activePage="votes">
      <ConfirmDialog isOpen={Boolean(deletingId)} onClose={() => !deleting && setDeletingId(null)} onConfirm={handleDelete} loading={deleting} tone="danger" title="Supprimer ce scrutin ?" description="Cette suppression est définitive et retirera le scrutin de la plateforme." confirmLabel="Supprimer" />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .42s ease both; }
      `}</style>

      <div className="max-w-5xl mx-auto animate-in fade-in duration-500">

        {/* ── header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 fade-up">
          <div>
            <h2 className="text-xl md:text-2xl font-[900] text-slate-900">
              Élections & Scrutins
            </h2>
            <p className="text-slate-400 font-medium text-xs mt-1">
              Configuration des candidats et des périodes de vote
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* stat chips */}
            {elections.length > 0 && (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-2xl">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600">{activeCount} actif{activeCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl">
                  <XCircle size={11} className="text-slate-300" />
                  <span className="text-[10px] font-black text-slate-400">{inactiveCount} inactif{inactiveCount > 1 ? 's' : ''}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 h-11 bg-emerald-500 hover:bg-emerald-600
                text-white rounded-xl px-5 shadow-lg shadow-emerald-100
                active:scale-95 transition-all font-black text-[11px]"
            >
              <Plus size={17} />
              Nouveau scrutin
            </button>
          </div>
        </div>

        {/* ── content ── */}
        {loading ? (
          <Loading text="Chargement des scrutins…" className="py-32" />
        ) : elections.length > 0 ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">
              <div><h3 className="text-sm font-black text-slate-900">Liste des scrutins</h3><p className="mt-0.5 text-[10px] font-medium text-slate-400">Activez, modifiez ou clôturez chaque scrutin.</p></div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">{elections.length}</span>
            </div>
          <div className="flex flex-col gap-3 p-4">
            {elections.map((election, i) => (
              <ElectionCard
                key={election.id}
                election={election}
                index={i}
                onEdit={(el) => { setEditingElection(el); setShowModal(true); }}
                onDelete={setDeletingId}
                onToggle={toggleActive}
              />
            ))}
          </div>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm fade-up">
            <div className="w-20 h-20 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
              <Vote size={32} className="text-slate-200" />
            </div>
            <h3 className="text-slate-900 font-black text-lg">Aucun scrutin</h3>
            <p className="text-slate-400 font-bold text-[10px] mt-2 mb-6">
              Créez votre premier scrutin pour démarrer
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600
                text-white rounded-2xl px-6 py-3 font-black text-[11px]
                shadow-lg shadow-emerald-100 active:scale-95 transition-all"
            >
              <Plus size={16} /> Nouveau scrutin
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <CreateElectionModal
          close={closeModal}
          initialData={editingElection}
        />
      )}
    </AdminLayout>
  );
};

export default Votes;
