import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Appear, Label, RevealText } from '../components/primitives';

const PILLARS = [
  {
    label: 'Zero-knowledge proofs',
    body: 'A bid proves it follows the rules without showing who made it.',
  },
  { label: 'Private state', body: 'Your bidder secret stays encrypted on your device.' },
  {
    label: 'Selective disclosure',
    body: 'Only the price becomes public. Everything else is your call.',
  },
  { label: 'Verifiable results', body: 'Anyone can check the winning bid met every rule.' },
];

/** Nodes and links with ember pulses. 2D canvas, paused when off screen. */
function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let w = 0;
    let h = 0;
    const nodes = Array.from({ length: 34 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.00012,
    }));
    const pulses: { a: number; b: number; t: number }[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const links = () => {
      const out: [number, number, number][] = [];
      for (let i = 0; i < nodes.length; i += 1)
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = (nodes[i].x - nodes[j].x) * w;
          const dy = (nodes[i].y - nodes[j].y) * h;
          const d = Math.hypot(dx, dy);
          if (d < 150) out.push([i, j, d]);
        }
      return out;
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      }
      const ls = links();
      for (const [i, j, d] of ls) {
        ctx.strokeStyle = `rgba(255,255,255,${0.1 * (1 - d / 150)})`;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
        ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
        ctx.stroke();
      }
      if (ls.length && Math.random() < 0.03 && pulses.length < 6) {
        const [a, b] = ls[Math.floor(Math.random() * ls.length)];
        pulses.push({ a, b, t: 0 });
      }
      for (let k = pulses.length - 1; k >= 0; k -= 1) {
        const p = pulses[k];
        p.t += dt * 0.0006;
        if (p.t >= 1) {
          pulses.splice(k, 1);
          continue;
        }
        const x = (nodes[p.a].x + (nodes[p.b].x - nodes[p.a].x) * p.t) * w;
        const y = (nodes[p.a].y + (nodes[p.b].y - nodes[p.a].y) * p.t) * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
        g.addColorStop(0, 'rgba(255,138,0,0.9)');
        g.addColorStop(1, 'rgba(255,138,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 10, y - 10, 20, 20);
      }
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(n.x * w - 1, n.y * h - 1, 2, 2);
      }
    };

    let raf = 0;
    let last = performance.now();
    let running = false;
    const loop = (t: number) => {
      draw(Math.min(48, t - last));
      last = t;
      raf = requestAnimationFrame(loop);
    };
    if (reduce) draw(0);
    const io = new IntersectionObserver(([e]) => {
      if (reduce) return;
      if (e.isIntersecting && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else if (!e.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [reduce]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function MidnightTech() {
  return (
    <section
      className="relative overflow-hidden border-t border-white/8 py-28 sm:py-40"
      aria-labelledby="midnight-title"
    >
      <div className="shell grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Label tone="ember">Midnight</Label>
          <RevealText
            id="midnight-title"
            lines={['Privacy, built', 'into the auction.']}
            className="mt-6 text-display"
          />
          <Appear delay={0.15}>
            <p className="mt-8 max-w-lg text-[19px] leading-relaxed text-white/72">
              MidBid uses Midnight&apos;s programmable privacy to keep sensitive auction activity
              private while still allowing the network to verify the rules.
            </p>
          </Appear>
        </div>
        <div className="relative min-h-[320px] border border-white/8 lg:col-span-6" aria-hidden>
          <NetworkCanvas />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,transparent,rgba(5,5,5,0.85))]" />
        </div>
      </div>
      <div className="shell mt-20">
        <ul className="grid border-t border-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <li
              key={p.label}
              className={`py-8 sm:pr-8 ${i > 0 ? 'lg:border-l lg:border-white/8 lg:pl-8' : ''}`}
            >
              <Appear delay={i * 0.1}>
                <span className="label-ember">{p.label}</span>
                <p className="mt-4 text-[16px] leading-relaxed text-white/48">{p.body}</p>
              </Appear>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
