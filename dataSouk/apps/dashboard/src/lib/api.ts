import type { DashboardSummary, HourlyData, ProductData, StockAlert } from './types';

const BASE = import.meta.env.VITE_AGENT_URL ?? 'http://localhost:3456';

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = '';
    try {
      const b = JSON.parse(text) as { message?: string; hint?: string; error?: string };
      detail = [b.message, b.hint].filter(Boolean).join(' — ') || b.error || '';
    } catch {
      if (text) detail = text.slice(0, 240);
    }
    throw new Error(detail ? `${path} ${res.status} — ${detail}` : `${path} ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => j<{ status: string; db_connected: boolean; last_sync: string }>('/health'),
  summary: () => j<DashboardSummary>('/dashboard/summary'),
  hourly: () => j<HourlyData[]>('/dashboard/hourly'),
  products: () => j<ProductData[]>('/dashboard/products'),
  alerts: () => j<StockAlert[]>('/dashboard/alerts'),
  queueStatus: () => j<{ pending: number; synced_today: number; last_sync_at: string }>('/queue/status'),
  registrationInfo: () =>
    j<{
      commerce_hash: string;
      wilaya: string;
      type_commerce: string;
      register_url: string;
    }>('/registration-info'),
  updateCloudCredentials: (body: { cloud_api_key: string; cloud_api_url?: string }) =>
    j<{ ok: boolean }>('/config/cloud', { method: 'POST', body: JSON.stringify(body) }),
  saveConfig: (body: unknown) => j<{ ok: boolean }>('/config', { method: 'POST', body: JSON.stringify(body) }),
  consent: (accepted: boolean) => j<{ ok: boolean }>('/consent', { method: 'POST', body: JSON.stringify({ accepted }) }),
};
