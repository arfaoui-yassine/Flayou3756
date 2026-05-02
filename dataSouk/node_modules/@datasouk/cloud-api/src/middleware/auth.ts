import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RowDataPacket } from 'mysql2';
import type { DbPool } from '../db/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    commerceHash?: string;
  }
}

export function authMiddleware(pool: DbPool) {
  return async function (req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'missing_token' });
      return;
    }
    const token = h.slice('Bearer '.length).trim();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT commerce_hash FROM commerces WHERE api_key = ? LIMIT 1`,
      [token],
    );
    if (!rows?.length) {
      reply.code(401).send({ error: 'invalid_token' });
      return;
    }
    req.commerceHash = String(rows[0].commerce_hash);
  };
}
