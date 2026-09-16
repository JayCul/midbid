// Service boundaries. Screens depend on these interfaces only, so the demo market
// and Midnight Preprod are interchangeable behind them.
import type { Auction, AuctionResult, NewAuctionInput, Position, Receipt } from '../types/auction';

/** Reading and running auctions. */
export interface AuctionService {
  readonly source: Auction['source'];
  listAuctions(): Promise<Auction[]>;
  getAuction(id: string): Promise<Auction>;
  createAuction(input: NewAuctionInput): Promise<{ id: string; receipt: Receipt; note?: string }>;
  getCurrentHighestBid(id: string): Promise<bigint>;
  /** Ends an auction that is past its end time: the winner claims, or it closes unsold. */
  finalizeAuction(id: string): Promise<Receipt>;
  getAuctionResult(id: string): Promise<AuctionResult>;
  cancelAuction(id: string): Promise<Receipt>;
  settleAuction(id: string): Promise<Receipt>;
}

/** Bidding, split out because it is the only path that handles a private amount. */
export interface BidService {
  placePrivateBid(id: string, amount: bigint): Promise<Receipt>;
  getPosition(id: string): Promise<Position | null>;
}

export type MarketService = AuctionService & BidService;

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  /** Shortened for display only. The full address never renders in the UI. */
  maskedAddress: string | null;
  network: string | null;
  dust: { balance: bigint; cap: bigint } | null;
  error: string | null;
}

/** Wallet connection, independent of any auction. */
export interface WalletService {
  isAvailable(): Promise<boolean>;
  connect(): Promise<WalletState>;
  disconnect(): void;
}

/** Lower-level contract access used by the Midnight services. */
export interface ContractService {
  deployAuction(metadata: string, terms: unknown): Promise<{ address: string; receipt: Receipt }>;
  deployRegistry(): Promise<{ address: string; receipt: Receipt }>;
}
