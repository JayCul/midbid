import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Crown,
  EyeOff,
  Gavel,
  Link2,
  RefreshCw,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import type { MidbidApi } from '../useMidbid';
import { useLoader, useNow } from '../hooks';
import { Artwork } from '../components/AuctionCard';
import { CopyValue, Countdown, Notice, StatusBadge, TxRef } from '../components/bits';
import { Readiness } from '../components/Shell';
import { bidProblem, deriveStatus, formatAmount, minimumNextBid } from '../../lib/auction/model.js';

type Outcome = { kind: 'ok' | 'bad'; text: string; tx?: any } | null;

export default function AuctionDetail({ api, address }: { api: MidbidApi; address: string }) {
  const now = useNow();
  const auction = useLoader(() => api.service.getAuction(address), [api.service, address], 10_000);
  const a = auction.data ? { ...auction.data, phase: deriveStatus(auction.data, now) } : null;

  // Private position: computed on this device from encrypted private state.
  const position = useLoader(
    async () => (api.wallet && auction.data ? api.service.myPosition(auction.data) : null),
    [api.service, api.wallet, auction.data],
  );

  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);

  useEffect(() => {
    if (a && !amount) setAmount(String(minimumNextBid(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.bidCount, a?.highBid]);

  if (auction.error && !auction.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
        <Notice tone="bad">{auction.error}</Notice>
        <a href="#/browse" className="btn-ghost mt-4">
          <ArrowLeft size={15} aria-hidden /> Back to auctions
        </a>
      </div>
    );
  }
  if (!a) {
    return (
      <div className="mx-auto grid max-w-canvas gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-2">
        <div className="card aspect-[4/3] animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  const run = async (label: string, fn: () => Promise<any>, success: string) => {
    setBusy(label);
    setOutcome(null);
    try {
      const tx = await fn();
      setOutcome({ kind: 'ok', text: success, tx });
      auction.reload();
      position.reload();
    } catch (err: any) {
      setOutcome({ kind: 'bad', text: err?.message ?? String(err) });
      auction.reload();
    } finally {
      setBusy(null);
    }
  };

  const problem = amount ? bidProblem(a, amount, now) : null;
  const hasBids = a.bidCount > 0n;
  const pos = position.data;
  const ready = Boolean(api.wallet) && api.proofServerOk !== false;

  return (
    <div className="mx-auto max-w-canvas px-4 pt-8 sm:px-6">
      <a
        href="#/browse"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={14} aria-hidden /> All auctions
      </a>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Artwork auction={a} className="card aspect-[4/3]" />
          <div className="mt-6">
            <h2 className="text-lg font-semibold">About this item</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {a.metadata.description || 'The seller did not add a description.'}
            </p>
          </div>
          <div className="card mt-6 p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={16} className="text-accent" aria-hidden /> What this auction
              reveals
            </h2>
            <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-good">Public</p>
                <ul className="mt-2 space-y-1 text-muted">
                  <li>Terms and end time</li>
                  <li>High bid: {hasBids ? formatAmount(a.highBid) : 'none yet'}</li>
                  <li>Accepted bids: {String(a.bidCount)}</li>
                  <li>Status</li>
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-accent">Private</p>
                <ul className="mt-2 space-y-1 text-muted">
                  <li>Who holds the high bid</li>
                  <li>Whether bids share a bidder</li>
                  <li>Bids that never led</li>
                  <li>Bidder and seller secrets</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-xs text-muted">
              Contract <CopyValue value={a.address} label="contract address" />
              <span className="text-muted/70">Current leader commitment</span>
              <CopyValue value={a.leader} label="leader commitment" />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge phase={a.phase} />
            <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-muted">
              {a.metadata.category}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {a.metadata.title}
          </h1>

          <motion.div layout className="card mt-6 p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">
                  {hasBids ? 'Current high bid' : 'Starting bid'}
                </p>
                <motion.p
                  key={String(a.highBid)}
                  initial={{ scale: 1.08, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-1 font-display text-4xl font-semibold"
                >
                  {formatAmount(hasBids ? a.highBid : a.startingBid)}
                </motion.p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                  <EyeOff size={12} aria-hidden />
                  {hasBids ? 'Placed by a private bidder' : 'No bids yet'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted">Time</p>
                <Countdown auction={a} now={now} className="mt-1 block font-mono text-lg" />
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-5 text-sm">
              <Stat k="Bids" v={String(a.bidCount)} />
              <Stat k="Increment" v={formatAmount(a.minIncrement, '')} />
              <Stat
                k="Ends"
                v={new Date(Number(a.endsAt) * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            </dl>

            {pos && (pos.leading || pos.bids.length > 0 || pos.isSeller) && (
              <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-accent">
                  Only visible on this device
                </p>
                {pos.isSeller && <p className="mt-1">You created this auction.</p>}
                {pos.leading ? (
                  <p className="mt-1 flex items-center gap-2 font-medium">
                    <Crown size={15} className="text-accent" aria-hidden />
                    {a.phase === 'ACTIVE' ? 'You hold the high bid.' : 'Your bid won.'}
                  </p>
                ) : (
                  pos.bids.some((b: any) => b.status === 'confirmed') && (
                    <p className="mt-1 text-muted">You have been outbid.</p>
                  )
                )}
                {pos.bids.length > 0 && (
                  <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
                    {pos.bids.map((b: any) => (
                      <li key={b.nonce}>
                        {formatAmount(b.amount)} · {b.status} ·{' '}
                        {new Date(b.at).toLocaleTimeString()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {a.phase === 'ACTIVE' && (
              <form
                className="mt-5 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (problem) return;
                  run(
                    'bid',
                    async () => {
                      const tx = await api.service.placeBid(a.address, BigInt(amount));
                      api.remember('bid', a.address);
                      return tx;
                    },
                    'Your bid was accepted. The price is public; your identity is not.',
                  );
                }}
              >
                <label className="block">
                  <span className="label">
                    Your bid (minimum {formatAmount(minimumNextBid(a))})
                  </span>
                  <div className="flex gap-2">
                    <input
                      className="input font-mono text-base"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                      aria-invalid={Boolean(problem)}
                    />
                    <button
                      type="submit"
                      className="btn-primary shrink-0 px-5"
                      disabled={!ready || Boolean(problem) || !amount || busy !== null}
                    >
                      <Gavel size={15} aria-hidden />
                      {busy === 'bid' ? 'Proving…' : 'Place bid'}
                    </button>
                  </div>
                </label>
                {problem && <p className="text-sm text-bad">{problem}</p>}
                <p className="text-xs text-muted">
                  Your bid is proven on your machine. If it no longer leads when it lands, the
                  contract rejects it and nothing is recorded.
                </p>
              </form>
            )}

            {a.phase === 'SCHEDULED' && (
              <p className="mt-5 text-sm text-muted">
                Bidding opens {new Date(Number(a.startsAt) * 1000).toLocaleString()}.
              </p>
            )}

            {a.phase === 'ENDED' && hasBids && (
              <div className="mt-5 space-y-3">
                {pos?.leading ? (
                  <>
                    <p className="text-sm">
                      You won. Claiming opens your leading commitment on chain, which is the only
                      moment a bidder steps forward. Nothing else about your bids is revealed.
                    </p>
                    <button
                      className="btn-primary w-full"
                      disabled={!ready || busy !== null}
                      onClick={() =>
                        run(
                          'claim',
                          () => api.service.claimWin(a.address),
                          'Win claimed. Contact the seller to complete the exchange.',
                        )
                      }
                    >
                      <Trophy size={15} aria-hidden /> {busy === 'claim' ? 'Proving…' : 'Claim win'}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    The auction has ended. It closes when the winning bidder claims from the device
                    that placed the bid.
                  </p>
                )}
              </div>
            )}

            {a.phase === 'ENDED' && !hasBids && (
              <button
                className="btn-ghost mt-5 w-full"
                disabled={!ready || busy !== null}
                onClick={() =>
                  run('unsold', () => api.service.closeUnsold(a.address), 'Recorded as unsold.')
                }
              >
                {busy === 'unsold' ? 'Recording…' : 'Record as unsold'}
              </button>
            )}

            {a.phase === 'SETTLING' && (
              <div className="mt-5 space-y-3 text-sm">
                <p>
                  The winner has claimed. The seller records settlement once the exchange is
                  complete.
                </p>
                {pos?.isSeller && (
                  <button
                    className="btn-primary w-full"
                    disabled={!ready || busy !== null}
                    onClick={() =>
                      run('settle', () => api.service.settle(a.address), 'Settlement recorded.')
                    }
                  >
                    {busy === 'settle' ? 'Recording…' : 'Record settlement'}
                  </button>
                )}
              </div>
            )}

            {a.phase === 'SETTLED' && (
              <p className="mt-5 text-sm text-muted">Settled. This auction is complete.</p>
            )}
            {a.phase === 'CANCELLED' && (
              <p className="mt-5 text-sm text-muted">
                The seller cancelled this auction before any bid.
              </p>
            )}
            {a.phase === 'UNSOLD' && (
              <p className="mt-5 text-sm text-muted">This auction ended without a bid.</p>
            )}

            {pos?.isSeller && !hasBids && (a.phase === 'ACTIVE' || a.phase === 'SCHEDULED') && (
              <button
                className="mt-4 w-full text-center text-sm text-bad hover:underline disabled:opacity-40"
                disabled={!ready || busy !== null}
                onClick={() =>
                  run('cancel', () => api.service.cancel(a.address), 'Auction cancelled.')
                }
              >
                {busy === 'cancel' ? 'Cancelling…' : 'Cancel auction'}
              </button>
            )}

            {outcome && (
              <div className="mt-4">
                <Notice tone={outcome.kind === 'ok' ? 'good' : 'bad'}>
                  <p>{outcome.text}</p>
                  {outcome.tx && (
                    <div className="mt-2">
                      <TxRef tx={outcome.tx} />
                    </div>
                  )}
                </Notice>
              </div>
            )}

            {!api.wallet || api.proofServerOk === false ? (
              <div className="mt-5">
                <Readiness api={api} action="take part" />
              </div>
            ) : null}
          </motion.div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted">
            <button
              onClick={auction.reload}
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              <RefreshCw size={12} className={auction.loading ? 'animate-spin' : ''} aria-hidden />{' '}
              Refresh from indexer
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => {})}
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              <Link2 size={12} aria-hidden /> Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-0.5 font-medium">{v}</dd>
    </div>
  );
}
