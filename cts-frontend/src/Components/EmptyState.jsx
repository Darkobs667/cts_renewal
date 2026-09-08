export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
        <Icon size={24} className="text-emerald-600/45" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-emerald-950/70">{title}</p>
        {description && <p className="mt-1 text-xs text-emerald-900/45">{description}</p>}
      </div>
      {action}
    </div>
  );
}
