// Presentation helpers shared by every screen.
import type { Auction, AuctionPhase } from '../../types/auction';
import { deriveStatus, minimumNextBid } from './model.js';

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export const phaseOf = (a: Auction, now = nowSeconds()): AuctionPhase =>
  deriveStatus(
    { status: a.storedStatus, startsAt: a.startsAt, endsAt: a.endsAt },
    now,
  ) as AuctionPhase;

export const nextMinimum = (a: Auction): bigint =>
  minimumNextBid({
    bidCount: a.bidCount,
    highBid: a.highBid,
    startingBid: a.startingBid,
    minIncrement: a.minIncrement,
  });

/** The price to show: the high bid once there is one, otherwise the starting bid. */
export const displayPrice = (a: Auction): bigint => (a.bidCount > 0n ? a.highBid : a.startingBid);

export const formatNumber = (value: bigint | number) => BigInt(value).toLocaleString('en-US');

/** A stable three-digit lot label from a contract address. */
export function lotFromAddress(address: string): string {
  const n = parseInt(address.slice(0, 8), 16) % 1000;
  return n.toString().padStart(3, '0');
}

/** A stable visual seed from an id. */
export function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Shows only the last four characters of an address: `mn••••••8A21`. */
export function maskAddress(address: string | null | undefined): string {
  if (!address) return '';
  const prefix = address.startsWith('0x') ? '0x' : address.slice(0, 2);
  return `${prefix}••••••${address.slice(-4).toUpperCase()}`;
}

export const PHASE_LABEL: Record<AuctionPhase, string> = {
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  ENDED: 'Ended',
  SETTLING: 'Winner claimed',
  SETTLED: 'Settled',
  CANCELLED: 'Cancelled',
  UNSOLD: 'Unsold',
};

/** Splits seconds into clock parts for the countdown. */
export function clockParts(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function formatClock(seconds: number): string {
  const { days, hours, minutes, seconds: secs } = clockParts(seconds);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hms = `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  return days > 0 ? `${days}d ${hms}` : hms;
}
