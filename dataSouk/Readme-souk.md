# DataSouk — README for Cursor AI

> Dashboard analytics gratuit pour commerçants tunisiens, branché sur InnovaSoft POS.
> Les commerçants reçoivent des insights business. En contrepartie, les données anonymisées sont collectées.

---

## What you are building

A fullstack TypeScript monorepo with 3 apps:

1. **`apps/agent`** — Node.js service running locally on the merchant's Windows PC. Reads InnovaSoft's database (SQL Server or SQLite), anonymizes the data, queues events locally, syncs to cloud when internet is available. Exposes a local REST API on port 3456.

2. **`apps/dashboard`** — React SPA served by the agent. The merchant opens `http://localhost:5173` in their browser and sees their business insights (peak hours, top products, stock alerts).

3. **`apps/cloud-api`** — Fastify + PostgreSQL API hosted in the cloud. Receives anonymized event batches from agents.

---

## Monorepo structure to create

```
datasouk/
├── apps/
│   ├── agent/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── index.ts          ← auto-detect mssql or sqlite
│   │   │   │   ├── mssql.ts          ← SQL Server connector
│   │   │   │   ├── sqlite.ts         ← SQLite connector
│   │   │   │   └── queries.ts        ← all read-only SELECT queries
│   │   │   ├── collector/
│   │   │   │   └── index.ts          ← poll new tickets every 5 min
│   │   │   ├── anonymizer/
│   │   │   │   └── index.ts          ← SHA-256 hashing + data transformation
│   │   │   ├── queue/
│   │   │   │   ├── schema.sql        ← SQLite queue table
│   │   │   │   └── index.ts          ← enqueue / dequeue events
│   │   │   ├── sync/
│   │   │   │   └── index.ts          ← batch send to cloud API
│   │   │   ├── insights/
│   │   │   │   └── index.ts          ← compute the 3 merchant insights
│   │   │   └── server.ts             ← Fastify server on port 3456
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── dashboard/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── HourlyChart.tsx
│   │   │   │   ├── TopProductsChart.tsx
│   │   │   │   ├── StockAlertList.tsx
│   │   │   │   ├── SyncStatusBadge.tsx
│   │   │   │   └── ConsentModal.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Setup.tsx         ← 4-step wizard (first launch)
│   │   │   │   ├── Home.tsx          ← main dashboard
│   │   │   │   ├── Products.tsx
│   │   │   │   ├── Alerts.tsx
│   │   │   │   └── Sync.tsx
│   │   │   ├── lib/
│   │   │   │   └── api.ts            ← fetch calls to agent on port 3456
│   │   │   ├── i18n/
│   │   │   │   ├── fr.ts
│   │   │   │   └── ar.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── vite.config.ts
│   └── cloud-api/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── ingest.ts         ← POST /api/v1/ingest
│       │   │   ├── register.ts       ← POST /api/v1/register
│       │   │   └── health.ts
│       │   ├── db/
│       │   │   ├── schema.sql
│       │   │   └── index.ts          ← postgres client
│       │   ├── middleware/
│       │   │   ├── auth.ts           ← API key validation
│       │   │   └── validate.ts       ← Zod schema validation
│       │   └── server.ts
│       ├── .env.example
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   └── types.ts              ← all shared TypeScript types
│       └── package.json
├── package.json                      ← npm workspaces root
└── tsconfig.base.json
```

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript (strict) | 5.x |
| Agent server | Fastify | 4.x |
| SQL Server connector | mssql | 10.x |
| SQLite connector | better-sqlite3 | 9.x |
| Validation | Zod | 3.x |
| Logging | pino | 8.x |
| Frontend | React + Vite | 18.x / 5.x |
| Styling | TailwindCSS | 3.x |
| Charts | Recharts | 2.x |
| Cloud DB | PostgreSQL | 15.x |
| Testing | Vitest | 1.x |

---

## Step 1 — Root package.json (npm workspaces)

```json
{
  "name": "datasouk",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:agent": "npm -w apps/agent run dev",
    "dev:dashboard": "npm -w apps/dashboard run dev",
    "dev:cloud": "npm -w apps/cloud-api run dev",
    "build": "npm -w packages/shared run build && npm -w apps/agent run build && npm -w apps/dashboard run build && npm -w apps/cloud-api run build",
    "test": "npm -w apps/agent run test"
  }
}
```

---

## Step 2 — Shared types (packages/shared/src/types.ts)

Create these types first. Every other module imports from here.

