import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Confirmer cette action',
  description,
  confirmLabel = 'Confirmer',
  loading      = false,
  tone         = 'default',   // 'default' | 'danger' | 'success'
}) {
  const isDanger  = tone === 'danger';
  const isSuccess = tone === 'success';

  const iconEl = isDanger
    ? <Trash2 size={16} />
    : isSuccess
    ? <CheckCircle2 size={16} />
    : <AlertTriangle size={16} />;

  const iconBg = isDanger
    ? 'bg-red-100 text-red-600'
    : isSuccess
    ? 'bg-emerald-100 text-emerald-600'
    : 'bg-amber-100 text-amber-600';

  const msgBorder = isDanger
    ? 'border-red-100 bg-red-50'
    : isSuccess
    ? 'border-emerald-100 bg-emerald-50'
    : 'border-amber-100 bg-amber-50';

  const msgText = isDanger
    ? 'text-red-800'
    : isSuccess
    ? 'text-emerald-800'
    : 'text-amber-800';

  const confirmBg = isDanger
    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
    : isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
    : 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/20';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      size="sm"
      title={title}
      icon={
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          {iconEl}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Description */}
        {description && (
          <div className={`flex gap-3 rounded-xl border p-4 ${msgBorder}`}>
            <p className={`text-[13px] leading-relaxed ${msgText}`}>
              {description}
            </p>
          </div>
        )}

        {/* Warning irreversible */}
        {isDanger && (
          <p className="text-[11px] text-slate-400 text-center">
            Cette action est irréversible.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="modal-secondary-action flex-1"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-[1.3] inline-flex items-center justify-center gap-2
              rounded-xl px-4 py-3 text-[13px] font-bold text-white shadow-sm
              transition-all active:scale-[.97]
              disabled:cursor-not-allowed disabled:opacity-50 ${confirmBg}`}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" />Traitement…</>
              : confirmLabel
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}
