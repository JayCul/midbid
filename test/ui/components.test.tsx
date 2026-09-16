// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuctionTile } from '../../src/components/AuctionTile';
import { Countdown, PrivateBidder } from '../../src/components/primitives';
import { ReceiptLine } from '../../src/components/AppBits';
import { showcaseAuctions } from '../../src/data/showcase';
import { clockParts, formatClock, lotFromAddress, maskAddress } from '../../src/lib/auction/view';

afterEach(cleanup);

// IntersectionObserver is not in jsdom; framer-motion's whileInView needs it.
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).IntersectionObserver = IO;

describe('AuctionTile', () => {
  it('shows the price and never a bidder identity', () => {
    const a = showcaseAuctions()[0];
    const { container } = render(
      <MemoryRouter>
        <AuctionTile auction={a} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Limited Digital Artifact')).toBeTruthy();
    expect(screen.getByText('4,280')).toBeTruthy();
    expect(screen.getByText('Bidder private')).toBeTruthy();
    expect(container.textContent).not.toMatch(/0x[0-9a-f]{4}/i);
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/auction/demo-042');
  });
});

describe('privacy-safe display', () => {
  it('masks a wallet address to its last four characters', () => {
    expect(maskAddress('mn_shield-addr_preprod1kxmx7abcd8a21')).toBe('mn••••••8A21');
    expect(maskAddress('0x1234567890ab8a21')).toBe('0x••••••8A21');
    expect(maskAddress(null)).toBe('');
  });

  it('renders a private bidder as a redaction, not a name', () => {
    const { container } = render(<PrivateBidder />);
    expect(container.querySelector('.redacted')).toBeTruthy();
  });

  it('shows no identifier for a demo receipt', () => {
    const { container } = render(<ReceiptLine receipt={{ kind: 'demo' }} />);
    expect(container.textContent).toMatch(/no transaction created/);
  });
});

describe('time', () => {
  it('formats a live countdown', () => {
    expect(formatClock(2 * 3600 + 14 * 60 + 38)).toBe('02:14:38');
    expect(formatClock(90061)).toBe('1d 01:01:01');
    expect(clockParts(-5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('counts down from a contract end time', () => {
    render(<Countdown endsAt={Math.floor(Date.now() / 1000) + 125} />);
    expect(screen.getByText(/00:02:0[45]/)).toBeTruthy();
  });

  it('derives stable lot numbers from addresses', () => {
    expect(lotFromAddress('ab'.repeat(32))).toMatch(/^\d{3}$/);
    expect(lotFromAddress('ab'.repeat(32))).toBe(lotFromAddress('ab'.repeat(32)));
  });
});