```typescript
// Event types
export type EventType = 'sale' | 'hourly_summary' | 'stock_low';

export type CommerceType = 'epicerie' | 'cafe' | 'restaurant' | 'retail' | 'autre';

export type AmountRange = '<5' | '5-10' | '10-20' | '20-50' | '50-100' | '>100';

// Anonymized sale event — what gets sent to the cloud
export interface SaleEvent {
  event_type: 'sale';
  commerce_hash: string;      // SHA-256 of real commerce ID — never the real ID
  wilaya: string;             // region only, never street address
  type_commerce: CommerceType;
  heure: number;              // 0-23, never minutes
  jour_semaine: number;       // 0=Monday
  categories: string[];       // product categories, never product names
  montant_tranche: AmountRange; // amount range, never exact amount
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
  payload: string;            // JSON string of DataSoukEvent
  created_at: number;         // Unix timestamp
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
  poll_interval_ms: number;   // default 300000 (5 min)
  cloud_api_url: string;
  cloud_api_key: string;
  consent_given: boolean;
  consent_given_at: string | null;
}

// Dashboard API responses
export interface DashboardSummary {
  today: {
    total_tickets: number;
    total_revenue_estimate: string;   // range, not exact
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
  days_remaining: number;       // estimated from sales velocity
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
```

---

## Step 3 — Agent database connector (apps/agent/src/db/index.ts)

```typescript
import { AgentConfig } from '@datasouk/shared';

export interface InnovaDB {
  // Returns tickets created after the given timestamp
  getNewTickets(since: Date): Promise<RawTicket[]>;
  // Returns lines for given ticket IDs
  getTicketLines(ticketIds: number[]): Promise<RawTicketLine[]>;
  // Returns current stock levels
  getStockLevels(): Promise<RawStockLevel[]>;
  // Test connection
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

export interface RawTicket {
  id: number;
  date_heure: Date;
  montant_total: number;
  type_paiement: string;
}

export interface RawTicketLine {
  id_ticket: number;
  id_article: number;
  libelle: string;
  categorie: string;
  quantite: number;
  prix_unitaire: number;
}

export interface RawStockLevel {
  id_article: number;
  libelle: string;
  categorie: string;
  stock_actuel: number;
  stock_minimum: number;
}

// Factory — auto-detects DB type from config
export async function createDB(config: AgentConfig): Promise<InnovaDB> {
  if (config.db_type === 'mssql') {
    const { MssqlDB } = await import('./mssql');
    return new MssqlDB(config.mssql!);
  } else {
    const { SqliteDB } = await import('./sqlite');
    return new SqliteDB(config.sqlite!.file_path);
  }
}
```

**SQL queries to implement in `queries.ts`** (implement for both SQL Server and SQLite):

```sql
-- Get new tickets since last poll
SELECT id, date_heure, montant_total, type_paiement
FROM Ticket
WHERE date_heure > @since
ORDER BY date_heure ASC;

-- Get lines for tickets (use parameterized IN clause)
SELECT lt.id_ticket, lt.id_article, a.libelle, a.categorie,
       lt.quantite, lt.prix_unitaire
FROM LigneTicket lt
JOIN Article a ON a.id = lt.id_article
WHERE lt.id_ticket IN (@ids);

-- Get current stock levels with minimum threshold
SELECT a.id, a.libelle, a.categorie,
       COALESCE(s.stock_actuel, 0) as stock_actuel,
       COALESCE(a.stock_minimum, 5) as stock_minimum
FROM Article a
LEFT JOIN Stock s ON s.id_article = a.id
WHERE a.actif = 1;
```

---

## Step 4 — Anonymizer (apps/agent/src/anonymizer/index.ts)

