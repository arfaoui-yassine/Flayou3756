import { createDB } from '../db/index.js';
const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
function startOfMonth() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function revenueEstimateFromTotal(total) {
    if (total < 50)
        return '< 50 TND';
    if (total < 200)
        return '50–200 TND';
    if (total < 500)
        return '200–500 TND';
    return '> 500 TND';
}
function avgTicketBucket(avg) {
    if (!Number.isFinite(avg) || avg <= 0)
        return '—';
    if (avg < 8)
        return '< 8 TND / ticket';
    if (avg < 15)
        return '8–15 TND / ticket';
    if (avg < 30)
        return '15–30 TND / ticket';
    if (avg < 60)
        return '30–60 TND / ticket';
    return '> 60 TND / ticket';
}
function pctVsYesterday(today, yesterday) {
    if (today === 0 && yesterday === 0)
        return null;
    if (yesterday === 0)
        return today > 0 ? 100 : null;
    return Math.round(((today - yesterday) / yesterday) * 100);
}
export async function buildDashboardSummary(cfg) {
    const db = await createDB(cfg);
    try {
        const todayStart = startOfToday();
        const tomorrow = addDays(todayStart, 1);
        const yesterdayStart = addDays(todayStart, -1);
        const weekStart = addDays(todayStart, -6);
        const todayTickets = await db.getTicketsBetween(todayStart, tomorrow);
        const yesterdayTickets = await db.getTicketsBetween(yesterdayStart, todayStart);
        const weekTickets = await db.getTicketsBetween(weekStart, tomorrow);
        const linesToday = todayTickets.length > 0 ? await db.getTicketLines(todayTickets.map((t) => t.id)) : [];
        const articles_sold = linesToday.reduce((s, l) => s + l.quantite, 0);
        const catCount = new Map();
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
        const payCount = new Map();
        for (const t of todayTickets) {
            const k = t.type_paiement?.trim() || 'autre';
            payCount.set(k, (payCount.get(k) ?? 0) + 1);
        }
        let top_payment_label = '—';
        let payMax = 0;
        for (const [k, n] of payCount) {
            if (n > payMax) {
                payMax = n;
                top_payment_label = k;
            }
        }
        const hourCount = new Map();
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
        const avgRaw = todayTickets.length > 0 ? revenue / todayTickets.length : 0;
        const avg_ticket_estimate = avgTicketBucket(avgRaw);
        const tickets_vs_yesterday_pct = pctVsYesterday(todayTickets.length, yesterdayTickets.length);
        const byDay = new Map();
        for (let wd = 0; wd < 7; wd++)
            byDay.set(wd, 0);
        for (const t of weekTickets) {
            const wd = (new Date(t.date_heure).getDay() + 6) % 7;
            byDay.set(wd, (byDay.get(wd) ?? 0) + 1);
        }
        let busiest = 0;
        let busiestLabel = DAYS_FR[0];
        let quietest = Number.POSITIVE_INFINITY;
        let quietestLabel = DAYS_FR[0];
        for (const [wd, c] of byDay) {
            if (c > busiest) {
                busiest = c;
                busiestLabel = DAYS_FR[wd];
            }
            if (c < quietest) {
                quietest = c;
                quietestLabel = DAYS_FR[wd];
            }
        }
        const weekRevenue = weekTickets.reduce((s, t) => s + t.montant_total, 0);
        const week_revenue_estimate = revenueEstimateFromTotal(weekRevenue);
        const week_ticket_total = weekTickets.length;
        let top_category_week = '—';
        if (weekTickets.length > 0) {
            const wLines = await db.getTicketLines(weekTickets.map((t) => t.id));
            const wCat = new Map();
            for (const l of wLines) {
                wCat.set(l.categorie, (wCat.get(l.categorie) ?? 0) + l.quantite);
            }
            let wMax = 0;
            for (const [c, n] of wCat) {
                if (n > wMax) {
                    wMax = n;
                    top_category_week = c;
                }
            }
        }
        const stock = await db.getStockLevels();
        const sku_tracked = stock.length;
        const alerts = stock
            .filter((s) => s.stock_actuel <= s.stock_minimum)
            .slice(0, 20)
            .map((s) => ({
            article_name: s.libelle,
            category: s.categorie,
            current_stock: s.stock_actuel,
            days_remaining: s.stock_actuel <= 0 ? 0 : Math.max(1, Math.round(s.stock_actuel / 2)),
            urgency: s.stock_actuel === 0 ? 'high' : s.stock_actuel <= s.stock_minimum / 2 ? 'medium' : 'low',
        }));
        const critical_alert_count = alerts.filter((a) => a.urgency === 'high').length;
        return {
            today: {
                total_tickets: todayTickets.length,
                total_revenue_estimate: revenueEstimateFromTotal(revenue),
                top_category,
                peak_hour,
                articles_sold,
                avg_ticket_estimate,
                tickets_vs_yesterday_pct,
                top_payment_label,
            },
            week: {
                avg_daily_tickets: weekTickets.length / 7,
                busiest_day: busiestLabel,
                quietest_day: quietestLabel,
                week_revenue_estimate,
                top_category_week,
                week_ticket_total,
            },
            stock: {
                critical_alert_count,
                sku_tracked,
            },
            alerts,
        };
    }
    finally {
        await db.close();
    }
}
export async function buildHourlyData(cfg) {
    const db = await createDB(cfg);
    try {
        const end = new Date();
        const start = addDays(end, -7);
        const tickets = await db.getTicketsBetween(start, end);
        const byHour = new Map();
        for (const t of tickets) {
            const h = new Date(t.date_heure).getHours();
            byHour.set(h, (byHour.get(h) ?? 0) + 1);
        }
        const out = [];
        for (let h = 0; h < 24; h++) {
            out.push({
                hour: h,
                ticket_count: Math.round((byHour.get(h) ?? 0) / 7),
                day_label: '7j moy.',
            });
        }
        return out;
    }
    finally {
        await db.close();
    }
}
export async function buildProductData(cfg) {
    const db = await createDB(cfg);
    try {
        const end = new Date();
        const start = startOfMonth();
        const tickets = await db.getTicketsBetween(start, end);
        if (tickets.length === 0)
            return [];
        const lines = await db.getTicketLines(tickets.map((t) => t.id));
        const catTickets = new Map();
        const ticketCats = new Map();
        for (const l of lines) {
            const set = ticketCats.get(l.id_ticket) ?? new Set();
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
            trend: 'stable',
        }));
    }
    finally {
        await db.close();
    }
}
export async function buildAlerts(cfg) {
    const summary = await buildDashboardSummary(cfg);
    return summary.alerts;
}
//# sourceMappingURL=index.js.map