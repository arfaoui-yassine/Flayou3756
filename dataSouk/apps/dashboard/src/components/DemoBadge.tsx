/** Badge discret indiquant que les données affichées sont une démo (mock). */
export function DemoBadge({ reason = 'Aperçu démo' }: { reason?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-noir-200"
      title="Données d’aperçu utilisées tant que l’agent n’a pas encore d’historique exploitable."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-rouge-400" />
      {reason}
    </span>
  );
}
