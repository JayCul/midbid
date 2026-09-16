import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Appear, RevealText } from '../components/primitives';

/** A slow wireframe icosahedron: the hero object, seen again from further away. */
function Sculpture() {
  const v = [
    [0, 1, 1.618],
    [0, -1, 1.618],
    [0, 1, -1.618],
    [0, -1, -1.618],
    [1, 1.618, 0],
    [-1, 1.618, 0],
    [1, -1.618, 0],
    [-1, -1.618, 0],
    [1.618, 0, 1],
    [-1.618, 0, 1],
    [1.618, 0, -1],
    [-1.618, 0, -1],
  ];
  const edges: [number, number][] = [];
  for (let i = 0; i < v.length; i += 1)
    for (let j = i + 1; j < v.length; j += 1) {
      const d = Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]);
      if (Math.abs(d - 2) < 0.01) edges.push([i, j]);
    }
  // A fixed oblique projection; the whole drawing rotates in CSS.
  const p = (x: number, y: number, z: number) => [
    100 + (x * 0.9 + z * 0.35) * 40,
    100 + (y * 0.9 - z * 0.3) * 40,
  ];
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      {edges.map(([a, b], i) => {
        const [x1, y1] = p(...(v[a] as [number, number, number]));
        const [x2, y2] = p(...(v[b] as [number, number, number]));
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={i % 7 === 0 ? '#FF8A00' : '#fff'}
            strokeOpacity={i % 7 === 0 ? 0.55 : 0.12}
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}

export function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotate = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -25, reduce ? 0 : 35]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [reduce ? 1 : 0.8, 1]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-t border-white/8 py-40 sm:py-56"
      aria-labelledby="cta-title"
    >
      <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
        <div className="ember-haze col-start-1 row-start-1 h-[80vmin] w-[80vmin]" />
        <motion.div
          className="col-start-1 row-start-1 h-[70vmin] w-[70vmin]"
          style={{ rotate, scale }}
        >
          <div className="spin-slow h-full w-full">
            <Sculpture />
          </div>
        </motion.div>
      </div>
      <div className="grid-space pointer-events-none absolute inset-0 opacity-50" aria-hidden />

      <div className="shell relative text-center">
        <RevealText
          id="cta-title"
          lines={['Ready to make', 'your bid?']}
          className="mx-auto text-display sm:text-[clamp(3rem,8vw,7.5rem)]"
        />
        <Appear delay={0.2}>
          <p className="mx-auto mt-8 max-w-md text-[20px] leading-snug text-white/72">
            Enter the marketplace where the price can speak for itself.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link to="/explore" className="btn-primary">
              Explore auctions <ArrowRight size={16} className="arrow" aria-hidden />
            </Link>
            <Link to="/create" className="btn-secondary">
              Create an auction
            </Link>
          </div>
        </Appear>
      </div>
    </section>
  );
}
