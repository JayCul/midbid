// The market context: which data source is active, the wallet, and the log.
//
// The Midnight stack (ledger WASM, midnight-js) is large, so it is loaded only
// when something needs live data or a wallet. The landing page renders first
// on the demo market and never waits for it.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { MarketService, WalletState } from '../services/types';
import { MockAuctionService } from '../services/mock/MockAuctionService';
import { checkProofServer, PROOF_SERVER_COMMAND } from '../lib/midnight/proofServer.js';
import {
  hostedAvailable,
  proofServerUrl,
  provingNotice,
  readMode,
  type ProvingMode,
} from '../lib/midnight/proving';
import { PILOT_ADDRESS, REGISTRY_ADDRESS } from '../config.js';

export type MarketMode = 'live' | 'demo';
export type LogLine = { id: number; kind: 'info' | 'ok' | 'err'; text: string; at: number };

type MidnightModule = typeof import('../services/midnight/LaceWalletService');
type LaceWallet = InstanceType<MidnightModule['LaceWalletService']>;

const DISCONNECTED: WalletState = {
  status: 'disconnected',
  maskedAddress: null,
  network: null,
  dust: null,
  error: null,
};

const MODE_KEY = 'midbid.market.v1';

function initialMode(): MarketMode {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'demo' || q === 'live') return q;
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'demo' || saved === 'live') return saved;
  } catch {
    /* storage can be unavailable */
  }
  // Without a registry there is nothing live to browse yet.
  return REGISTRY_ADDRESS ? 'live' : 'demo';
}

let logId = 0;
const demoSingleton = new MockAuctionService();

function useMarketState() {
  const [mode, setModeState] = useState<MarketMode>(initialMode);
  const [wallet, setWallet] = useState<WalletState>(DISCONNECTED);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [proofServerOk, setProofServerOk] = useState<boolean | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [proving, setProving] = useState<ProvingMode>(() => readMode());
  /** Set while Lace is locked, so the dialog can say what it is waiting for. */
  const [connectHint, setConnectHint] = useState<string | null>(null);
  const lace = useRef<LaceWallet | null>(null);
  const [live, setLive] = useState<MarketService | null>(null);

  const log = useCallback((text: string, kind: LogLine['kind'] = 'info') => {
    setLogs((prev) => [{ id: logId++, kind, text, at: Date.now() }, ...prev].slice(0, 200));
  }, []);

  // Other demo bidders keep demo prices moving while the site is open.
  useEffect(() => {
    demoSingleton.startActivity();
    const off = demoSingleton.subscribe(() => setVersion((v) => v + 1));
    return () => {
      off();
      demoSingleton.stopActivity();
    };
  }, []);

  const loadLace = useCallback(async () => {
    if (!lace.current) {
      const mod: MidnightModule = await import('../services/midnight/LaceWalletService');
      lace.current = new mod.LaceWalletService(log);
      setLive(lace.current.market());
    }
    return lace.current;
  }, [log]);

  const setMode = useCallback(
    (next: MarketMode) => {
      setModeState(next);
      try {
        localStorage.setItem(MODE_KEY, next);
      } catch {
        /* the choice lasts for this page */
      }
      if (next === 'live') loadLace().catch((err) => log(String(err?.message ?? err), 'err'));
    },
    [loadLace, log],
  );

  useEffect(() => {
    if (mode === 'live') loadLace().catch((err) => log(String(err?.message ?? err), 'err'));
  }, [mode, loadLace, log]);

  const refreshProofServer = useCallback(async () => {
    const r = await checkProofServer(proofServerUrl());
    setProofServerOk(r.ok);
    return r.ok;
  }, [proving]);

  /** Opt in or out of hosted proving. Never changed without the person asking. */
  const setProvingMode = useCallback(
    async (mode: ProvingMode) => {
      const l = await loadLace();
      setProving(l.setProvingMode(mode));
      await refreshProofServer().catch(() => setProofServerOk(false));
    },
    [loadLace, refreshProofServer],
  );

  const connect = useCallback(async () => {
    setWallet((w) => ({ ...w, status: 'connecting', error: null }));
    setConnectHint(null);
    const l = await loadLace();
    const next = await l.connect(() =>
      setConnectHint('Lace is locked. Unlock it, then press Connect again.'),
    );
    if (next.status === 'connected') setConnectHint(null);
    setWallet(next);
    if (next.status === 'connected') {
      setLive(l.market());
      await refreshProofServer().catch(() => setProofServerOk(false));
    }
    return next;
  }, [loadLace, refreshProofServer]);

  const disconnect = useCallback(() => {
    lace.current?.disconnect();
    if (lace.current) setLive(lace.current.market());
    setWallet(DISCONNECTED);
  }, []);

  /** The service that owns an auction id: demo slugs, or Midnight addresses. */
  const serviceFor = useCallback(
    async (id: string): Promise<MarketService> => {
      if (id.startsWith('demo-')) return demoSingleton;
      await loadLace();
      return lace.current!.market();
    },
    [loadLace],
  );

  const market: MarketService | null = mode === 'demo' ? demoSingleton : live;

  return {
    mode,
    setMode,
    market,
    demo: demoSingleton,
    live,
    loadLace,
    serviceFor,
    wallet,
    connectHint,
    connect,
    disconnect,
    walletOpen,
    openWallet: () => setWalletOpen(true),
    closeWallet: () => setWalletOpen(false),
    logs,
    log,
    proofServerOk,
    refreshProofServer,
    proofServerCommand: PROOF_SERVER_COMMAND as string,
    proving,
    setProvingMode,
    provingNotice: provingNotice(proving),
    hostedProvingAvailable: hostedAvailable(),
    registryAddress: REGISTRY_ADDRESS as string | null,
    pilotAddress: PILOT_ADDRESS as string | null,
    /** Bumps when demo data changes, so loaders can refresh. */
    version,
  };
}

export type Market = ReturnType<typeof useMarketState>;
const MarketContext = createContext<Market | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const value = useMarketState();
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): Market {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider');
  return ctx;
}
