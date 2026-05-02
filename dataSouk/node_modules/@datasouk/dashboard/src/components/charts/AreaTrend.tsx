import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HourlyData } from '../../lib/types';

export function AreaTrend({ data, title, subtitle }: { data: HourlyData[]; title?: string; subtitle?: string }) {
  return (
    <div className="card-glass h-80 w-full p-5">
      {title ? (
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="font-display text-xl tracking-wide text-white">{title}</h3>
            {subtitle ? <p className="label-eyebrow mt-1">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="rougeFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.85} />
                <stop offset="60%" stopColor="#dc2626" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickFormatter={(h: number) => `${h}h`}
              stroke="#9aa0ad"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="#9aa0ad"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: '#0d0e10',
                border: '1px solid rgba(220,38,38,0.4)',
                borderRadius: 10,
                color: '#fee2e2',
                fontSize: 12,
              }}
              labelFormatter={(h: number) => `${h}h00`}
              formatter={(value: number) => [`${value} tickets`, 'Activité']}
            />
            <Area
              type="monotone"
              dataKey="ticket_count"
              stroke="#ef4444"
              strokeWidth={2.4}
              fill="url(#rougeFade)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
