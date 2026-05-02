import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { ProductData } from '../lib/types';

const SHADES = ['#ef4444', '#dc2626', '#b91c1c', '#fb7185', '#7f1d1d', '#fda4af'];

export function TopProductsChart({ data }: { data: ProductData[] }) {
  return (
    <div className="card-dark h-72 w-full p-5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ left: 12 }}>
          <XAxis type="number" allowDecimals={false} stroke="#9aa0ad" fontSize={11} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="category"
            width={120}
            stroke="#cdd1d9"
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0d0e10',
              border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: 10,
              color: '#fee2e2',
              fontSize: 12,
            }}
          />
          <Bar dataKey="ticket_count" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={SHADES[i % SHADES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
