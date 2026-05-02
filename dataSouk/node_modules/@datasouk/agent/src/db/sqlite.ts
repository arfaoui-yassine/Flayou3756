import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { InnovaDB, RawStockLevel, RawTicket, RawTicketLine } from './index.js';
import { Q_NEW_TICKETS, Q_STOCK_LEVELS, Q_TICKET_LINES, Q_TICKETS_BETWEEN } from './queries.js';

function mapTicket(row: Record<string, unknown>): RawTicket {
  return {
    id: Number(row.id),
    date_heure: new Date(String(row.date_heure)),
    montant_total: Number(row.montant_total),
    type_paiement: String(row.type_paiement),
  };
}

export class SqliteDB implements InnovaDB {
  private db: Database.Database;

  constructor(filePath: string) {
    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      throw new Error(
        `SQLite: le dossier n'existe pas (« ${dir} »). Créez le dossier ou corrigez le chemin dans Configuration (/setup).`,
      );
    }
    if (!fs.existsSync(resolved)) {
      throw new Error(
        `SQLite: fichier introuvable (« ${resolved} »). Indiquez le chemin réel du fichier .db InnovaSoft (pas l'exemple du formulaire).`,
      );
    }
    this.db = new Database(resolved, { readonly: true, fileMustExist: true });
  }

  async ping(): Promise<boolean> {
    this.db.prepare('SELECT 1').get();
    return true;
  }

  async close(): Promise<void> {
    this.db.close();
  }

  async getNewTickets(since: Date): Promise<RawTicket[]> {
    const stmt = this.db.prepare(
      Q_NEW_TICKETS.replace('@since', '?').replace(/\s+/g, ' ').trim(),
    );
    const rows = stmt.all(since.toISOString()) as Record<string, unknown>[];
    return rows.map(mapTicket);
  }

  async getTicketsBetween(start: Date, end: Date): Promise<RawTicket[]> {
    const sql = Q_TICKETS_BETWEEN.replace('@start', '?').replace('@end', '?').replace(/\s+/g, ' ').trim();
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(start.toISOString(), end.toISOString()) as Record<string, unknown>[];
    return rows.map(mapTicket);
  }

  async getTicketLines(ticketIds: number[]): Promise<RawTicketLine[]> {
    if (ticketIds.length === 0) return [];
    const placeholders = ticketIds.map(() => '?').join(',');
    const q = Q_TICKET_LINES.replace('{IDS}', placeholders).replace(/\s+/g, ' ').trim();
    const stmt = this.db.prepare(q);
    const rows = stmt.all(...ticketIds) as Record<string, unknown>[];
    return rows.map((row) => ({
      id_ticket: Number(row.id_ticket),
      id_article: Number(row.id_article),
      libelle: String(row.libelle),
      categorie: String(row.categorie),
      quantite: Number(row.quantite),
      prix_unitaire: Number(row.prix_unitaire),
    }));
  }

  async getStockLevels(): Promise<RawStockLevel[]> {
    const stmt = this.db.prepare(Q_STOCK_LEVELS.replace(/\s+/g, ' ').trim());
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((row) => ({
      id_article: Number(row.id),
      libelle: String(row.libelle),
      categorie: String(row.categorie),
      stock_actuel: Number(row.stock_actuel),
      stock_minimum: Number(row.stock_minimum),
    }));
  }
}
