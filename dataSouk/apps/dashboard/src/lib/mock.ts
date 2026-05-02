/**
 * Données de repli — réalistes, stables (pas d’aléatoire),
 * utilisées si l’agent renvoie une réponse vide ou échoue.
 *
 * Profil simulé : épicerie de quartier en milieu urbain tunisien.
 */
import type { DashboardSummary, HourlyData, ProductData, StockAlert } from './types';

export const MOCK_HOURLY: HourlyData[] = [
  { hour: 0, ticket_count: 0, day_label: '7j moy.' },
  { hour: 1, ticket_count: 0, day_label: '7j moy.' },
  { hour: 2, ticket_count: 0, day_label: '7j moy.' },
  { hour: 3, ticket_count: 0, day_label: '7j moy.' },
  { hour: 4, ticket_count: 0, day_label: '7j moy.' },
  { hour: 5, ticket_count: 1, day_label: '7j moy.' },
  { hour: 6, ticket_count: 4, day_label: '7j moy.' },
  { hour: 7, ticket_count: 9, day_label: '7j moy.' },
  { hour: 8, ticket_count: 14, day_label: '7j moy.' },
  { hour: 9, ticket_count: 12, day_label: '7j moy.' },
  { hour: 10, ticket_count: 11, day_label: '7j moy.' },
  { hour: 11, ticket_count: 13, day_label: '7j moy.' },
  { hour: 12, ticket_count: 18, day_label: '7j moy.' },
  { hour: 13, ticket_count: 17, day_label: '7j moy.' },
  { hour: 14, ticket_count: 12, day_label: '7j moy.' },
  { hour: 15, ticket_count: 11, day_label: '7j moy.' },
  { hour: 16, ticket_count: 14, day_label: '7j moy.' },
  { hour: 17, ticket_count: 19, day_label: '7j moy.' },
  { hour: 18, ticket_count: 24, day_label: '7j moy.' },
  { hour: 19, ticket_count: 27, day_label: '7j moy.' },
  { hour: 20, ticket_count: 22, day_label: '7j moy.' },
  { hour: 21, ticket_count: 13, day_label: '7j moy.' },
  { hour: 22, ticket_count: 6, day_label: '7j moy.' },
  { hour: 23, ticket_count: 2, day_label: '7j moy.' },
];

export const MOCK_PRODUCTS: ProductData[] = [
  { category: 'Boissons', ticket_count: 184, percentage: 28.4, trend: 'up' },
  { category: 'Boulangerie', ticket_count: 142, percentage: 21.9, trend: 'stable' },
  { category: 'Fruits & légumes', ticket_count: 116, percentage: 17.9, trend: 'up' },
  { category: 'Épicerie salée', ticket_count: 88, percentage: 13.6, trend: 'down' },
  { category: 'Laitiers', ticket_count: 64, percentage: 9.9, trend: 'stable' },
  { category: 'Épicerie sucrée', ticket_count: 32, percentage: 4.9, trend: 'up' },
  { category: 'Hygiène', ticket_count: 22, percentage: 3.4, trend: 'stable' },
];

export const MOCK_ALERTS: StockAlert[] = [
  { article_name: 'Huile végétale 1L', category: 'Épicerie salée', current_stock: 2, days_remaining: 1, urgency: 'high' },
  { article_name: 'Lait UHT 1L', category: 'Laitiers', current_stock: 5, days_remaining: 2, urgency: 'high' },
  { article_name: 'Fromage local 250g', category: 'Laitiers', current_stock: 4, days_remaining: 3, urgency: 'medium' },
  { article_name: 'Tomates fraîches', category: 'Fruits & légumes', current_stock: 6, days_remaining: 2, urgency: 'medium' },
  { article_name: 'Coca-Cola 33cl', category: 'Boissons', current_stock: 9, days_remaining: 4, urgency: 'medium' },
  { article_name: 'Pâtes 500g', category: 'Épicerie salée', current_stock: 12, days_remaining: 6, urgency: 'low' },
  { article_name: 'Biscuits petit-déj', category: 'Épicerie sucrée', current_stock: 14, days_remaining: 7, urgency: 'low' },
];

export const MOCK_SUMMARY: DashboardSummary = {
  today: {
    total_tickets: 87,
    total_revenue_estimate: '200–500 TND',
    top_category: 'Boissons',
    peak_hour: 19,
    articles_sold: 214,
    avg_ticket_estimate: '8–15 TND / ticket',
    tickets_vs_yesterday_pct: 12,
    top_payment_label: 'especes',
  },
  week: {
    avg_daily_tickets: 78.4,
    busiest_day: 'Vendredi',
    quietest_day: 'Lundi',
    week_revenue_estimate: '> 500 TND',
    top_category_week: 'Boissons',
    week_ticket_total: 549,
  },
  stock: {
    critical_alert_count: 2,
    sku_tracked: 184,
  },
  alerts: MOCK_ALERTS,
};

export const MOCK_QUEUE = {
  pending: 12,
  synced_today: 96,
  last_sync_at: new Date(Date.now() - 4 * 60_000).toISOString(),
};

/**
 * Vérifie si le résumé renvoyé par l’agent est exploitable.
 * Sinon le composant affichera la version mock (sans message d’erreur agressif).
 */
export function isSummaryUsable(s: DashboardSummary | null | undefined): s is DashboardSummary {
  if (!s || !s.today || !s.week || !s.stock) return false;
  return s.today.total_tickets > 0 || s.week.week_ticket_total > 0;
}

export function isHourlyUsable(h: HourlyData[] | null | undefined): h is HourlyData[] {
  if (!h || h.length === 0) return false;
  return h.some((p) => p.ticket_count > 0);
}

export function isProductsUsable(p: ProductData[] | null | undefined): p is ProductData[] {
  return Array.isArray(p) && p.length > 0;
}
