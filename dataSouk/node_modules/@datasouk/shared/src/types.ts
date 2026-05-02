// Event types
export type EventType = 'sale' | 'hourly_summary' | 'stock_low';

export type CommerceType = 'epicerie' | 'cafe' | 'restaurant' | 'retail' | 'autre';

export type AmountRange = '<5' | '5-10' | '10-20' | '20-50' | '50-100' | '>100';

// Anonymized sale event — what gets sent to the cloud
export interface SaleEvent {
  event_type: 'sale';
  commerce_hash: string;
  wilaya: string;
  type_commerce: CommerceType;
  heure: number;
  jour_semaine: number;
  categories: string[];
  montant_tranche: AmountRange;
  nb_articles: number;
}

export interface StockLowEvent {
  event_type: 'stock_low';
  commerce_hash: string;
  wilaya: string;
  type_commerce: CommerceType;
  category: string;
  current_stock: number;
  threshold: number;
}

export type DataSoukEvent = SaleEvent | StockLowEvent;

// Queue item stored locally in SQLite
export interface QueueItem {
  id: number;
  event_type: EventType;
  payload: string;
  created_at: number;
  synced: 0 | 1;
  synced_at: number | null;
}

// Agent config (stored in config.json on merchant PC)
export interface AgentConfig {
  db_type: 'mssql' | 'sqlite';
  mssql?: {
    server: string;
    database: string;
    user: string;
    password: string;
  };
  sqlite?: {
    file_path: string;
  };
  commerce_type: CommerceType;
  wilaya: string;
  poll_interval_ms: number;
  cloud_api_url: string;
  cloud_api_key: string;
  consent_given: boolean;
  consent_given_at: string | null;
  /** Opaque local ID; only the hash is sent to the cloud */
  commerce_internal_id: string;
}

// Dashboard API responses
export interface DashboardSummary {
  today: {
    total_tickets: number;
    total_revenue_estimate: string;
    top_category: string;
    peak_hour: number;
  };
  week: {
    avg_daily_tickets: number;
    busiest_day: string;
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

// Cloud API
export interface IngestPayload {
  events: DataSoukEvent[];
  agent_version: string;
  sent_at: string;
}

export interface RegisterPayload {
  commerce_hash: string;
  wilaya: string;
  type_commerce: CommerceType;
}
