import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarket } from '../hooks/useMarket';
import { useLoader } from '../hooks/useTime';
import { readIndex } from '../lib/auction/localIndex.js';
import { PROVENANCE } from '../config.js';
import type { Receipt } from '../types/auction';
import { AuctionTile } from '../components/AuctionTile';
import { LogPanel, Notice, PageHead, Readiness, ReceiptLine } from '../components/AppBits';
import { ArrowLink, Label } from '../components/primitives';

export function ActivityPage() {
  const market = useMarket();
  const index = useMemo(() => readIndex(), []);
  const ids = useMemo(() => [...new Set([...index.created, ...index.bid])], [index]);
  const { data, loading } = useLoader(async () => {
    if (ids.length === 0) return [];
    const service = await market.serviceFor(ids[0]);
    const results = await Promise.allSettled(ids.map((id) => service.getAuction(id)));
    return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  }, [ids]);

  const created = (data ?? []).filter((a) => index.created.includes(a.id));
  const bid = (data ?? []).filter((a) => index.bid.includes(a.id));

  return (
    <div className="shell pb-32">
      <PageHead label="Activity" title="Your auctions.">
        <p className="max-w-sm text-[15px] leading-relaxed text-white/48">
          Kept in this browser only. The chain has no record linking you to these auctions.
        </p>
      </PageHead>
      {[
        {
          title: 'Created',
          list: created,
          empty: 'Nothing created from this browser on Preprod yet.',
        },
        { title: 'Bid in', list: bid, empty: 'No Preprod bids from this browser yet.' },
      ].map((s) => (
        <section key={s.title} className="mt-16">
          <Label>{s.title}</Label>
          {s.list.length > 0 ? (
            <div className="mt-6 border-b border-white/8">
              {s.list.map((a) => (
                <AuctionTile key={a.id} auction={a} size="row" />
              ))}
            </div>
          ) : (
            !loading && (
              <div className="mt-6 flex flex-wrap items-center gap-8 border-t border-white/8 pt-8">
                <p className="text-[17px] text-white/48">{s.empty}</p>
                <ArrowLink to="/explore">Explore auctions</ArrowLink>
              </div>
            )
          )}
        </section>
      ))}
    </div>
  );
}

export function SetupPage() {
  const market = useMarket();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ address: string; receipt: Receipt } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deploy = async () => {
    setBusy(true);
    setError(null);
    try {
      const lace = await market.loadLace();
      setResult(await lace.market().deployRegistry());
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell max-w-3xl pb-32">
      <PageHead label="Operator" title="Environment." />
      <dl className="mt-12 divide-y divide-white/8 border-y border-white/8">
        <div className="py-5">
          <dt className="label">Configured registry</dt>
          <dd className="mt-2 break-all font-mono text-[13px] text-white/72">
            {market.registryAddress ?? 'None'}
          </dd>
        </div>
        <div className="py-5">
          <dt className="label">Auction circuit commitment</dt>
          <dd className="mt-2 break-all font-mono text-[13px] text-white/72">
            {PROVENANCE.circuitCommitment}
          </dd>
        </div>
      </dl>
      <div className="mt-14 space-y-6">
        <h2 className="text-title">Deploy a registry</h2>
        <p className="text-[16px] leading-relaxed text-white/72">
          Needed once per environment. Then set{' '}
          <code className="font-mono">VITE_REGISTRY_ADDRESS</code> and rebuild, or try it first with{' '}
          <code className="font-mono">?registry=&lt;address&gt;</code>.
        </p>
        <Readiness action="deploy a registry" />
        <button
          className="btn-primary"
          disabled={market.wallet.status !== 'connected' || busy}
          onClick={deploy}
        >
          {busy ? 'Approve in Lace…' : 'Deploy registry'}
        </button>
        {error && <Notice tone="bad">{error}</Notice>}
        {result && (
          <Notice tone="good">
            <p className="text-white">Registry deployed.</p>
            <p className="mt-2 break-all font-mono text-[12px]">{result.address}</p>
            <div className="mt-2">
              <ReceiptLine receipt={result.receipt} />
            </div>
          </Notice>
        )}
        <LogPanel />
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="shell flex min-h-[80vh] flex-col justify-center pb-24 pt-40">
      <Label tone="ember">404</Label>
      <h1 className="mt-6 text-display">Nothing on this lot.</h1>
      <Link to="/" className="btn-secondary mt-10 self-start">
        Back to MidBid
      </Link>
    </div>
  );
}
