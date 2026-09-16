import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { EASE, Label, RevealText } from '../components/primitives';

export function PrivacyCompare() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const seen = useInView(ref, { once: true, margin: '0px 0px -25% 0px' });
  const fadeOld = seen && !reduce;

  return (
    <section
      className="relative overflow-hidden border-t border-white/8 py-28 sm:py-40"
      aria-labelledby="privacy-title"
    >
      <div
        className="ember-haze pointer-events-none absolute -right-[20%] top-[30%] h-[60vw] w-[60vw] opacity-60"
        aria-hidden
      />
      <div className="shell relative">
        <Label tone="ember">Privacy</Label>
        <RevealText
          id="privacy-title"
          lines={[
            'The blockchain can verify the bid',
            'without revealing everything',
            'about the bidder.',
          ]}
          className="mt-6 max-w-5xl text-title sm:text-[clamp(2.2rem,4.6vw,4.2rem)]"
          lineClassName={['', '', 'text-white/40']}
        />

        <div ref={ref} className="mt-20 grid gap-6 md:grid-cols-2 md:gap-0">
          <motion.div
            className="border border-white/8 p-8 sm:p-10 md:border-r-0"
            animate={
              fadeOld
                ? { opacity: 0.32, filter: 'blur(1.5px) grayscale(1)', scale: 0.985 }
                : { opacity: 1, filter: 'blur(0px) grayscale(0)', scale: 1 }
            }
            transition={{ duration: 1.6, ease: EASE, delay: 1.1 }}
          >
            <div className="flex items-center justify-between">
              <Label>Traditional auction</Label>
              <Label className="text-bad/80">Exposed</Label>
            </div>
            <dl className="mt-10 divide-y divide-white/8">
              <Field
                k="Bidder"
                v={<span className="num font-mono">0x7A…91</span>}
                strike={fadeOld}
              />
              <Field k="Bid" v={<span className="num">4,280</span>} strike={fadeOld} />
              <Field k="History" v="Visible" strike={fadeOld} />
            </dl>
            <p className="mt-8 text-[14px] leading-relaxed text-white/48">
              Every bid is tied to an account anyone can follow, across this auction and every other
              one.
            </p>
          </motion.div>

          <div className="relative border border-ember/40 bg-abyss/60 p-8 backdrop-blur-sm sm:p-10">
            <div className="flex items-center justify-between">
              <Label tone="ember" live>
                MidBid
              </Label>
              <Label tone="bright">Private</Label>
            </div>
            <dl className="mt-10 divide-y divide-white/8">
              <Field k="Bid" v={<Verified>Verified</Verified>} />
              <Field
                k="Bidder"
                v={
                  <span className="inline-flex items-center gap-3">
                    <span className="redacted" style={{ width: 52 }} aria-hidden /> Private
                  </span>
                }
              />
              <Field k="Auction state" v={<Verified>Verified</Verified>} />
            </dl>
            <p className="mt-8 text-[14px] leading-relaxed text-white/72">
              Identity not exposed through the bid. The price is public so the auction stays
              competitive; the fee-paying wallet can still be visible to network analysis, and we
              say so.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Verified({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-ember/15 text-ember">
        <Check size={11} aria-hidden />
      </span>
      {children}
    </span>
  );
}

function Field({ k, v, strike = false }: { k: string; v: React.ReactNode; strike?: boolean }) {
  return (
    <div className="flex items-center justify-between py-5">
      <dt className="label">{k}</dt>
      <dd className="relative text-[clamp(1.25rem,2vw,1.6rem)] tracking-[-0.02em]">
        {v}
        <motion.span
          className="absolute left-0 top-1/2 h-px w-full origin-left bg-white/72"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: strike ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
          aria-hidden
        />
      </dd>
    </div>
  );
}
