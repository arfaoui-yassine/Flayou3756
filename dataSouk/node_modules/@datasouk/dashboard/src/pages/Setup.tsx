import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WILAYAS } from '../data/wilayas';
import { api } from '../lib/api';
import { ConsentModal } from '../components/ConsentModal';

const commerceTypes = [
  ['epicerie', 'Épicerie'],
  ['cafe', 'Café'],
  ['restaurant', 'Restaurant'],
  ['retail', 'Retail'],
  ['autre', 'Autre'],
] as const;

const inputClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-noir-800 p-2 text-white placeholder:text-noir-300 focus:border-rouge-500/60 focus:outline-none';
const radioCard =
  'flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-noir-700/70 p-3 text-noir-100 hover:border-rouge-500/40';

export function Setup() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [commerce_type, setCommerceType] = useState<(typeof commerceTypes)[number][0]>('epicerie');
  const [wilaya, setWilaya] = useState(WILAYAS[0]);
  const [db_type, setDbType] = useState<'mssql' | 'sqlite'>('sqlite');
  const [mssql, setMssql] = useState({ server: '', database: '', user: '', password: '' });
  const [sqlitePath, setSqlitePath] = useState('');
  const [consent, setConsent] = useState(false);
  const [cloud_api_url, setCloudUrl] = useState('http://localhost:8080');
  const [cloud_api_key, setCloudKey] = useState('');
  const [showConsentInfo, setShowConsentInfo] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      await api.saveConfig({
        db_type,
        mssql: db_type === 'mssql' ? mssql : undefined,
        sqlite: db_type === 'sqlite' ? { file_path: sqlitePath } : undefined,
        commerce_type,
        wilaya,
        poll_interval_ms: 300_000,
        cloud_api_url,
        cloud_api_key,
        consent_given: consent,
        consent_given_at: consent ? new Date().toISOString() : null,
      });
      nav('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <p className="label-eyebrow text-rouge-300">Onboarding</p>
        <h1 className="mt-1 font-display text-4xl tracking-wide text-white">Configuration DataSouk</h1>
        <p className="mt-1 text-sm text-noir-200">Étape {step} / 4</p>
      </header>

      <div className="card-glass p-6">
        {step === 1 && (
          <div className="space-y-2">
            <p className="label-eyebrow mb-2">Type de commerce</p>
            {commerceTypes.map(([v, label]) => (
              <label key={v} className={radioCard}>
                <input
                  type="radio"
                  name="ct"
                  className="accent-rouge-500"
                  checked={commerce_type === v}
                  onChange={() => setCommerceType(v)}
                />
                <span className="text-white">{label}</span>
              </label>
            ))}
            <div className="pt-3">
              <button
                type="button"
                className="rounded-lg bg-rouge-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-rouge-600"
                onClick={() => setStep(2)}
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="label-eyebrow">Wilaya</label>
            <select
              className={inputClass}
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
            >
              {WILAYAS.map((w) => (
                <option key={w} value={w} className="bg-noir-800">
                  {w}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-noir-100 hover:border-rouge-500/40" onClick={() => setStep(1)}>
                Retour
              </button>
              <button
                type="button"
                className="rounded-lg bg-rouge-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-rouge-600"
                onClick={() => setStep(3)}
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 text-noir-100">
                <input
                  type="radio"
                  className="accent-rouge-500"
                  checked={db_type === 'sqlite'}
                  onChange={() => setDbType('sqlite')}
                />
                SQLite
              </label>
              <label className="flex items-center gap-2 text-noir-100">
                <input
                  type="radio"
                  className="accent-rouge-500"
                  checked={db_type === 'mssql'}
                  onChange={() => setDbType('mssql')}
                />
                SQL Server
              </label>
            </div>
            {db_type === 'sqlite' ? (
              <div>
                <label className="label-eyebrow">Chemin fichier .db</label>
                <input
                  className={`${inputClass} font-mono text-sm`}
                  placeholder="Ex. C:\InnovaSoft\data\innova.db (chemin réel sur ce PC)"
                  value={sqlitePath}
                  onChange={(e) => setSqlitePath(e.target.value)}
                />
                <p className="mt-1 text-xs text-noir-200">
                  Le fichier et son dossier doivent exister. Pour un essai sans Innova : à la racine du
                  dépôt, exécutez{' '}
                  <code className="rounded bg-noir-800 px-1 text-rouge-200">npm run example:db</code>, puis
                  indiquez le chemin absolu vers{' '}
                  <code className="rounded bg-noir-800 px-1 text-rouge-200">examples/innova/innova.db</code>.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {(['server', 'database', 'user', 'password'] as const).map((k) => (
                  <div key={k}>
                    <label className="label-eyebrow capitalize">{k}</label>
                    <input
                      className={inputClass}
                      type={k === 'password' ? 'password' : 'text'}
                      value={mssql[k]}
                      onChange={(e) => setMssql({ ...mssql, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="label-eyebrow">URL API cloud</label>
              <input
                className={inputClass}
                value={cloud_api_url}
                onChange={(e) => setCloudUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="label-eyebrow">Clé API</label>
              <input
                className={inputClass}
                value={cloud_api_key}
                onChange={(e) => setCloudKey(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-noir-100 hover:border-rouge-500/40" onClick={() => setStep(2)}>
                Retour
              </button>
              <button
                type="button"
                className="rounded-lg bg-rouge-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-rouge-600"
                onClick={() => setStep(4)}
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-noir-100">
              En activant DataSouk, vous acceptez l&apos;envoi de statistiques anonymisées.
              <button
                type="button"
                className="ml-2 text-rouge-300 underline"
                onClick={() => setShowConsentInfo(true)}
              >
                Détails
              </button>
            </p>
            <label className="flex items-center gap-2 text-sm text-noir-100">
              <input
                type="checkbox"
                className="accent-rouge-500"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              J&apos;accepte la collecte anonymisée
            </label>
            {err ? <p className="text-sm text-rouge-300">{err}</p> : null}
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-noir-100 hover:border-rouge-500/40" onClick={() => setStep(3)}>
                Retour
              </button>
              <button
                type="button"
                disabled={!consent || loading}
                className="rounded-lg bg-rouge-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-rouge-600 disabled:opacity-50"
                onClick={() => void submit()}
              >
                {loading ? '…' : 'Terminer'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConsentModal
        open={showConsentInfo}
        onClose={() => setShowConsentInfo(false)}
        onAccept={() => {
          setConsent(true);
          setShowConsentInfo(false);
        }}
      />
    </div>
  );
}
