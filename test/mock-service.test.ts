// The demo market must behave like the contract and must never invent a transaction.
import { describe, expect, it } from 'vitest';
import { MockAuctionService } from '../src/services/mock/MockAuctionService';
import { showcaseAuctions } from '../src/data/showcase';
import { phaseOf } from '../src/lib/auction/view';

const NOW = 1_800_000_000;
const service = () => new MockAuctionService({ now: () => NOW });

describe('showcase data', () => {
  it('has at least six auctions across every category, all with private bidders', () => {
    const list = showcaseAuctions(NOW);
    expect(list.length).toBeGreaterThanOrEqual(6);
    expect(new Set(list.map((a) => a.category)).size).toBe(6);
    for (const a of list) {
      expect(a.bidderPrivacy).toBe('private');
      expect(a.source).toBe('demo');
      expect(JSON.stringify(a, (_k, v) => (typeof v === 'bigint' ? String(v) : v))).not.toMatch(
        /0x[0-9a-f]{6,}|@\w+/i,
      );
    }
  });
});

describe('MockAuctionService', () => {
  it('applies the contract minimum and increment', async () => {
    const s = service();
    const a = await s.getAuction('demo-042');
    await expect(s.placePrivateBid(a.id, a.highBid + 1n)).rejects.toThrow(/minimum bid/);
    const receipt = await s.placePrivateBid(a.id, a.highBid + a.minIncrement);
    expect(receipt).toEqual({ kind: 'demo' });
    expect((await s.getAuction(a.id)).highBid).toBe(a.highBid + a.minIncrement);
  });

  it('never returns a transaction identifier', async () => {
    const s = service();
    const a = await s.getAuction('demo-088');
    const receipt = await s.placePrivateBid(a.id, a.highBid + a.minIncrement);
    expect(receipt).not.toHaveProperty('txId');
    expect(receipt).not.toHaveProperty('txHash');
  });

  it('tracks this device’s position privately', async () => {
    const s = service();
    expect(await s.getPosition('demo-017')).toBeNull();
    const a = await s.getAuction('demo-017');
    await s.placePrivateBid(a.id, a.highBid + a.minIncrement);
    expect(await s.getPosition(a.id)).toMatchObject({ leading: true, isSeller: false });
  });

  it('creates an auction with the same validation as a deploy', async () => {
    const s = service();
    const input = {
      title: 'Test lot',
      description: '',
      category: 'Art' as const,
      imageUrl: '',
      startingBid: '50',
      minIncrement: '5',
      durationSeconds: 3600,
    };
    await expect(s.createAuction({ ...input, startingBid: '0' })).rejects.toThrow(/above zero/);
    const { id, receipt } = await s.createAuction(input);
    expect(receipt.kind).toBe('demo');
    const a = await s.getAuction(id);
    expect(phaseOf(a, NOW)).toBe('ACTIVE');
    expect((await s.getPosition(id))?.isSeller).toBe(true);
    await s.cancelAuction(id);
    expect((await s.getAuction(id)).storedStatus).toBe('CANCELLED');
  });

  it('refuses bids on ended auctions', async () => {
    const s = service();
    await expect(s.placePrivateBid('demo-031', 999999n)).rejects.toThrow(/no longer taking bids/);
  });
});
