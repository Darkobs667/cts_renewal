import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer cette action',
  description,
  confirmLabel = 'Confirmer',
  loading = false,
  tone = 'default',
}) {
  const destructive = tone === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={() => !loading && onClose()} size="sm" title={title} subtitle="Cette action nécessite votre confirmation.">
      <div className="space-y-5">
        <div className={`flex gap-3 rounded-2xl border p-4 ${destructive ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${destructive ? 'bg-red-100 text-red-600' : 'bg-white text-emerald-600'}`}>
            {destructive ? <Trash2 size={18} /> : <AlertTriangle size={18} />}
          </div>
          <p className={`pt-0.5 text-xs font-medium leading-relaxed ${destructive ? 'text-red-900/70' : 'text-emerald-950/70'}`}>{description}</p>
        </div>
        <div className="flex gap-3 border-t border-emerald-100 pt-5">
          <button type="button" disabled={loading} onClick={onClose} className="modal-secondary-action flex-1">Annuler</button>
          <button type="button" disabled={loading} onClick={onConfirm} className={destructive ? 'flex-1 rounded-2xl bg-red-600 px-4 py-3.5 text-[11px] font-black text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60' : 'modal-primary-action flex-1'}>
            {loading ? 'Traitement…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
