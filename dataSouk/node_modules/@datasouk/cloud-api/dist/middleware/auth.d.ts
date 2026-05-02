import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DbPool } from '../db/index.js';
declare module 'fastify' {
    interface FastifyRequest {
        commerceHash?: string;
    }
}
export declare function authMiddleware(pool: DbPool): (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map