// Metadata floating in the hero environment, read from demo lot 042. Thin rules,
// tiny type, one ember indicator each: part of the space, not cards on top of it.
import { motion } from 'framer-motion';
import { useMarket } from '../hooks/useMarket';
import { useLoader } from '../hooks/useTime';
import { AnimatedAmount, Countdown, EASE } from '../components/primitives';

type NoteProps = {
  className: string;
  delay: number;
  line: 'left' | 'right';
  children: React.ReactNode;
};

function Note({ className, delay, line, children }: NoteProps) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 9 + delay * 2, repeat: Infinity, ease: 'easeInOut' }}
        className={`flex items-center gap-3 ${line === 'left' ? 'flex-row-reverse' : ''}`}
      >
        <div className="border-l border-white/16 pl-3">{children}</div>
        <span className="h-px w-14 bg-gradient-to-r from-white/28 to-transparent" aria-hidden />
        <span className="h-1 w-1 rounded-full bg-ember" aria-hidden />
      </motion.div>
    </motion.div>
  );
}

export function HeroAnnotations() {
  const market = useMarket();
  const { data: lot } = useLoader(() => market.demo.getAuction('demo-042'), [market.version]);
  if (!lot) return null;

  return (
    <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
      <Note className="left-[47%] top-[13%]" delay={1.3} line="right">
        <p className="label text-white/72">Auction {lot.lot}</p>
        <p className="label mt-2 inline-flex items-center gap-2 text-ember">
          <span className="pulse-dot" /> Active
        </p>
        <p className="label mt-2">{String(lot.bidCount)} private bids</p>
      </Note>

      <Note className="right-[3%] top-[18%]" delay={1.5} line="left">
        <p className="label">Current high bid</p>
        <p className="mt-2 text-2xl tracking-[-0.03em] text-white">
          <AnimatedAmount value={lot.highBid} /> <span className="label">tNIGHT</span>
        </p>
      </Note>

      <Note className="left-[66%] top-[77%]" delay={1.7} line="right">
        <p className="label">Bidder</p>
        <p className="label mt-2 inline-flex items-center gap-2 text-white/72">
          <span className="redacted" style={{ width: 42 }} /> Private
        </p>
      </Note>

      <Note className="right-[3%] top-[56%]" delay={1.9} line="left">
        <p className="text-xl tracking-[-0.02em] text-white">
          <Countdown endsAt={lot.endsAt} />
        </p>
        <p className="label mt-2">Remaining</p>
      </Note>
    </div>
  );
}
