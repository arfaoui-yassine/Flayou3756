import { describe, it, expect, beforeAll } from 'vitest';
import { assertNoPersonalData, hashId, toAmountRange, toSaleEvent } from './index.js';
beforeAll(() => {
    process.env.ANONYMIZE_SALT = 'test_salt_at_least_16_chars';
});
describe('anonymizer', () => {
    it('hashId is stable for same input', () => {
        expect(hashId('shop-1')).toBe(hashId('shop-1'));
        expect(hashId('shop-1')).not.toBe(hashId('shop-2'));
    });
    it('toAmountRange buckets', () => {
        expect(toAmountRange(2)).toBe('<5');
        expect(toAmountRange(7)).toBe('5-10');
        expect(toAmountRange(150)).toBe('>100');
    });
    it('toSaleEvent strips granular time and hashes commerce', () => {
        const ticket = {
            id: 1,
            date_heure: new Date('2024-06-10T14:35:00Z'),
            montant_total: 42,
            type_paiement: 'cash',
        };
        const lines = [
            {
                id_ticket: 1,
                id_article: 9,
                libelle: 'X',
                categorie: 'Boissons',
                quantite: 2,
                prix_unitaire: 21,
            },
        ];
        const ev = toSaleEvent(ticket, lines, 'internal-1', 'Tunis', 'cafe');
        expect(ev.event_type).toBe('sale');
        expect(ev.commerce_hash).toBe(hashId('internal-1'));
        expect(ev.heure).toBe(ticket.date_heure.getHours());
        expect(ev.categories).toEqual(['Boissons']);
        expect(ev.montant_tranche).toBe('20-50');
    });
    it('assertNoPersonalData blocks banned substrings', () => {
        expect(() => assertNoPersonalData({ note: 'email: x' })).toThrow(/blocked/);
    });
});
//# sourceMappingURL=index.test.js.map