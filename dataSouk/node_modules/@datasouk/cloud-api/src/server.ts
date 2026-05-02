import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';
import Fastify from 'fastify';
import { createPool, migrate } from './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
import { healthRoutes } from './routes/health.js';
import { registerRoutes } from './routes/register.js';
import { ingestRoutes } from './routes/ingest.js';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((u) => u.startsWith('mysql://'), {
      message: 'DATABASE_URL doit commencer par mysql:// (ex. mysql://root:pass@127.0.0.1:3306/datasouk)',
    }),
  PORT: z.coerce.number().default(8080),
});

async function main(): Promise<void> {
  const env = envSchema.parse(process.env);
  const pool = createPool(env.DATABASE_URL);
  await migrate(pool);

  const app = Fastify({ logger: true });
  await app.register(healthRoutes, { pool });
  await app.register(registerRoutes, { pool });
  await app.register(ingestRoutes, { pool });

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

main().catch((e) => {
  process.stderr.write(`${e}\n`);
  process.exit(1);
});
