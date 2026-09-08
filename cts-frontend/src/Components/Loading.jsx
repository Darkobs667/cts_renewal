export default function Loading({ text = 'Chargement...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 ${className}`} role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-600" />
      <p className="text-sm font-medium text-emerald-900/60">{text}</p>
    </div>
  );
}
