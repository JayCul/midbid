import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Gavel, KeyRound, ShieldCheck, Timer } from 'lucide-react';
import type { MidbidApi } from '../useMidbid';
import { useLoader, useNow } from '../hooks';
import { AuctionCard } from '../components/AuctionCard';

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Landing({ api }: { api: MidbidApi }) {
  const now = useNow();
  const live = useLoader(() => api.service.listAuctions(), [api.service], 30_000);
  const active = (live.data ?? []).filter((a) => a.phase === 'ACTIVE').slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="grid-field pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-canvas px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <motion.p variants={fade} initial="hidden" animate="show" className="eyebrow">
            Private bidding on Midnight
          </motion.p>
          <motion.h1
            variants={fade}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tightest sm:text-7xl"
          >
            See the price.
            <br />
            <span className="text-gradient">Not the bidder.</span>
          </motion.h1>
          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
          >
            Live auctions where everyone sees the high bid, and nobody sees who placed it. The rules
            run in a Midnight contract, and the winner only steps forward once the auction has
            ended.
          </motion.p>
          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-wrap gap-3"
          >
            <a href="#/browse" className="btn-primary px-5 py-3 text-base">
              Browse auctions <ArrowRight size={16} aria-hidden />
            </a>
            <a href="#/create" className="btn-ghost px-5 py-3 text-base">
              <Gavel size={16} aria-hidden /> Create an auction
            </a>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-canvas px-4 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How a Midbid auction works
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Gavel,
              title: 'A seller opens terms',
              body: 'Starting bid, minimum increment and end time are written into a new contract. Nobody can change them afterwards, including the seller.',
            },
            {
              icon: KeyRound,
              title: 'Bidders prove, not reveal',
              body: 'Each bid is proven on your own machine. It publishes the new price and a fresh commitment, never a name, and never the same commitment twice.',
            },
            {
              icon: Timer,
              title: 'The winner steps forward',
              body: 'When block time passes the end, only the holder of the leading commitment can claim. The seller then records settlement.',
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              className="card p-6"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <step.icon size={18} aria-hidden />
              </div>
              <p className="mt-4 font-mono text-xs text-muted">0{i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-canvas px-4 sm:px-6" aria-labelledby="privacy">
        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-line p-6 md:border-b-0 md:border-r sm:p-8">
              <div className="flex items-center gap-2 text-good">
                <Eye size={16} aria-hidden />
                <h2 id="privacy" className="text-lg font-semibold text-ink">
                  Public, on purpose
                </h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                <li>The listing, starting bid, increment and end time</li>
                <li>The current high bid and how many bids were accepted</li>
                <li>The auction's status, from live to settled</li>
                <li>That a transaction called the contract, as on any chain</li>
              </ul>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 text-accent">
                <EyeOff size={16} aria-hidden />
                <h3 className="text-lg font-semibold text-ink">Never written to the chain</h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                <li>Which bidder placed the high bid</li>
                <li>Whether two bids came from the same bidder</li>
                <li>Bids that would not have led: they fail locally and are never sent</li>
                <li>Your bidder and seller secrets</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-line bg-surface px-6 py-4 text-xs leading-relaxed text-muted sm:px-8">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <p>
              Honest limit: the wallet that pays a transaction's fee can still be visible to chain
              analysis. Midbid keeps bidder identity out of contract state; it does not claim to
              hide network-level metadata. Read the{' '}
              <a
                className="underline hover:text-ink"
                href="https://github.com/JayCul/midbid/blob/main/docs/PRIVACY.md"
                target="_blank"
                rel="noreferrer"
              >
                privacy model
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-canvas px-4 sm:px-6" aria-labelledby="live">
        <div className="flex items-end justify-between gap-4">
          <h2 id="live" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Live on Preprod
          </h2>
          <a href="#/browse" className="text-sm text-muted hover:text-ink">
            View all
          </a>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.loading &&
            !live.data &&
            [0, 1, 2].map((i) => <div key={i} className="card h-72 animate-pulse" />)}
          {active.map((a) => (
            <AuctionCard key={a.address} auction={a} now={now} />
          ))}
          {live.data && active.length === 0 && (
            <div className="card col-span-full p-8 text-center text-sm text-muted">
              No auctions are live right now.{' '}
              <a href="#/create" className="text-accent hover:underline">
                Open the next one.
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
