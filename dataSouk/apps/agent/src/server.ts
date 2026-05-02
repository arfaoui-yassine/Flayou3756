import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { z } from 'zod';

const __agentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__agentDir, '..', '.env') });
import Fastify, { type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import pino from 'pino';
import type { AgentConfig } from '@datasouk/shared';
import { loadAgentConfig, saveAgentConfig, getConfigPath } from './lib/config-file.js';
import { initQueue, getPendingCount, getSyncedTodayCount, getLastSyncAt } from './queue/index.js';
import { createDB } from './db/index.js';
import { buildAlerts, buildDashboardSummary, buildHourlyData, buildProductData } from './insights/index.js';
import { syncPendingEvents } from './sync/index.js';
import { ensureCommerceId, startCollector, stopCollector } from './collector/index.js';
import { hashId } from './anonymizer/index.js';

const log = pino({ name: 'agent-server' });
const AGENT_VERSION = '0.0.1';

const envSchema = z.object({
  ANONYMIZE_SALT: z.string().min(16),
  LOCAL_PORT: z.coerce.number().default(3456),
});

let cachedConfig: AgentConfig | null = null;

function getConfig(): AgentConfig | null {
  return cachedConfig;
}

function refreshConfig(): void {
  cachedConfig = loadAgentConfig();
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** InnoSoft / SQLite / MSSQL read errors → 503 + message for the dashboard */
function replyInnovaFailure(reply: FastifyReply, e: unknown, logLabel: string): void {
  const msg = errMessage(e);
  log.error({ err: e }, logLabel);
  const looksLikePathOrDb = /SQLite:|fichier introuvable|dossier|ENOENT|ECONNREFUSED|Failed to connect|login failed/i.test(
    msg,
  );
  const status = looksLikePathOrDb ? 503 : 500;
  reply.code(status).send({
    error: looksLikePathOrDb ? 'innova_db' : `${logLabel}_failed`,
    message: msg,
  });
}

const configBodySchema = z.object({
  db_type: z.enum(['mssql', 'sqlite']),
  mssql: z
    .object({
      server: z.string(),
      database: z.string(),
      user: z.string(),
      password: z.string(),
    })
    .optional(),
  sqlite: z
    .object({
      file_path: z.string(),
    })
    .optional(),
  commerce_type: z.enum(['epicerie', 'cafe', 'restaurant', 'retail', 'autre']),
  wilaya: z.string(),
  poll_interval_ms: z.number().optional(),
  cloud_api_url: z.string().url(),
  cloud_api_key: z.string(),
  consent_given: z.boolean(),
  consent_given_at: z.string().nullable().optional(),
  commerce_internal_id: z.string().optional(),
});

async function main(): Promise<void> {
  const env = envSchema.parse(process.env);
  process.env.ANONYMIZE_SALT = env.ANONYMIZE_SALT;

  initQueue();
  refreshConfig();
  startCollector(getConfig);

  const syncTimer = setInterval(() => {
    const c = getConfig();
    if (!c?.consent_given || !c.cloud_api_key) return;
    void syncPendingEvents(c.cloud_api_url, c.cloud_api_key, AGENT_VERSION).catch((e) =>
      log.error({ err: e }, 'sync interval error'),
    );
  }, 60_000);

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] });

  app.get('/health', async () => {
    let db_connected = false;
    const c = getConfig();
    if (c) {
      try {
        const db = await createDB(c);
        db_connected = await db.ping();
        await db.close();
      } catch {
        db_connected = false;
      }
    }
    return {
      status: 'ok',
      db_connected,
      last_sync: getLastSyncAt() ?? '',
      config_path: getConfigPath(),
    };
  });

  app.get('/dashboard/summary', async (req, reply) => {
    const c = getConfig();
    if (!c) return reply.code(400).send({ error: 'not_configured' });
    try {
      return await buildDashboardSummary(c);
    } catch (e) {
      replyInnovaFailure(reply, e, 'summary');
      return;
    }
  });

  app.get('/dashboard/hourly', async (req, reply) => {
    const c = getConfig();
    if (!c) return reply.code(400).send({ error: 'not_configured' });
    try {
      return await buildHourlyData(c);
    } catch (e) {
      replyInnovaFailure(reply, e, 'hourly');
      return;
    }
  });

  app.get('/dashboard/products', async (req, reply) => {
    const c = getConfig();
    if (!c) return reply.code(400).send({ error: 'not_configured' });
    try {
      return await buildProductData(c);
    } catch (e) {
      replyInnovaFailure(reply, e, 'products');
      return;
    }
  });

  app.get('/dashboard/alerts', async (req, reply) => {
    const c = getConfig();
    if (!c) return reply.code(400).send({ error: 'not_configured' });
    try {
      return await buildAlerts(c);
    } catch (e) {
      replyInnovaFailure(reply, e, 'alerts');
      return;
    }
  });

  app.get('/queue/status', async () => ({
    pending: getPendingCount(),
    synced_today: getSyncedTodayCount(),
    last_sync_at: getLastSyncAt() ?? '',
  }));

  /** Pour inscription cloud : commerce_hash + URL d’appel POST /api/v1/register (réponse = api_key). */
  app.get('/registration-info', async (req, reply) => {
    const c = getConfig();
    if (!c) return reply.code(400).send({ error: 'not_configured' });
    const base = c.cloud_api_url.replace(/\/$/, '');
    const commerce_hash = hashId(c.commerce_internal_id);
    return {
      commerce_hash,
      wilaya: c.wilaya,
      type_commerce: c.commerce_type,
      register_url: `${base}/api/v1/register`,
    };
  });

  /** Mettre à jour uniquement l’URL cloud et/ou la clé API après un POST /api/v1/register. */
  app.post('/config/cloud', async (req, reply) => {
    const c = getConfig();
    if (!c) return reply.code(400).send({ error: 'not_configured' });
    const schema = z.object({
      cloud_api_url: z.string().url().optional(),
      cloud_api_key: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const next: AgentConfig = {
      ...c,
      cloud_api_key: parsed.data.cloud_api_key,
      ...(parsed.data.cloud_api_url ? { cloud_api_url: parsed.data.cloud_api_url } : {}),
    };
    saveAgentConfig(next);
    refreshConfig();
    return { ok: true };
  });

  app.post('/config', async (req, reply) => {
    const parsed = configBodySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const body = parsed.data;
    if (body.db_type === 'mssql' && !body.mssql) {
      return reply.code(400).send({ error: 'mssql_config_required' });
    }
    if (body.db_type === 'sqlite' && !body.sqlite) {
      return reply.code(400).send({ error: 'sqlite_config_required' });
    }
    if (body.db_type === 'sqlite' && body.sqlite) {
      const resolved = path.resolve(body.sqlite.file_path);
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        return reply.code(400).send({
          error: 'sqlite_dir_missing',
          message: `Le dossier n'existe pas : ${dir}`,
        });
      }
      if (!fs.existsSync(resolved)) {
        return reply.code(400).send({
          error: 'sqlite_file_missing',
          message: `Fichier SQLite introuvable : ${resolved}`,
        });
      }
    }
    const next: AgentConfig = ensureCommerceId({
      db_type: body.db_type,
      mssql: body.mssql,
      sqlite: body.sqlite,
      commerce_type: body.commerce_type,
      wilaya: body.wilaya,
      poll_interval_ms: body.poll_interval_ms ?? 300_000,
      cloud_api_url: body.cloud_api_url,
      cloud_api_key: body.cloud_api_key,
      consent_given: body.consent_given,
      consent_given_at: body.consent_given_at ?? (body.consent_given ? new Date().toISOString() : null),
      commerce_internal_id: body.commerce_internal_id ?? randomUUID(),
    });
    saveAgentConfig(next);
    refreshConfig();
    stopCollector();
    startCollector(getConfig);
    return { ok: true };
  });

  app.post('/consent', async (req, reply) => {
    const schema = z.object({ accepted: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const c = getConfig();
    if (!c) return reply.code(400).send({ error: 'not_configured' });
    const next: AgentConfig = {
      ...c,
      consent_given: parsed.data.accepted,
      consent_given_at: parsed.data.accepted ? new Date().toISOString() : null,
    };
    saveAgentConfig(next);
    refreshConfig();
    stopCollector();
    startCollector(getConfig);
    return { ok: true };
  });

  const close = async () => {
    clearInterval(syncTimer);
    stopCollector();
    await app.close();
  };

  process.on('SIGINT', () => {
    void close().then(() => process.exit(0));
  });

  await app.listen({ port: env.LOCAL_PORT, host: '0.0.0.0' });
  log.info({ port: env.LOCAL_PORT }, 'agent listening');
}

main().catch((e) => {
  log.error(e);
  process.exit(1);
});
