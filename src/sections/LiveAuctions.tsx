import { useMarket } from '../hooks/useMarket';
import { useLoader, useNow } from '../hooks/useTime';
import { phaseOf } from '../lib/auction/view';
import type { Auction } from '../types/auction';
import { AuctionTile } from '../components/AuctionTile';
import { Appear, ArrowLink, Label, RevealText } from '../components/primitives';

export function LiveAuctions() {
  const market = useMarket();
  const now = useNow(15000);

  // Live Preprod auctions when there are any; otherwise the demo market, labelled.
  const { data } = useLoader(async () => {
    if (market.live) {
      try {
        const live = (await market.live.listAuctions()).filter((a) => phaseOf(a) === 'ACTIVE');
        if (live.length > 0) return { source: 'midnight' as const, list: live };
      } catch {
        /* fall through to the demo market */
      }
    }
    const demo = (await market.demo.listAuctions()).filter((a) => phaseOf(a, now) === 'ACTIVE');
    return { source: 'demo' as const, list: demo };
  }, [market.live, market.version]);

  const list: Auction[] = data?.list ?? [];
  const [feature, second, third, ...rest] = list;

  return (
    <section className="relative py-28 sm:py-40" aria-labelledby="live-title">
      <div className="shell">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Label tone="ember" live>
              {data?.source === 'midnight'
                ? 'Live market · Midnight Preprod'
                : 'Live market · Demo lots'}
            </Label>
            <RevealText
              id="live-title"
              lines={['Auctions in motion.']}
              className="mt-6 text-display"
            />
          </div>
          <Appear className="md:col-span-5 md:pb-3">
            <p className="text-[20px] leading-snug text-white/72">
              Watch prices move without watching people.
            </p>
            {data?.source === 'demo' && (
              <p className="mt-3 text-[14px] text-white/48">
                Sample lots from the demo market. Nothing here is sent to a network.
              </p>
            )}
          </Appear>
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-12 lg:gap-10">
          {feature && (
            <div className="lg:col-span-7">
              <AuctionTile auction={feature} size="feature" />
            </div>
          )}
          <div className="flex flex-col gap-16 lg:col-span-5 lg:pt-40">
            {second && <AuctionTile auction={second} index={1} />}
            {third && <AuctionTile auction={third} index={2} />}
          </div>
        </div>

        {rest.length > 0 && (
          <Appear className="mt-24">
            <div className="border-b border-white/8">
              {rest.slice(0, 3).map((a) => (
                <AuctionTile key={a.id} auction={a} size="row" />
              ))}
            </div>
          </Appear>
        )}

        <div className="mt-12 flex justify-end">
          <ArrowLink to="/explore" className="text-[15px]">
            Explore all auctions
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
