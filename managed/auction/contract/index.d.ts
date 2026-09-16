import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Status { OPEN = 0, CANCELLED = 1, UNSOLD = 2, WON = 3, SETTLED = 4 }

export type Witnesses<PS> = {
  bidderSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  bidNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  sellerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  placeBid(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimWin(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closeUnsold(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settle(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  cancel(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  placeBid(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimWin(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closeUnsold(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settle(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  cancel(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  sellerPublicKey(secret_0: Uint8Array): Uint8Array;
  leaderCommitment(secret_0: Uint8Array, nonce_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  sellerPublicKey(context: __compactRuntime.CircuitContext<PS>,
                  secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  leaderCommitment(context: __compactRuntime.CircuitContext<PS>,
                   secret_0: Uint8Array,
                   nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  placeBid(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimWin(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closeUnsold(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settle(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  cancel(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly metadata: string;
  readonly sellerKey: Uint8Array;
  readonly startingBid: bigint;
  readonly minIncrement: bigint;
  readonly startsAt: bigint;
  readonly endsAt: bigint;
  readonly circuitCommitment: Uint8Array;
  readonly status: Status;
  readonly highBid: bigint;
  readonly bidCount: bigint;
  readonly leader: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               meta_0: string,
               seller_0: Uint8Array,
               starting_0: bigint,
               increment_0: bigint,
               opensAt_0: bigint,
               closesAt_0: bigint,
               circuits_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
