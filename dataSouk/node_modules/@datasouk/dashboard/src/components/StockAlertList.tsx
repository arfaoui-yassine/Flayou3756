import type { StockAlert } from '../lib/types';

const urgencyClass: Record<StockAlert['urgency'], string> = {
  low: 'bg-white/5 text-noir-100 ring-1 ring-white/10',
  medium: 'bg-rouge-500/10 text-rouge-200 ring-1 ring-rouge-500/30',
  high: 'bg-rouge-500/20 text-rouge-100 ring-1 ring-rouge-500/60',
};

const urgencyLabel: Record<StockAlert['urgency'], string> = {
  low: 'À surveiller',
  medium: 'Bientôt',
  high: 'Critique',
};

export function StockAlertList({ alerts }: { alerts: StockAlert[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-noir-200">Aucune alerte stock.</p>;
  }
  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li
          key={`${a.article_name}-${a.category}`}
          className="flex items-center justify-between rounded-xl border border-white/5 bg-noir-700/70 px-4 py-3 text-sm shadow-sm"
        >
          <div>
            <p className="font-semibold text-white">{a.article_name}</p>
            <p className="text-noir-200">
              {a.category} · {a.current_stock} unités · ~{a.days_remaining} j restants
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${urgencyClass[a.urgency]}`}>
            {urgencyLabel[a.urgency]}
          </span>
        </li>
      ))}
    </ul>
  );
}
