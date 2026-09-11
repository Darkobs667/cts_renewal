import { useEffect, useState } from 'react';
import { Search, CheckCircle2, XCircle, User, MailOpen } from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import api from '../services/api';
import { candidatePhotoUrl } from '../utils/media';
import toast from 'react-hot-toast';

export default function AdminCandidatures() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [processing,   setProcessing]   = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/candidates', { params: { status: 'en_attente' } });
      if (res.data?.success) {
        setCandidatures(res.data.data.map((c) => ({
          ...c,
          user_nom:       c.user ? `${c.user.first_name} ${c.user.last_name}`.trim() : `#${c.user_id}`,
          position_titre: c.position?.title ?? 'Poste inconnu',
          photo_url:      candidatePhotoUrl(c.photo_url || c.photo_path),
        })));
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      await api.put(`/candidates/${id}/${action}`);
      setCandidatures((p) => p.filter((c) => c.id !== id));
      toast.success(action === 'approve' ? 'Candidature approuvée.' : 'Candidature refusée.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du traitement.');
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  };

  const filtered = candidatures.filter((c) => {
    const q = search.toLowerCase();
    return c.user_nom.toLowerCase().includes(q) || c.position_titre.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-5">

        {/* Header */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900">Candidatures en attente</h1>
            {candidatures.length > 0 && (
              <span className="badge badge-amber">{candidatures.length} en attente</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Examinez et validez les demandes de candidature
          </p>
        </div>

        {/* Search */}
        <div className="relative animate-fade-up delay-50">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou poste…"
            className="search-input w-full max-w-sm pl-10" />
        </div>

        {/* Table */}
        <div className="content-card animate-fade-up delay-100">
          {loading ? (
            <Loading text="Chargement des candidatures…" className="py-16" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={MailOpen}
              title={search ? 'Aucune candidature trouvée.' : 'Aucune candidature en attente.'}
              description={search ? 'Modifiez votre recherche.' : 'Toutes les demandes ont été traitées.'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Postulant</th>
                    <th>Poste visé</th>
                    <th>Slogan / Bio</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      {/* Postulant */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg
                            border border-slate-200 bg-slate-100">
                            {c.photo_url
                              ? <img src={c.photo_url} alt={c.user_nom} className="h-full w-full object-cover" />
                              : <div className="flex h-full w-full items-center justify-center">
                                  <User size={14} className="text-slate-400" />
                                </div>
                            }
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{c.user_nom}</p>
                            <p className="text-[10px] text-slate-400">{c.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Poste */}
                      <td>
                        <p className="text-sm font-semibold text-slate-700">{c.position_titre}</p>
                      </td>

                      {/* Slogan */}
                      <td>
                        <p className="max-w-xs truncate text-xs text-slate-500">
                          {c.slogan || c.bio || 'Non renseigné'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(c.id, 'approve')}
                            disabled={processing[c.id]}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-200
                              bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700
                              transition hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <CheckCircle2 size={13} />Accepter
                          </button>
                          <button
                            onClick={() => handleAction(c.id, 'reject')}
                            disabled={processing[c.id]}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200
                              bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600
                              transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle size={13} />Refuser
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
