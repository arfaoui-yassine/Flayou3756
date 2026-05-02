import type {
  AgentConfig,
  DashboardSummary,
  HourlyData,
  ProductData,
  StockAlert,
} from '@datasouk/shared';
import { createDB } from '../db/index.js';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function revenueEstimateFromTotal(total: number): string {
  if (total < 50) return '< 50 TND';
  if (total < 200) return '50–200 TND';
  if (total < 500) return '200–500 TND';
  return '> 500 TND';
}

export async function buildDashboardSummary(cfg: AgentConfig): Promise<DashboardSummary> {
  const db = await createDB(cfg);
  try {
    const todayStart = startOfToday();
    const tomorrow = addDays(todayStart, 1);
    const weekStart = addDays(todayStart, -6);
    const todayTickets = await db.getTicketsBetween(todayStart, tomorrow);
    const weekTickets = await db.getTicketsBetween(weekStart, tomorrow);
    const linesToday =
      todayTickets.length > 0 ? await db.getTicketLines(todayTickets.map((t) => t.id)) : [];
    const catCount = new Map<string, number>();
    for (const l of linesToday) {
      catCount.set(l.categorie, (catCount.get(l.categorie) ?? 0) + l.quantite);
    }
    let top_category = '—';
    let topN = 0;
    for (const [c, n] of catCount) {
      if (n > topN) {
        topN = n;
        top_category = c;
      }
    }
    const hourCount = new Map<number, number>();
    for (const t of todayTickets) {
      const h = new Date(t.date_heure).getHours();
      hourCount.set(h, (hourCount.get(h) ?? 0) + 1);
    }
    let peak_hour = 12;
    let peakC = 0;
    for (const [h, c] of hourCount) {
      if (c > peakC) {
        peakC = c;
        peak_hour = h;
      }
    }
    const revenue = todayTickets.reduce((s, t) => s + t.montant_total, 0);
    const byDay = new Map<number, number>();
    for (const t of weekTickets) {
      const wd = (new Date(t.date_heure).getDay() + 6) % 7;
      byDay.set(wd, (byDay.get(wd) ?? 0) + 1);
    }
    let busiest = 0;
    let busiestLabel = DAYS_FR[0];
    for (const [wd, c] of byDay) {
      if (c > busiest) {
        busiest = c;
        busiestLabel = DAYS_FR[wd];
      }
    }
    const stock = await db.getStockLevels();
    const alerts: StockAlert[] = stock
      .filter((s) => s.stock_actuel <= s.stock_minimum)
      .slice(0, 20)
      .map((s) => ({
        article_name: s.libelle,
        category: s.categorie,
        current_stock: s.stock_actuel,
        days_remaining: s.stock_actuel <= 0 ? 0 : Math.max(1, Math.round(s.stock_actuel / 2)),
        urgency: s.stock_actuel === 0 ? 'high' : s.stock_actuel <= s.stock_minimum / 2 ? 'medium' : 'low',
      }));
    return {
      today: {
        total_tickets: todayTickets.length,
        total_revenue_estimate: revenueEstimateFromTotal(revenue),
        top_category,
        peak_hour,
      },
      week: {
        avg_daily_tickets: weekTickets.length / 7,
        busiest_day: busiestLabel,
      },
      alerts,
    };
  } finally {
    await db.close();
  }
}

export async function buildHourlyData(cfg: AgentConfig): Promise<HourlyData[]> {
  const db = await createDB(cfg);
  try {
    const end = new Date();
    const start = addDays(end, -7);
    const tickets = await db.getTicketsBetween(start, end);
    const byHour = new Map<number, number>();
    for (const t of tickets) {
      const h = new Date(t.date_heure).getHours();
      byHour.set(h, (byHour.get(h) ?? 0) + 1);
    }
    const out: HourlyData[] = [];
    for (let h = 0; h < 24; h++) {
      out.push({
        hour: h,
        ticket_count: Math.round((byHour.get(h) ?? 0) / 7),
        day_label: '7j moy.',
      });
    }
    return out;
  } finally {
    await db.close();
  }
}

export async function buildProductData(cfg: AgentConfig): Promise<ProductData[]> {
  const db = await createDB(cfg);
  try {
    const end = new Date();
    const start = startOfMonth();
    const tickets = await db.getTicketsBetween(start, end);
    if (tickets.length === 0) return [];
    const lines = await db.getTicketLines(tickets.map((t) => t.id));
    const catTickets = new Map<string, number>();
    const ticketCats = new Map<number, Set<string>>();
    for (const l of lines) {
      const set = ticketCats.get(l.id_ticket) ?? new Set<string>();
      set.add(l.categorie);
      ticketCats.set(l.id_ticket, set);
    }
    for (const [_id, cats] of ticketCats) {
      for (const c of cats) {
        catTickets.set(c, (catTickets.get(c) ?? 0) + 1);
      }
    }
    const total = [...catTickets.values()].reduce((a, b) => a + b, 0) || 1;
    const sorted = [...catTickets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return sorted.map(([category, ticket_count]) => ({
      category,
      ticket_count,
      percentage: Math.round((ticket_count / total) * 1000) / 10,
      trend: 'stable' as const,
    }));
  } finally {
    await db.close();
  }
}

export async function buildAlerts(cfg: AgentConfig): Promise<StockAlert[]> {
  const summary = await buildDashboardSummary(cfg);
  return summary.alerts;
}
