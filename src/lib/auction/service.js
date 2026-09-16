// AuctionService: every Midnight call the app makes, behind one interface.
//
// Components never touch midnight-js. They ask this service for auctions and
// actions, and it returns plain objects or real transaction identifiers. There
// is no simulated path in here: if a call returns, it happened on Preprod.
//
// Secrets live in the encrypted private state store, scoped to the wallet
// account and to each auction's address:
//   sellerSecret  written at deploy; proves the right to cancel and settle
//   bidderSecret  created on the first bid in an auction; never leaves
//   bids          this device's own bids, with the nonce each one used
// Only commitments to these reach the chain.
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

import * as Auction from '../../../managed/auction/contract/index.js';
import * as Registry from '../../../managed/registry/contract/index.js';
import { PROVENANCE, REGISTRY_ADDRESS, isContractAddress } from '../../config.js';
import { STORED, parseMetadata, bidProblem, deriveStatus } from './model.js';
import { toHex, fromHex, randomBytes32 } from './bytes.js';

export const PRIVATE_STATE_ID = 'midbid';

export const auctionWitnesses = {
  bidderSecret: ({ privateState }) => [
    privateState,
    required(privateState.bidderSecret, 'bidder secret'),
  ],
  bidNonce: ({ privateState }) => [privateState, required(privateState.nonce, 'bid nonce')],
  sellerSecret: ({ privateState }) => [
    privateState,
    required(privateState.sellerSecret, 'seller secret'),
  ],
};

function required(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new Error(`This device does not hold the ${name} for this auction.`);
  }
  return value;
}

export const compiledAuction = CompiledContract.make('auction', Auction.Contract).pipe(
  CompiledContract.withWitnesses(auctionWitnesses),
);

export const compiledRegistry = CompiledContract.make('registry', Registry.Contract).pipe(
  CompiledContract.withVacantWitnesses,
);

/** Maps a contract's revert message to something a bidder can act on. */
export function explainFailure(err) {
  const text = String(err?.message ?? err);
  /** @type {Array<[RegExp, string]>} */
  const known = [
    [
      /bid is below the minimum/,
      'Someone bid first. The minimum has moved; refresh and bid again.',
    ],
    [/auction has ended/, 'The auction ended before your bid landed.'],
    [/auction has not started/, 'The auction has not started yet.'],
    [/auction is not open/, 'This auction is no longer open.'],
    [/not the winning bid/, 'This device does not hold the winning bid.'],
    [
      /only the seller/,
      'Only the seller who created this auction can do that, from the device that created it.',
    ],
    [/cannot cancel after a bid/, 'An auction cannot be cancelled once someone has bid.'],
    [/auction already listed/, 'This auction is already listed.'],
  ];
  for (const [pattern, message] of known) if (pattern.test(text)) return message;
  return text;
}

const txRef = (result) => ({
  txId: result?.public?.txId ?? result?.txId,
  txHash: result?.public?.txHash ?? result?.txHash,
  blockHeight: result?.public?.blockHeight ?? result?.blockHeight,
});

/**
 * Decodes an auction's public ledger and refuses anything that is not a Midbid
 * auction built from these exact circuits.
 */
export function decodeAuction(address, contractState, now) {
  let l;
  try {
    l = Auction.ledger(contractState.data);
    void l.endsAt;
    void l.leader;
  } catch {
    throw new Error(`${address.slice(0, 10)}... is not a Midbid auction.`);
  }
  if (toHex(l.circuitCommitment) !== PROVENANCE.circuitCommitment) {
    throw new Error(`${address.slice(0, 10)}... was not built from Midbid's audited circuits.`);
  }
  const base = {
    address,
    metadata: parseMetadata(l.metadata),
    sellerKey: toHex(l.sellerKey),
    startingBid: l.startingBid,
    minIncrement: l.minIncrement,
    startsAt: l.startsAt,
    endsAt: l.endsAt,
    storedStatus: STORED[l.status],
    status: l.status,
    highBid: l.highBid,
    bidCount: l.bidCount,
    leader: toHex(l.leader),
  };
  return { ...base, phase: deriveStatus(base, now) };
}

