import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Send, ShieldCheck, User, Vote } from 'lucide-react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import VoterLayout from '../Components/VoterLayout';
import Modal from '../Components/Modal';
import api from '../services/api';
import { candidatePhotoUrl } from '../utils/media';
import Loading from '../Components/Loading';

export default function VoterBallot() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ballots, setBallots] = useState([]);
  const [choices, setChoices] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadBallot = async () => {
      try {
        const [positionsResponse, votesResponse] = await Promise.all([
          api.get('/positions'),
          api.get('/votes/my'),
        ]);
        const votedPositionIds = new Set((votesResponse.data || []).map((vote) => vote.position_id));
        const positions = (positionsResponse.data?.data || [])
          .filter((position) => position.is_active == 1 && !votedPositionIds.has(position.id));

        const candidatesByPosition = await Promise.all(positions.map(async (position) => {
          const response = await api.get('/candidates', { params: { position_id: position.id } });
          return {
            ...position,
            candidates: (response.data?.data || []).map((candidate) => ({
              id: candidate.id,
              name: `${candidate.user?.first_name || ''} ${candidate.user?.last_name || ''}`.trim() || 'Candidat',
              slogan: candidate.slogan || candidate.bio || 'Aucune profession de foi.',
              photo: candidatePhotoUrl(candidate.photo_url || candidate.photo_path),
            })),
          };
        }));
        setBallots(candidatesByPosition);
      } catch (error) {
        toast.error('Impossible de charger le bulletin. Réessayez dans un instant.');
      } finally {
        setLoading(false);
      }
    };
    loadBallot();
  }, []);

  const selectedEntries = useMemo(() => ballots
    .filter((ballot) => choices[ballot.id])
    .map((ballot) => ({ ballot, choice: choices[ballot.id] })), [ballots, choices]);

  const choose = (positionId, candidate) => {
    setChoices((previous) => ({ ...previous, [positionId]: candidate }));
  };

  const submitBallot = async () => {
    if (!selectedEntries.length || submitting) return;
    try {
      setSubmitting(true);
      await api.post('/votes/batch', {
        votes: selectedEntries.map(({ ballot, choice }) => ({
          position_id: ballot.id,
          candidate_id: choice.id === 'blanc' ? null : choice.id,
        })),
      });
      toast.success(`${selectedEntries.length} vote(s) enregistré(s).`);
      navigate('/voterHistory', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Le bulletin n’a pas pu être enregistré.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VoterLayout activePage="dashboard">
      <div className="mx-auto max-w-4xl pb-24">
        <div className="mb-8 rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-100"><Vote size={21} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">Bulletin unique</p>
              <h1 className="mt-1 text-xl font-black text-emerald-950 sm:text-2xl">Votez pour tous vos scrutins en une fois</h1>
              <p className="mt-2 text-xs font-medium leading-relaxed text-emerald-900/70">Faites vos choix à votre rythme, puis confirmez-les en une seule fois.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Loading text="Chargement du bulletin…" className="py-24" />
        ) : ballots.length === 0 ? (
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-20 text-center"><ShieldCheck className="mx-auto text-emerald-500" size={34} /><h2 className="mt-4 text-lg font-black text-emerald-950">Tout est à jour</h2><p className="mt-1 text-sm text-slate-500">Vous avez déjà voté pour tous les scrutins ouverts.</p></div>
        ) : (
          <div className="space-y-5">
            {ballots.map((ballot, index) => {
              const selected = choices[ballot.id];
              return <section key={ballot.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <header className="flex items-center justify-between gap-4 border-b border-slate-50 px-5 py-5 sm:px-6">
                  <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Scrutin {index + 1}</p><h2 className="mt-1 text-base font-black text-slate-900">{ballot.title}</h2></div>
                  {selected ? <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-600"><Check size={12} /> Choix effectué</span> : <span className="text-[10px] font-bold text-slate-400">À sélectionner</span>}
                </header>
                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  {ballot.candidates.map((candidate) => {
                    const isSelected = selected?.id === candidate.id;
                    return <button type="button" key={candidate.id} onClick={() => choose(ballot.id, candidate)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'}`}>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-500">{candidate.photo ? <img src={candidate.photo} alt="" className="h-full w-full object-cover" /> : <User size={18} />}</div>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-900">{candidate.name}</span><span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">{candidate.slogan}</span></span>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}><Check size={12} /></span>
                    </button>;
                  })}
                  <button type="button" onClick={() => choose(ballot.id, { id: 'blanc', name: 'Vote blanc' })} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${selected?.id === 'blanc' ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40'}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><ChevronDown size={17} /></span><span className="text-sm font-black text-slate-700">Vote blanc</span></button>
                </div>
              </section>;
            })}
          </div>
        )}
      </div>

      {selectedEntries.length > 0 && <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-3xl border border-emerald-200 bg-white p-3 shadow-xl shadow-emerald-950/15 sm:bottom-6 sm:px-5"><div><p className="text-sm font-black text-emerald-950">{selectedEntries.length} choix prêt{selectedEntries.length > 1 ? 's' : ''}</p><p className="text-[10px] font-medium text-emerald-700">Une seule confirmation suffit.</p></div><button type="button" onClick={() => setConfirmOpen(true)} className="modal-primary-action flex shrink-0 items-center gap-2"><Send size={15} /> Confirmer</button></div>}

      <Modal isOpen={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} size="md" title="Confirmer le bulletin" subtitle={`${selectedEntries.length} scrutin(s) seront enregistrés.`}>
        <div className="space-y-4"><div className="max-h-56 space-y-2 overflow-y-auto">{selectedEntries.map(({ ballot, choice }) => <div key={ballot.id} className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 px-4 py-3"><span className="text-xs font-black text-emerald-950">{ballot.title}</span><span className="text-right text-[11px] font-bold text-emerald-700">{choice.name}</span></div>)}</div><p className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-[11px] leading-relaxed text-emerald-900">Les choix récapitulés ci-dessus sont définitifs après confirmation.</p><div className="flex gap-3 border-t border-emerald-100 pt-5"><button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting} className="modal-secondary-action flex-1">Revoir</button><button type="button" onClick={submitBallot} disabled={submitting} className="modal-primary-action flex-[1.3]">{submitting ? 'Enregistrement…' : 'Voter'}</button></div></div>
      </Modal>
    </VoterLayout>
  );
}
