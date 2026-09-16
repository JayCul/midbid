import { useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import type { MidbidApi } from '../useMidbid';
import { useLoader, useNow } from '../hooks';
import { AuctionCard } from '../components/AuctionCard';
import { Notice } from '../components/bits';
import { deriveStatus } from '../../lib/auction/model.js';
import { isContractAddress } from '../../config.js';

const FILTERS = [
  { id: 'live', label: 'Live', phases: ['ACTIVE', 'SCHEDULED'] },
  { id: 'ended', label: 'Ended', phases: ['ENDED', 'SETTLING', 'SETTLED', 'UNSOLD', 'CANCELLED'] },
  { id: 'all', label: 'All', phases: null },
] as const;

export default function Browse({ api }: { api: MidbidApi }) {
  const now = useNow();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('live');
  const [query, setQuery] = useState('');
  const extra = useMemo(() => [...api.index.created, ...api.index.bid], [api.index]);
  const { data, error, loading, reload } = useLoader(
    () => api.service.listAuctions({ extra }),
    [api.service, extra],
    20_000,
  );

  const visible = useMemo(() => {
    const phases = FILTERS.find((f) => f.id === filter)!.phases as readonly string[] | null;
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .map((a) => ({ ...a, phase: deriveStatus(a, now) }))
      .filter((a) => !phases || phases.includes(a.phase))
      .filter(
        (a) =>
          !q ||
          a.metadata.title.toLowerCase().includes(q) ||
          a.metadata.category.toLowerCase().includes(q) ||
          a.address.startsWith(q),
      )
      .sort((a, b) => Number(a.endsAt - b.endsAt));
  }, [data, filter, query, now]);

  const q = query.trim().toLowerCase();

  return (
    <div className="mx-auto max-w-canvas px-4 pt-10 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Browse</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Auctions</h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Every auction here is a contract on Preprod carrying Midbid&apos;s circuit commitment.
            Prices are public. Bidders are not.
          </p>
        </div>
        <a href="#/create" className="btn-primary self-start sm:self-auto">
          Create an auction
        </a>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border border-line p-1" role="tablist" aria-label="Filter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3.5 py-1.5 text-sm transition ${
                filter === f.id ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <span className="sr-only">Search auctions</span>
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            className="input pl-10"
            placeholder="Search by title, category, or paste a contract address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button onClick={reload} className="btn-ghost" aria-label="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden />
        </button>
      </div>

      {isContractAddress(q) && (
        <div className="mt-4">
          <Notice>
            Open{' '}
            <a className="font-mono text-accent hover:underline" href={`#/auction/${q}`}>
              {q.slice(0, 16)}…
            </a>{' '}
            directly. Unlisted auctions still work by address.
          </Notice>
        </div>
      )}
      {!api.registryAddress && (
        <div className="mt-4">
          <Notice tone="warn">
            No registry is configured for this build, so only auctions this browser created or bid
            in are shown. Any auction still opens by its address.
          </Notice>
        </div>
      )}
      {error && (
        <div className="mt-4">
          <Notice tone="bad">Could not load auctions: {error}</Notice>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          !data &&
          [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-80 animate-pulse" />)}
        {visible.map((a) => (
          <AuctionCard key={a.address} auction={a} now={now} />
        ))}
      </div>
      {data && visible.length === 0 && (
        <div className="card mt-2 p-10 text-center">
          <p className="font-medium">Nothing here yet.</p>
          <p className="mt-1 text-sm text-muted">
            {filter === 'live' ? 'No auctions are live.' : 'No auctions match.'}{' '}
            <a href="#/create" className="text-accent hover:underline">
              Create one
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
