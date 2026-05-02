import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DemoBadge } from '../components/DemoBadge';
import { MOCK_QUEUE } from '../lib/mock';

type RegInfo = {
  commerce_hash: string;
  wilaya: string;
  type_commerce: string;
  register_url: string;
};

export function Sync() {
  const [s, setS] = useState<{ pending: number; synced_today: number; last_sync_at: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reg, setReg] = useState<RegInfo | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [regMsg, setRegMsg] = useState<string | null>(null);

  useEffect(() => {
    void api
      .queueStatus()
      .then(setS)
      .catch(() => setS(null))
      .finally(() => setLoaded(true));
    void api
      .registrationInfo()
      .then(setReg)
      .catch(() => setReg(null));
  }, []);

  async function saveApiKey() {
    setRegMsg(null);
    const k = apiKeyInput.trim();
    if (!k) {
      setRegMsg('Collez la clé renvoyée par le cloud (champ api_key).');
      return;
    }
    try {
      await api.updateCloudCredentials({ cloud_api_key: k });
      setRegMsg('Clé enregistrée. La synchronisation utilisera ce jeton.');
      setApiKeyInput('');
    } catch (e) {
      setRegMsg(e instanceof Error ? e.message : 'Erreur');
    }
  }

  const view = s ?? MOCK_QUEUE;
  const isMock = loaded && !s;
  const lastFmt = view.last_sync_at
    ? new Date(view.last_sync_at).toLocaleString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : '—';

  const registerJson =
    reg &&
    JSON.stringify(
      {
        commerce_hash: reg.commerce_hash,
        wilaya: reg.wilaya,
        type_commerce: reg.type_commerce,
      },
      null,
      2,
    );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-eyebrow text-rouge-300">Cloud</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide text-white">Synchronisation</h1>
          <p className="mt-1 text-sm text-noir-200">État de la file locale et inscription cloud</p>
        </div>
        {isMock ? <DemoBadge /> : null}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-dark p-5">
          <p className="label-eyebrow">En attente</p>
          <p className="mt-2 font-display text-5xl text-rouge-400">{view.pending}</p>
          <p className="mt-1 text-sm text-noir-200">Événements anonymisés non envoyés</p>
        </div>
        <div className="card-dark p-5">
          <p className="label-eyebrow">Envoyés aujourd&apos;hui</p>
          <p className="mt-2 font-display text-5xl text-white">{view.synced_today}</p>
          <p className="mt-1 text-sm text-noir-200">Cumul depuis 00h00</p>
        </div>
        <div className="card-dark p-5">
          <p className="label-eyebrow">Dernière sync</p>
          <p className="mt-2 font-display text-3xl text-white">{lastFmt}</p>
          <p className="mt-1 text-sm text-noir-200">Push cloud</p>
        </div>
      </div>

      <div className="card-glass p-6">
        <h3 className="font-display text-2xl tracking-wide text-rouge-400">Où prendre la clé API ?</h3>
        <p className="mt-2 text-sm text-noir-100">
          La clé est créée par <strong className="text-white">votre API cloud</strong> (endpoint{' '}
          <code className="rounded bg-noir-800 px-1 text-rouge-200">POST /api/v1/register</code>). Elle
          n&apos;existe pas dans InnovaSoft : lancez le service cloud (
          <code className="rounded bg-noir-800 px-1 text-rouge-200">npm run dev:cloud</code>) puis
          inscrivez ce commerce avec le même <code className="rounded bg-noir-800 px-1 text-rouge-200">commerce_hash</code>.
        </p>
        {reg ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              <span className="font-medium text-white">commerce_hash</span> (pour l&apos;inscription) :
            </p>
            <code className="block break-all rounded bg-noir-800 p-2 text-xs text-rouge-100">{reg.commerce_hash}</code>
            <p>
              <span className="font-medium text-white">URL d&apos;inscription</span> :{' '}
              <code className="rounded bg-noir-800 px-1 text-xs text-rouge-100">{reg.register_url}</code>
            </p>
            {registerJson ? (
              <div>
                <p className="mb-1 font-medium text-white">Corps JSON pour POST /api/v1/register :</p>
                <pre className="max-h-48 overflow-auto rounded bg-noir-900 p-3 text-xs text-noir-100 ring-1 ring-white/10">
                  {registerJson}
                </pre>
                <p className="mt-2 text-xs text-noir-200">
                  Exemple PowerShell :{' '}
                  <code className="rounded bg-noir-800 px-1 text-rouge-200">
                    Invoke-RestMethod -Uri &quot;{reg.register_url}&quot; -Method Post -ContentType
                    &quot;application/json&quot; -Body (Get-Content body.json -Raw)
                  </code>{' '}
                  (en enregistrant le JSON ci-dessus dans{' '}
                  <code className="rounded bg-noir-800 px-1 text-rouge-200">body.json</code>).
                </p>
              </div>
            ) : null}
            <p className="text-noir-200">
              La réponse JSON contient <code className="rounded bg-noir-800 px-1 text-rouge-200">api_key</code> : copiez
              cette valeur ci-dessous.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="flex-1 rounded-lg border border-white/10 bg-noir-800 p-2 font-mono text-sm text-white placeholder:text-noir-300"
                placeholder="Coller api_key ici"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-rouge-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-rouge-600"
                onClick={() => void saveApiKey()}
              >
                Enregistrer la clé
              </button>
            </div>
            {regMsg ? <p className="text-sm text-rouge-200">{regMsg}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-noir-200">
            Enregistrez d&apos;abord la configuration dans <strong className="text-white">Configuration</strong> pour
            afficher le hash et l&apos;URL d&apos;inscription.
          </p>
        )}
      </div>
    </div>
  );
}
