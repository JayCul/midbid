// Sample lots for the demo market and the landing page.
//
// These are illustrative. They are only ever served by MockAuctionService, which
// labels itself as demo everywhere it appears, and they never reach Midnight.
import type { Auction, Category } from '../types/auction';

type Seed = {
  slug: string;
  lot: string;
  title: string;
  description: string;
  category: Category;
  startingBid: number;
  minIncrement: number;
  highBid: number;
  bidCount: number;
  /** Minutes from page load until the end. Negative means already ended. */
  endsInMinutes: number;
  /** Minutes the auction has been open. */
  openForMinutes: number;
  visualSeed: number;
  storedStatus?: Auction['storedStatus'];
};

const SEEDS: Seed[] = [
  {
    slug: 'demo-042',
    lot: '042',
    title: 'Limited Digital Artifact',
    description:
      'A single-edition generative sculpture, rendered once and never reissued. The winner receives the source file and the signed edition record.',
    category: 'Digital Collectibles',
    startingBid: 1000,
    minIncrement: 100,
    highBid: 4280,
    bidCount: 12,
    endsInMinutes: 134,
    openForMinutes: 1300,
    visualSeed: 1,
  },
  {
    slug: 'demo-017',
    lot: '017',
    title: 'Nocturne in Copper, No. 3',
    description:
      'Large-format print from the Nocturne series, hand-finished and numbered 3 of 5. Ships framed.',
    category: 'Art',
    startingBid: 2500,
    minIncrement: 250,
    highBid: 6750,
    bidCount: 9,
    endsInMinutes: 612,
    openForMinutes: 2000,
    visualSeed: 2,
  },
  {
    slug: 'demo-088',
    lot: '088',
    title: 'Founders Hangar Skin',
    description:
      'The original hangar skin from the first season of Driftline, one of twelve ever granted. Transfers to the winner’s game account.',
    category: 'Gaming Assets',
    startingBid: 300,
    minIncrement: 25,
    highBid: 1175,
    bidCount: 21,
    endsInMinutes: 41,
    openForMinutes: 900,
    visualSeed: 3,
  },
  {
    slug: 'demo-104',
    lot: '104',
    title: 'Studio Session, First Pressing',
    description:
      'An unreleased studio session on a first-pressing test record, with a private listening call for the winner.',
    category: 'Creator Drops',
    startingBid: 800,
    minIncrement: 50,
    highBid: 0,
    bidCount: 0,
    endsInMinutes: 2880,
    openForMinutes: 30,
    visualSeed: 4,
  },
  {
    slug: 'demo-061',
    lot: '061',
    title: 'Community Garden Plot, Season Lease',
    description:
      'A full-season lease on plot 61. Proceeds fund the shared greenhouse. The winner is announced by lot number only.',
    category: 'Community Auctions',
    startingBid: 150,
    minIncrement: 10,
    highBid: 420,
    bidCount: 14,
    endsInMinutes: 1500,
    openForMinutes: 3000,
    visualSeed: 5,
  },
  {
    slug: 'demo-009',
    lot: '009',
    title: 'Archive Chronograph, Ref. 9',
    description:
      'A serviced archive chronograph with papers. Offered privately: bidders are verified off the auction, never named on it.',
    category: 'Private Sales',
    startingBid: 12000,
    minIncrement: 500,
    highBid: 18500,
    bidCount: 6,
    endsInMinutes: 4320,
    openForMinutes: 1440,
    visualSeed: 6,
  },
  {
    slug: 'demo-031',
    lot: '031',
    title: 'Monolith Study, Edition of One',
    description: 'A closed auction kept for reference: ended with a claimed winner.',
    category: 'Art',
    startingBid: 500,
    minIncrement: 50,
    highBid: 2950,
    bidCount: 17,
    endsInMinutes: -180,
    openForMinutes: 2880,
    visualSeed: 7,
    storedStatus: 'WON',
  },
];

export function showcaseAuctions(nowSeconds = Math.floor(Date.now() / 1000)): Auction[] {
  return SEEDS.map((s) => ({
    id: s.slug,
    source: 'demo',
    lot: s.lot,
    title: s.title,
    description: s.description,
    category: s.category,
    imageUrl: '',
    visualSeed: s.visualSeed,
    currency: 'tNIGHT',
    startingBid: BigInt(s.startingBid),
    minIncrement: BigInt(s.minIncrement),
    highBid: BigInt(s.highBid),
    bidCount: BigInt(s.bidCount),
    startsAt: BigInt(nowSeconds - s.openForMinutes * 60),
    endsAt: BigInt(nowSeconds + s.endsInMinutes * 60),
    storedStatus: s.storedStatus ?? 'OPEN',
    showHighBid: true,
    bidderPrivacy: 'private',
  }));
}

/** Price history for the signature section, for lot 042. Bidders are never recorded. */
export const LOT_042_HISTORY = [1000, 1450, 2100, 2800, 3800, 4280];
