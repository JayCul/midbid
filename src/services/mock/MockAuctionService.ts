// The demo market. Runs entirely in memory so the site works with no wallet.
//
// It applies the same rules the contract enforces, using the same model
// functions, so the demo behaves like the real thing. It never produces a
// transaction identifier: every receipt is { kind: 'demo' }.
import type {
  Auction,
  AuctionResult,
  NewAuctionInput,
  Position,
  Receipt,
} from '../../types/auction';
import type { MarketService } from '../types';
import { showcaseAuctions } from '../../data/showcase';
import { bidProblem, buildMetadata, buildTerms } from '../../lib/auction/model.js';
import { nextMinimum, nowSeconds, phaseOf, seedFrom } from '../../lib/auction/view';

type Listener = () => void;

export class MockAuctionService implements MarketService {
  readonly source = 'demo' as const;
  private auctions = new Map<string, Auction>();
  private positions = new Map<string, Position & { leadingAmount: bigint | null }>();
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private counter = 200;

  constructor(
    private readonly options: {
      now?: () => number;
      simulateActivity?: boolean;
      latencyMs?: number;
    } = {},
  ) {
    for (const a of showcaseAuctions(this.now())) this.auctions.set(a.id, a);
  }

  private now() {
    return this.options.now ? this.options.now() : nowSeconds();
  }

  private async wait() {
    const ms = this.options.latencyMs ?? 0;
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
  }

  private require(id: string): Auction {
    const a = this.auctions.get(id);
    if (!a) throw new Error('That auction does not exist in the demo market.');
    return a;
  }

  /**
   * Other demo bidders, so prices move while someone watches. Off by default;
   * the demo provider turns it on. Clearly part of the demo, never live data.
   */
  startActivity(intervalMs = 9000) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const active = [...this.auctions.values()].filter((a) => phaseOf(a, this.now()) === 'ACTIVE');
      if (active.length === 0) return;
      const a = active[Math.floor(Math.random() * active.length)];
      const steps = BigInt(1 + Math.floor(Math.random() * 3));
      const amount = nextMinimum(a) + a.minIncrement * (steps - 1n);
      this.auctions.set(a.id, { ...a, highBid: amount, bidCount: a.bidCount + 1n });
      const pos = this.positions.get(a.id);
      if (pos) pos.leading = false;
      this.emit();
    }, intervalMs);
  }

  stopActivity() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  async listAuctions() {
    await this.wait();
    return [...this.auctions.values()];
  }

  async getAuction(id: string) {
    await this.wait();
    return this.require(id);
  }

  async getCurrentHighestBid(id: string) {
    return this.require(id).highBid;
  }

  async createAuction(input: NewAuctionInput) {
    await this.wait();
    // The same validation the Midnight path runs before deploying.
    const metadata = JSON.parse(buildMetadata(input));
    const terms = buildTerms(input, this.now());
    this.counter += 1;
    const id = `demo-${this.counter}`;
    const auction: Auction = {
      id,
      source: 'demo',
      lot: String(this.counter).padStart(3, '0'),
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      imageUrl: metadata.imageUrl,
      visualSeed: seedFrom(id),
      currency: 'tNIGHT',
      startingBid: terms.startingBid,
      minIncrement: terms.minIncrement,
      highBid: 0n,
      bidCount: 0n,
      startsAt: terms.startsAt,
      endsAt: terms.endsAt,
      storedStatus: 'OPEN',
      showHighBid: true,
      bidderPrivacy: 'private',
    };
    this.auctions.set(id, auction);
    this.positions.set(id, { isSeller: true, leading: false, bids: [], leadingAmount: null });
    this.emit();
    return { id, receipt: { kind: 'demo' } as Receipt };
  }

  async placePrivateBid(id: string, amount: bigint): Promise<Receipt> {
    await this.wait();
    const a = this.require(id);
    const problem = bidProblem(
      {
        status: a.storedStatus,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        bidCount: a.bidCount,
        highBid: a.highBid,
        startingBid: a.startingBid,
        minIncrement: a.minIncrement,
      },
      amount,
      this.now(),
    );
    if (problem) throw new Error(problem);
    this.auctions.set(id, { ...a, highBid: amount, bidCount: a.bidCount + 1n });
    const pos = this.positions.get(id) ?? {
      isSeller: false,
      leading: false,
      bids: [],
      leadingAmount: null,
    };
    pos.bids = [...pos.bids, { amount: String(amount), at: Date.now(), status: 'confirmed' }];
    pos.leading = true;
    pos.leadingAmount = amount;
    this.positions.set(id, pos);
    this.emit();
    return { kind: 'demo' };
  }

  async getPosition(id: string): Promise<Position | null> {
    const p = this.positions.get(id);
    return p ? { isSeller: p.isSeller, leading: p.leading, bids: p.bids } : null;
  }

  async finalizeAuction(id: string): Promise<Receipt> {
    await this.wait();
    const a = this.require(id);
    if (phaseOf(a, this.now()) !== 'ENDED') throw new Error('This auction has not ended.');
    if (a.bidCount === 0n) {
      this.auctions.set(id, { ...a, storedStatus: 'UNSOLD' });
    } else {
      if (!this.positions.get(id)?.leading)
        throw new Error('This device does not hold the winning bid.');
      this.auctions.set(id, { ...a, storedStatus: 'WON' });
    }
    this.emit();
    return { kind: 'demo' };
  }

  async getAuctionResult(id: string): Promise<AuctionResult> {
    const a = this.require(id);
    const phase = phaseOf(a, this.now());
    return {
      phase,
      winningBid: a.bidCount > 0n && phase !== 'ACTIVE' && phase !== 'SCHEDULED' ? a.highBid : null,
      claimed: a.storedStatus === 'WON' || a.storedStatus === 'SETTLED',
    };
  }

  async cancelAuction(id: string): Promise<Receipt> {
    const a = this.require(id);
    if (!this.positions.get(id)?.isSeller) throw new Error('Only the seller can cancel.');
    if (a.bidCount > 0n) throw new Error('An auction cannot be cancelled once someone has bid.');
    this.auctions.set(id, { ...a, storedStatus: 'CANCELLED' });
    this.emit();
    return { kind: 'demo' };
  }

  async settleAuction(id: string): Promise<Receipt> {
    const a = this.require(id);
    if (a.storedStatus !== 'WON') throw new Error('There is no claimed winner to settle with.');
    if (!this.positions.get(id)?.isSeller) throw new Error('Only the seller can settle.');
    this.auctions.set(id, { ...a, storedStatus: 'SETTLED' });
    this.emit();
    return { kind: 'demo' };
  }
}
