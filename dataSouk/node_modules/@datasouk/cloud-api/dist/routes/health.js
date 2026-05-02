export const healthRoutes = async (app, opts) => {
    const { pool } = opts;
    app.get('/api/v1/health', async (_req, reply) => {
        try {
            await pool.query('SELECT 1');
            return { status: 'ok', db: true };
        }
        catch {
            return reply.code(503).send({ status: 'degraded', db: false });
        }
    });
};
//# sourceMappingURL=health.js.map