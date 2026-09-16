// Midnight Preprod behind the same interfaces as the demo market.
//
// Everything here resolves only when the network and the wallet say so. Receipts
// carry the identifier Lace returned; nothing is invented on failure.
import type {
  Auction,
  AuctionResult,
  Category,
  NewAuctionInput,
  Position,
  Receipt,
} from '../../types/auction';
import type { MarketService } from '../types';
import { buildMetadata, buildTerms } from '../../lib/auction/model.js';
import { addToIndex, readIndex } from '../../lib/auction/localIndex.js';
import { lotFromAddress, phaseOf, seedFrom } from '../../lib/auction/view';
import { MidnightAuctionClient } from './auctionClient.js';

type Decoded = {
  address: string;
  metadata: { title: string; description: string; category: string; imageUrl: string };
  sellerKey: string;
  startingBid: bigint;
  minIncrement: bigint;
  startsAt: bigint;
  endsAt: bigint;
  storedStatus: Auction['storedStatus'];
  highBid: bigint;
  bidCount: bigint;
  leader: string;
};

const onchain = (ref: { txId?: string; txHash?: string } | null | undefined): Receipt => ({
  kind: 'onchain',
  txId: ref?.txId,
  txHash: ref?.txHash,
});

export function toAuction(d: Decoded): Auction {
  return {
    id: d.address,
    source: 'midnight',
    lot: lotFromAddress(d.address),
    title: d.metadata.title,
    description: d.metadata.description,
    category: d.metadata.category as Category,
    imageUrl: d.metadata.imageUrl,
    visualSeed: seedFrom(d.address),
    currency: 'tNIGHT',
    startingBid: d.startingBid,
    minIncrement: d.minIncrement,
    highBid: d.highBid,
    bidCount: d.bidCount,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    storedStatus: d.storedStatus,
    showHighBid: true,
    bidderPrivacy: 'private',
  };
}

export class MidnightAuctionService implements MarketService {
  readonly source = 'midnight' as const;
  private client: any;

  constructor(opts: {
    publicDataProvider: object;
    walletProviders: null | ((name: 'auction' | 'registry') => unknown);
    log: (line: string, kind?: 'info' | 'ok' | 'err') => void;
  }) {
    this.client = new MidnightAuctionClient(opts);
  }

  get connected(): boolean {
    return this.client.connected;
  }

  private async decoded(id: string): Promise<Decoded> {
    return this.client.getAuction(id);
  }

  async listAuctions() {
    const index = readIndex();
    const list: Decoded[] = await this.client.listAuctions({
      extra: [...index.created, ...index.bid],
    });
    return list.map(toAuction);
  }

  async getAuction(id: string) {
    return toAuction(await this.decoded(id));
  }

  async getCurrentHighestBid(id: string) {
    return (await this.decoded(id)).highBid;
  }

  async createAuction(input: NewAuctionInput) {
    const metadata = buildMetadata(input);
    const terms = buildTerms(input);
    const result = await this.client.createAuction({ metadata, terms });
    addToIndex('created', result.address);
    return {
      id: result.address as string,
      receipt: onchain(result.deploy),
      note: result.listingError
        ? `The auction exists, but listing it failed: ${result.listingError}`
        : undefined,
    };
  }

  async placePrivateBid(id: string, amount: bigint) {
    const ref = await this.client.placeBid(id, amount);
    addToIndex('bid', id);
    return onchain(ref);
  }

  async getPosition(id: string): Promise<Position | null> {
    if (!this.client.connected) return null;
    const p = await this.client.myPosition(await this.decoded(id));
    return {
      isSeller: p.isSeller,
      leading: p.leading,
      bids: p.bids.map((b: any) => ({ amount: b.amount, at: b.at, status: b.status })),
    };
  }

  async finalizeAuction(id: string) {
    const d = await this.decoded(id);
    const ref =
      d.bidCount === 0n ? await this.client.closeUnsold(id) : await this.client.claimWin(id);
    return onchain(ref);
  }

  async getAuctionResult(id: string): Promise<AuctionResult> {
    const a = await this.getAuction(id);
    const phase = phaseOf(a);
    return {
      phase,
      winningBid: a.bidCount > 0n && phase !== 'ACTIVE' && phase !== 'SCHEDULED' ? a.highBid : null,
      claimed: a.storedStatus === 'WON' || a.storedStatus === 'SETTLED',
    };
  }

  async cancelAuction(id: string) {
    return onchain(await this.client.cancel(id));
  }

  async settleAuction(id: string) {
    return onchain(await this.client.settle(id));
  }

  // ----------------------------------------------------- Midnight only ---

  async isListed(id: string): Promise<boolean> {
    return (await this.client.registryListings()).includes(id);
  }

  async listInRegistry(id: string) {
    return onchain(await this.client.listAuction(id));
  }

  async deployRegistry() {
    const r = await this.client.deployRegistry();
    return { address: r.address as string, receipt: onchain(r) };
  }
}
