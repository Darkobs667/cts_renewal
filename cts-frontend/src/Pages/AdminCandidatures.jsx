import React, { useState, useEffect } from 'react';
import AdminLayout from '../Components/AdminLayout';
import { Loader2, User, XCircle, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import api from '../services/api';
import { candidatePhotoUrl } from '../utils/media';
import toast from 'react-hot-toast';

const AdminCandidatures = () => {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState({}); // { id: true/false }

  const fetchCandidatures = async () => {
    setLoading(true);
    try {
      const response = await api.get('/candidates', { params: { status: 'en_attente' } });
      if (response.data?.success) {
        const data = response.data.data.map(c => ({
          ...c,
          user_nom: c.user ? `${c.user.first_name} ${c.user.last_name}`.trim() : `Utilisateur #${c.user_id}`,
          position_titre: c.position?.title ?? 'Poste inconnu',
          position_id: c.position_id,
          photo_url: candidatePhotoUrl(c.photo_url || c.photo_path),
        }));
        setCandidatures(data);
      }
    } catch (error) {
      console.error('Erreur chargement candidatures', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatures();
  }, []);

  const handleAction = async (id, action) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      await api.put(`/candidates/${id}/${action}`);
      // Retirer de la liste locale ou recharger
      setCandidatures(prev => prev.filter(c => c.id !== id));
      toast.success(action === 'approve' ? 'Candidature approuvée.' : 'Candidature refusée.');
    } catch (error) {
      console.error('Erreur action candidature', error);
      toast.error(error.response?.data?.message || 'Erreur lors du traitement de la demande.');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const filtered = candidatures.filter(c =>
    c.user_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.position_titre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout activePage="candidatures">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Candidatures en attente</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Examinez les demandes de candidature et validez ou refusez-les
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white p-4 rounded-[28px] border border-slate-100 mb-6 flex items-center shadow-sm">
          <Search className="text-slate-400 mr-3" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou poste..."
            className="flex-1 p-2 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center text-slate-400 font-medium text-sm">
            {searchTerm ? 'Aucune candidature trouvée.' : 'Aucune candidature en attente.'}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Photo</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Postulant</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Poste visé</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400">Slogan / Bio</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200">
                          {cand.photo_url ? (
                            <img src={cand.photo_url} alt={cand.user_nom} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User size={18} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-slate-800">{cand.user_nom}</p>
                        <p className="text-[11px] text-slate-400">{cand.user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-slate-800">{cand.position_titre}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-slate-600  truncate">{cand.slogan || cand.bio || 'Non renseigné'}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(cand.id, 'approve')}
                            disabled={processing[cand.id]}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 rounded-xl font-black text-[10px] transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Accepter
                          </button>
                          <button
                            onClick={() => handleAction(cand.id, 'reject')}
                            disabled={processing[cand.id]}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl font-black text-[10px] transition-all disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCandidatures;