export class AuctionService {
  /**
   * @param {object} opts
   * @param {object} opts.publicDataProvider  always present, needs no wallet
   * @param {any} [opts.walletProviders]
   *        full provider sets, present once a wallet is connected
   * @param {(line: string, kind?: any) => void} [opts.log]
   */
  constructor({ publicDataProvider, walletProviders = null, log = () => {} }) {
    this.publicDataProvider = publicDataProvider;
    this.walletProviders = walletProviders;
    this.log = log;
  }

  get connected() {
    return Boolean(this.walletProviders);
  }

  providers(name) {
    if (!this.walletProviders) throw new Error('Connect a wallet first.');
    return this.walletProviders(name);
  }

  // ------------------------------------------------------------ reading ---

  async getAuction(address) {
    if (!isContractAddress(address)) throw new Error('That is not a contract address.');
    const state = await this.publicDataProvider.queryContractState(address);
    if (!state) throw new Error('No contract exists at that address on Preprod.');
    return decodeAuction(address, state);
  }

  /** Addresses in the registry, newest listing order is not guaranteed. */
  async registryListings(registry = REGISTRY_ADDRESS) {
    if (!registry) return [];
    const state = await this.publicDataProvider.queryContractState(registry);
    if (!state) throw new Error('The Midbid registry was not found on Preprod.');
    const l = Registry.ledger(state.data);
    return Array.from(l.listings, (bytes) => toHex(bytes));
  }

  /**
   * Every listed auction that decodes and carries Midbid's circuit commitment.
   * Anything else in the registry is skipped, not shown.
   */
  /** @param {{ extra?: string[] }} [opts] */
  async listAuctions({ extra = [] } = {}) {
    const listed = await this.registryListings().catch((err) => {
      this.log(`Could not read the registry: ${err.message}`, 'err');
      return [];
    });
    const addresses = [...new Set([...listed, ...extra])];
    const results = await Promise.allSettled(addresses.map((a) => this.getAuction(a)));
    return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  }

  // ------------------------------------------------------ private state ---

  async privateState(address) {
    const psp = this.providers('auction').privateStateProvider;
    psp.setContractAddress(address);
    return (await psp.get(PRIVATE_STATE_ID)) ?? null;
  }

  async writePrivateState(address, next) {
    const psp = this.providers('auction').privateStateProvider;
    psp.setContractAddress(address);
    await psp.set(PRIVATE_STATE_ID, next);
  }

  /**
   * What this device knows privately about an auction: whether it created it,
   * its own bids, and whether one of them currently leads. Computed locally by
   * opening the public leader commitment; nothing is sent anywhere.
   */
  async myPosition(auction) {
    const ps = await this.privateState(auction.address);
    if (!ps) return { isSeller: false, bids: [], leading: false, leadingBid: null };
    const isSeller =
      ps.sellerSecret instanceof Uint8Array &&
      toHex(Auction.pureCircuits.sellerPublicKey(ps.sellerSecret)) === auction.sellerKey;
    const bids = Array.isArray(ps.bids) ? ps.bids : [];
    let leadingBid = null;
    if (ps.bidderSecret instanceof Uint8Array && BigInt(auction.bidCount) > 0n) {
      leadingBid =
        bids.find(
          (b) =>
            toHex(Auction.pureCircuits.leaderCommitment(ps.bidderSecret, fromHex(b.nonce))) ===
            auction.leader,
        ) ?? null;
    }
    return { isSeller, bids, leading: Boolean(leadingBid), leadingBid };
  }

  // ------------------------------------------------------------ actions ---

  /**
   * Deploys a new auction and lists it in the registry. Two wallet approvals:
   * the deploy, then the listing. If listing fails the auction still exists
   * and opens by direct link.
   */
  async createAuction({ metadata, terms }) {
    const sellerSecret = randomBytes32();
    this.log('Deploying your auction. Approve the transaction in Lace.');
    const deployed = await deployContract(this.providers('auction'), {
      compiledContract: compiledAuction,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: { sellerSecret, bids: [] },
      args: [
        metadata,
        Auction.pureCircuits.sellerPublicKey(sellerSecret),
        terms.startingBid,
        terms.minIncrement,
        terms.startsAt,
        terms.endsAt,
        fromHex(PROVENANCE.circuitCommitment),
      ],
    });
    const address = deployed.deployTxData.public.contractAddress;
    const deploy = txRef(deployed.deployTxData);
    this.log(`Auction deployed at ${address}.`, 'ok');

    let listing = null;
    let listingError = null;
    if (REGISTRY_ADDRESS) {
      try {
        listing = await this.listAuction(address);
      } catch (err) {
        listingError = explainFailure(err);
        this.log(`Listing failed: ${listingError}`, 'err');
      }
    }
    return { address, deploy, listing, listingError };
  }

