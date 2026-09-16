import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import { Appear, EASE, Label, RevealText } from '../components/primitives';

const ROWS: { k: string; v: string }[] = [
  { k: 'Item', v: 'Limited Digital Artifact' },
  { k: 'Starting bid', v: '1,000 tNIGHT' },
  { k: 'Minimum increment', v: '100 tNIGHT' },
  { k: 'Duration', v: '24 hours' },
];

export function CreatePreview() {
  const reduce = useReducedMotion();
  return (
    <section
      className="relative border-t border-white/8 py-28 sm:py-40"
      aria-labelledby="create-title"
    >
      <div className="shell grid gap-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <Label tone="ember">Create</Label>
          <RevealText
            id="create-title"
            lines={['Your auction.', 'Your rules.']}
            className="mt-6 text-display"
          />
          <Appear delay={0.2}>
            <p className="mt-8 max-w-md text-[19px] leading-relaxed text-white/72">
              Four decisions and the auction is live. Once it opens, the terms are locked, including
              for you.
            </p>
            <Link to="/create" className="btn-secondary mt-10">
              Start an auction <ArrowRight size={16} className="arrow" aria-hidden />
            </Link>
          </Appear>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="relative overflow-hidden border border-white/8 bg-abyss p-7 sm:p-10">
            <div
              className="ember-haze pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 opacity-70"
              aria-hidden
            />
            <dl className="relative">
              {ROWS.map((r, i) => (
                <motion.div
                  key={r.k}
                  className="grid gap-2 border-b border-white/8 py-6 sm:grid-cols-[180px_1fr] sm:items-baseline"
                  initial={reduce ? false : { opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.1 }}
                >
                  <dt className="label">{r.k}</dt>
                  <dd className="text-[22px] tracking-[-0.025em]">{r.v}</dd>
                </motion.div>
              ))}
              <motion.div
                className="grid gap-2 border-b border-white/8 py-6 sm:grid-cols-[180px_1fr] sm:items-center"
                initial={reduce ? false : { opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
              >
                <dt className="label">Display current high bid</dt>
                <dd className="flex items-center gap-4">
                  <span
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-ember"
                    aria-hidden
                  >
                    <span className="absolute right-1 h-4 w-4 rounded-full bg-void" />
                  </span>
                  <span className="text-[22px] tracking-[-0.025em]">On</span>
                  <span className="label inline-flex items-center gap-1.5 text-white/28">
                    <Lock size={11} aria-hidden /> Always, by design
                  </span>
                </dd>
              </motion.div>
            </dl>
            <Link to="/create" className="btn-primary relative mt-8 w-full">
              Create auction
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
