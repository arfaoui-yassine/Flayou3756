export function ConsentModal(props: {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card-glass max-w-lg p-6">
        <h2 className="font-display text-2xl tracking-wide text-rouge-400">Données collectées</h2>
        <p className="mt-2 text-sm text-noir-100">
          Seules des statistiques anonymisées sont envoyées (tranches de montants, catégories, wilaya,
          heure). Aucun nom de client ni montant exact.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-noir-600 px-4 py-2 text-sm text-white hover:bg-noir-500"
            onClick={props.onClose}
          >
            Fermer
          </button>
          <button
            type="button"
            className="rounded-lg bg-rouge-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-rouge-600"
            onClick={props.onAccept}
          >
            J&apos;accepte
          </button>
        </div>
      </div>
    </div>
  );
}
