import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { EASE, Label, RevealText } from '../components/primitives';
import { HeroAnnotations } from './HeroAnnotations';

const HeroScene = lazy(() => import('./HeroScene'));

/** Static stand-in while the scene loads, and for reduced motion without WebGL. */
function SceneFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="ember-haze absolute h-[70vmin] w-[70vmin]" />
      <svg viewBox="0 0 200 200" className="relative h-[34vmin] w-[34vmin] opacity-80">
        <polygon
          points="100,18 171,59 171,141 100,182 29,141 29,59"
          fill="#141414"
          stroke="#FF8A00"
          strokeOpacity="0.4"
        />
        <polygon points="100,62 138,128 62,128" fill="none" stroke="#fff" strokeOpacity="0.12" />
      </svg>
    </div>
  );
}

function useIsSmall() {
  const [small, setSmall] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setSmall(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return small;
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const small = useIsSmall();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  // Each layer moves at its own depth. Reduced motion pins them all.
  const k = reduce ? 0 : 1;
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 60 * k]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -90 * k]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1 - 0.12 * k]);
  const notesY = useTransform(scrollYProgress, [0, 1], [0, -220 * k]);
  const headY = useTransform(scrollYProgress, [0, 1], [0, 140 * k]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[680px] overflow-hidden bg-void"
      aria-labelledby="hero-title"
    >
      <motion.div className="grid-space absolute inset-0" style={{ y: gridY }} aria-hidden />

      <motion.div
        className="absolute inset-0"
        style={{ y: sceneY, scale: sceneScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.2, ease: EASE, delay: 0.2 }}
      >
        <Suspense fallback={<SceneFallback />}>
          <HeroScene progress={scrollYProgress} low={small} still={reduce} />
        </Suspense>
      </motion.div>

      <motion.div className="absolute inset-0 hidden md:block" style={{ y: notesY, opacity: fade }}>
        <HeroAnnotations />
      </motion.div>

      {/* Legibility: darken behind the type without a visible panel. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,rgba(5,5,5,0.92),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent"
        aria-hidden
      />

      <motion.div
        className="shell relative flex h-full flex-col pb-10 pt-28 sm:pb-14"
        style={{ y: headY, opacity: fade }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          <Label tone="ember" live>
            Private auctions
          </Label>
          <Label className="hidden sm:inline-flex">Midnight network</Label>
        </motion.div>

        <div className="mt-auto">
          <RevealText
            id="hero-title"
            as="h1"
            immediate
            delay={0.25}
            lines={['See the price.', 'Not the bidder.']}
            lineClassName={['', 'text-white/40']}
            className="text-hero font-medium"
          />
          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,460px)_1fr] md:items-end">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 1.0 }}
              className="text-[18px] leading-[1.5] text-white/72 sm:text-[20px]"
            >
              Private auctions where competition stays visible, but individual bidders stay private.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 1.12 }}
              className="flex flex-wrap items-center gap-3 md:justify-end"
            >
              <Link to="/explore" className="btn-primary">
                Explore auctions <ArrowRight size={16} className="arrow" aria-hidden />
              </Link>
              <Link to="/create" className="btn-secondary">
                Create an auction
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-10 flex items-center justify-between border-t border-white/8 pt-5"
          >
            <Label>Powered by Midnight</Label>
            <Label className="hidden sm:inline-flex">Scroll</Label>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
