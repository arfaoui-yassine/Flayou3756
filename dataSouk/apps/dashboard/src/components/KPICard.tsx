export function KPICard(props: { title: string; value: string | number; trend?: string; accent?: 'red' | 'neutral' }) {
  const accent = props.accent ?? 'neutral';
  return (
    <div className="card-dark relative overflow-hidden p-5">
      <p className="label-eyebrow">{props.title}</p>
      <p
        className={`mt-2 font-display text-3xl tracking-wide ${
          accent === 'red' ? 'text-rouge-400' : 'text-white'
        }`}
      >
        {props.value}
      </p>
      {props.trend ? <p className="mt-2 text-xs font-medium text-rouge-200">{props.trend}</p> : null}
    </div>
  );
}
