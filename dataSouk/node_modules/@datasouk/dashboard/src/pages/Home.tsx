import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardSummary, HourlyData, ProductData } from '../lib/types';
import { StatBlock } from '../components/StatBlock';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { StockAlertList } from '../components/StockAlertList';
import { DonutChart } from '../components/charts/DonutChart';
import { AreaTrend } from '../components/charts/AreaTrend';
import { RadialGauge } from '../components/charts/RadialGauge';
import { WeekdayBars } from '../components/charts/WeekdayBars';
import { DemoBadge } from '../components/DemoBadge';
import {
  MOCK_HOURLY,
  MOCK_PRODUCTS,
  MOCK_QUEUE,
  MOCK_SUMMARY,
  isHourlyUsable,
  isProductsUsable,
  isSummaryUsable,
} from '../lib/mock';

const PAYMENT_LABEL: Record<string, string> = {
  especes: 'Espèces',
  carte: 'Carte bancaire',
  edinar: 'e-Dinar',
  mobile: 'Paiement mobile',
  autre: 'Autre',
};

function pct(v: number | null | undefined, fallback = 0): string {
  const n = v ?? fallback;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(0)}%`;
}

export function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyData[] | null>(null);
  const [products, setProducts] = useState<ProductData[] | null>(null);
  const [queue, setQueue] = useState<{ pending: number; synced_today: number; last_sync_at: string } | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, h, p, q] = await Promise.allSettled([
        api.summary(),
        api.hourly(),
        api.products(),
        api.queueStatus(),
      ]);
      if (cancelled) return;
      const sVal = s.status === 'fulfilled' ? s.value : null;
      const hVal = h.status === 'fulfilled' ? h.value : null;
      const pVal = p.status === 'fulfilled' ? p.value : null;
      const qVal = q.status === 'fulfilled' ? q.value : null;
      setSummary(sVal);
      setHourly(hVal);
      setProducts(pVal);
      setQueue(qVal);
      const mock = !isSummaryUsable(sVal) || !isHourlyUsable(hVal) || !isProductsUsable(pVal);
      setUsingMock(mock);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const s = isSummaryUsable(summary) ? summary : MOCK_SUMMARY;
  const h = isHourlyUsable(hourly) ? hourly : MOCK_HOURLY;
  const p = isProductsUsable(products) ? products : MOCK_PRODUCTS;
  const q = queue ?? MOCK_QUEUE;

  const peakHourPct = Math.min(
    100,
    Math.round(((h.find((x) => x.hour === s.today.peak_hour)?.ticket_count ?? 0) / Math.max(...h.map((x) => x.ticket_count), 1)) * 100),
  );

  const payment = PAYMENT_LABEL[s.today.top_payment_label] ?? 'Espèces';
  const todayShare = Math.round((s.today.total_tickets / Math.max(s.week.week_ticket_total, s.today.total_tickets, 1)) * 100);

  return (
    <div className="space-y-10">
      <section className="card-glass relative overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-0 -z-0 bg-grid-faint bg-grid opacity-40" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label-eyebrow text-rouge-300">Tableau de bord · jour</p>
            <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-wide text-white sm:text-6xl">
              Votre commerce<span className="text-rouge-500">,</span> en chiffres
            </h1>
            <p className="mt-3 max-w-xl text-sm text-noir-100">
              Suivi anonymisé en temps réel : tickets, paniers moyens, catégories phares et alertes
              stock — sans jamais exposer vos clients ni vos données sensibles.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <SyncStatusBadge pending={q.pending} lastSync={q.last_sync_at} />
            {usingMock ? <DemoBadge /> : null}
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock
            value={s.today.total_tickets}
            label="Tickets aujourd'hui"
            sub={`${pct(s.today.tickets_vs_yesterday_pct)} vs hier`}
          />
          <StatBlock
            value={s.today.articles_sold}
            label="Unités vendues"
            sub={s.today.avg_ticket_estimate}
            accent="mute"
          />
          <StatBlock
            value={`${s.today.peak_hour}h`}
            label="Heure de pointe"
            sub={`${peakHourPct}% du volume jour`}
            accent="mute"
          />
          <StatBlock
            value={s.today.top_category}
            label="Top catégorie"
            sub={`Paiement : ${payment}`}
            accent="mute"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaTrend
            data={h}
            title="Activité horaire"
            subtitle="Moyenne 7 jours · tickets / heure"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <RadialGauge
            value={Math.min(100, todayShare)}
            max={100}
            label="Part du jour"
            caption="Sur le total semaine"
          />
          <RadialGauge
            value={Math.min(100, peakHourPct)}
            max={100}
            label="Charge à la pointe"
            caption={`Heure ${s.today.peak_hour}h`}
            color="#fb7185"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-white">Mix catégories</h2>
              <p className="label-eyebrow">Mois en cours</p>
            </div>
          </div>
          <DonutChart
            data={p}
            centerValue={`${p.reduce((a, x) => a + x.ticket_count, 0)}`}
            centerLabel="Tickets · 30j"
          />
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-white">Semaine</h2>
              <p className="label-eyebrow">Volume jour par jour</p>
            </div>
            <span className="text-xs text-noir-200">
              CA estimé · <span className="text-rouge-300">{s.week.week_revenue_estimate}</span>
            </span>
          </div>
          <WeekdayBars
            busiestDay={s.week.busiest_day}
            quietestDay={s.week.quietest_day}
            weekTotal={s.week.week_ticket_total}
            avgDaily={s.week.avg_daily_tickets}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-dark p-5 lg:col-span-1">
          <p className="label-eyebrow">Stock surveillé</p>
          <p className="mt-2 font-display text-5xl text-white">{s.stock.sku_tracked}</p>
          <p className="mt-1 text-sm text-noir-200">SKU actifs ce mois</p>
          <div className="my-4 h-px w-full bg-white/5" />
          <p className="label-eyebrow">Alertes critiques</p>
          <p className="mt-2 font-display text-5xl text-rouge-400">{s.stock.critical_alert_count}</p>
          <p className="mt-1 text-sm text-noir-200">À réapprovisionner sous 48h</p>
        </div>
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-white">Alertes stock</h2>
              <p className="label-eyebrow">Top 7 — risque de rupture</p>
            </div>
          </div>
          <StockAlertList alerts={s.alerts} />
        </div>
      </section>

      <footer className="pt-6 text-center text-[11px] uppercase tracking-[0.3em] text-noir-300">
        DataSouk · Tableau de bord anonymisé
      </footer>
    </div>
  );
}
