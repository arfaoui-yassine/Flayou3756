export interface DashboardSummary {
  today: {
    total_tickets: number;
    total_revenue_estimate: string;
    top_category: string;
    peak_hour: number;
    articles_sold: number;
    avg_ticket_estimate: string;
    tickets_vs_yesterday_pct: number | null;
    top_payment_label: string;
  };
  week: {
    avg_daily_tickets: number;
    busiest_day: string;
    quietest_day: string;
    week_revenue_estimate: string;
    top_category_week: string;
    week_ticket_total: number;
  };
  stock: {
    critical_alert_count: number;
    sku_tracked: number;
  };
  alerts: StockAlert[];
}

export interface StockAlert {
  article_name: string;
  category: string;
  current_stock: number;
  days_remaining: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface HourlyData {
  hour: number;
  ticket_count: number;
  day_label: string;
}

export interface ProductData {
  category: string;
  ticket_count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}
