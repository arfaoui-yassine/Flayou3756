# DataSouk

**DataSouk** is a TypeScript monorepo for Tunisian merchants using **InnovaSoft POS**. A small **agent** runs on the shop PC (read-only access to the POS database), computes **local business insights** for a **React dashboard**, and optionally sends **anonymized events** to a **cloud API** backed by **MySQL**.

Merchants see peak hours, category mix, and stock alerts. Only aggregated, non-identifying data is designed to leave the shop (hashed commerce id, wilaya, hour buckets, amount ranges, categories—never exact totals tied to identity fields as defined in the anonymizer).

---

## What’s in this repo

| Package / app | Role |
|---------------|------|
| **`packages/shared`** | Shared TypeScript types (`AgentConfig`, events, dashboard DTOs). |
| **`apps/agent`** | Fastify on **3456**: reads MSSQL/SQLite (read-only), anonymizes, **SQLite queue**, periodic **sync** to cloud, REST for the dashboard. |
| **`apps/dashboard`** | Vite + React + Tailwind + Recharts on **5173**; talks to the agent (`VITE_AGENT_URL` or `http://localhost:3456`). |
| **`apps/cloud-api`** | Fastify on **8080**; `POST /api/v1/register`, `POST /api/v1/ingest`, `GET /api/v1/health`; stores events in Postgres. |

```mermaid
flowchart LR
  subgraph shop["Merchant PC"]
    POS[(Innova DB\nMSSQL or SQLite)]
    Agent[Agent :3456]
    Q[(Local queue\nSQLite)]
    POS -->|SELECT only| Agent
    Agent --> Q
  end
  Dash[Dashboard :5173] -->|REST| Agent
  Agent -->|batches when online| Cloud[Cloud API :8080]
  Cloud --> DB[(MySQL)]
```

---

## Repository layout

```
dataSouk/
├── package.json              # npm workspaces: apps/*, packages/*
├── packages/shared/          # @datasouk/shared
├── apps/agent/
├── apps/dashboard/
├── apps/cloud-api/
├── examples/innova/          # sample innova.db (see below)
├── scripts/                  # create-example-innova-db.cjs
├── README.md                 # this file
└── Readme-souk.md            # full product/spec & Cursor-oriented notes
```

---

## Demo without InnovaSoft (`innova.db`)

To try the dashboard with **fake POS data** (tickets, lines, stock):

```bash
npm run example:db
```

This writes **`examples/innova/innova.db`**. In **Configuration** (`/setup`), choose SQLite and set the **absolute path** to that file (e.g. `D:\...\dataSouk\examples\innova\innova.db` on Windows). Details: `examples/innova/README.md`.

---

## Prerequisites

- **Node.js** 20+ (recommended) and npm.
- **MySQL** 8+ (or compatible) if you run the cloud API (local or hosted).
- **InnovaSoft** database **or** the example SQLite file above, with the schema expected by the read-only queries in `apps/agent/src/db/queries.ts`.

Native module: **`better-sqlite3`** (agent local queue; dashboard build does not need it for compile). On Windows, npm install builds it via prebuilds when possible.

---

## Install, build, test

From the `dataSouk` directory:

```bash
npm install
npm run build
npm test
```

`build` compiles shared types, the agent, the dashboard (TypeScript check + Vite production build), and the cloud API.

---

## Configuration and local data

| Item | Default / notes |
|------|------------------|
| Agent config | `%USERPROFILE%\.datasouk\config.json` (override with `DATASOUK_CONFIG_PATH`) |
| Event queue DB | `%USERPROFILE%\.datasouk\queue.db` (override with `DATASOUK_QUEUE_DB` or `DATASOUK_DATA_DIR`) |

First-time setup is also available in the dashboard wizard (**`/setup`**) which posts to `POST /config` on the agent.

The agent requires a strong salt for hashing:

- **`ANONYMIZE_SALT`** — at least 16 characters; must be set in the environment when starting the agent (see `.env.example` in `apps/agent`).

Optional:

- **`LOCAL_PORT`** — agent listen port (default `3456`).

Cloud API:

- **`DATABASE_URL`** — URI MySQL (`mysql://user:pass@host:3306/datasouk`). Créer la base avant le premier lancement.
- **`PORT`** — listen port (default `8080`).

See `apps/agent/.env.example` and `apps/cloud-api/.env.example`.

