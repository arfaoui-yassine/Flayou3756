import { z } from 'zod';
const commerceType = z.enum(['epicerie', 'cafe', 'restaurant', 'retail', 'autre']);
const saleEvent = z.object({
    event_type: z.literal('sale'),
    commerce_hash: z.string(),
    wilaya: z.string(),
    type_commerce: commerceType,
    heure: z.number().int().min(0).max(23),
    jour_semaine: z.number().int().min(0).max(6),
    categories: z.array(z.string()),
    montant_tranche: z.enum(['<5', '5-10', '10-20', '20-50', '50-100', '>100']),
    nb_articles: z.number().int().nonnegative(),
});
const stockEvent = z.object({
    event_type: z.literal('stock_low'),
    commerce_hash: z.string(),
    wilaya: z.string(),
    type_commerce: commerceType,
    category: z.string(),
    current_stock: z.number().int(),
    threshold: z.number().int(),
});
export const ingestBodySchema = z.object({
    events: z.array(z.discriminatedUnion('event_type', [saleEvent, stockEvent])),
    agent_version: z.string(),
    sent_at: z.string(),
});
export const registerBodySchema = z.object({
    commerce_hash: z.string().length(64),
    wilaya: z.string(),
    type_commerce: commerceType,
});
//# sourceMappingURL=validate.js.map