// A look inside an auction before anyone clicks. The preview animates its own
// sample bids while on screen and says so; the real room is one click away.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { useLoader } from '../hooks/useTime';
import { LotVisual } from '../components/LotVisual';
import { AnimatedAmount, Countdown, EASE, Label, RevealText } from '../components/primitives';

type Event = { id: number; amount: number; ago: number };

export function AuctionPreview() {
  const market = useMarket();
  const { data: lot } = useLoader(() => market.demo.getAuction('demo-042'), []);
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { margin: '-15% 0px' });
  const reduce = useReducedMotion();
  const [high, setHigh] = useState(4280);
  const [events, setEvents] = useState<Event[]>([
    { id: 3, amount: 4280, ago: 12 },
    { id: 2, amount: 3800, ago: 340 },
    { id: 1, amount: 2800, ago: 1860 },
  ]);

  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => {
      setHigh((h) => {
        const next = h + 100 * (1 + Math.floor(Math.random() * 2));
        setEvents((ev) => [{ id: Date.now(), amount: next, ago: 0 }, ...ev].slice(0, 4));
        return next;
      });
    }, 5200);
    const tick = setInterval(
      () => setEvents((ev) => ev.map((e) => ({ ...e, ago: e.ago + 1 }))),
      1000,
    );
    return () => {
      clearInterval(id);
      clearInterval(tick);
    };
  }, [inView, reduce]);

  return (
    <section
      className="relative border-t border-white/8 py-28 sm:py-40"
      aria-labelledby="room-title"
    >
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <Label tone="ember">Inside an auction</Label>
            <RevealText
              id="room-title"
              lines={['Every bid verified.', 'No bidder on display.']}
              className="mt-6 text-display"
            />
          </div>
        </div>

        <motion.div
          ref={frame}
          initial={reduce ? false : { opacity: 0, y: 40, clipPath: 'inset(8% 4% 8% 4%)' }}
          whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: 1.2, ease: EASE }}
          className="mt-20 border border-white/8 bg-abyss"
        >
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-6">
              <Label tone="bright">Auction 042</Label>
              <Label tone="ember" live>
                Active
              </Label>
            </div>
            <Label className="text-white/28">Preview · sample bids</Label>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(380px,1fr)]">
            <div className="relative border-b border-white/8 lg:border-b-0 lg:border-r">
              <LotVisual
                seed={1}
                title="Limited Digital Artifact"
                className="aspect-[4/3] w-full lg:aspect-auto lg:h-full"
              />
              <div className="absolute bottom-0 left-0 p-5 sm:p-7">
                <Label>Digital Collectibles</Label>
                <p className="mt-3 text-2xl tracking-[-0.03em] sm:text-3xl">
                  Limited Digital Artifact
                </p>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <Label>Current high bid</Label>
              <p className="mt-4 text-[clamp(3rem,6vw,4.75rem)] leading-none tracking-[-0.05em]">
                <AnimatedAmount value={high} />
              </p>
              <p className="label mt-3">tNIGHT · bidder private</p>

              <dl className="mt-8 grid grid-cols-2 border-y border-white/8">
                <div className="border-r border-white/8 py-4 pr-4">
                  <dt className="label">Starting bid</dt>
                  <dd className="num mt-2 text-xl">1,000</dd>
                </div>
                <div className="py-4 pl-4">
                  <dt className="label">Time left</dt>
                  <dd className="mt-2 text-xl">{lot ? <Countdown endsAt={lot.endsAt} /> : '—'}</dd>
                </div>
              </dl>

              <Link to="/auction/demo-042" className="btn-primary mt-8 w-full">
                Place private bid <ArrowRight size={16} className="arrow" aria-hidden />
              </Link>
              <p className="mt-4 flex items-center gap-2 text-[13px] text-white/72">
                <ShieldCheck size={14} className="text-ember" aria-hidden />
                Your bid is verified. Your identity stays out of it.
              </p>

              <div className="mt-8 border-t border-white/8 pt-5">
                <Label>Activity</Label>
                <ul className="mt-3" aria-live="off">
                  <AnimatePresence initial={false}>
                    {events.map((e) => (
                      <motion.li
                        key={e.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="flex items-center justify-between py-2 text-[13px]"
                      >
                        <span className="inline-flex items-center gap-2 text-white/72">
                          <Check size={12} className="text-ember" aria-hidden /> Bid verified
                          <span className="redacted ml-1" style={{ width: 30 }} aria-hidden />
                        </span>
                        <span className="num text-white/48">
                          {e.amount.toLocaleString('en-US')} ·{' '}
                          {e.ago < 60 ? `${e.ago}s` : `${Math.floor(e.ago / 60)}m`}
                        </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
