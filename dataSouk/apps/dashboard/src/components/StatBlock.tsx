/** Bloc chiffre dark/rouge */
export function StatBlock(props: {
  value: string | number;
  label: string;
  sub?: string;
  accent?: 'red' | 'mute';
}) {
  const accent = props.accent ?? 'red';
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-noir-700/80 p-5 shadow-xl transition hover:border-rouge-500/40 hover:shadow-glow">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rouge-500/10 blur-2xl transition group-hover:bg-rouge-500/30" />
      <div
        className={`font-display text-5xl leading-none tracking-wide sm:text-6xl ${
          accent === 'red' ? 'text-rouge-400' : 'text-white'
        }`}
      >
        {props.value}
      </div>
      <p className="label-eyebrow mt-3">{props.label}</p>
      {props.sub ? <p className="mt-1 text-sm text-noir-200">{props.sub}</p> : null}
    </div>
  );
}
