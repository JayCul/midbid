import { useMemo } from 'react';
import type { MidbidApi } from '../useMidbid';
import { useLoader, useNow } from '../hooks';
import { AuctionCard } from '../components/AuctionCard';
import { Notice } from '../components/bits';
import { deriveStatus } from '../../lib/auction/model.js';

export default function MyActivity({ api }: { api: MidbidApi }) {
  const now = useNow();
  const addresses = useMemo(
    () => [...new Set([...api.index.created, ...api.index.bid])],
    [api.index],
  );
  const { data, loading, error } = useLoader(
    async () => {
      const results = await Promise.allSettled(addresses.map((a) => api.service.getAuction(a)));
      return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    },
    [api.service, addresses],
    20_000,
  );

  const withPhase = (data ?? []).map((a) => ({ ...a, phase: deriveStatus(a, now) }));
  const created = withPhase.filter((a) => api.index.created.includes(a.address));
  const bid = withPhase.filter((a) => api.index.bid.includes(a.address));

  return (
    <div className="mx-auto max-w-canvas px-4 pt-10 sm:px-6">
      <p className="eyebrow">My activity</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your auctions and bids</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        This list lives in this browser only. The chain has no record linking you to these auctions,
        so there is nothing to look up elsewhere. Clearing site data clears it.
      </p>
      {error && (
        <div className="mt-4">
          <Notice tone="bad">{error}</Notice>
        </div>
      )}

      <Section
        title="Auctions you created"
        empty="You have not created an auction from this browser."
        loading={loading && !data}
      >
        {created.map((a) => (
          <AuctionCard key={a.address} auction={a} now={now} />
        ))}
      </Section>
      <Section
        title="Auctions you bid in"
        empty="You have not bid from this browser yet."
        loading={loading && !data}
      >
        {bid.map((a) => (
          <AuctionCard key={a.address} auction={a} now={now} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  empty,
  loading,
  children,
}: {
  title: string;
  empty: string;
  loading: boolean;
  children: React.ReactNode[];
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <div className="card h-72 animate-pulse" />}
        {children}
      </div>
      {!loading && children.length === 0 && (
        <p className="card p-6 text-sm text-muted">
          {empty}{' '}
          <a href="#/browse" className="text-accent hover:underline">
            Browse auctions
          </a>
        </p>
      )}
    </section>
  );
}
