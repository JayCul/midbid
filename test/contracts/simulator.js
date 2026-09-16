// In-memory Midbid auction and registry, driven the way the app drives them,
// minus proofs. Each call runs the real compiled circuit, so an assert in the
// contract is what makes a test pass or fail, not a check in this file.
import {
  createConstructorContext,
  createCircuitContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import * as Auction from '../../managed/auction/contract/index.js';
import * as Registry from '../../managed/registry/contract/index.js';

const COIN_PUBLIC_KEY = '0'.repeat(64);

export const bytes32 = (label) => {
  const bytes = new Uint8Array(32);
  bytes.set(new TextEncoder().encode(label).subarray(0, 32));
  return bytes;
};

export const { Status } = Auction;

// Witnesses read only from the private state of whoever is acting.
export const witnesses = {
  bidderSecret: ({ privateState }) => [privateState, privateState.bidderSecret],
  bidNonce: ({ privateState }) => [privateState, privateState.nonce],
  sellerSecret: ({ privateState }) => [privateState, privateState.sellerSecret],
};

export const T0 = 1_800_000_000; // an arbitrary fixed "now", in seconds

export class AuctionSimulator {
  constructor({
    metadata = JSON.stringify({ title: 'Test lot' }),
    sellerSecret = bytes32('seller'),
    startingBid = 100n,
    minIncrement = 10n,
    startsAt = BigInt(T0),
    endsAt = BigInt(T0 + 3600),
    circuitCommitment = bytes32('circuits'),
  } = {}) {
    this.sellerSecret = sellerSecret;
    this.contract = new Auction.Contract(witnesses);
    this.address = sampleContractAddress();
    this.now = T0;
    const { currentContractState } = this.contract.initialState(
      createConstructorContext({}, COIN_PUBLIC_KEY),
      metadata,
      Auction.pureCircuits.sellerPublicKey(sellerSecret),
      startingBid,
      minIncrement,
      startsAt,
      endsAt,
      circuitCommitment,
    );
    this.state = currentContractState.data;
  }

  get ledger() {
    return Auction.ledger(this.state);
  }

  /** Moves block time, in seconds since the epoch. */
  at(seconds) {
    this.now = seconds;
    return this;
  }

  run(circuit, privateState, ...args) {
    const context = createCircuitContext(
      this.address,
      COIN_PUBLIC_KEY,
      this.state,
      privateState,
      undefined,
      undefined,
      this.now,
    );
    const { context: next } = this.contract.impureCircuits[circuit](context, ...args);
    this.state = next.currentQueryContext.state;
    return this.ledger;
  }

  bid(bidder, amount, nonce = bytes32(`nonce-${amount}`)) {
    return this.run('placeBid', { bidderSecret: bidder, nonce }, amount);
  }

  claimWin(bidder, nonce) {
    return this.run('claimWin', { bidderSecret: bidder, nonce });
  }

  closeUnsold() {
    return this.run('closeUnsold', {});
  }

  settle(as = this.sellerSecret) {
    return this.run('settle', { sellerSecret: as });
  }

  cancel(as = this.sellerSecret) {
    return this.run('cancel', { sellerSecret: as });
  }
}

export class RegistrySimulator {
  constructor() {
    this.contract = new Registry.Contract({});
    this.address = sampleContractAddress();
    const { currentContractState } = this.contract.initialState(
      createConstructorContext({}, COIN_PUBLIC_KEY),
    );
    this.state = currentContractState.data;
  }

  get ledger() {
    return Registry.ledger(this.state);
  }

  list(address) {
    const context = createCircuitContext(this.address, COIN_PUBLIC_KEY, this.state, {});
    const { context: next } = this.contract.impureCircuits.list(context, address);
    this.state = next.currentQueryContext.state;
    return this.ledger;
  }
}
