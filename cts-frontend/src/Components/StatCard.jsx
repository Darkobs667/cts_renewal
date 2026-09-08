const StatCard = ({ label, value, icon: Icon, color, accent, detail }) => (
  <article className="kpi-card flex items-center justify-between gap-3 p-4 sm:gap-4 sm:p-5">
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-medium text-slate-500 sm:mb-3 sm:text-xs">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tabular-nums sm:text-3xl">{value}</h3>
      {detail && <p className="mt-2 text-[11px] font-medium text-slate-400">{detail}</p>}
    </div>
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-emerald-100 sm:h-11 sm:w-11 ${color || accent || 'bg-emerald-600'}`}>
      <Icon className="text-white" size={19} />
    </div>
  </article>
);

export default StatCard;