```typescript
import { createHash } from 'crypto';
import { RawTicket, RawTicketLine } from '../db';
import { SaleEvent, AmountRange, CommerceType } from '@datasouk/shared';

// SALT must be loaded from env — never hardcoded
const SALT = process.env.ANONYMIZE_SALT!;

export function hashId(id: string | number): string {
  return createHash('sha256')
    .update(`${SALT}:${id}`)
    .digest('hex');
}

export function toAmountRange(amount: number): AmountRange {
  if (amount < 5) return '<5';
  if (amount < 10) return '5-10';
  if (amount < 20) return '10-20';
  if (amount < 50) return '20-50';
  if (amount < 100) return '50-100';
  return '>100';
}

export function toSaleEvent(
  ticket: RawTicket,
  lines: RawTicketLine[],
  commerceId: string,
  wilaya: string,
  type_commerce: CommerceType
): SaleEvent {
  const date = new Date(ticket.date_heure);
  return {
    event_type: 'sale',
    commerce_hash: hashId(commerceId),   // real ID never leaves this function
    wilaya,
    type_commerce,
    heure: date.getHours(),             // minutes discarded
    jour_semaine: (date.getDay() + 6) % 7,
    categories: [...new Set(lines.map(l => l.categorie))],
    montant_tranche: toAmountRange(ticket.montant_total),
    nb_articles: lines.reduce((sum, l) => sum + l.quantite, 0),
  };
}

// NEVER include: customer names, phone numbers, emails, exact amounts, exact addresses
// These fields are explicitly blocked — throw if detected
export function assertNoPersonalData(payload: unknown): void {
  const str = JSON.stringify(payload).toLowerCase();
  const banned = ['telephone', 'email', 'nom_client', 'adresse', 'rue'];
  for (const field of banned) {
    if (str.includes(field)) {
      throw new Error(`Personal data field "${field}" detected in payload — blocked`);
    }
  }
}
```

---

## Step 5 — Queue (apps/agent/src/queue/schema.sql + index.ts)

```sql
-- schema.sql
CREATE TABLE IF NOT EXISTS events_queue (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type  TEXT NOT NULL,
  payload     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  synced      INTEGER DEFAULT 0,
  synced_at   INTEGER
);

CREATE TABLE IF NOT EXISTS sync_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Store last polled timestamp
INSERT OR IGNORE INTO sync_state (key, value)
VALUES ('last_polled_at', '1970-01-01T00:00:00.000Z');
```

```typescript
// index.ts — implement these functions
export function enqueue(event: DataSoukEvent): void
export function getPending(limit?: number): QueueItem[]  // default limit 500
export function markSynced(ids: number[]): void
export function getLastPolledAt(): Date
export function setLastPolledAt(date: Date): void
export function getPendingCount(): number
```

---

## Step 6 — Sync (apps/agent/src/sync/index.ts)

```typescript
// Sync logic — runs every 60 seconds
// Only sends if internet is available (ping cloud API /health first)
// Sends batches of max 500 events
// On failure: logs error, keeps events in queue, retries next cycle
// On success: marks events as synced

export async function syncPendingEvents(): Promise<{
  sent: number;
  failed: number;
  skipped: boolean; // true if offline
}>
```

---

## Step 7 — Fastify server (apps/agent/src/server.ts)

Implement these routes. All return JSON. CORS is open for localhost:5173.

```
GET  /health                → { status: 'ok', db_connected: bool, last_sync: string }
GET  /dashboard/summary     → DashboardSummary
GET  /dashboard/hourly      → HourlyData[]   (last 7 days, grouped by hour)
GET  /dashboard/products    → ProductData[]  (top 10 categories this month)
GET  /dashboard/alerts      → StockAlert[]
GET  /queue/status          → { pending: number, synced_today: number, last_sync_at: string }
POST /config                → save config to config.json
POST /consent               → { accepted: boolean } → save to config
```

---

## Step 8 — Dashboard React

### Setup page (first launch wizard)

4 steps:
1. **Type de commerce** — radio buttons: épicerie / café / restaurant / retail / autre
2. **Localisation** — dropdown of Tunisian wilayas (24 options)
3. **Base de données** — SQL Server (form: server, db, user, password) OR SQLite (file path picker)
4. **Consentement** — show what data is collected, checkbox to accept, Submit button

### Home page — 3 KPI cards + charts

```tsx
// Layout
<div className="grid grid-cols-3 gap-4">
  <KPICard title="Tickets aujourd'hui" value={summary.today.total_tickets} trend="+12%" />
  <KPICard title="Heure de pointe" value={`${summary.today.peak_hour}h`} />
  <KPICard title="Top catégorie" value={summary.today.top_category} />
</div>
<HourlyChart data={hourlyData} />    // bar chart, last 7 days average
<TopProductsChart data={products} /> // horizontal bars
<StockAlertList alerts={summary.alerts} />
```

### Bilingual support

```typescript
// i18n/fr.ts
export const fr = {
  peak_hour: 'Heure de pointe',
  top_product: 'Top catégorie',
  stock_alert: 'Alerte stock',
  // ...
}

// i18n/ar.ts
export const ar = {
  peak_hour: 'ساعة الذروة',
  top_product: 'أفضل فئة',
  stock_alert: 'تنبيه المخزون',
  // ...
}
```

