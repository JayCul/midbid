// The pilot register on Preprod: joining, reading the list, and deploying it.
//
// Nothing here touches an auction. It is a separate contract on purpose, so a
// public participation list can never be mistaken for a list of bidders.
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

import * as Pilot from '../../../managed/pilot/contract/index.js';
import { PILOT_ADDRESS } from '../../config.js';
import { toHex } from '../../lib/auction/bytes.js';
import type { Receipt } from '../../types/auction';

export const ROLES = ['TESTER', 'BUILDER', 'SELLER', 'BIDDER'] as const;
export type RoleName = (typeof ROLES)[number];

export type Member = {
  address: string;
  handle: string;
  joinedAt: number;
  role: RoleName;
  key: string;
};

// The midnight-js types expect a contract with no compiled-asset path; the
// registry path is JavaScript and sidesteps this. Casting keeps the same shape.
export const compiledPilot = CompiledContract.make('pilot', Pilot.Contract).pipe(
  CompiledContract.withVacantWitnesses,
) as any;

/** One address, one entry. The key is what the contract stores as the member id. */
export async function addressKey(address: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address.trim()));
  return new Uint8Array(digest);
}

const onchain = (ref: any): Receipt => ({
  kind: 'onchain',
  txId: ref?.public?.txId ?? ref?.txId,
  txHash: ref?.public?.txHash ?? ref?.txHash,
});

export class PilotService {
  constructor(
    private readonly publicDataProvider: any,
    private readonly providers: null | (() => any),
    /** The connected wallet's own address. The page never handles it. */
    private readonly ownAddress: () => string | null,
    private readonly log: (line: string, kind?: 'info' | 'ok' | 'err') => void = () => {},
  ) {}

  get address(): string | null {
    return PILOT_ADDRESS;
  }

  private require() {
    if (!this.providers) throw new Error('Connect a wallet first.');
    if (!PILOT_ADDRESS) throw new Error('No pilot register is configured for this build.');
    return this.providers();
  }

  /** Everyone who has joined, newest entries last. Readable without a wallet. */
  async members(): Promise<Member[]> {
    if (!PILOT_ADDRESS) return [];
    const state = await this.publicDataProvider.queryContractState(PILOT_ADDRESS);
    if (!state) throw new Error('The pilot register was not found on Preprod.');
    const l = Pilot.ledger(state.data);
    const out: Member[] = [];
    for (const [key, record] of l.entries) {
      try {
        const parsed = JSON.parse(record);
        if (typeof parsed?.address !== 'string') continue;
        out.push({
          address: parsed.address,
          handle: typeof parsed.handle === 'string' ? parsed.handle.slice(0, 40) : '',
          joinedAt: Number(parsed.joinedAt) || 0,
          role: ROLES[Number(l.roles.lookup(key)) as number] ?? 'TESTER',
          key: toHex(key),
        });
      } catch {
        // An entry anyone could have written. Skip what does not parse.
      }
    }
    return out.sort((a, b) => a.joinedAt - b.joinedAt);
  }

  async count(): Promise<number> {
    if (!PILOT_ADDRESS) return 0;
    const state = await this.publicDataProvider.queryContractState(PILOT_ADDRESS);
    if (!state) return 0;
    return Number(Pilot.ledger(state.data).joinedCount);
  }

  async hasJoined(address: string): Promise<boolean> {
    if (!PILOT_ADDRESS) return false;
    const state = await this.publicDataProvider.queryContractState(PILOT_ADDRESS);
    if (!state) return false;
    return Pilot.ledger(state.data).members.member(await addressKey(address));
  }

  /** Whether the connected wallet is already on the list. */
  async selfJoined(): Promise<boolean> {
    const address = this.ownAddress();
    return address ? this.hasJoined(address) : false;
  }

  /** Publishes the connected wallet's address. One transaction, signed by them. */
  async join(handle: string, role: RoleName): Promise<Receipt> {
    const providers = this.require();
    const address = this.ownAddress();
    if (!address) throw new Error('Connect a wallet first.');
    const key = await addressKey(address);
    const record = JSON.stringify({
      v: 1,
      address: address.trim(),
      handle: handle.trim().slice(0, 40),
      joinedAt: Math.floor(Date.now() / 1000),
    });
    this.log('Joining the pilot register. Approve in Lace.');
    const found = await findDeployedContract(providers, {
      compiledContract: compiledPilot,
      contractAddress: PILOT_ADDRESS,
    });
    const result = await found.callTx.join(key, record, ROLES.indexOf(role));
    this.log('You are on the public pilot list.', 'ok');
    return onchain(result);
  }

  /** Operator only, once per environment. */
  async deploy(name: string): Promise<{ address: string; receipt: Receipt }> {
    if (!this.providers) throw new Error('Connect a wallet first.');
    this.log('Deploying the pilot register. Approve in Lace.');
    const deployed = await deployContract(this.providers(), {
      compiledContract: compiledPilot,
      args: [name],
    });
    return {
      address: deployed.deployTxData.public.contractAddress,
      receipt: onchain(deployed.deployTxData),
    };
  }
}
