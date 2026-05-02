import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HourlyData } from '../lib/types';

export function HourlyChart({ data }: { data: HourlyData[] }) {
  return (
    <div className="card-dark h-72 w-full p-5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            tickFormatter={(h) => `${h}h`}
            stroke="#9aa0ad"
            fontSize={11}
            axisLine={false}
            tickLine={false}
          />
          <YAxis allowDecimals={false} stroke="#9aa0ad" fontSize={11} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{
              background: '#0d0e10',
              border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: 10,
              color: '#fee2e2',
              fontSize: 12,
            }}
          />
          <Bar dataKey="ticket_count" fill="#dc2626" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
