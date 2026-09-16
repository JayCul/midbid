import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { useLoader, useNow } from '../hooks/useTime';
import { phaseOf } from '../lib/auction/view';
import { isContractAddress } from '../config.js';
import { AuctionTile } from '../components/AuctionTile';
import { DemoNotice, MarketSwitch, Notice, PageHead } from '../components/AppBits';
import { ArrowLink } from '../components/primitives';

const FILTERS = [
  { id: 'live', label: 'Live', phases: ['ACTIVE', 'SCHEDULED'] },
  { id: 'ended', label: 'Ended', phases: ['ENDED', 'SETTLING', 'SETTLED', 'UNSOLD', 'CANCELLED'] },
  { id: 'all', label: 'All', phases: null },
] as const;

export default function Explore() {
  const market = useMarket();
  const now = useNow();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('live');
  const [query, setQuery] = useState('');
  const service = market.market;

  const { data, error, loading } = useLoader(
    async () => (service ? service.listAuctions() : []),
    [service, market.version],
    market.mode === 'live' ? 20000 : 0,
  );

  const visible = useMemo(() => {
    const phases = FILTERS.find((f) => f.id === filter)!.phases as readonly string[] | null;
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .filter((a) => !phases || phases.includes(phaseOf(a, now)))
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.id.startsWith(q),
      )
      .sort((a, b) => Number(a.endsAt - b.endsAt));
  }, [data, filter, query, now]);

  const q = query.trim().toLowerCase();
  const [first, ...others] = visible;

  return (
    <div className="shell pb-32">
      <PageHead label="Explore" title={<>Auctions in motion.</>}>
        <MarketSwitch />
      </PageHead>

      <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-8" role="tablist" aria-label="Filter auctions">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`relative pb-2 text-[15px] transition-colors ${filter === f.id ? 'text-white' : 'text-white/48 hover:text-white'}`}
            >
              {f.label}
              {filter === f.id && <span className="absolute inset-x-0 -bottom-px h-px bg-ember" />}
            </button>
          ))}
        </div>
        <form
          className="relative w-full lg:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (isContractAddress(q)) navigate(`/auction/${q}`);
          }}
        >
          <label className="sr-only" htmlFor="auction-search">
            Search auctions
          </label>
          <Search
            size={16}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-white/28"
            aria-hidden
          />
          <input
            id="auction-search"
            className="field pl-7 text-[15px]"
            placeholder="Search, or paste a contract address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="mt-8 space-y-3">
        {market.mode === 'demo' && <DemoNotice />}
        {market.mode === 'live' && !market.registryAddress && (
          <Notice tone="warn">
            No registry is configured for this build, so only auctions this browser created or bid
            in appear. Any auction opens by its address.
          </Notice>
        )}
        {isContractAddress(q) && <Notice>Press Enter to open this auction by address.</Notice>}
        {error && <Notice tone="bad">Could not load auctions: {error}</Notice>}
      </div>

      {loading && !data && (
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="aspect-[4/3] animate-pulse bg-abyss" />
          ))}
        </div>
      )}

      {first && (
        <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <AuctionTile auction={first} size="feature" />
          </div>
          <div className="lg:col-span-5 lg:pt-32">
            {others[0] && <AuctionTile auction={others[0]} index={1} />}
          </div>
        </div>
      )}

      {others.length > 1 && (
        <div className="mt-24 border-b border-white/8">
          {others.slice(1).map((a) => (
            <AuctionTile key={a.id} auction={a} size="row" />
          ))}
        </div>
      )}

      {data && visible.length === 0 && (
        <div className="mt-24 flex flex-col items-start gap-6 border-t border-white/8 pt-12">
          <p className="text-3xl tracking-[-0.03em] text-white/72">
            {filter === 'live' ? 'Nothing is live right now.' : 'No auctions match.'}
          </p>
          <div className="flex flex-wrap gap-8">
            <ArrowLink to="/create">Open the next one</ArrowLink>
            {market.mode === 'live' && (
              <button className="btn-quiet" onClick={() => market.setMode('demo')}>
                Browse the demo market
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
