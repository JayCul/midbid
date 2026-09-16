import { useState } from 'react';
import type { MidbidApi } from '../useMidbid';
import { CopyValue, Notice, TxRef } from '../components/bits';
import { Readiness } from '../components/Shell';
import { PROVENANCE } from '../../config.js';

/**
 * Operator page. Deploys the registry once per environment. The resulting
 * address goes into VITE_REGISTRY_ADDRESS for the production build.
 */
export default function Setup({ api }: { api: MidbidApi }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ address: string; txId?: string; txHash?: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const deploy = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await api.service.deployRegistry());
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
      <p className="eyebrow">Operator</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Environment setup</h1>

      <div className="card mt-6 space-y-4 p-6 text-sm">
        <div>
          <p className="label">Configured registry</p>
          {api.registryAddress ? (
            <CopyValue value={api.registryAddress} label="registry address" />
          ) : (
            <p className="text-muted">None. Browse shows only this browser&apos;s auctions.</p>
          )}
        </div>
        <div>
          <p className="label">Auction circuit commitment</p>
          <CopyValue value={PROVENANCE.circuitCommitment} label="circuit commitment" />
          <p className="mt-2 text-xs text-muted">
            Every genuine auction stores this value. The app hides any contract without it.
          </p>
        </div>
      </div>

      <div className="card mt-6 space-y-4 p-6">
        <h2 className="text-lg font-semibold">Deploy a registry</h2>
        <p className="text-sm text-muted">
          Needed once per environment. Afterwards, set{' '}
          <code className="font-mono">VITE_REGISTRY_ADDRESS</code> to the new address and rebuild,
          or open the app with <code className="font-mono">?registry=&lt;address&gt;</code> to try
          it first.
        </p>
        <Readiness api={api} action="deploy a registry" />
        <button className="btn-primary" disabled={!api.wallet || busy} onClick={deploy}>
          {busy ? 'Deploying… approve in Lace' : 'Deploy registry'}
        </button>
        {error && <Notice tone="bad">{error}</Notice>}
        {result && (
          <Notice tone="good">
            <p>Registry deployed.</p>
            <p className="mt-2 break-all font-mono text-xs">{result.address}</p>
            <div className="mt-2">
              <TxRef tx={result} />
            </div>
          </Notice>
        )}
      </div>
    </div>
  );
}