Switch button in top-right corner. RTL support via `dir="rtl"` on root when Arabic is selected.

### Color palette (TailwindCSS config)

```javascript
// tailwind.config.ts
colors: {
  brand: {
    DEFAULT: '#1A6B4A',
    light: '#E8F5EF',
    dark: '#0F4A33',
  }
}
```

---

## Step 9 — Cloud API (apps/cloud-api)

```typescript
// POST /api/v1/ingest
// Headers: Authorization: Bearer <api_key>
// Body: IngestPayload
// Validates with Zod, inserts into PostgreSQL events table
// Returns: { received: number, rejected: number }

// POST /api/v1/register
// Body: RegisterPayload
// Creates a new API key for the commerce
// Returns: { api_key: string }
```

**PostgreSQL schema:**

```sql
CREATE TABLE events (
  id              BIGSERIAL PRIMARY KEY,
  event_type      VARCHAR(50) NOT NULL,
  commerce_hash   VARCHAR(64) NOT NULL,
  wilaya          VARCHAR(50),
  type_commerce   VARCHAR(50),
  heure           SMALLINT,
  jour_semaine    SMALLINT,
  categories      TEXT[],
  montant_tranche VARCHAR(20),
  nb_articles     SMALLINT,
  received_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commerces (
  commerce_hash   VARCHAR(64) PRIMARY KEY,
  api_key         VARCHAR(64) UNIQUE NOT NULL,
  wilaya          VARCHAR(50),
  type_commerce   VARCHAR(50),
  registered_at   TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ
);

CREATE INDEX idx_events_wilaya       ON events(wilaya);
CREATE INDEX idx_events_type         ON events(type_commerce);
CREATE INDEX idx_events_received     ON events(received_at);
CREATE INDEX idx_events_heure        ON events(heure);
```

---

## Environment variables

### apps/agent/.env.example

```env
INNOVA_DB_TYPE=mssql
INNOVA_MSSQL_SERVER=localhost\SQLEXPRESS
INNOVA_MSSQL_DB=InnovaPOS
INNOVA_MSSQL_USER=datasouk_readonly
INNOVA_MSSQL_PASSWORD=
INNOVA_SQLITE_PATH=C:/InnovaSoft/data/innova.db
ANONYMIZE_SALT=change_me_to_32_random_chars_minimum
CLOUD_API_URL=https://api.datasouk.tn
CLOUD_API_KEY=
LOCAL_PORT=3456
```

### apps/cloud-api/.env.example

```env
DATABASE_URL=postgresql://user:password@localhost:5432/datasouk
PORT=8080
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=3600000
```

---

## Coding rules for Cursor

1. **TypeScript strict** — `"strict": true` in all tsconfigs. No `any`.
2. **All DB queries are parameterized** — never concatenate user input into SQL strings.
3. **All async functions have try/catch** — log errors with pino, never crash the process.
4. **Anonymizer is never bypassed** — all data passes through `toSaleEvent()` before queuing.
5. **READ ONLY on InnovaSoft DB** — never INSERT, UPDATE, DELETE on InnovaSoft tables.
6. **Tests for anonymizer** — write Vitest unit tests in `apps/agent/src/anonymizer/index.test.ts`.
7. **No console.log** — use `import pino from 'pino'; const log = pino();`.
8. **Config validation at startup** — validate `.env` with Zod before the server starts. Fail fast with a clear error message if required vars are missing.

---

## How to run (development)

```bash
# Install all dependencies
npm install

# Start agent (runs on port 3456)
npm run dev:agent

# Start dashboard (runs on port 5173)
npm run dev:dashboard

# Start cloud API (runs on port 8080)
npm run dev:cloud

# Run tests
npm test
```

---

## Cursor — start here

Generate files in this exact order to avoid import errors:

1. `packages/shared/src/types.ts`
2. `apps/agent/src/db/index.ts` + `mssql.ts` + `sqlite.ts` + `queries.ts`
3. `apps/agent/src/anonymizer/index.ts` + `index.test.ts`
4. `apps/agent/src/queue/schema.sql` + `index.ts`
5. `apps/agent/src/collector/index.ts`
6. `apps/agent/src/sync/index.ts`
7. `apps/agent/src/insights/index.ts`
8. `apps/agent/src/server.ts`
9. `apps/dashboard/src/` (all components and pages)
10. `apps/cloud-api/src/` (routes + db)
11. All `package.json` files and `tsconfig.json` files
12. Root `package.json` with workspaces

---

*DataSouk — Collecter la Tunisie, un ticket à la fois.*