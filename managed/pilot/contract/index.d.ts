import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Role { TESTER = 0, BUILDER = 1, SELLER = 2, BIDDER = 3 }

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  join(context: __compactRuntime.CircuitContext<PS>,
       key_0: Uint8Array,
       record_0: string,
       role_0: Role): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  join(context: __compactRuntime.CircuitContext<PS>,
       key_0: Uint8Array,
       record_0: string,
       role_0: Role): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  join(context: __compactRuntime.CircuitContext<PS>,
       key_0: Uint8Array,
       record_0: string,
       role_0: Role): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly pilotName: string;
  readonly joinedCount: bigint;
  members: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  entries: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): string;
    [Symbol.iterator](): Iterator<[Uint8Array, string]>
  };
  roles: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Role;
    [Symbol.iterator](): Iterator<[Uint8Array, Role]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>, name_0: string): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
