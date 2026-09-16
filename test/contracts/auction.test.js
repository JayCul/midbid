import { describe, expect, it } from 'vitest';
import { pureCircuits } from '../../managed/auction/contract/index.js';
import { AuctionSimulator, RegistrySimulator, Status, T0, bytes32 } from './simulator.js';

const alice = bytes32('alice');
const bob = bytes32('bob');
const mallory = bytes32('mallory');
const END = T0 + 3600;

const hex = (bytes) => Buffer.from(bytes).toString('hex');

describe('auction terms', () => {
  it('publishes the terms every bidder bids under', () => {
    const l = new AuctionSimulator().ledger;
    expect(l.startingBid).toBe(100n);
    expect(l.minIncrement).toBe(10n);
    expect(l.startsAt).toBe(BigInt(T0));
    expect(l.endsAt).toBe(BigInt(END));
    expect(JSON.parse(l.metadata)).toEqual({ title: 'Test lot' });
    expect(l.circuitCommitment).toEqual(bytes32('circuits'));
  });

  it('opens with no bids and stores only a hash of the seller secret', () => {
    const sim = new AuctionSimulator();
    const l = sim.ledger;
    expect(l.status).toBe(Status.OPEN);
    expect(l.highBid).toBe(0n);
    expect(l.bidCount).toBe(0n);
    expect(l.sellerKey).toEqual(pureCircuits.sellerPublicKey(sim.sellerSecret));
    expect(hex(l.sellerKey)).not.toBe(hex(sim.sellerSecret));
  });

  it('rejects terms that make no sense', () => {
    expect(() => new AuctionSimulator({ startingBid: 0n })).toThrow(
      /starting bid must be above zero/,
    );
    expect(() => new AuctionSimulator({ minIncrement: 0n })).toThrow(/minimum increment/);
    expect(() => new AuctionSimulator({ endsAt: BigInt(T0) })).toThrow(
      /must end after it starts/,
    );
  });
});

describe('bidding', () => {
  it('accepts a first bid at the starting bid and makes it the public price', () => {
    const l = new AuctionSimulator().bid(alice, 100n);
    expect(l.highBid).toBe(100n);
    expect(l.bidCount).toBe(1n);
  });

  it('rejects a first bid below the starting bid', () => {
    const sim = new AuctionSimulator();
    expect(() => sim.bid(alice, 99n)).toThrow(/bid is below the minimum/);
    expect(sim.ledger.bidCount).toBe(0n);
  });

  it('requires later bids to beat the high bid by the increment', () => {
    const sim = new AuctionSimulator();
    sim.bid(alice, 100n);
    expect(() => sim.bid(bob, 109n)).toThrow(/bid is below the minimum/);
    expect(sim.bid(bob, 110n).highBid).toBe(110n);
  });

  it('never writes the bidder secret, and never repeats a leader commitment', () => {
    const sim = new AuctionSimulator();
    const first = sim.bid(alice, 100n, bytes32('n1')).leader;
    const second = sim.bid(alice, 120n, bytes32('n2')).leader;
    expect(hex(first)).not.toBe(hex(second));
    expect(first).toEqual(pureCircuits.leaderCommitment(alice, bytes32('n1')));
    const l = sim.ledger;
    for (const value of [l.leader, l.sellerKey, l.circuitCommitment]) {
      expect(hex(value)).not.toBe(hex(alice));
    }
  });

  it('refuses bids before the auction starts', () => {
    const sim = new AuctionSimulator({ startsAt: BigInt(T0 + 600) });
    expect(() => sim.bid(alice, 100n)).toThrow(/auction has not started/);
    expect(sim.at(T0 + 600).bid(alice, 100n).bidCount).toBe(1n);
  });

  it('refuses bids once block time reaches the end', () => {
    const sim = new AuctionSimulator().at(END);
    expect(() => sim.bid(alice, 100n)).toThrow(/auction has ended/);
  });
});

describe('ending and winning', () => {
  const withBids = () => {
    const sim = new AuctionSimulator();
    sim.bid(alice, 100n, bytes32('a1'));
    sim.bid(bob, 150n, bytes32('b1'));
    return sim;
  };

  it('lets the leader claim after the end by opening their commitment', () => {
    const sim = withBids().at(END);
    expect(sim.claimWin(bob, bytes32('b1')).status).toBe(Status.WON);
  });

  it('refuses a claim before the end', () => {
    expect(() => withBids().claimWin(bob, bytes32('b1'))).toThrow(/auction has not ended/);
  });

  it('refuses a claim from an outbid bidder', () => {
    expect(() => withBids().at(END).claimWin(alice, bytes32('a1'))).toThrow(
      /not the winning bid/,
    );
  });

  it('refuses a claim from someone who knows the nonce but not the secret', () => {
    expect(() => withBids().at(END).claimWin(mallory, bytes32('b1'))).toThrow(
      /not the winning bid/,
    );
  });

  it('refuses a second claim once won', () => {
    const sim = withBids().at(END);
    sim.claimWin(bob, bytes32('b1'));
    expect(() => sim.claimWin(bob, bytes32('b1'))).toThrow(/auction is not open/);
  });

  it('records an unsold auction only when nobody bid, and only after the end', () => {
    expect(new AuctionSimulator().at(END).closeUnsold().status).toBe(Status.UNSOLD);
    expect(() => withBids().at(END).closeUnsold()).toThrow(/auction has bids/);
    expect(() => new AuctionSimulator().closeUnsold()).toThrow(/auction has not ended/);
  });
});

describe('seller actions', () => {
  it('lets the seller settle once the winner has claimed', () => {
    const sim = new AuctionSimulator();
    sim.bid(bob, 100n, bytes32('b1'));
    sim.at(END).claimWin(bob, bytes32('b1'));
    expect(sim.settle().status).toBe(Status.SETTLED);
  });

  it('refuses settlement before a claim, or by anyone but the seller', () => {
    const sim = new AuctionSimulator();
    sim.bid(bob, 100n, bytes32('b1'));
    sim.at(END);
    expect(() => sim.settle()).toThrow(/no claimed winner/);
    sim.claimWin(bob, bytes32('b1'));
    expect(() => sim.settle(mallory)).toThrow(/only the seller can settle/);
  });

  it('lets the seller cancel before any bid', () => {
    expect(new AuctionSimulator().cancel().status).toBe(Status.CANCELLED);
  });

  it('refuses cancellation after a bid, after the end, or by anyone else', () => {
    const withBid = new AuctionSimulator();
    withBid.bid(alice, 100n);
    expect(() => withBid.cancel()).toThrow(/cannot cancel after a bid/);
    expect(() => new AuctionSimulator().at(END).cancel()).toThrow(/auction has ended/);
    expect(() => new AuctionSimulator().cancel(mallory)).toThrow(/only the seller can cancel/);
  });

  it('closes every circuit once cancelled', () => {
    const sim = new AuctionSimulator();
    sim.cancel();
    expect(() => sim.bid(alice, 100n)).toThrow(/auction is not open/);
    expect(() => sim.cancel()).toThrow(/auction is not open/);
  });
});

describe('registry', () => {
  it('lists an auction address once', () => {
    const reg = new RegistrySimulator();
    const address = bytes32('auction-1');
    const l = reg.list(address);
    expect(l.listingCount).toBe(1n);
    expect(l.listings.member(address)).toBe(true);
    expect(() => reg.list(address)).toThrow(/auction already listed/);
  });
});
