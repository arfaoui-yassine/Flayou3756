import { useEffect, useState } from 'react';
import { TopProductsChart } from '../components/TopProductsChart';
import { DonutChart } from '../components/charts/DonutChart';
import { DemoBadge } from '../components/DemoBadge';
import { api } from '../lib/api';
import type { ProductData } from '../lib/types';
import { MOCK_PRODUCTS, isProductsUsable } from '../lib/mock';

export function Products() {
  const [data, setData] = useState<ProductData[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void api
      .products()
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoaded(true));
  }, []);
  const view = isProductsUsable(data) ? data : MOCK_PRODUCTS;
  const isMock = loaded && !isProductsUsable(data);
  const total = view.reduce((acc, x) => acc + x.ticket_count, 0);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-eyebrow text-rouge-300">Catalogue</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide text-white">Produits & catégories</h1>
          <p className="mt-1 text-sm text-noir-200">Vue agrégée sur 30 jours · données anonymisées</p>
        </div>
        {isMock ? <DemoBadge /> : null}
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart data={view} centerValue={`${total}`} centerLabel="Tickets · 30j" />
        <TopProductsChart data={view} />
      </div>
      <div className="card-dark p-5">
        <h2 className="font-display text-xl tracking-wide text-white">Détail catégories</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-noir-200">
            <tr>
              <th className="py-2">Catégorie</th>
              <th className="py-2">Tickets</th>
              <th className="py-2">Part</th>
              <th className="py-2">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {view.map((p) => (
              <tr key={p.category} className="border-t border-white/5">
                <td className="py-2 text-white">{p.category}</td>
                <td className="py-2">{p.ticket_count}</td>
                <td className="py-2">{p.percentage.toFixed(1)}%</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.trend === 'up'
                        ? 'bg-rouge-500/15 text-rouge-200'
                        : p.trend === 'down'
                          ? 'bg-white/5 text-noir-100'
                          : 'bg-white/5 text-noir-200'
                    }`}
                  >
                    {p.trend === 'up' ? '▲ en hausse' : p.trend === 'down' ? '▼ en baisse' : '— stable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
