import { motion, useReducedMotion } from 'framer-motion';
import { EASE, Label, RevealText } from '../components/primitives';

const STEPS = [
  {
    n: '01',
    title: 'Create',
    body: 'Set your item, minimum bid and auction duration. The terms are fixed once the auction opens.',
  },
  {
    n: '02',
    title: 'Compete privately',
    body: 'Submit a bid without publicly exposing your identity. It is proven on your own machine first.',
  },
  {
    n: '03',
    title: 'Watch the price',
    body: 'The current highest amount stays visible, so everyone knows exactly what it takes to lead.',
  },
  {
    n: '04',
    title: 'Winner selected',
    body: 'When time expires, the contract fixes the winning bid. Only the winner can step forward to claim it.',
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 border-t border-white/8 py-28 sm:py-40"
      aria-labelledby="how-title"
    >
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Label tone="ember">How it works</Label>
            <RevealText
              id="how-title"
              lines={['Four moves.', 'No names.']}
              className="mt-6 text-display"
            />
          </div>
        </div>

        <div className="relative mt-24">
          <motion.div
            className="absolute left-0 right-0 top-0 hidden h-px origin-left bg-gradient-to-r from-ember via-white/16 to-white/8 lg:block"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px -20% 0px' }}
            transition={{ duration: 1.6, ease: EASE }}
            aria-hidden
          />
          <ol className="grid gap-14 lg:grid-cols-4 lg:gap-10">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                className="relative border-l border-white/8 pl-6 lg:border-l-0 lg:pl-0 lg:pt-10"
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.14 }}
              >
                <span
                  className="absolute -top-[3px] left-0 hidden h-[7px] w-[7px] rounded-full bg-ember lg:block"
                  aria-hidden
                />
                <span className="label-ember num">{s.n}</span>
                <h3 className="mt-6 text-[28px] leading-none tracking-[-0.035em]">{s.title}</h3>
                <p className="mt-5 max-w-[30ch] text-[16px] leading-relaxed text-white/48">
                  {s.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
