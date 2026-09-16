// All Midnight wiring lives behind this hook, so pages stay presentational.
// Reading auctions needs no wallet; every action goes through AuctionService
// with providers built from the connected Lace session.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { PREPROD, REGISTRY_ADDRESS } from '../config.js';
import { connectLace } from '../lib/lace.js';
import { browserPasswordProvider } from '../lib/privateStorage.js';
import { describeError, installGlobalErrorLogging, traceObject } from '../lib/instrument.js';
import { checkProofServer, PROOF_SERVER_COMMAND } from '../lib/proofServer.js';
import { AuctionService } from '../lib/auction/service.js';
import { addToIndex, readIndex } from '../lib/auction/localIndex.js';

setNetworkId(PREPROD.networkId);

export type LogKind = 'info' | 'ok' | 'err';
export type LogLine = { id: number; kind: LogKind; text: string; at: number };

export type Wallet = {
  shielded: string;
  unshielded: string;
  connectorName: string;
  dust: { balance: bigint; cap: bigint } | null;
};

let logId = 0;

export function useMidbid() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [proofServerOk, setProofServerOk] = useState<boolean | null>(null);
  const [indexVersion, setIndexVersion] = useState(0);
  const walletProviders = useRef<null | ((name: 'auction' | 'registry') => any)>(null);

  const log = useCallback((text: string, kind: LogKind = 'info') => {
    setLogs((prev) => [{ id: logId++, kind, text, at: Date.now() }, ...prev].slice(0, 200));
  }, []);

  useEffect(() => installGlobalErrorLogging(log), [log]);

  const publicDataProvider = useMemo(
    () => indexerPublicDataProvider(PREPROD.indexer, PREPROD.indexerWs),
    [],
  );

  // Rebuilt when the wallet changes, so an action can never run against a
  // stale session.
  const service = useMemo(
    () =>
      new AuctionService({
        publicDataProvider,
        walletProviders: wallet ? walletProviders.current : null,
        log,
      }),
    [publicDataProvider, wallet, log],
  );

  const refreshProofServer = useCallback(async () => {
    const result = await checkProofServer();
    setProofServerOk(result.ok);
    return result.ok;
  }, []);

  useEffect(() => {
    refreshProofServer().catch(() => setProofServerOk(false));
  }, [refreshProofServer]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      log('Requesting connection. Approve it in Lace.');
      const s = await connectLace();

      const privateStateProvider = levelPrivateStateProvider({
        privateStateStoreName: 'midbid-private-state',
        privateStoragePasswordProvider: browserPasswordProvider(),
        accountId: s.addresses.shielded,
      });
      const walletProvider = traceObject('walletProvider', s.walletProvider, ['balanceTx'], log);
      const midnightProvider = traceObject(
        'midnightProvider',
        s.midnightProvider,
        ['submitTx'],
        log,
      );

      // One provider set per contract: they differ only in where the circuit
      // keys are fetched from. Private state is shared and scoped by address.
      const sets = new Map<string, any>();
      walletProviders.current = (name) => {
        if (!sets.has(name)) {
          const zkConfigProvider = new FetchZkConfigProvider(
            `${window.location.origin}/zk/${name}`,
            fetch.bind(window),
          );
          sets.set(name, {
            publicDataProvider,
            privateStateProvider,
            zkConfigProvider,
            proofProvider: traceObject(
              'proofProvider',
              httpClientProofProvider(PREPROD.proofServer, zkConfigProvider),
              ['proveTx'],
              log,
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
        /* balance is informational */
      }
      setWallet({
        shielded: s.addresses.shielded,
        unshielded: s.addresses.unshielded,
        connectorName: s.connectorName,
        dust,
      });
      log(`Connected via ${s.connectorName}.`, 'ok');
      await refreshProofServer();
    } catch (err) {
      log(describeError(err), 'err');
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [log, publicDataProvider, refreshProofServer]);

  const disconnect = useCallback(() => {
    // The connector has no revoke call, so disconnecting means dropping every
    // wallet-derived capability the page holds.
    walletProviders.current = null;
    setWallet(null);
    log('Disconnected. Wallet handles and providers dropped.', 'ok');
  }, [log]);

  const remember = useCallback((kind: 'created' | 'bid', address: string) => {
    addToIndex(kind, address);
    setIndexVersion((v) => v + 1);
  }, []);

  const index = useMemo(() => readIndex(), [indexVersion]);

  return {
    logs,
    log,
    wallet,
    connecting,
    proofServerOk,
    proofServerCommand: PROOF_SERVER_COMMAND as string,
    registryAddress: REGISTRY_ADDRESS as string | null,
    service,
    index,
    connect,
    disconnect,
    refreshProofServer,
    remember,
  };
}

export type MidbidApi = ReturnType<typeof useMidbid>;
