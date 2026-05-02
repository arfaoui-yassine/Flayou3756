import type { InnovaDB, RawStockLevel, RawTicket, RawTicketLine } from './index.js';
export declare class MssqlDB implements InnovaDB {
    private pool;
    constructor(cfg: {
        server: string;
        database: string;
        user: string;
        password: string;
    });
    ping(): Promise<boolean>;
    close(): Promise<void>;
    getNewTickets(since: Date): Promise<RawTicket[]>;
    getTicketsBetween(start: Date, end: Date): Promise<RawTicket[]>;
    getTicketLines(ticketIds: number[]): Promise<RawTicketLine[]>;
    getStockLevels(): Promise<RawStockLevel[]>;
}
//# sourceMappingURL=mssql.d.ts.map