import type { DataSoukEvent, QueueItem } from '@datasouk/shared';
export declare function initQueue(): void;
export declare function enqueue(event: DataSoukEvent): void;
export declare function getPending(limit?: number): QueueItem[];
export declare function markSynced(ids: number[]): void;
export declare function getLastPolledAt(): Date;
export declare function setLastPolledAt(date: Date): void;
export declare function getPendingCount(): number;
export declare function getSyncedTodayCount(): number;
export declare function getLastSyncAt(): string | null;
//# sourceMappingURL=index.d.ts.map