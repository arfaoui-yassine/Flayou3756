/**
 * Génère examples/innova/innova.db — schéma minimal compatible avec apps/agent (lecture seule).
 * Usage (depuis la racine dataSouk) : npm run example:db
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const outDir = path.join(__dirname, '..', 'examples', 'innova');
const outFile = path.join(outDir, 'innova.db');

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outFile)) {
  fs.unlinkSync(outFile);
}

const db = new Database(outFile);

db.exec(`
CREATE TABLE Ticket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_heure TEXT NOT NULL,
  montant_total REAL NOT NULL,
  type_paiement TEXT NOT NULL
);

CREATE TABLE Article (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle TEXT NOT NULL,
  categorie TEXT NOT NULL,
  stock_minimum REAL NOT NULL DEFAULT 5,
  actif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE Stock (
  id_article INTEGER PRIMARY KEY REFERENCES Article(id),
  stock_actuel REAL NOT NULL
);

CREATE TABLE LigneTicket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ticket INTEGER NOT NULL REFERENCES Ticket(id),
  id_article INTEGER NOT NULL REFERENCES Article(id),
  quantite REAL NOT NULL,
  prix_unitaire REAL NOT NULL
);

CREATE INDEX idx_ticket_date ON Ticket(date_heure);
`);

const articles = [
  ['Eau 1.5L', 'Boissons', 24],
  ['Coca 33cl', 'Boissons', 10],
  ['Pain', 'Boulangerie', 15],
  ['Yaourt nature', 'Laitiers', 20],
  ['Fromage local', 'Laitiers', 8],
  ['Tomates', 'Fruits & légumes', 12],
  ['Bananes', 'Fruits & légumes', 18],
  ['Pâtes 500g', 'Épicerie salée', 30],
  ['Huile 1L', 'Épicerie salée', 6],
  ['Biscuits', 'Épicerie sucrée', 25],
];

const insertArticle = db.prepare(
  'INSERT INTO Article (libelle, categorie, stock_minimum, actif) VALUES (?, ?, ?, 1)',
);
const insertStock = db.prepare('INSERT INTO Stock (id_article, stock_actuel) VALUES (?, ?)');

const articleIds = [];
for (let i = 0; i < articles.length; i++) {
  const [lib, cat, min] = articles[i];
  const r = insertArticle.run(lib, cat, min);
  const id = Number(r.lastInsertRowid);
  articleIds.push(id);
  const stock = i % 3 === 0 ? min - 2 : min + 5 + i * 2;
  insertStock.run(id, stock);
}

const insertTicket = db.prepare(
  'INSERT INTO Ticket (date_heure, montant_total, type_paiement) VALUES (?, ?, ?)',
);
const insertLine = db.prepare(
  'INSERT INTO LigneTicket (id_ticket, id_article, quantite, prix_unitaire) VALUES (?, ?, ?, ?)',
);

const pay = ['especes', 'carte', 'especes'];
let ticketId = 0;

function addTicket(isoDate, lines) {
  const total = lines.reduce((s, [qty, pu]) => s + qty * pu, 0);
  const r = insertTicket.run(isoDate, total, pay[ticketId % pay.length]);
  const tid = Number(r.lastInsertRowid);
  ticketId++;
  for (const [artIdx, qty, pu] of lines) {
    insertLine.run(tid, articleIds[artIdx], qty, pu);
  }
}

const now = new Date();
for (let d = 0; d < 14; d++) {
  const day = new Date(now);
  day.setDate(day.getDate() - d);
  for (let h of [8, 9, 11, 12, 13, 18, 19, 20]) {
    day.setHours(h, 15 + (d % 45), 0, 0);
    const iso = day.toISOString();
    const a = (d + h) % articleIds.length;
    const b = (a + 1) % articleIds.length;
    addTicket(iso, [
      [a, 2, 1.2 + (h % 3) * 0.5],
      [b, 1, 2.5],
    ]);
  }
}

for (let h = 0; h < 8; h++) {
  const t = new Date(now);
  t.setHours(9 + h, 20, 0, 0);
  addTicket(t.toISOString(), [[h % articleIds.length, 3 + (h % 2), 4]]);
}

db.close();

console.log('Base exemple créée :', outFile);
console.log('Dans Configuration (/setup), SQLite : chemin absolu vers ce fichier.');
