import { describe, expect, it } from 'vitest';
import {
  bidProblem,
  buildMetadata,
  buildTerms,
  deriveStatus,
  formatDuration,
  minimumNextBid,
  parseMetadata,
} from '../src/lib/auction/model.js';

const NOW = 1_800_000_000;
const auction = (over = {}) => ({
  status: 0,
  startsAt: BigInt(NOW - 60),
  endsAt: BigInt(NOW + 600),
  bidCount: 0n,
  highBid: 0n,
  startingBid: 100n,
  minIncrement: 10n,
  ...over,
});

describe('lifecycle', () => {
  it('reads an open auction against the clock', () => {
    expect(deriveStatus(auction({ startsAt: BigInt(NOW + 1) }), NOW)).toBe('SCHEDULED');
    expect(deriveStatus(auction(), NOW)).toBe('ACTIVE');
    expect(deriveStatus(auction(), NOW + 600)).toBe('ENDED');
  });

  it('maps stored terminal states directly', () => {
    expect(deriveStatus(auction({ status: 1 }), NOW)).toBe('CANCELLED');
    expect(deriveStatus(auction({ status: 2 }), NOW)).toBe('UNSOLD');
    expect(deriveStatus(auction({ status: 3 }), NOW)).toBe('SETTLING');
    expect(deriveStatus(auction({ status: 4 }), NOW)).toBe('SETTLED');
  });
});

describe('bid checks mirror the circuit', () => {
  it('uses the starting bid first, then high bid plus increment', () => {
    expect(minimumNextBid(auction())).toBe(100n);
    expect(minimumNextBid(auction({ bidCount: 2n, highBid: 150n }))).toBe(160n);
  });

  it('explains each rejection before the wallet is involved', () => {
    expect(bidProblem(auction(), 99n, NOW)).toMatch(/minimum bid is 100/);
    expect(bidProblem(auction(), 100n, NOW)).toBeNull();
    expect(bidProblem(auction(), 100n, NOW + 600)).toMatch(/no longer taking bids/);
    expect(bidProblem(auction({ startsAt: BigInt(NOW + 5) }), 100n, NOW)).toMatch(/not started/);
    expect(bidProblem(auction(), 'abc', NOW)).toMatch(/whole number/);
    expect(bidProblem(auction(), 2n ** 64n, NOW)).toMatch(/too large/);
  });
});

describe('create form', () => {
  it('builds contract terms in seconds', () => {
    const t = buildTerms({ startingBid: '50', minIncrement: '5', durationSeconds: 3600 }, NOW);
    expect(t).toEqual({ startingBid: 50n, minIncrement: 5n, startsAt: BigInt(NOW), endsAt: BigInt(NOW + 3600) });
  });

  it('rejects terms the contract would refuse', () => {
    expect(() => buildTerms({ startingBid: '0', minIncrement: '5', durationSeconds: 3600 })).toThrow(/above zero/);
    expect(() => buildTerms({ startingBid: '1.5', minIncrement: '5', durationSeconds: 3600 })).toThrow(/whole number/);
    expect(() => buildTerms({ startingBid: '5', minIncrement: '5', durationSeconds: 60 })).toThrow(/at least 5 minutes/);
  });

  it('keeps metadata to public listing fields and validates them', () => {
    const json = buildMetadata({ title: '  Rare print ', category: 'Art', imageUrl: 'https://x.test/a.png' });
    expect(JSON.parse(json)).toMatchObject({ title: 'Rare print', category: 'Art', settlement: 'manual' });
    expect(() => buildMetadata({ title: '' })).toThrow(/title/);
    expect(() => buildMetadata({ title: 'x', imageUrl: 'http://insecure' })).toThrow(/https/);
  });

  it('reads untrusted metadata defensively', () => {
    expect(parseMetadata('not json').title).toBe('Untitled auction');
    expect(parseMetadata(JSON.stringify({ title: 'Ok', imageUrl: 'javascript:alert(1)' })).imageUrl).toBe('');
  });
});

describe('formatting', () => {
  it('formats countdowns compactly', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(59)).toBe('59s');
    expect(formatDuration(125)).toBe('2m 05s');
    expect(formatDuration(3 * 3600 + 120)).toBe('3h 2m');
    expect(formatDuration(2 * 86400 + 3600)).toBe('2d 1h');
  });
});
