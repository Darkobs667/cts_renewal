import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title       = 'Confirmer cette action',
  description,
  confirmLabel = 'Confirmer',
  loading      = false,
  tone         = 'default',
}) {
  const isDanger = tone === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      size="sm"
      title={title}
      subtitle="Cette action nécessite votre confirmation."
    >
      <div className="space-y-5">
        {/* Message block */}
        <div className={`flex gap-3 rounded-xl border p-4 ${
          isDanger
            ? 'border-red-100 bg-red-50'
            : 'border-amber-100 bg-amber-50'
        }`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isDanger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {isDanger ? <Trash2 size={16} /> : <AlertTriangle size={16} />}
          </div>
          <p className={`pt-0.5 text-xs leading-relaxed ${
            isDanger ? 'text-red-800' : 'text-amber-800'
          }`}>
            {description}
          </p>
        </div>

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
            className={`flex-1 rounded-xl px-4 py-3 text-[12px] font-bold text-white
              shadow-sm transition-all active:scale-[0.97]
              disabled:cursor-not-allowed disabled:opacity-55 ${
              isDanger
                ? 'bg-red-600 shadow-red-500/20 hover:bg-red-700'
                : 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Traitement…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
