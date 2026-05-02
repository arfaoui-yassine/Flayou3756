import sql from 'mssql';
import { Q_NEW_TICKETS, Q_STOCK_LEVELS, Q_TICKET_LINES, Q_TICKETS_BETWEEN } from './queries.js';
export class MssqlDB {
    pool;
    constructor(cfg) {
        this.pool = new sql.ConnectionPool({
            server: cfg.server,
            database: cfg.database,
            user: cfg.user,
            password: cfg.password,
            options: {
                encrypt: false,
                trustServerCertificate: true,
            },
        });
    }
    async ping() {
        await this.pool.connect();
        await this.pool.request().query('SELECT 1 AS ok');
        return true;
    }
    async close() {
        await this.pool.close();
    }
    async getNewTickets(since) {
        await this.pool.connect();
        const r = await this.pool.request().input('since', sql.DateTime2, since).query(Q_NEW_TICKETS);
        return r.recordset.map((row) => ({
            ...row,
            date_heure: new Date(row.date_heure),
        }));
    }
    async getTicketsBetween(start, end) {
        await this.pool.connect();
        const r = await this.pool
            .request()
            .input('start', sql.DateTime2, start)
            .input('end', sql.DateTime2, end)
            .query(Q_TICKETS_BETWEEN);
        return r.recordset.map((row) => ({
            ...row,
            date_heure: new Date(row.date_heure),
        }));
    }
    async getTicketLines(ticketIds) {
        if (ticketIds.length === 0)
            return [];
        await this.pool.connect();
        const req = this.pool.request();
        const placeholders = ticketIds.map((id, i) => {
            const name = `id${i}`;
            req.input(name, sql.Int, id);
            return `@${name}`;
        });
        const q = Q_TICKET_LINES.replace('{IDS}', placeholders.join(','));
        const r = await req.query(q);
        return r.recordset;
    }
    async getStockLevels() {
        await this.pool.connect();
        const r = await this.pool.request().query(Q_STOCK_LEVELS);
        return r.recordset;
    }
}
//# sourceMappingURL=mssql.js.map