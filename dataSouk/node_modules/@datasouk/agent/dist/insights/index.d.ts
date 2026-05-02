import type { AgentConfig, DashboardSummary, HourlyData, ProductData, StockAlert } from '@datasouk/shared';
export declare function buildDashboardSummary(cfg: AgentConfig): Promise<DashboardSummary>;
export declare function buildHourlyData(cfg: AgentConfig): Promise<HourlyData[]>;
export declare function buildProductData(cfg: AgentConfig): Promise<ProductData[]>;
export declare function buildAlerts(cfg: AgentConfig): Promise<StockAlert[]>;
//# sourceMappingURL=index.d.ts.map