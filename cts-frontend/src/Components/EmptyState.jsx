export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={22} className="text-slate-300" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-600">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
