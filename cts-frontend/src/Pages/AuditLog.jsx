import { useCallback, useEffect, useState } from 'react';
import {
  Activity, CheckCircle2, RefreshCw, Search,
  ShieldCheck, Trash2, UserCog, X, XCircle, KeyRound,
  ToggleLeft, ClipboardList,
} from 'lucide-react';
import AdminLayout from '../Components/AdminLayout';
import Loading from '../Components/Loading';
import EmptyState from '../Components/EmptyState';
import api from '../services/api';

/* ── Mapping action → libellé + icône + couleur ── */
const ACTION_META = {
  'candidate.approve':  { label: 'Candidature validée',      Icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  'candidate.reject':   { label: 'Candidature refusée',      Icon: XCircle,      color: 'text-red-500 bg-red-50'         },
  'user.status_update': { label: 'Statut électeur modifié',  Icon: UserCog,      color: 'text-blue-600 bg-blue-50'       },
  'user.password_reset':{ label: 'Mot de passe réinitialisé',Icon: KeyRound,     color: 'text-amber-600 bg-amber-50'     },
  'position.update':    { label: 'Scrutin modifié',          Icon: ToggleLeft,   color: 'text-violet-600 bg-violet-50'   },
  'position.delete':    { label: 'Scrutin supprimé',         Icon: Trash2,       color: 'text-red-500 bg-red-50'         },
};

const DEFAULT_META = { label: 'Action admin', Icon: Activity, color: 'text-slate-500 bg-slate-100' };

function ActionBadge({ action }) {
  const m = ACTION_META[action] ?? DEFAULT_META;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
      text-[11px] font-bold ${m.color}`}>
      <m.Icon size={11} strokeWidth={2.5} />
      {m.label}
    </span>
  );
}

function MetadataView({ meta }) {
  if (!meta || !Object.keys(meta).length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {Object.entries(meta).map(([k, v]) => (
        <span key={k} className="rounded-md border border-slate-100 bg-slate-50
          px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          {k}: <span className="text-slate-700">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export default function AuditLogPage() {
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('');   // '' = tous

  const load = useCallback(async (soft = false) => {
    if (soft) setSyncing(true); else setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      if (res.data?.success) setLogs(res.data.data || []);
    } finally { setLoading(false); setSyncing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Filtrage local */
  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || l.action.includes(q)
      || l.admin?.toLowerCase().includes(q)
      || JSON.stringify(l.metadata || {}).toLowerCase().includes(q);
    const matchFilter = !filter || l.action === filter;
    return matchSearch && matchFilter;
  });

  /* Actions disponibles pour le filtre */
  const availableActions = [...new Set(logs.map((l) => l.action))].sort();

  /* Formater la date */
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white">
                <ClipboardList size={16} />
              </div>
              <h1 className="text-xl font-black text-slate-900">Journal d'audit</h1>
            </div>
            <p className="text-xs text-slate-400 ml-11">
              Traçabilité des actions administratives — {logs.length} entrée{logs.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={syncing} className="btn-secondary self-start">
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>

        {/* Sécurité info */}
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 animate-fade-up delay-50">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Ce journal enregistre automatiquement toutes les actions sensibles effectuées par les administrateurs :
            validations de candidatures, modifications de scrutins, changements de statut d'électeurs et réinitialisations de mot de passe.
          </p>
        </div>

        {/* Filtres */}
        {!loading && logs.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row animate-fade-up delay-100">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par action, admin…"
                className="search-input w-full pl-10"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="modal-select w-full sm:w-56">
              <option value="">Toutes les actions</option>
              {availableActions.map((a) => (
                <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>
              ))}
            </select>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <Loading text="Chargement du journal…" className="py-24" />
        ) : filtered.length === 0 ? (
          <div className="content-card p-8">
            <EmptyState
              icon={Activity}
              title={search || filter ? 'Aucun résultat' : 'Journal vide'}
              description={search || filter
                ? 'Essayez de modifier vos filtres.'
                : 'Les actions admin apparaîtront ici automatiquement.'}
            />
          </div>
        ) : (
          <div className="content-card animate-fade-up delay-100">
            <div className="content-card-header">
              <p className="text-sm font-bold text-slate-800">
                {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
                {(search || filter) && <span className="text-slate-400 font-normal"> (filtrées)</span>}
              </p>
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map((log, i) => (
                <div key={log.id}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-slate-50/60
                    sm:flex-row sm:items-start sm:gap-4 animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  {/* Action badge */}
                  <div className="shrink-0">
                    <ActionBadge action={log.action} />
                  </div>

                  {/* Détails */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-800">
                        {log.admin}
                      </span>
                      {log.target_type && log.target_id && (
                        <span className="text-[10px] text-slate-400">
                          → {log.target_type} #{log.target_id}
                        </span>
                      )}
                    </div>
                    <MetadataView meta={log.metadata} />
                  </div>

                  {/* Date + IP */}
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-semibold text-slate-500">{fmt(log.created_at)}</p>
                    {log.ip_address && (
                      <p className="text-[10px] text-slate-300 mt-0.5 font-mono">{log.ip_address}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
