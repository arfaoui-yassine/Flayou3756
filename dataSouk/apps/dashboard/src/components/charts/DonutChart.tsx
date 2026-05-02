import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ProductData } from '../../lib/types';

const PALETTE = ['#dc2626', '#ef4444', '#fb7185', '#f87171', '#7f1d1d', '#b91c1c', '#fda4af'];

export function DonutChart({ data, centerValue, centerLabel }: { data: ProductData[]; centerValue?: string; centerLabel?: string }) {
  const slices = data.slice(0, 6);
  return (
    <div className="card-glass relative h-80 w-full p-5">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="ticket_count"
            nameKey="category"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={3}
            stroke="none"
          >
            {slices.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#0d0e10',
              border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: 10,
              color: '#fee2e2',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value} tickets`, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(v) => <span style={{ color: '#cdd1d9', fontSize: 12 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-[68%] flex-col items-center text-center">
          <p className="font-display text-3xl tracking-wide text-white">{centerValue}</p>
          {centerLabel ? (
            <p className="label-eyebrow mt-1 text-[10px]">{centerLabel}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
