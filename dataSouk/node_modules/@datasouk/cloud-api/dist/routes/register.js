import { randomBytes } from 'node:crypto';
import { registerBodySchema } from '../middleware/validate.js';
export const registerRoutes = async (app, opts) => {
    const { pool } = opts;
    app.post('/api/v1/register', async (req, reply) => {
        const parsed = registerBodySchema.safeParse(req.body);
        if (!parsed.success)
            return reply.code(400).send({ error: parsed.error.flatten() });
        const api_key = randomBytes(32).toString('hex');
        try {
            await pool.query(`INSERT INTO commerces (commerce_hash, api_key, wilaya, type_commerce)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           api_key = VALUES(api_key),
           wilaya = VALUES(wilaya),
           type_commerce = VALUES(type_commerce)`, [parsed.data.commerce_hash, api_key, parsed.data.wilaya, parsed.data.type_commerce]);
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ error: 'register_failed' });
        }
        return { api_key };
    });
};
//# sourceMappingURL=register.js.map