import type { FastifyPluginAsync } from 'fastify';
import type { DbPool } from '../db/index.js';
import { ingestBodySchema } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';

export const ingestRoutes: FastifyPluginAsync<{ pool: DbPool }> = async (app, opts) => {
  const { pool } = opts;
  const auth = authMiddleware(pool);

  app.post('/api/v1/ingest', { preHandler: auth }, async (req, reply) => {
    const parsed = ingestBodySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    let received = 0;
    let rejected = 0;
    const tokenHash = req.commerceHash;

    for (const ev of parsed.data.events) {
      if (tokenHash && ev.commerce_hash !== tokenHash) {
        rejected++;
        continue;
      }
      try {
        if (ev.event_type === 'sale') {
          await pool.query(
            `INSERT INTO events (
              event_type, commerce_hash, wilaya, type_commerce, heure, jour_semaine,
              categories, montant_tranche, nb_articles
            ) VALUES (?,?,?,?,?,?,?,?,?)`,
            [
              ev.event_type,
              ev.commerce_hash,
              ev.wilaya,
              ev.type_commerce,
              ev.heure,
              ev.jour_semaine,
              JSON.stringify(ev.categories),
              ev.montant_tranche,
              ev.nb_articles,
            ],
          );
        } else {
          await pool.query(
            `INSERT INTO events (
              event_type, commerce_hash, wilaya, type_commerce, category, current_stock, threshold
            ) VALUES (?,?,?,?,?,?,?)`,
            [
              ev.event_type,
              ev.commerce_hash,
              ev.wilaya,
              ev.type_commerce,
              ev.category,
              ev.current_stock,
              ev.threshold,
            ],
          );
        }
        received++;
      } catch {
        rejected++;
      }
    }

    const hash = parsed.data.events[0]?.commerce_hash ?? tokenHash;
    if (hash) {
      await pool.query(`UPDATE commerces SET last_seen_at = CURRENT_TIMESTAMP(3) WHERE commerce_hash = ?`, [
        hash,
      ]);
    }

    return { received, rejected };
  });
};
