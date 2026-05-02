import type { InnovaDB, RawStockLevel, RawTicket, RawTicketLine } from './index.js';
export declare class SqliteDB implements InnovaDB {
    private db;
    constructor(filePath: string);
    ping(): Promise<boolean>;
    close(): Promise<void>;
    getNewTickets(since: Date): Promise<RawTicket[]>;
    getTicketsBetween(start: Date, end: Date): Promise<RawTicket[]>;
    getTicketLines(ticketIds: number[]): Promise<RawTicketLine[]>;
    getStockLevels(): Promise<RawStockLevel[]>;
}
//# sourceMappingURL=sqlite.d.ts.map