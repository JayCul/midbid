import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Crown, ShieldCheck } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { useLoader, useNow } from '../hooks/useTime';
import type { MarketService } from '../services/types';
import type { Receipt } from '../types/auction';
import { bidProblem } from '../lib/auction/model.js';
import { displayPrice, formatNumber, nextMinimum, phaseOf } from '../lib/auction/view';
import { LotVisual } from '../components/LotVisual';
import {
  AnimatedAmount,
  Countdown,
  EASE,
  Label,
  PhaseLabel,
  PrivateBidder,
} from '../components/primitives';
import { DemoNotice, LogPanel, Notice, Readiness, ReceiptLine } from '../components/AppBits';

type Outcome = { kind: 'ok' | 'bad'; text: string; receipt?: Receipt } | null;

export default function AuctionPage() {
  const { id = '' } = useParams();
  const market = useMarket();
  const now = useNow();
  const [service, setService] = useState<MarketService | null>(null);

  useEffect(() => {
    let live = true;
    market.serviceFor(id).then((s) => live && setService(s));
    return () => {
      live = false;
    };
    // The Midnight service is rebuilt when the wallet connects or disconnects.
  }, [id, market.serviceFor, market.live, market.wallet.status]);

  const isDemo = id.startsWith('demo-');
  const auction = useLoader(
    async () => (service ? service.getAuction(id) : null),
    [service, id, market.version],
    isDemo ? 0 : 10000,
  );
  const position = useLoader(
    async () => (service && auction.data ? service.getPosition(id) : null),
    [service, id, auction.data],
  );
  const listed = useLoader(async () => {
    if (
      !service ||
      service.source !== 'midnight' ||
      !position.data?.isSeller ||
      !market.registryAddress
    )
      return null;
    return (service as any).isListed(id) as Promise<boolean>;
  }, [service, position.data?.isSeller, id]);

  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const a = auction.data;

  useEffect(() => {
    if (a) setAmount(String(nextMinimum(a)));
  }, [a?.bidCount, a?.highBid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (auction.error && !a) {
    return (
      <div className="shell pb-32 pt-44">
        <Notice tone="bad">{auction.error}</Notice>
        <Link to="/explore" className="btn-quiet mt-8">
          <ArrowLeft size={15} /> Back to auctions
        </Link>
      </div>
    );
  }
  if (!a || !service) {
    return (
      <div className="shell grid gap-10 pb-32 pt-44 lg:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse bg-abyss" />
        <div className="h-96 animate-pulse bg-abyss" />
      </div>
    );
  }

  const phase = phaseOf(a, now);
  const hasBids = a.bidCount > 0n;
  const pos = position.data;
  const ready = isDemo || (market.wallet.status === 'connected' && market.proofServerOk !== false);
  const problem = amount ? bidProblem({ ...a, status: a.storedStatus }, amount, now) : null;

  const run = async (label: string, fn: () => Promise<Receipt>, success: string) => {
    setBusy(label);
    setOutcome(null);
    try {
      const receipt = await fn();
      setOutcome({ kind: 'ok', text: success, receipt });
    } catch (err: any) {
      setOutcome({ kind: 'bad', text: err?.message ?? String(err) });
    } finally {
      setBusy(null);
      auction.reload();
      position.reload();
    }
  };

  return (
    <div className="shell pb-32 pt-28 sm:pt-32">
      <Link to="/explore" className="btn-quiet">
        <ArrowLeft size={15} aria-hidden /> All auctions
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="relative border border-white/8">
            <LotVisual
              seed={a.visualSeed}
              imageUrl={a.imageUrl}
              title={a.title}
              className="aspect-[4/5] sm:aspect-[5/4]"
            />
            <div className="absolute inset-x-0 top-0 flex justify-between p-5">
              <Label tone="bright">Auction {a.lot}</Label>
              <PhaseLabel phase={phase} />
            </div>
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-2">
            <div>
              <Label>About this lot</Label>
              <p className="mt-4 text-[16px] leading-relaxed text-white/72">
                {a.description || 'The seller did not add a description.'}
              </p>
            </div>
            <div>
              <Label>What this auction reveals</Label>
              <dl className="mt-4 divide-y divide-white/8 border-y border-white/8 text-[14px]">
                <Reveal k="Price" v="Public" on />
                <Reveal k="Accepted bids" v="Public" on />
                <Reveal k="Bidder" v="Private" />
                <Reveal k="Losing bids" v="Never sent" />
              </dl>
            </div>
          </div>
          {!isDemo && (
            <p className="label mt-10 break-all normal-case tracking-normal text-white/28">
              Contract {a.id}
            </p>
          )}
        </motion.div>

        <motion.aside
          className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Label>{a.category}</Label>
            {isDemo && <Label className="text-white/28">Demo market</Label>}
          </div>
          <h1 className="mt-4 text-title">{a.title}</h1>

          <div className="mt-10 border-y border-white/8 py-8">
            <Label>{hasBids ? 'Current high bid' : 'Starting bid'}</Label>
            <p className="mt-4 text-[clamp(3.25rem,6vw,5rem)] leading-none tracking-[-0.05em]">
              <AnimatedAmount value={displayPrice(a)} />
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="label">tNIGHT</span>
              {hasBids ? <PrivateBidder /> : <span className="label">No bids yet</span>}
            </div>
          </div>

          <dl className="grid grid-cols-3 border-b border-white/8">
            <Stat k="Starting bid" v={formatNumber(a.startingBid)} />
            <Stat k="Increment" v={formatNumber(a.minIncrement)} />
            <Stat k="Private bids" v={String(a.bidCount)} />
          </dl>
          <div className="flex items-baseline justify-between border-b border-white/8 py-6">
            <Label>
              {phase === 'SCHEDULED' ? 'Opens' : phase === 'ACTIVE' ? 'Time left' : 'Ended'}
            </Label>
            <span className="text-3xl tracking-[-0.03em]">
              {phase === 'ACTIVE' ? (
                <Countdown endsAt={a.endsAt} />
              ) : phase === 'SCHEDULED' ? (
                <Countdown endsAt={a.startsAt} />
              ) : (
                <span className="text-lg text-white/48">
                  {new Date(Number(a.endsAt) * 1000).toLocaleString()}
                </span>
              )}
            </span>
          </div>

          {pos && (pos.leading || pos.bids.length > 0 || pos.isSeller) && (
            <div className="mt-6 border border-ember/30 bg-ember/[0.04] p-5">
              <Label tone="ember">Only visible on this device</Label>
              {pos.isSeller && <p className="mt-3 text-[15px]">You created this auction.</p>}
              {pos.leading ? (
                <p className="mt-3 flex items-center gap-2 text-[15px]">
                  <Crown size={15} className="text-ember" aria-hidden />
                  {phase === 'ACTIVE' ? 'You hold the high bid.' : 'Your bid won.'}
                </p>
              ) : (
                pos.bids.some((b) => b.status === 'confirmed') && (
                  <p className="mt-3 text-[15px] text-white/72">You have been outbid.</p>
                )
              )}
            </div>
          )}

          <div className="mt-8 space-y-5">
            {isDemo && <DemoNotice />}

            {phase === 'ACTIVE' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (problem) return;
                  run(
                    'bid',
                    () => service.placePrivateBid(id, BigInt(amount)),
                    'Bid verified. The price is public; you are not.',
                  );
                }}
              >
                <label htmlFor="bid" className="label">
                  Your bid · minimum {formatNumber(nextMinimum(a))}
                </label>
                <div className="mt-3 flex items-end gap-4">
                  <input
                    id="bid"
                    className="field num text-3xl tracking-[-0.03em]"
                    inputMode="numeric"
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                    aria-invalid={Boolean(problem)}
                    aria-describedby="bid-help"
                  />
                  <span className="label pb-4">tNIGHT</span>
                </div>
                {problem && <p className="mt-3 text-[14px] text-bad">{problem}</p>}
                <button
                  type="submit"
                  className="btn-primary mt-6 w-full"
                  disabled={!ready || Boolean(problem) || !amount || busy !== null}
                >
                  {busy === 'bid'
                    ? isDemo
                      ? 'Placing…'
                      : 'Proving on your machine…'
                    : 'Place private bid'}
                </button>
                <p
                  id="bid-help"
                  className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-white/48"
                >
                  <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ember" aria-hidden />
                  Your bid is verified before it lands. If someone outbids you first, it is rejected
                  and nothing is recorded.
                </p>
              </form>
            )}

            {phase === 'ENDED' &&
              hasBids &&
              (pos?.leading ? (
                <div>
                  <p className="text-[15px] leading-relaxed text-white/72">
                    You won. Claiming proves the winning bid was yours, the only moment a bidder
                    steps forward.
                  </p>
                  <button
                    className="btn-primary mt-5 w-full"
                    disabled={!ready || busy !== null}
                    onClick={() =>
                      run(
                        'claim',
                        () => service.finalizeAuction(id),
                        'Win claimed. Arrange the exchange with the seller.',
                      )
                    }
                  >
                    {busy === 'claim' ? 'Proving…' : 'Claim win'}
                  </button>
                </div>
              ) : (
                <p className="text-[15px] text-white/48">
                  Ended. Waiting for the winning bidder to claim.
                </p>
              ))}
            {phase === 'ENDED' && !hasBids && (
              <button
                className="btn-secondary w-full"
                disabled={!ready || busy !== null}
                onClick={() =>
                  run('unsold', () => service.finalizeAuction(id), 'Recorded as unsold.')
                }
              >
                Record as unsold
              </button>
            )}
            {phase === 'SETTLING' && (
              <div>
                <p className="text-[15px] text-white/72">
                  The winner has claimed. The seller records settlement after the exchange.
                </p>
                {pos?.isSeller && (
                  <button
                    className="btn-primary mt-5 w-full"
                    disabled={!ready || busy !== null}
                    onClick={() =>
                      run('settle', () => service.settleAuction(id), 'Settlement recorded.')
                    }
                  >
                    Record settlement
                  </button>
                )}
              </div>
            )}
            {phase === 'SETTLED' && (
              <p className="text-[15px] text-white/48">Settled. This auction is complete.</p>
            )}
            {phase === 'CANCELLED' && (
              <p className="text-[15px] text-white/48">Cancelled by the seller before any bid.</p>
            )}
            {phase === 'UNSOLD' && (
              <p className="text-[15px] text-white/48">Ended without a bid.</p>
            )}
            {phase === 'SCHEDULED' && (
              <p className="text-[15px] text-white/48">Bidding has not opened yet.</p>
            )}

            {pos?.isSeller && !hasBids && (phase === 'ACTIVE' || phase === 'SCHEDULED') && (
              <button
                className="btn-quiet text-bad/80 hover:text-bad"
                disabled={!ready || busy !== null}
                onClick={() => run('cancel', () => service.cancelAuction(id), 'Auction cancelled.')}
              >
                Cancel auction
              </button>
            )}

            {listed.data === false && (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-white/8 p-4 text-[14px]">
                <span className="text-white/72">
                  Not listed in Explore yet. It still opens by link.
                </span>
                <button
                  className="btn-quiet text-ember"
                  disabled={!ready || busy !== null}
                  onClick={() =>
                    run(
                      'list',
                      async () => {
                        const r = await (service as any).listInRegistry(id);
                        listed.reload();
                        return r;
                      },
                      'Listed in Explore.',
                    )
                  }
                >
                  List it
                </button>
              </div>
            )}

            {outcome && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Notice tone={outcome.kind === 'ok' ? 'good' : 'bad'}>
                  <p className="flex items-center gap-2 text-white">
                    {outcome.kind === 'ok' && (
                      <Check size={14} className="text-ember" aria-hidden />
                    )}
                    {outcome.text}
                  </p>
                  <div className="mt-2">
                    <ReceiptLine receipt={outcome.receipt} />
                  </div>
                </Notice>
              </motion.div>
            )}

            {!isDemo && <Readiness action="take part" />}
            {!isDemo && <LogPanel />}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-r border-white/8 py-5 pr-3 last:border-r-0 [&:not(:first-child)]:pl-4">
      <dt className="label">{k}</dt>
      <dd className="num mt-2 text-lg">{v}</dd>
    </div>
  );
}

function Reveal({ k, v, on = false }: { k: string; v: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-white/48">{k}</dt>
      <dd className={on ? 'text-white' : 'text-ember'}>{v}</dd>
    </div>
  );
}
