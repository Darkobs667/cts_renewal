import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Send, ShieldCheck, Vote } from 'lucide-react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import VoterLayout from '../Components/VoterLayout';
import Modal from '../Components/Modal';
import Loading from '../Components/Loading';
import api from '../services/api';

function normalise(c) {
  return {
    id:      c.id,
    name:    `${c.user?.first_name ?? ''} ${c.user?.last_name ?? ''}`.trim() || 'Candidat',
    slogan:  c.slogan || null,
    bio:     c.bio    || null,
    initial: (c.user?.first_name?.[0] ?? 'C').toUpperCase(),
    // photo_url vient du backend (Cloudinary URL) ou photo_path en fallback
    photo:   c.photo_url || c.photo_path || null,
  };
}

export default function VoterBallot() {
  const navigate = useNavigate();
  const [loading,     setLoading]     = useState(true);
  const [ballots,     setBallots]     = useState([]);
  const [choices,     setChoices]     = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [posRes, candRes, votesRes] = await Promise.all([
          api.get('/positions'),
          api.get('/candidates'),
          api.get('/votes/my'),
        ]);
        const votedIds = new Set((votesRes.data || []).map((v) => v.position_id));
        const byPos = {};
        for (const c of (candRes.data?.data || [])) {
          // Filtre défensif côté client : ne montrer que les candidats validés.
          // La validation serveur dans batchStore bloque de toute façon les votes invalides.
          if (c.status !== 'valide') continue;
          if (!byPos[c.position_id]) byPos[c.position_id] = [];
          byPos[c.position_id].push(normalise(c));
        }
        setBallots(
          (posRes.data?.data || [])
            .filter((p) => p.is_active == 1 && !votedIds.has(p.id))
            .map((p) => ({ ...p, candidates: byPos[p.id] ?? [] }))
        );
      } catch { toast.error('Impossible de charger le bulletin.'); }
      finally  { setLoading(false); }
    })();
  }, []);

  const selectedEntries = useMemo(
    () => ballots.filter((b) => choices[b.id]).map((b) => ({ ballot: b, choice: choices[b.id] })),
    [ballots, choices]
  );

  const choose = (posId, candidate) => setChoices((p) => ({ ...p, [posId]: candidate }));

  const submit = async () => {
    if (!selectedEntries.length || submitting) return;
    try {
      setSubmitting(true);
      await api.post('/votes/batch', {
        votes: selectedEntries.map(({ ballot, choice }) => ({
          position_id:  ballot.id,
          candidate_id: choice.id === 'blanc' ? null : choice.id,
        })),
      });
      toast.success(`${selectedEntries.length} vote(s) enregistré(s).`);
      navigate('/voterHistory', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulletin non enregistré.');
    } finally { setSubmitting(false); }
  };

  return (
    <VoterLayout activePage="scrutins">
      <div className="mx-auto max-w-3xl space-y-4 voter-ballot-scroll-padding">

        {/* Header */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Vote size={18} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Bulletin de vote</h1>
              <p className="text-xs text-slate-500">Faites vos choix puis confirmez en une fois.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Loading text="Chargement du bulletin…" className="py-24" />
        ) : ballots.length === 0 ? (
          <div className="content-card p-10 text-center">
            <ShieldCheck className="mx-auto text-emerald-500" size={30} />
            <p className="mt-4 text-sm font-bold text-slate-700">Tout est à jour</p>
            <p className="mt-1 text-xs text-slate-400">Vous avez déjà voté pour tous les scrutins ouverts.</p>
          </div>
        ) : ballots.map((ballot, idx) => {
          const selected = choices[ballot.id];
          return (
            <section key={ballot.id} className="content-card animate-fade-up"
              style={{ animationDelay: `${idx * 60}ms` }}>
              {/* Scrutin header */}
              <div className="content-card-header">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                    Scrutin {idx + 1}
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold text-slate-900">{ballot.title}</h2>
                </div>
                {selected
                  ? <span className="badge badge-green"><Check size={10} />Choix effectué</span>
                  : <span className="badge badge-slate">À sélectionner</span>
                }
              </div>

              {/* Candidates */}
              <div className="flex flex-col gap-2 p-4">
                {ballot.candidates.map((c) => {
                  const isSel = selected?.id === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => choose(ballot.id, c)}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left
                        transition-all duration-150 w-full ${
                        isSel
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}>
                      {/* Avatar photo ou initiale */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-xl overflow-hidden text-sm font-black select-none ${
                        !c.photo ? (isSel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500') : ''
                      }`}>
                        {c.photo
                          ? <img src={c.photo} alt={c.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }}
                            />
                          : null
                        }
                        <span className={`${c.photo ? 'hidden' : 'flex'} h-full w-full items-center justify-center`}>
                          {c.initial}
                        </span>
                      </div>

                      {/* Info candidat — slogan et bio non tronqués */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 leading-snug">{c.name}</p>
                        {c.slogan && (
                          <p className="mt-1 text-[11px] font-semibold text-emerald-700 leading-relaxed">
                            « {c.slogan} »
                          </p>
                        )}
                        {c.bio && (
                          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                            {c.bio}
                          </p>
                        )}
                      </div>

                      {/* Radio */}
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center
                        rounded-full border-2 transition-all mt-0.5 ${
                        isSel ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {isSel && <Check size={11} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}

                {/* Vote blanc */}
                <button type="button"
                  onClick={() => choose(ballot.id, { id: 'blanc', name: 'Vote blanc', initial: '—' })}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selected?.id === 'blanc'
                      ? 'border-slate-700 bg-slate-900'
                      : 'border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center
                    rounded-xl ${selected?.id === 'blanc' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <ChevronDown size={16} />
                  </div>
                  <span className={`text-sm font-semibold ${selected?.id === 'blanc' ? 'text-white' : 'text-slate-600'}`}>
                    Vote blanc
                  </span>
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Floating bar — remonte au-dessus de la bottom nav sur mobile */}
      {selectedEntries.length > 0 && (
        <div className="voter-ballot-floatbar animate-zoom-in">
          <div className="flex items-center justify-between gap-4 rounded-2xl border
            border-slate-200 bg-white px-4 py-3 shadow-2xl shadow-slate-950/15">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {selectedEntries.length} choix prêt{selectedEntries.length > 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-slate-400">Une seule confirmation suffit.</p>
            </div>
            <button onClick={() => setConfirmOpen(true)} className="btn-primary">
              <Send size={14} />Confirmer
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <Modal isOpen={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)}
        size="md" title="Confirmer le bulletin"
        subtitle={`${selectedEntries.length} scrutin(s) seront enregistrés définitivement.`}>
        <div className="space-y-4">
          <div className="max-h-52 space-y-2 overflow-y-auto">
            {selectedEntries.map(({ ballot, choice }) => (
              <div key={ballot.id} className="flex items-center justify-between gap-4
                rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-800">{ballot.title}</span>
                <span className="text-right text-[11px] font-bold text-emerald-700">{choice.name}</span>
              </div>
            ))}
          </div>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3
            text-[11px] leading-relaxed text-slate-500">
            Ces choix sont définitifs après confirmation. Le vote est irréversible.
          </p>
          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting}
              className="modal-secondary-action flex-1">Revoir</button>
            <button type="button" onClick={submit} disabled={submitting}
              className="modal-primary-action flex-[1.3] flex items-center justify-center gap-2">
              {submitting
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Envoi…</>
                : <><Send size={14} />Voter</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </VoterLayout>
  );
}
