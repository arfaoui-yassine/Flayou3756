import { createHash } from 'node:crypto';
function requireSalt() {
    const salt = process.env.ANONYMIZE_SALT;
    if (!salt || salt.length < 16) {
        throw new Error('ANONYMIZE_SALT must be set (min 16 characters)');
    }
    return salt;
}
export function hashId(id) {
    const salt = requireSalt();
    return createHash('sha256').update(`${salt}:${id}`).digest('hex');
}
export function toAmountRange(amount) {
    if (amount < 5)
        return '<5';
    if (amount < 10)
        return '5-10';
    if (amount < 20)
        return '10-20';
    if (amount < 50)
        return '20-50';
    if (amount < 100)
        return '50-100';
    return '>100';
}
export function toSaleEvent(ticket, lines, commerceId, wilaya, type_commerce) {
    const date = new Date(ticket.date_heure);
    return {
        event_type: 'sale',
        commerce_hash: hashId(commerceId),
        wilaya,
        type_commerce,
        heure: date.getHours(),
        jour_semaine: (date.getDay() + 6) % 7,
        categories: [...new Set(lines.map((l) => l.categorie))],
        montant_tranche: toAmountRange(ticket.montant_total),
        nb_articles: lines.reduce((sum, l) => sum + l.quantite, 0),
    };
}
export function assertNoPersonalData(payload) {
    const str = JSON.stringify(payload).toLowerCase();
    const banned = ['telephone', 'email', 'nom_client', 'adresse', 'rue'];
    for (const field of banned) {
        if (str.includes(field)) {
            throw new Error(`Personal data field "${field}" detected in payload — blocked`);
        }
    }
}
//# sourceMappingURL=index.js.map