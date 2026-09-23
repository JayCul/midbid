import { describe, expect, it } from 'vitest';
import {
  createConstructorContext,
  createCircuitContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import * as Pilot from '../../managed/pilot/contract/index.js';
import { bytes32 } from './simulator.js';

const COIN_PUBLIC_KEY = '0'.repeat(64);

/** The pilot register, driven the way the join page drives it. */
class PilotSimulator {
  constructor(name = 'MidBid Preprod pilot') {
    this.contract = new Pilot.Contract({});
    this.address = sampleContractAddress();
    const { currentContractState } = this.contract.initialState(
      createConstructorContext({}, COIN_PUBLIC_KEY),
      name,
    );
    this.state = currentContractState.data;
  }

  get ledger() {
    return Pilot.ledger(this.state);
  }

  join(address, { role = Pilot.Role.TESTER, handle = '' } = {}) {
    const record = JSON.stringify({ v: 1, address, handle, joinedAt: 1_800_000_000 });
    const context = createCircuitContext(this.address, COIN_PUBLIC_KEY, this.state, {});
    const { context: next } = this.contract.impureCircuits.join(
      context,
      bytes32(address),
      record,
      role,
    );
    this.state = next.currentQueryContext.state;
    return this.ledger;
  }
}

const ALICE = 'mn_shield-addr_preprod1alice';
const BOB = 'mn_shield-addr_preprod1bob';

describe('pilot register', () => {
  it('publishes the pilot name and starts empty', () => {
    const l = new PilotSimulator().ledger;
    expect(l.pilotName).toBe('MidBid Preprod pilot');
    expect(l.joinedCount).toBe(0n);
  });

  it('records a participant with their address, handle and role', () => {
    const sim = new PilotSimulator();
    const l = sim.join(ALICE, { role: Pilot.Role.BUILDER, handle: 'alice' });
    expect(l.joinedCount).toBe(1n);
    const entry = JSON.parse(l.entries.lookup(bytes32(ALICE)));
    expect(entry).toMatchObject({ address: ALICE, handle: 'alice' });
    expect(l.roles.lookup(bytes32(ALICE))).toBe(Pilot.Role.BUILDER);
  });

  it('counts each address once', () => {
    const sim = new PilotSimulator();
    sim.join(ALICE);
    expect(() => sim.join(ALICE)).toThrow(/already joined/);
    expect(sim.ledger.joinedCount).toBe(1n);
  });

  it('keeps a readable list as the cohort grows', () => {
    const sim = new PilotSimulator();
    sim.join(ALICE);
    sim.join(BOB, { role: Pilot.Role.SELLER });
    const addresses = [...sim.ledger.entries].map(([, record]) => JSON.parse(record).address);
    expect(addresses.sort()).toEqual([ALICE, BOB].sort());
    expect(sim.ledger.joinedCount).toBe(2n);
  });

  it('holds nothing that links a member to an auction or a bid', () => {
    const sim = new PilotSimulator();
    sim.join(ALICE, { handle: 'alice' });
    const state = JSON.stringify([...sim.ledger.entries].map(([, r]) => r));
    expect(state).not.toMatch(/bid|auction|commitment/i);
  });
});
