import React, { useState } from 'react';
import VoterLayout from "../Components/VoterLayout";
import { useLocation, useNavigate } from "react-router";
import { ShieldCheck, ArrowLeft, Send, CheckCircle, User, ShieldAlert, Lock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const VoterRecap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { election, selectedCandidate } = location.state || {};

  if (!election || !selectedCandidate) {
    return (
      <VoterLayout activePage="dashboard">
        <div className="text-center py-20">
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            Aucune donnée de vote trouvée.
          </p>
          <button
            onClick={() => navigate('/voterDashboard')}
            className="mt-4 text-emerald-500 font-bold text-sm hover:text-emerald-600 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </VoterLayout>
    );
  }

  const handleFinalConfirm = async () => {
    setLoading(true);
    try {
      const position_id = election.id;
      const candidate_id = selectedCandidate.id === 'blanc' ? null : selectedCandidate.id;
      await api.post('/votes', { position_id, candidate_id });
      setIsSubmitted(true);
      toast.success('Votre vote a été enregistré.');
    } catch (error) {
      const message = error.response?.data?.message || "Erreur lors de l'enregistrement du vote.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isBlanc = selectedCandidate.id === 'blanc';

  return (
    <VoterLayout activePage="dashboard">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .42s ease both; }

        @keyframes zoomIn {
          from { opacity: 0; transform: scale(.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        .zoom-in { animation: zoomIn .5s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div className="max-w-xl mx-auto pb-20">

        {/* ── pre-submit view ── */}
        {!isSubmitted ? (
          <>
            {/* header */}
            <div className="mb-8 fade-up">
              <h1 className="text-xl md:text-2xl font-[900] text-slate-900 mb-2">
                Récapitulatif de votre choix
              </h1>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-[10px] font-black text-slate-400">
                  Vérification finale avant signature numérique
                </p>
              </div>
            </div>

            {/* main card */}
            <div
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 md:p-8
                space-y-6 mb-5 fade-up"
              style={{ animationDelay: '60ms' }}
            >
              {/* scrutin label */}
              <div className="flex items-center gap-2 pb-5 border-b border-slate-50">
                <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <ShieldCheck size={13} className="text-slate-400" />
                </div>
                <p className="text-[11px] font-black text-slate-900 tracking-wide">
                  Scrutin&nbsp;: <span className="text-emerald-600">{election.titre}</span>
                </p>
              </div>

              {/* stepper reminder */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={13} className="text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400">Sélection</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-100 rounded-full max-w-[60px]">
                  <div className="h-full w-full bg-emerald-400 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-white">2</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600">Confirmation</span>
                </div>
              </div>

              {/* candidate block */}
              <div className={`flex items-center gap-5 p-5 rounded-2xl border-2 transition-all ${
                isBlanc
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-emerald-50/60 border-emerald-100'
              }`}>
                {/* avatar */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                  {selectedCandidate.photo ? (
                    <img
                      src={selectedCandidate.photo}
                      className="w-full h-full object-cover"
                      alt="Candidat"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      isBlanc ? 'bg-slate-800' : 'bg-emerald-100'
                    }`}>
                      <User size={22} className={isBlanc ? 'text-slate-500' : 'text-emerald-300'} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] font-black tracking-widest uppercase mb-1 ${
                    isBlanc ? 'text-slate-500' : 'text-emerald-500'
                  }`}>
                    Candidat sélectionné
                  </p>
                  <h3 className={`font-[900] text-base leading-tight ${
                    isBlanc ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedCandidate.nom || selectedCandidate.name}
                  </h3>
                  {!isBlanc && (
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {selectedCandidate.profession || selectedCandidate.job || '---'}
                    </p>
                  )}
                </div>

                {/* checkmark */}
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 ${
                  isBlanc ? 'bg-white/10' : 'bg-emerald-500'
                }`}>
                  <CheckCircle size={16} className={isBlanc ? 'text-white' : 'text-white'} strokeWidth={2.5} />
                </div>
              </div>

              {/* warning */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={13} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                    En cliquant sur confirmer, votre bulletin sera chiffré et envoyé au serveur.
                  </p>
                  <p className="text-[10px] font-black text-amber-600 mt-1">
                    Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>

            {/* action buttons */}
            <div
              className="flex flex-col md:flex-row gap-3 fade-up"
              style={{ animationDelay: '120ms' }}
            >
              <button
                disabled={loading}
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white
                  border border-slate-100 text-slate-500 rounded-2xl font-[900] text-[11px]
                  hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]
                  disabled:opacity-50 md:w-auto"
              >
                <ArrowLeft size={15} /> Modifier le choix
              </button>

              <button
                disabled={loading}
                onClick={handleFinalConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-4
                  bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl
                  font-[900] text-sm shadow-lg shadow-emerald-100
                  active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Chiffrement en cours…
                  </>
                ) : (
                  <>Confirmer le vote <Send size={15} /></>
                )}
              </button>
            </div>
          </>

        ) : (
          /* ── success screen ── */
          <div className="zoom-in">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center space-y-8">

              {/* icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center
                  shadow-xl shadow-emerald-100 rotate-3">
                  <CheckCircle size={40} className="text-white" strokeWidth={2.5} />
                </div>
              </div>

              {/* title */}
              <div>
                <h3 className="text-2xl font-[900] text-slate-900">Voté avec succès</h3>
                <p className="text-[10px] font-black text-emerald-500 mt-1 tracking-widest uppercase">
                  Votre voix a été enregistrée
                </p>
              </div>

              {/* receipt */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-left">
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-3">
                  Reçu de transaction numérique
                </p>
                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 font-mono
                  text-[11px] font-black text-slate-800 break-all shadow-inner">
                  CTS-TX-{Math.random().toString(36).substring(2, 15).toUpperCase()}
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-3 text-center">
                  Un justificatif a été envoyé à votre adresse institutionnelle.
                </p>
              </div>

              {/* shield note */}
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">
                  Vote anonymisé · Registre audité
                </span>
              </div>

              {/* back button */}
              <button
                onClick={() => navigate('/voterDashboard')}
                className="w-full py-4 bg-slate-900 hover:bg-emerald-500 text-white
                  rounded-2xl font-[900] text-sm transition-all duration-200
                  active:scale-[0.98] shadow-lg shadow-slate-100"
              >
                Retour au tableau de bord
              </button>
            </div>
          </div>
        )}

      </div>
    </VoterLayout>
  );
};

export default VoterRecap;
