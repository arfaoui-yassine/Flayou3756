import type { AgentConfig } from '@datasouk/shared';
export interface InnovaDB {
    getNewTickets(since: Date): Promise<RawTicket[]>;
    getTicketLines(ticketIds: number[]): Promise<RawTicketLine[]>;
    getStockLevels(): Promise<RawStockLevel[]>;
    getTicketsBetween(start: Date, end: Date): Promise<RawTicket[]>;
    ping(): Promise<boolean>;
    close(): Promise<void>;
}
export interface RawTicket {
    id: number;
    date_heure: Date;
    montant_total: number;
    type_paiement: string;
}
export interface RawTicketLine {
    id_ticket: number;
    id_article: number;
    libelle: string;
    categorie: string;
    quantite: number;
    prix_unitaire: number;
}
export interface RawStockLevel {
    id_article: number;
    libelle: string;
    categorie: string;
    stock_actuel: number;
    stock_minimum: number;
}
export declare function createDB(config: AgentConfig): Promise<InnovaDB>;
//# sourceMappingURL=index.d.ts.map