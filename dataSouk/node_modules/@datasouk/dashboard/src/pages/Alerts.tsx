import { useEffect, useState } from 'react';
import { StockAlertList } from '../components/StockAlertList';
import { DemoBadge } from '../components/DemoBadge';
import { api } from '../lib/api';
import type { StockAlert } from '../lib/types';
import { MOCK_ALERTS } from '../lib/mock';

export function Alerts() {
  const [alerts, setAlerts] = useState<StockAlert[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void api
      .alerts()
      .then((a) => setAlerts(a))
      .catch(() => setAlerts(null))
      .finally(() => setLoaded(true));
  }, []);
  const view = alerts && alerts.length > 0 ? alerts : MOCK_ALERTS;
  const isMock = loaded && (!alerts || alerts.length === 0);
  const high = view.filter((a) => a.urgency === 'high').length;
  const medium = view.filter((a) => a.urgency === 'medium').length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-eyebrow text-rouge-300">Stock</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide text-white">Alertes & ruptures</h1>
          <p className="mt-1 text-sm text-noir-200">
            <span className="text-rouge-300">{high}</span> critique{high > 1 ? 's' : ''} ·{' '}
            <span className="text-rouge-200">{medium}</span> à surveiller
          </p>
        </div>
        {isMock ? <DemoBadge /> : null}
      </header>
      <div className="card-dark p-5">
        <StockAlertList alerts={view} />
      </div>
    </div>
  );
}
