// Integration between the compiled contract and the app's service layer: the
// same ledger bytes the indexer returns are decoded, verified and interpreted.
import { describe, expect, it } from 'vitest';
import { PROVENANCE } from '../src/provenance.js';
import { fromHex } from '../src/lib/auction/bytes.js';
import { AuctionService, decodeAuction, explainFailure } from '../src/lib/auction/service.js';
import { AuctionSimulator, T0, bytes32 } from './contracts/simulator.js';

const ADDRESS = 'ab'.repeat(32);
const genuine = () =>
  new AuctionSimulator({
    circuitCommitment: fromHex(PROVENANCE.circuitCommitment),
    metadata: JSON.stringify({ title: 'Signed poster', category: 'Art' }),
  });

describe('decodeAuction', () => {
  it('decodes a genuine auction and derives its phase', () => {
    const sim = genuine();
    sim.bid(bytes32('alice'), 120n);
    const a = decodeAuction(ADDRESS, { data: sim.state }, T0 + 10);
    expect(a.metadata.title).toBe('Signed poster');
    expect(a.highBid).toBe(120n);
    expect(a.bidCount).toBe(1n);
    expect(a.phase).toBe('ACTIVE');
    expect(a.storedStatus).toBe('OPEN');
    expect(decodeAuction(ADDRESS, { data: sim.state }, T0 + 3600).phase).toBe('ENDED');
  });

  it('refuses a contract that carries a different circuit commitment', () => {
    const impostor = new AuctionSimulator({ circuitCommitment: bytes32('something else') });
    expect(() => decodeAuction(ADDRESS, { data: impostor.state })).toThrow(/audited circuits/);
  });
});

describe('AuctionService reads', () => {
  const serviceWith = (states) =>
    new AuctionService({
      publicDataProvider: { queryContractState: async (a) => states[a] ?? null },
    });

  it('returns an auction from public data without a wallet', async () => {
    const a = await serviceWith({ [ADDRESS]: { data: genuine().state } }).getAuction(ADDRESS);
    expect(a.address).toBe(ADDRESS);
  });

  it('says clearly when nothing is deployed at an address', async () => {
    await expect(serviceWith({}).getAuction(ADDRESS)).rejects.toThrow(/No contract exists/);
    await expect(serviceWith({}).getAuction('nope')).rejects.toThrow(/not a contract address/);
  });

  it('skips impostors when listing', async () => {
    const other = 'cd'.repeat(32);
    const list = await serviceWith({
      [ADDRESS]: { data: genuine().state },
      [other]: { data: new AuctionSimulator().state },
    }).listAuctions({ extra: [ADDRESS, other] });
    expect(list.map((a) => a.address)).toEqual([ADDRESS]);
  });

  it('refuses wallet actions until a wallet is connected', async () => {
    await expect(serviceWith({}).cancel(ADDRESS)).rejects.toThrow(/Connect a wallet/);
  });
});

describe('explainFailure', () => {
  it('turns contract reverts into next steps', () => {
    expect(explainFailure(new Error('failed assert: bid is below the minimum'))).toMatch(
      /minimum has moved/,
    );
    expect(explainFailure(new Error('something unexpected'))).toBe('something unexpected');
  });
});
