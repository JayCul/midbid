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

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="mb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor="rgb(var(--accent-2))" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="none" stroke="url(#mb-g)" strokeWidth="6" />
      <path d="M32 10a22 22 0 0 1 0 44a14 22 0 0 0 0-44z" fill="url(#mb-g)" />
    </svg>
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
