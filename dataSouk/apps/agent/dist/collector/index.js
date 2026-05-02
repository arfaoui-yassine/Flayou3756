import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { createDB } from '../db/index.js';
import { assertNoPersonalData, hashId, toSaleEvent } from '../anonymizer/index.js';
import { enqueue, getLastPolledAt, setLastPolledAt } from '../queue/index.js';
const log = pino({ name: 'collector' });
let timer = null;
export function stopCollector() {
    if (timer)
        clearInterval(timer);
    timer = null;
}
export function startCollector(getConfig) {
    stopCollector();
    const tick = async () => {
        const cfg = getConfig();
        if (!cfg?.consent_given)
            return;
        try {
            const db = await createDB(cfg);
            const since = getLastPolledAt();
            const tickets = await db.getNewTickets(since);
            if (tickets.length > 0) {
                const ids = tickets.map((t) => t.id);
                const lines = await db.getTicketLines(ids);
                const byTicket = new Map();
                for (const l of lines) {
                    const arr = byTicket.get(l.id_ticket) ?? [];
                    arr.push(l);
                    byTicket.set(l.id_ticket, arr);
                }
                let latest = since;
                for (const t of tickets) {
                    const ev = toSaleEvent(t, byTicket.get(t.id) ?? [], cfg.commerce_internal_id, cfg.wilaya, cfg.commerce_type);
                    assertNoPersonalData(ev);
                    enqueue(ev);
                    if (t.date_heure > latest)
                        latest = t.date_heure;
                }
                setLastPolledAt(latest);
            }
            const stock = await db.getStockLevels();
            for (const s of stock) {
                if (s.stock_actuel <= s.stock_minimum) {
                    const ev = {
                        event_type: 'stock_low',
                        commerce_hash: hashId(cfg.commerce_internal_id),
                        wilaya: cfg.wilaya,
                        type_commerce: cfg.commerce_type,
                        category: s.categorie,
                        current_stock: s.stock_actuel,
                        threshold: s.stock_minimum,
                    };
                    assertNoPersonalData(ev);
                    enqueue(ev);
                }
            }
            await db.close();
        }
        catch (e) {
            log.error({ err: e }, 'collector tick failed');
        }
    };
    const schedule = () => {
        const cfg = getConfig();
        const ms = cfg?.poll_interval_ms ?? 300_000;
        timer = setInterval(() => {
            void tick();
        }, ms);
        void tick();
    };
    schedule();
}
export function ensureCommerceId(cfg) {
    if (cfg.commerce_internal_id)
        return cfg;
    return { ...cfg, commerce_internal_id: randomUUID() };
}
//# sourceMappingURL=index.js.map