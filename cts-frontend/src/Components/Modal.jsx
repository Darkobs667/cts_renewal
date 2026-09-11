import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md' }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <motion.button
            aria-label="Fermer"
            className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.section
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className={`relative z-10 my-auto w-full ${SIZES[size] ?? SIZES.md}
              overflow-hidden rounded-2xl border border-slate-200/80 bg-white
              shadow-2xl shadow-slate-950/20 outline-none`}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.97, y: 8  }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {/* Header */}
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">
                  CTS · Espace sécurisé
                </p>
                <h2 id="modal-title" className="text-base font-black text-slate-900">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                  border border-slate-200 bg-slate-50 text-slate-400
                  transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </header>

            {/* Body */}
            <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
