export function SyncStatusBadge(props: { pending: number; lastSync: string }) {
  const last = props.lastSync ? new Date(props.lastSync) : null;
  const lastFmt = last && !Number.isNaN(last.getTime()) ? last.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-rouge-500/40 bg-noir-700/80 px-4 py-1.5 text-xs font-medium text-rouge-100 backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rouge-500 opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-rouge-500" />
      </span>
      <span>
        File cloud : <strong className="text-white">{props.pending}</strong>
        <span className="ml-2 text-noir-200">·</span>
        <span className="ml-2">
          Dernière sync : <strong className="text-white">{lastFmt}</strong>
        </span>
      </span>
    </div>
  );
}
