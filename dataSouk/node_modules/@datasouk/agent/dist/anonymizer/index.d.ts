import type { RawTicket, RawTicketLine } from '../db/index.js';
import type { AmountRange, CommerceType, SaleEvent } from '@datasouk/shared';
export declare function hashId(id: string | number): string;
export declare function toAmountRange(amount: number): AmountRange;
export declare function toSaleEvent(ticket: RawTicket, lines: RawTicketLine[], commerceId: string, wilaya: string, type_commerce: CommerceType): SaleEvent;
export declare function assertNoPersonalData(payload: unknown): void;
//# sourceMappingURL=index.d.ts.map