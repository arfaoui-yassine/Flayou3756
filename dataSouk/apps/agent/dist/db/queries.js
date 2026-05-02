export const Q_NEW_TICKETS = `
SELECT id, date_heure, montant_total, type_paiement
FROM Ticket
WHERE date_heure > @since
ORDER BY date_heure ASC;
`;
export const Q_TICKET_LINES = `
SELECT lt.id_ticket, lt.id_article, a.libelle, a.categorie,
       lt.quantite, lt.prix_unitaire
FROM LigneTicket lt
JOIN Article a ON a.id = lt.id_article
WHERE lt.id_ticket IN ({IDS});
`;
export const Q_STOCK_LEVELS = `
SELECT a.id, a.libelle, a.categorie,
       COALESCE(s.stock_actuel, 0) as stock_actuel,
       COALESCE(a.stock_minimum, 5) as stock_minimum
FROM Article a
LEFT JOIN Stock s ON s.id_article = a.id
WHERE a.actif = 1;
`;
export const Q_TICKETS_BETWEEN = `
SELECT id, date_heure, montant_total, type_paiement
FROM Ticket
WHERE date_heure >= @start AND date_heure < @end
ORDER BY date_heure ASC;
`;
//# sourceMappingURL=queries.js.map