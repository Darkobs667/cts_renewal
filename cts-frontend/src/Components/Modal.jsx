import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Logocts from '../assets/logo-cts2-removebg-preview.png';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  icon,
}) {
  const panelRef    = useRef(null);
  const onCloseRef  = useRef(onClose);
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
          className="fixed inset-0 z-[200] flex items-end justify-center overflow-y-auto
            p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.button
            aria-label="Fermer"
            className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[3px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.section
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className={`modal-panel ${SIZES[size] ?? SIZES.md}`}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 20, scale: 0.98  }}
            transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
          >
            {/* Header */}
            <header className="modal-header">
              <div className="flex items-center gap-3">
                {/* Logo ou icône custom */}
                {icon ? (
                  <div className="modal-icon-wrapper">
                    {icon}
                  </div>
                ) : (
                  <div className="modal-logo-badge">
                    <img src={Logocts} alt="CTS" className="h-4 w-4 object-contain mix-blend-multiply" />
                  </div>
                )}
                <div>
                  <p className="modal-eyebrow">CTS · Espace sécurisé</p>
                  <h2 id="modal-title" className="modal-title">{title}</h2>
                  {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="modal-close-btn"
                aria-label="Fermer la fenêtre"
              >
                <X size={15} />
              </button>
            </header>

            {/* Body */}
            <div className="modal-body">
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
