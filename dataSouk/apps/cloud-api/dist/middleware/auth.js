export function authMiddleware(pool) {
    return async function (req, reply) {
        const h = req.headers.authorization;
        if (!h?.startsWith('Bearer ')) {
            reply.code(401).send({ error: 'missing_token' });
            return;
        }
        const token = h.slice('Bearer '.length).trim();
        const [rows] = await pool.query(`SELECT commerce_hash FROM commerces WHERE api_key = ? LIMIT 1`, [token]);
        if (!rows?.length) {
            reply.code(401).send({ error: 'invalid_token' });
            return;
        }
        req.commerceHash = String(rows[0].commerce_hash);
    };
}
//# sourceMappingURL=auth.js.map