---

## Run in development

Use **three terminals** from `dataSouk` (cloud only if you need ingest):

**1. Agent**

```bash
# Windows PowerShell example
$env:ANONYMIZE_SALT="your_secret_at_least_16_chars"
npm run dev:agent
```

**2. Dashboard**

```bash
npm run dev:dashboard
```

Open [http://localhost:5173](http://localhost:5173). Optional: copy `apps/dashboard/.env.example` to `apps/dashboard/.env` and set **`VITE_AGENT_URL`** if the agent is not on `http://localhost:3456`. Vite loads `apps/dashboard/.env` on its own (no `dotenv` dependency).

**3. Cloud API** (optional)

```bash
$env:DATABASE_URL="mysql://user:password@127.0.0.1:3306/datasouk"
npm run dev:cloud
```

Production-style start after `npm run build`:

- Agent: `npm -w apps/agent run start`
- Cloud: `npm -w apps/cloud-api run start`
- Dashboard: static files in `apps/dashboard/dist` (serve with any static host or integrate behind the agent if you add that later).

---

## Agent HTTP API (summary)

Base URL: `http://localhost:3456` (by default).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness + DB connectivity + last sync hint |
| `GET` | `/dashboard/summary` | KPIs and embedded alerts |
| `GET` | `/dashboard/hourly` | Hourly series (insights) |
| `GET` | `/dashboard/products` | Top categories |
| `GET` | `/dashboard/alerts` | Stock alerts |
| `GET` | `/queue/status` | Pending / synced counts |
| `GET` | `/registration-info` | `commerce_hash`, `wilaya`, `type_commerce`, `register_url` (needs saved config) |
| `POST` | `/config` | Save merchant + DB + cloud settings |
| `POST` | `/config/cloud` | Update `cloud_api_key` (and optionally `cloud_api_url`) after cloud registration |
| `POST` | `/consent` | Update consent flag |

CORS is allowed for the Vite dev origin (`localhost:5173`).

---

## Cloud API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/health` | DB up check (used by the agent before sync) |
| `POST` | `/api/v1/register` | Register commerce hash → returns `api_key` |
| `POST` | `/api/v1/ingest` | Bearer token; batch of anonymized events |

### Where the API key (`cloud_api_key`) comes from

The key is **not** invented in the dashboard: the **cloud API creates it** when you register this shop.

1. Save configuration once in **`/setup`** (so the agent knows `cloud_api_url`, wilaya, commerce type, and has a `commerce_internal_id`).
2. Call **`GET http://localhost:3456/registration-info`** on the agent: it returns **`commerce_hash`** and **`register_url`** aligned with your config.
3. **`POST`** to `register_url` with JSON  
   `{ "commerce_hash": "<from step 2>", "wilaya": "<same as config>", "type_commerce": "<same as config>" }`  
   (wilaya and type must match what you saved).
4. The response body includes **`api_key`**: paste it into Configuration, or send **`POST /config/cloud`** with `{ "cloud_api_key": "<paste>" }`.

In production, the same `POST /api/v1/register` would be hosted on your real cloud (e.g. `https://api.datasouk.tn`).

---

## Security and privacy (behavioural summary)

- InnovaSoft database access is **read-only** in code intent (SELECT-only queries).
- Sales are turned into **`SaleEvent`** objects via hashing and bucketing; the anonymizer includes checks against obvious personal-data field names in payloads before queueing.
- **`commerce_internal_id`** stays on the machine; only **`commerce_hash`** is used in outbound events.

For exact types, SQL shapes, and coding rules, see **`Readme-souk.md`**.

---

## Troubleshooting

- **Dashboard errors loading data** — Ensure the agent is running and `ANONYMIZE_SALT` is set; complete **`/setup`** so `config.json` exists.
- **Agent DB connection fails** — Verify SQL Server/SQLite path, credentials, and firewall; check `/health`.
- **Sync never sends** — Cloud must expose **`GET /api/v1/health`**; config needs **`cloud_api_url`** and an **`cloud_api_key`** obtained via **`POST /api/v1/register`** (see *Where the API key* above). Use **`GET /registration-info`** on the agent if you are unsure of `commerce_hash`.

---

## License / product

Product positioning and tagline are described in **`Readme-souk.md`**. Add a `LICENSE` file at the repo root if you distribute this codebase.
