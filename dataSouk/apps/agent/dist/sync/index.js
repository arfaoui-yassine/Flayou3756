import pino from 'pino';
import { getPending, markSynced } from '../queue/index.js';
const log = pino({ name: 'sync' });
export async function syncPendingEvents(cloudApiUrl, cloudApiKey, agentVersion) {
    const base = cloudApiUrl.replace(/\/$/, '');
    try {
        const health = await fetch(`${base}/api/v1/health`, { method: 'GET' });
        if (!health.ok) {
            log.warn({ status: health.status }, 'cloud health not ok, skip sync');
            return { sent: 0, failed: 0, skipped: true };
        }
    }
    catch (e) {
        log.warn({ err: e }, 'cloud unreachable, skip sync');
        return { sent: 0, failed: 0, skipped: true };
    }
    const batch = getPending(500);
    if (batch.length === 0)
        return { sent: 0, failed: 0, skipped: false };
    const events = [];
    const ids = [];
    for (const row of batch) {
        try {
            events.push(JSON.parse(row.payload));
            ids.push(row.id);
        }
        catch (e) {
            log.error({ err: e, id: row.id }, 'bad queue payload');
        }
    }
    if (events.length === 0)
        return { sent: 0, failed: 0, skipped: false };
    try {
        const res = await fetch(`${base}/api/v1/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cloudApiKey}`,
            },
            body: JSON.stringify({
                events,
                agent_version: agentVersion,
                sent_at: new Date().toISOString(),
            }),
        });
        if (!res.ok) {
            const text = await res.text();
            log.error({ status: res.status, text }, 'ingest failed');
            return { sent: 0, failed: events.length, skipped: false };
        }
        markSynced(ids);
        return { sent: events.length, failed: 0, skipped: false };
    }
    catch (e) {
        log.error({ err: e }, 'ingest error');
        return { sent: 0, failed: events.length, skipped: false };
    }
}
//# sourceMappingURL=index.js.map