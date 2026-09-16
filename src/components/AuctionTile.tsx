// Editorial auction tile. Never renders a bidder: the price moves, the people don't appear.
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Auction } from '../types/auction';
import { displayPrice, phaseOf } from '../lib/auction/view';
import { useNow } from '../hooks/useTime';
import { Amount, Countdown, EASE, Label, PhaseLabel, PrivateBidder } from './primitives';
import { LotVisual } from './LotVisual';

export function AuctionTile({
  auction: a,
  size = 'standard',
  index = 0,
}: {
  auction: Auction;
  size?: 'feature' | 'standard' | 'row';
  index?: number;
}) {
  const now = useNow();
  const reduce = useReducedMotion();
  const phase = phaseOf(a, now);
  const hasBids = a.bidCount > 0n;
  const to = `/auction/${a.id}`;

  const meta = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <PhaseLabel phase={phase} />
      <Label>{a.category}</Label>
      {a.source === 'demo' && <Label className="text-white/28">Demo</Label>}
    </div>
  );

  if (size === 'row') {
    return (
      <Link
        to={to}
        className="group grid grid-cols-[88px_1fr] items-center gap-5 border-t border-white/8 py-5 transition-colors hover:border-white/28 sm:grid-cols-[120px_1.4fr_1fr_1fr_auto] sm:gap-8"
      >
        <LotVisual
          seed={a.visualSeed}
          imageUrl={a.imageUrl}
          title={a.title}
          className="aspect-square"
        />
        <div className="min-w-0">
          <Label>Auction {a.lot}</Label>
          <h3 className="mt-2 truncate text-xl tracking-[-0.03em] transition-colors group-hover:text-ember-soft">
            {a.title}
          </h3>
          <div className="mt-2 sm:hidden">
            <Amount value={displayPrice(a)} className="text-lg" />
          </div>
        </div>
        <div className="hidden sm:block">
          <Label>{hasBids ? 'Current high bid' : 'Starting bid'}</Label>
          <div className="mt-2">
            <Amount value={displayPrice(a)} animated className="text-2xl tracking-[-0.03em]" />
          </div>
        </div>
        <div className="hidden sm:block">
          <Label>{phase === 'ACTIVE' ? 'Remaining' : 'Status'}</Label>
          <div className="mt-2 text-lg text-white/72">
            {phase === 'ACTIVE' ? <Countdown endsAt={a.endsAt} /> : <PhaseLabel phase={phase} />}
          </div>
        </div>
        <ArrowRight
          size={18}
          className="arrow hidden text-white/48 group-hover:text-ember sm:block"
          aria-hidden
        />
      </Link>
    );
  }

  const feature = size === 'feature';
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay: index * 0.08 }}
      className="group relative"
    >
      <Link to={to} className="block" aria-label={`${a.title}, auction ${a.lot}`}>
        <div className="relative overflow-hidden border border-white/8 transition-colors duration-500 group-hover:border-white/28">
          <LotVisual
            seed={a.visualSeed}
            imageUrl={a.imageUrl}
            title={a.title}
            className={`${feature ? 'aspect-[4/5] lg:aspect-[5/6]' : 'aspect-[4/3]'} [&_.lot-media]:transition-transform [&_.lot-media]:duration-[1.4s] [&_.lot-media]:ease-expo group-hover:[&_.lot-media]:scale-[1.04]`}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
            <Label tone="bright">Auction {a.lot}</Label>
            {phase === 'ACTIVE' && (
              <span className="label num text-white/72">
                <Countdown endsAt={a.endsAt} />
              </span>
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/60 to-transparent p-5 pt-16 transition-transform duration-700 ease-expo group-hover:-translate-y-1">
            <PrivateBidder compact />
          </div>
        </div>

        <div className="mt-5 transition-transform duration-700 ease-expo group-hover:translate-x-1">
          {meta}
          <h3
            className={`mt-3 tracking-[-0.035em] ${feature ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}
          >
            {a.title}
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-6 border-t border-white/8 pt-5 sm:grid-cols-3">
            <div>
              <Label>{hasBids ? 'Current high bid' : 'Starting bid'}</Label>
              <div className="mt-2">
                <Amount
                  value={displayPrice(a)}
                  animated
                  className={`tracking-[-0.03em] ${feature ? 'text-3xl' : 'text-2xl'}`}
                />
              </div>
            </div>
            <div className="hidden sm:block">
              <Label>Starting bid</Label>
              <div className="mt-2">
                <Amount value={a.startingBid} className="text-lg text-white/72" />
              </div>
            </div>
            <div>
              <Label>Private bids</Label>
              <p className="num mt-2 text-lg text-white/72">{String(a.bidCount)}</p>
            </div>
          </div>
          <span className="btn-quiet mt-6 text-white/72 group-hover:text-ember">
            View auction <ArrowRight size={15} className="arrow" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
