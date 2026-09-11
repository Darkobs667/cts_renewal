/**
 * StatCard — KPI card niveau enterprise.
 * Inspiration : Linear, Vercel, Stripe Dashboard.
 *
 * Props :
 *  - label   : string
 *  - value   : string | number
 *  - icon    : Lucide component
 *  - trend   : { value: number, label: string }  (optionnel)
 *  - accent  : classe Tailwind pour la couleur de l'icône (ex: 'bg-emerald-500')
 *  - detail  : string sous la valeur (optionnel)
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, trend, accent = 'bg-emerald-500', detail }) {
  const trendPositive = trend?.value > 0;
  const trendNeutral  = !trend || trend?.value === 0;

  return (
    <article className="kpi-card group">
      {/* Subtle gradient top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent} shadow-sm`}>
          <Icon size={18} className="text-white" strokeWidth={2} />
        </div>

        {/* Trend chip */}
        {trend && (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
            trendPositive
              ? 'bg-emerald-50 text-emerald-700'
              : trendNeutral
              ? 'bg-slate-100 text-slate-500'
              : 'bg-red-50 text-red-600'
          }`}>
            {trendPositive ? <TrendingUp size={10} /> : trendNeutral ? <Minus size={10} /> : <TrendingDown size={10} />}
            {trend.label}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-2xl font-black tabular-nums text-slate-900 sm:text-3xl tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
        {detail && (
          <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
        )}
      </div>
    </article>
  );
}
