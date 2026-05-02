import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

/**
 * Jauge radiale (0–100). Affiche la valeur au centre ; la valeur visuelle est
 * bornée à [0, max] pour rester lisible même quand le KPI dépasse l’objectif.
 */
export function RadialGauge({
  value,
  max = 100,
  label,
  caption,
  color = '#ef4444',
}: {
  value: number;
  max?: number;
  label: string;
  caption?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const data = [{ name: label, value: clamped }];
  return (
    <div className="card-glass relative flex h-44 flex-col items-center justify-center px-3 py-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="74%"
          outerRadius="100%"
          data={data}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
          <RadialBar background={{ fill: 'rgba(255,255,255,0.07)' }} dataKey="value" cornerRadius={12} fill={color} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
        <p className="font-display text-3xl leading-none text-white">{value}</p>
        <p className="label-eyebrow mt-1 text-[10px] text-rouge-200">{label}</p>
      </div>
      {caption ? (
        <p className="absolute inset-x-0 bottom-2 text-center text-[11px] text-noir-200">{caption}</p>
      ) : null}
    </div>
  );
}