  async listAuction(address, registry = REGISTRY_ADDRESS) {
    if (!registry) throw new Error('No registry is configured.');
    this.log('Listing the auction so others can find it. Approve in Lace.');
    const found = await findDeployedContract(this.providers('registry'), {
      compiledContract: compiledRegistry,
      contractAddress: registry,
    });
    const result = await found.callTx.list(fromHex(address));
    this.log('Auction listed.', 'ok');
    return txRef(result);
  }

  /** Deploys an empty registry. Done once per environment by an operator. */
  async deployRegistry() {
    this.log('Deploying a Midbid registry. Approve in Lace.');
    const deployed = await deployContract(this.providers('registry'), {
      compiledContract: compiledRegistry,
      args: [],
    });
    return {
      address: deployed.deployTxData.public.contractAddress,
      ...txRef(deployed.deployTxData),
    };
  }

  async attach(address) {
    return findDeployedContract(this.providers('auction'), {
      compiledContract: compiledAuction,
      contractAddress: address,
      privateStateId: PRIVATE_STATE_ID,
    });
  }

  /**
   * Places a private bid. The amount is a circuit argument, disclosed only as
   * the new public price. The bidder is a fresh commitment under a new nonce.
   */
  async placeBid(address, amount) {
    const auction = await this.getAuction(address);
    const problem = bidProblem(auction, amount);
    if (problem) throw new Error(problem);

    const existing = (await this.privateState(address)) ?? { bids: [] };
    const bidderSecret =
      existing.bidderSecret instanceof Uint8Array ? existing.bidderSecret : randomBytes32();
    const nonce = randomBytes32();
    // Stored before proving, so the nonce survives even if the page closes
    // while the wallet is approving. A bid is only marked confirmed afterwards.
    const pending = {
      amount: String(amount),
      nonce: toHex(nonce),
      at: Date.now(),
      status: 'pending',
    };
    await this.writePrivateState(address, {
      ...existing,
      bidderSecret,
      nonce,
      bids: [...(existing.bids ?? []), pending],
    });

    this.log('Proving your bid locally, then submitting. Approve in Lace.');
    try {
      const found = await this.attach(address);
      const result = await found.callTx.placeBid(BigInt(amount));
      const ref = txRef(result);
      await this.markBid(address, pending.nonce, { status: 'confirmed', ...ref });
      this.log('Bid accepted by the contract.', 'ok');
      return ref;
    } catch (err) {
      await this.markBid(address, pending.nonce, { status: 'failed' });
      throw new Error(explainFailure(err), { cause: err });
    }
  }

  async markBid(address, nonceHex, patch) {
    const ps = (await this.privateState(address)) ?? { bids: [] };
    const bids = (ps.bids ?? []).map((b) => (b.nonce === nonceHex ? { ...b, ...patch } : b));
    await this.writePrivateState(address, { ...ps, bids });
  }

  /** The winner opens the leading commitment. Only possible after the end. */
  async claimWin(address) {
    const auction = await this.getAuction(address);
    const position = await this.myPosition(auction);
    if (!position.leadingBid) throw new Error('This device does not hold the winning bid.');
    const ps = await this.privateState(address);
    await this.writePrivateState(address, { ...ps, nonce: fromHex(position.leadingBid.nonce) });
    return this.call(address, 'claimWin', 'Claiming the win. Approve in Lace.');
  }

  closeUnsold(address) {
    return this.call(address, 'closeUnsold', 'Recording that the auction ended unsold.');
  }

  settle(address) {
    return this.call(address, 'settle', 'Recording settlement. Approve in Lace.');
  }

  cancel(address) {
    return this.call(address, 'cancel', 'Cancelling the auction. Approve in Lace.');
  }

  async call(address, circuit, message) {
    this.log(message);
    try {
      const found = await this.attach(address);
      const result = await found.callTx[circuit]();
      this.log(`${circuit} accepted by the contract.`, 'ok');
      return txRef(result);
    } catch (err) {
      throw new Error(explainFailure(err), { cause: err });
    }
  }
}
