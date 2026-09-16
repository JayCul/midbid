// The signature section. The price climbs down the page in full view; every bid
// beside it is the same redacted mark. Scroll drives the auction forward.
import { useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { Check } from 'lucide-react';
import { LOT_042_HISTORY } from '../data/showcase';
import { formatNumber } from '../lib/auction/view';
import { EASE, Label, RevealText } from '../components/primitives';

const EVENTS = [
  { kind: 'start' as const, label: 'Start', time: '00:00:00' },
  ...LOT_042_HISTORY.map((amount, i) => ({
    kind: 'bid' as const,
    amount,
    time: ['00:04:12', '01:37:40', '03:02:09', '09:48:55', '15:21:30', '21:45:22'][i],
  })),
  { kind: 'end' as const, label: 'Auction ended', time: '24:00:00' },
];

export function Competition() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(reduce ? EVENTS.length - 1 : 0);
  const fill = useTransform(scrollYProgress, [0.05, 0.9], ['0%', '100%']);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (reduce) return;
    const next = Math.min(
      EVENTS.length - 1,
      Math.max(0, Math.floor(((p - 0.05) / 0.85) * EVENTS.length)),
    );
    setStep(next);
  });

  const current = [...EVENTS.slice(0, step + 1)].reverse().find((e) => e.kind === 'bid');

  return (
    <section
      ref={ref}
      className="relative border-t border-white/8 lg:h-[320vh]"
      aria-labelledby="competition-title"
    >
      <div className="lg:sticky lg:top-0 lg:h-screen">
        <div className="shell grid h-full gap-16 py-28 lg:grid-cols-12 lg:items-center lg:py-0">
          <div className="lg:col-span-6">
            <Label tone="ember">Auction 042 · Timeline</Label>
            <RevealText
              id="competition-title"
              lines={['Competition', 'without exposure.']}
              className="mt-6 text-display"
            />
            <div className="mt-14 grid max-w-md grid-cols-2 border-t border-white/8">
              <div className="border-r border-white/8 pr-6 pt-6">
                <Label>Price</Label>
                <p className="mt-3 text-4xl tracking-[-0.04em] sm:text-5xl">Visible</p>
                <p className="num mt-4 text-[15px] text-ember">
                  {current ? `${formatNumber(current.amount)} tNIGHT` : 'Opening'}
                </p>
              </div>
              <div className="pl-6 pt-6">
                <Label>Bidder</Label>
                <p className="mt-3 text-4xl tracking-[-0.04em] text-white/40 sm:text-5xl">
                  Private
                </p>
                <p className="mt-5">
                  <span className="redacted" style={{ width: 88 }} aria-hidden />
                </p>
              </div>
            </div>
          </div>

          <ol
            className="relative lg:col-span-6 lg:col-start-7"
            aria-label="Price history for auction 042"
          >
            <div className="absolute bottom-3 left-[7px] top-3 w-px bg-white/8" aria-hidden />
            <motion.div
              className="absolute left-[7px] top-3 w-px origin-top bg-ember"
              style={{ height: reduce ? '100%' : fill }}
              aria-hidden
            />
            {EVENTS.map((e, i) => {
              const on = i <= step;
              const head = i === step;
              return (
                <motion.li
                  key={i}
                  className="relative grid grid-cols-[16px_1fr] gap-6 py-[clamp(6px,1.1vh,14px)]"
                  animate={{ opacity: on ? 1 : 0.22 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <span
                    className={`relative z-10 mt-2 h-[15px] w-[15px] rounded-full border transition-colors duration-500 ${
                      head
                        ? 'border-ember bg-ember'
                        : on
                          ? 'border-ember bg-void'
                          : 'border-white/16 bg-void'
                    }`}
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    {e.kind === 'bid' ? (
                      <>
                        <span
                          className={`num text-[clamp(1.4rem,2.4vw,2.2rem)] leading-none tracking-[-0.04em] transition-colors duration-500 ${
                            head ? 'text-white' : 'text-white/72'
                          }`}
                        >
                          {formatNumber(e.amount)}
                          <span className="label ml-2">tNIGHT</span>
                        </span>
                        <span className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-2">
                            <span className="redacted" style={{ width: 44 }} aria-hidden />
                            <span className="label">Private</span>
                          </span>
                          <span
                            className={`label inline-flex items-center gap-1 ${on ? 'text-ember' : ''}`}
                          >
                            <Check size={11} aria-hidden /> Verified
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[clamp(1.1rem,2vw,1.5rem)] tracking-[-0.02em] text-white/72">
                        {e.label}
                      </span>
                    )}
                    <span className="label num hidden basis-full xl:block">T+{e.time}</span>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
