import { motion } from 'framer-motion';
import { EyeOff, Image as ImageIcon } from 'lucide-react';
import { formatAmount, minimumNextBid } from '../../lib/auction/model.js';
import { Countdown, StatusBadge } from './bits';

export type AuctionView = {
  address: string;
  metadata: { title: string; description: string; category: string; imageUrl: string };
  startingBid: bigint;
  minIncrement: bigint;
  startsAt: bigint;
  endsAt: bigint;
  highBid: bigint;
  bidCount: bigint;
  phase: string;
};

export function Artwork({ auction, className = '' }: { auction: AuctionView; className?: string }) {
  const { imageUrl, title } = auction.metadata;
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="glow grid h-full w-full place-items-center">
          <ImageIcon size={28} className="text-muted/60" aria-hidden />
        </div>
      )}
    </div>
  );
}

export function AuctionCard({
  auction,
  now,
  preview = false,
}: {
  auction: AuctionView;
  now: number;
  preview?: boolean;
}) {
  const hasBids = BigInt(auction.bidCount) > 0n;
  const body = (
    <motion.article
      whileHover={preview ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="card group flex h-full flex-col overflow-hidden"
    >
      <div className="relative">
        <Artwork auction={auction} className="aspect-[4/3]" />
        <div className="absolute left-3 top-3">
          <StatusBadge phase={auction.phase} />
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-canvas/80 px-2.5 py-0.5 text-[11px] text-muted backdrop-blur">
          {auction.metadata.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-lg font-semibold group-hover:text-accent">
          {auction.metadata.title}
        </h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">
              {hasBids ? 'High bid' : 'Starting bid'}
            </p>
            <p className="font-display text-xl font-semibold">
              {formatAmount(hasBids ? auction.highBid : auction.startingBid)}
            </p>
          </div>
          <div className="text-right text-xs text-muted">
            <p className="inline-flex items-center gap-1">
              <EyeOff size={12} aria-hidden /> {String(auction.bidCount)} private{' '}
              {auction.bidCount === 1n ? 'bid' : 'bids'}
            </p>
            <Countdown auction={auction} now={now} className="mt-1 block font-mono" />
          </div>
        </div>
        {auction.phase === 'ACTIVE' && (
          <p className="mt-3 text-xs text-muted">
            Next bid from {formatAmount(minimumNextBid(auction))}
          </p>
        )}
      </div>
    </motion.article>
  );
  if (preview) return body;
  return (
    <a href={`#/auction/${auction.address}`} className="block h-full rounded-2xl">
      {body}
    </a>
  );
}
