// The auction as every screen sees it, whichever service produced it.

/** Where an auction lives. Demo auctions never touch a network. */
export type AuctionSource = 'midnight' | 'demo';

/**
 * Display lifecycle. SCHEDULED, ACTIVE and ENDED are an open auction read
 * against the clock; the contract enforces the same boundaries with block time.
 */
export type AuctionPhase =
  'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'SETTLING' | 'SETTLED' | 'CANCELLED' | 'UNSOLD';

export type StoredStatus = 'OPEN' | 'CANCELLED' | 'UNSOLD' | 'WON' | 'SETTLED';

export type Category =
  | 'Digital Collectibles'
  | 'Art'
  | 'Gaming Assets'
  | 'Creator Drops'
  | 'Community Auctions'
  | 'Private Sales';

export interface Auction {
  /** Contract address for Midnight auctions, a slug for demo auctions. */
  id: string;
  source: AuctionSource;
  /** Three-digit lot label, e.g. "042". Presentation only. */
  lot: string;
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
  /** Seed for the generated lot visual when there is no image. */
  visualSeed: number;
  currency: 'tNIGHT';
  startingBid: bigint;
  minIncrement: bigint;
  /** Public high bid. 0 until the first bid. */
  highBid: bigint;
  /** Accepted bids. Distinct bidders are private and never counted. */
  bidCount: bigint;
  /** Seconds since the epoch. */
  startsAt: bigint;
  endsAt: bigint;
  storedStatus: StoredStatus;
  /** The high bid is always shown: the contract discloses it by design. */
  showHighBid: true;
  bidderPrivacy: 'private';
}

export interface NewAuctionInput {
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
  startingBid: string;
  minIncrement: string;
  durationSeconds: number;
}

/**
 * What an action produced. A Midnight receipt carries the identifier the wallet
 * returned. A demo receipt carries nothing, so the UI can never show an invented
 * transaction.
 */
export type Receipt = { kind: 'onchain'; txId?: string; txHash?: string } | { kind: 'demo' };

/** What this device privately knows about an auction. Never sent anywhere. */
export interface Position {
  isSeller: boolean;
  leading: boolean;
  bids: { amount: string; at: number; status: 'pending' | 'confirmed' | 'failed' }[];
}

export interface AuctionResult {
  phase: AuctionPhase;
  winningBid: bigint | null;
  claimed: boolean;
}
