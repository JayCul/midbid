// Small shared pieces: status badge, countdown, addresses, transaction refs.
import { useState } from 'react';
import { Check, Copy, Moon, Sun } from 'lucide-react';
import { formatDuration, secondsLeft } from '../../lib/auction/model.js';
import type { Theme } from '../useTheme';

const BADGE: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Draft', tone: 'text-muted border-line' },
  SCHEDULED: { label: 'Scheduled', tone: 'text-accent-2 border-accent-2/40' },
  ACTIVE: { label: 'Live', tone: 'text-good border-good/40' },
  ENDED: { label: 'Ended', tone: 'text-warn border-warn/40' },
  SETTLING: { label: 'Winner claimed', tone: 'text-accent border-accent/40' },
  SETTLED: { label: 'Settled', tone: 'text-muted border-line' },
  CANCELLED: { label: 'Cancelled', tone: 'text-bad border-bad/40' },
  UNSOLD: { label: 'Unsold', tone: 'text-muted border-line' },
};

export function StatusBadge({ phase }: { phase: string }) {
  const b = BADGE[phase] ?? { label: phase, tone: 'text-muted border-line' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${b.tone}`}
    >
      {phase === 'ACTIVE' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
        </span>
      )}
      {b.label}
    </span>
  );
}

export function Countdown({
  auction,
  now,
  className = '',
}: {
  auction: { startsAt: bigint; endsAt: bigint; phase: string };
  now: number;
  className?: string;
}) {
  if (auction.phase === 'DRAFT') {
    const runs = Math.max(0, Number(auction.endsAt - auction.startsAt));
    return <span className={className}>Runs {formatDuration(runs)}</span>;
  }
  if (auction.phase === 'SCHEDULED') {
    const toStart = Math.max(0, Number(auction.startsAt) - now);
    return <span className={className}>Opens in {formatDuration(toStart)}</span>;
  }
  if (auction.phase !== 'ACTIVE') {
    return (
      <span className={className}>
        Ended {new Date(Number(auction.endsAt) * 1000).toLocaleString()}
      </span>
    );
  }
  const left = secondsLeft(auction, now);
  return (
    <span className={`${className} ${left < 300 ? 'text-warn' : ''}`} aria-live="off">
      {formatDuration(left)} left
    </span>
  );
}

export const short = (value: string, head = 6, tail = 4) =>
  value.length > head + tail + 3 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;

export function CopyValue({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* the value stays visible for manual copying */
    }
  };
  return (
    <button
      onClick={copy}
      title={value}
      aria-label={`Copy ${label ?? 'value'}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line px-2 py-1 font-mono text-xs text-muted transition hover:text-ink"
    >
      <span className="truncate">{short(value, 10, 6)}</span>
      {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
    </button>
  );
}

/** A real transaction identifier returned by the wallet. Never invented. */
export function TxRef({ tx }: { tx?: { txHash?: string; txId?: string } | null }) {
  const id = tx?.txHash ?? tx?.txId;
  if (!id) return null;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      Transaction <CopyValue value={String(id)} label="transaction id" />
    </span>
  );
}

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-muted transition hover:text-ink"
    >
      {theme === 'dark' ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
    </button>
  );
}

/** MidBid mark: a folded gold M over a gavel. Colours are the brand's, not theme tokens. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 58) / 64)}
      viewBox="0 0 64 58"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="mb-gold-ui" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE14D" />
          <stop offset="0.5" stopColor="#FFCC15" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        fill="url(#mb-gold-ui)"
        d="M4 50V11c0-5 5-7.5 9-4.6L32 20.5 51 6.4C55 3.5 60 6 60 11v39l-9-6.5V21.5L32 32 13 21.5v22Z"
      />
      <path fill="#000" fillOpacity=".2" d="M13 21.5 32 32v5.5L13 27Z" />
      <g fill="url(#mb-gold-ui)" stroke="rgb(var(--bg))" strokeWidth="1.6" paintOrder="stroke">
        <rect x="30.6" y="41" width="3" height="13" rx="1.5" transform="rotate(-45 32.1 47.5)" />
        <rect x="20.5" y="36.5" width="12" height="6" rx="1.5" transform="rotate(-45 26.5 39.5)" />
      </g>
      <rect x="17" y="53.5" width="17" height="3" rx="1.5" fill="url(#mb-gold-ui)" />
    </svg>
  );
}

/** Mark plus wordmark: "Mid" in ink, "Bid" in gold. */
export function Logo({ size = 30, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-xl font-bold tracking-tight">
        Mid<span className="text-gradient">Bid</span>
      </span>
    </span>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'bad' | 'good';
  children: React.ReactNode;
}) {
  const tones = {
    info: 'border-accent/30 bg-accent/5',
    warn: 'border-warn/40 bg-warn/5',
    bad: 'border-bad/40 bg-bad/5',
    good: 'border-good/40 bg-good/5',
  };
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}
      role="status"
    >
      {children}
    </div>
  );
}
