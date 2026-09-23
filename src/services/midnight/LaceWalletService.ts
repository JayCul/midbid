// Lace on Midnight Preprod, behind WalletService.
//
// Connecting builds the provider sets the MidnightAuctionService needs. The seed
// never leaves Lace, and the UI only ever receives a masked address.
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import type { WalletService, WalletState } from '../types';
import { PREPROD } from '../../config.js';
import { connectLace, findLace } from '../../lib/midnight/lace.js';
import { browserPasswordProvider } from '../../lib/midnight/privateStorage.js';
import { describeError, traceObject } from '../../lib/midnight/instrument.js';
import { maskAddress } from '../../lib/auction/view';
import { MidnightAuctionService } from './MidnightAuctionService';
import { PilotService } from './PilotService';

setNetworkId(PREPROD.networkId);

type Log = (line: string, kind?: 'info' | 'ok' | 'err') => void;
type Name = 'auction' | 'registry' | 'pilot';

export const DISCONNECTED: WalletState = {
  status: 'disconnected',
  maskedAddress: null,
  network: null,
  dust: null,
  error: null,
};

export class LaceWalletService implements WalletService {
  private providers: null | ((name: Name) => unknown) = null;
  /** Held so the pilot register can publish it when the participant asks. */
  private shielded: string | null = null;
  readonly publicDataProvider = indexerPublicDataProvider(PREPROD.indexer, PREPROD.indexerWs);

  constructor(private readonly log: Log) {}

  async isAvailable() {
    try {
      await findLace({ timeoutMs: 1200 });
      return true;
    } catch {
      return false;
    }
  }

  async connect(): Promise<WalletState> {
    try {
      this.log('Requesting connection. Approve it in Lace.');
      const s = await connectLace();
      this.shielded = s.addresses.shielded;
      const privateStateProvider = levelPrivateStateProvider({
        privateStateStoreName: 'midbid-private-state',
        privateStoragePasswordProvider: browserPasswordProvider(),
        accountId: s.addresses.shielded,
      });
      const walletProvider = traceObject(
        'walletProvider',
        s.walletProvider,
        ['balanceTx'],
        this.log,
      );
      const midnightProvider = traceObject(
        'midnightProvider',
        s.midnightProvider,
        ['submitTx'],
        this.log,
      );

      // One set per contract; they differ only in where circuit keys come from.
      const sets = new Map<Name, unknown>();
      this.providers = (name) => {
        if (!sets.has(name)) {
          const zkConfigProvider = new FetchZkConfigProvider(
            `${window.location.origin}/zk/${name}`,
            fetch.bind(window),
          );
          sets.set(name, {
            publicDataProvider: this.publicDataProvider,
            privateStateProvider,
            zkConfigProvider,
            proofProvider: traceObject(
              'proofProvider',
              httpClientProofProvider(PREPROD.proofServer, zkConfigProvider),
              ['proveTx'],
              this.log,
            ),
            walletProvider,
            midnightProvider,
          });
        }
        return sets.get(name);
      };

      let dust = null;
      try {
        const d = await s.api.getDustBalance();
        dust = { balance: d.balance, cap: d.cap };
      } catch {
        /* informational only */
      }
      this.log(`Connected via ${s.connectorName}.`, 'ok');
      return {
        status: 'connected',
        maskedAddress: maskAddress(s.addresses.shielded),
        network: PREPROD.networkId,
        dust,
        error: null,
      };
    } catch (err) {
      this.providers = null;
      this.shielded = null;
      const message = describeError(err);
      this.log(message, 'err');
      return { ...DISCONNECTED, status: 'error', error: message };
    }
  }

  disconnect() {
    // The connector has no revoke call, so disconnecting drops every
    // wallet-derived capability this page holds.
    this.providers = null;
    this.shielded = null;
    this.log('Disconnected. Wallet handles and providers dropped.', 'ok');
  }

  /** The pilot register, readable without a wallet and joinable with one. */
  pilot(): PilotService {
    return new PilotService(
      this.publicDataProvider,
      this.providers ? () => this.providers!('pilot') : null,
      () => this.shielded,
      this.log,
    );
  }

  /** A market bound to the current connection, or read-only when disconnected. */
  market(): MidnightAuctionService {
    return new MidnightAuctionService({
      publicDataProvider: this.publicDataProvider,
      walletProviders: this.providers,
      log: this.log,
    });
  }
}
