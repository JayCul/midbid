// Shared building blocks: logo, labels, reveal text, animated numbers, countdown.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatClock, formatNumber, PHASE_LABEL } from '../lib/auction/view';
import { useCountdown } from '../hooks/useTime';
import type { AuctionPhase } from '../types/auction';

export const EASE = [0.16, 1, 0.3, 1] as const;

// ------------------------------------------------------------------ logo ---

/** The MidBid mark: a folded M over a gavel. */
export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 58) / 64)}
      viewBox="0 0 64 58"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="mb-ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB347" />
          <stop offset="0.5" stopColor="#FF8A00" />
          <stop offset="1" stopColor="#E86F00" />
        </linearGradient>
      </defs>
      <path
        fill="url(#mb-ember)"
        d="M4 50V11c0-5 5-7.5 9-4.6L32 20.5 51 6.4C55 3.5 60 6 60 11v39l-9-6.5V21.5L32 32 13 21.5v22Z"
      />
      <path fill="#000" fillOpacity=".22" d="M13 21.5 32 32v5.5L13 27Z" />
      <g fill="url(#mb-ember)" stroke="#050505" strokeWidth="1.6" paintOrder="stroke">
        <rect x="30.6" y="41" width="3" height="13" rx="1.5" transform="rotate(-45 32.1 47.5)" />
        <rect x="20.5" y="36.5" width="12" height="6" rx="1.5" transform="rotate(-45 26.5 39.5)" />
      </g>
      <rect x="17" y="53.5" width="17" height="3" rx="1.5" fill="url(#mb-ember)" />
    </svg>
  );
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-[19px] font-semibold tracking-[-0.03em]">
        Mid<span className="text-ember">Bid</span>
      </span>
    </span>
  );
}

// ---------------------------------------------------------------- labels ---

export function Label({
  children,
  live = false,
  tone = 'muted',
  className = '',
}: {
  children: ReactNode;
  live?: boolean;
  tone?: 'muted' | 'ember' | 'bright';
  className?: string;
}) {
  const color =
    tone === 'ember' ? 'text-ember' : tone === 'bright' ? 'text-white/72' : 'text-white/48';
  return (
    <span className={`label inline-flex items-center gap-2 ${color} ${className}`}>
      {live && <span className="pulse-dot" aria-hidden />}
      {children}
    </span>
  );
}

export function PhaseLabel({ phase }: { phase: AuctionPhase }) {
  const live = phase === 'ACTIVE';
  return (
    <Label live={live} tone={live ? 'ember' : 'muted'}>
      {PHASE_LABEL[phase]}
    </Label>
  );
}

/** A bidder, as MidBid shows one: never a name or an address. */
export function PrivateBidder({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="redacted" style={{ width: compact ? 36 : 56 }} aria-hidden />
      <span className="label text-white/72">Bidder private</span>
    </span>
  );
}

// ---------------------------------------------------------------- motion ---

/**
 * Reveals text word by word, line by line. Pass lines as an array so the break
 * points are part of the design, not the viewport.
 */
export function RevealText({
  lines,
  id,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  lineClassName = [],
  immediate = false,
}: {
  lines: string[];
  id?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  delay?: number;
  lineClassName?: string[];
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const show = immediate || inView;
  let index = 0;
  return (
    <Tag ref={ref} id={id} className={className} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span key={li} className={`block ${lineClassName[li] ?? ''}`} aria-hidden>
          {line.split(' ').map((word, wi) => {
            const i = index++;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={reduce ? false : { y: '105%', opacity: 0 }}
                  animate={show || reduce ? { y: '0%', opacity: 1 } : undefined}
                  transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.06 }}
                >
                  {word}
                  {wi < line.split(' ').length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/** Fades and lifts children in when they enter the viewport. */
export function Appear({
  children,
  delay = 0,
  y = 30,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Counts between values when a bid changes, and flashes ember on increase. */
export function AnimatedAmount({
  value,
  className = '',
}: {
  value: bigint | number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const target = Number(value);
  const [shown, setShown] = useState(target);
  const [flash, setFlash] = useState(false);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;
    if (reduce) {
      setShown(target);
      return;
    }
    if (target > from) {
      setFlash(true);
      setTimeout(() => setFlash(false), 900);
    }
    const controls = animate(from, target, {
      duration: 0.8,
      ease: EASE,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, reduce]);

  return (
    <span
      className={`num transition-colors duration-700 ${flash ? 'text-ember' : ''} ${className}`}
      aria-live="polite"
    >
      {formatNumber(shown)}
    </span>
  );
}

/** A real countdown to a contract end time. */
export function Countdown({
  endsAt,
  className = '',
  endedText = 'Ended',
}: {
  endsAt: bigint | number;
  className?: string;
  endedText?: string;
}) {
  const left = useCountdown(endsAt);
  return (
    <span className={`num ${left > 0 && left < 300 ? 'text-ember' : ''} ${className}`}>
      {left > 0 ? formatClock(left) : endedText}
    </span>
  );
}

// --------------------------------------------------------------- actions ---

export function ArrowLink({
  to,
  children,
  className = '',
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={`btn-quiet ${className}`}>
      {children}
      <ArrowRight size={15} className="arrow" aria-hidden />
    </Link>
  );
}

export function Amount({
  value,
  animated = false,
  className = '',
  unitClassName = '',
}: {
  value: bigint | number;
  animated?: boolean;
  className?: string;
  unitClassName?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      {animated ? (
        <AnimatedAmount value={value} />
      ) : (
        <span className="num">{formatNumber(value)}</span>
      )}
      <span className={`label ${unitClassName}`}>tNIGHT</span>
    </span>
  );
}
