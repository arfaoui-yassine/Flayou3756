import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Q_NEW_TICKETS, Q_STOCK_LEVELS, Q_TICKET_LINES, Q_TICKETS_BETWEEN } from './queries.js';
function mapTicket(row) {
    return {
        id: Number(row.id),
        date_heure: new Date(String(row.date_heure)),
        montant_total: Number(row.montant_total),
        type_paiement: String(row.type_paiement),
    };
}
export class SqliteDB {
    db;
    constructor(filePath) {
        const resolved = path.resolve(filePath);
        const dir = path.dirname(resolved);
        if (!fs.existsSync(dir)) {
            throw new Error(`SQLite: le dossier n'existe pas (« ${dir} »). Créez le dossier ou corrigez le chemin dans Configuration (/setup).`);
        }
        if (!fs.existsSync(resolved)) {
            throw new Error(`SQLite: fichier introuvable (« ${resolved} »). Indiquez le chemin réel du fichier .db InnovaSoft (pas l'exemple du formulaire).`);
        }
        this.db = new Database(resolved, { readonly: true, fileMustExist: true });
    }
    async ping() {
        this.db.prepare('SELECT 1').get();
        return true;
    }
    async close() {
        this.db.close();
    }
    async getNewTickets(since) {
        const stmt = this.db.prepare(Q_NEW_TICKETS.replace('@since', '?').replace(/\s+/g, ' ').trim());
        const rows = stmt.all(since.toISOString());
        return rows.map(mapTicket);
    }
    async getTicketsBetween(start, end) {
        const sql = Q_TICKETS_BETWEEN.replace('@start', '?').replace('@end', '?').replace(/\s+/g, ' ').trim();
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(start.toISOString(), end.toISOString());
        return rows.map(mapTicket);
    }
    async getTicketLines(ticketIds) {
        if (ticketIds.length === 0)
            return [];
        const placeholders = ticketIds.map(() => '?').join(',');
        const q = Q_TICKET_LINES.replace('{IDS}', placeholders).replace(/\s+/g, ' ').trim();
        const stmt = this.db.prepare(q);
        const rows = stmt.all(...ticketIds);
        return rows.map((row) => ({
            id_ticket: Number(row.id_ticket),
            id_article: Number(row.id_article),
            libelle: String(row.libelle),
            categorie: String(row.categorie),
            quantite: Number(row.quantite),
            prix_unitaire: Number(row.prix_unitaire),
        }));
    }
    async getStockLevels() {
        const stmt = this.db.prepare(Q_STOCK_LEVELS.replace(/\s+/g, ' ').trim());
        const rows = stmt.all();
        return rows.map((row) => ({
            id_article: Number(row.id),
            libelle: String(row.libelle),
            categorie: String(row.categorie),
            stock_actuel: Number(row.stock_actuel),
            stock_minimum: Number(row.stock_minimum),
        }));
    }
}
//# sourceMappingURL=sqlite.js.map