// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AuctionCard } from '../../src/ui/components/AuctionCard';
import { Countdown, StatusBadge, TxRef } from '../../src/ui/components/bits';
import { parseRoute } from '../../src/ui/hooks';

afterEach(cleanup);

const NOW = 1_800_000_000;
const auction = (over = {}) => ({
  address: 'ab'.repeat(32),
  metadata: { title: 'Moon print', description: '', category: 'Art', imageUrl: '' },
  startingBid: 100n,
  minIncrement: 10n,
  startsAt: BigInt(NOW - 60),
  endsAt: BigInt(NOW + 125),
  highBid: 0n,
  bidCount: 0n,
  phase: 'ACTIVE',
  ...over,
});

describe('AuctionCard', () => {
  it('shows the starting bid before any bid, and never a bidder', () => {
    render(<AuctionCard auction={auction()} now={NOW} />);
    expect(screen.getByText('Starting bid')).toBeTruthy();
    expect(screen.getByText('100 tNIGHT')).toBeTruthy();
    expect(screen.getByText(/0 private bids/)).toBeTruthy();
  });

  it('shows the public high bid and the next minimum once bids exist', () => {
    render(<AuctionCard auction={auction({ bidCount: 2n, highBid: 150n })} now={NOW} />);
    expect(screen.getByText('High bid')).toBeTruthy();
    expect(screen.getByText('150 tNIGHT')).toBeTruthy();
    expect(screen.getByText(/Next bid from 160 tNIGHT/)).toBeTruthy();
  });

  it('links to the auction page by contract address', () => {
    const { container } = render(<AuctionCard auction={auction()} now={NOW} />);
    expect(container.querySelector('a')?.getAttribute('href')).toBe(`#/auction/${'ab'.repeat(32)}`);
  });
});

describe('status and time', () => {
  it('labels each lifecycle phase', () => {
    render(<StatusBadge phase="SETTLING" />);
    expect(screen.getByText('Winner claimed')).toBeTruthy();
  });

  it('counts down from the contract end time', () => {
    render(<Countdown auction={auction()} now={NOW} />);
    expect(screen.getByText('2m 05s left')).toBeTruthy();
  });

  it('renders nothing rather than a placeholder when there is no transaction id', () => {
    const { container } = render(<TxRef tx={{}} />);
    expect(container.textContent).toBe('');
  });
});

describe('routes', () => {
  it('parses deep links', () => {
    expect(parseRoute('#/auction/ABCD')).toEqual({ page: 'auction', address: 'abcd' });
    expect(parseRoute('#/browse')).toEqual({ page: 'browse' });
    expect(parseRoute('')).toEqual({ page: 'home' });
  });
});
