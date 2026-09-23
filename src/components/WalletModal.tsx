import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, Loader2, X } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { EASE, Label, LogoMark } from './primitives';
import { ProvingSwitch } from './AppBits';

const LACE_URL = 'https://www.lace.io/';

export function WalletModal() {
  const market = useMarket();
  const { wallet } = market;
  const dialog = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!market.walletOpen) return;
    market.clearConnectHint();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && market.closeWallet();
    window.addEventListener('keydown', onKey);
    dialog.current?.focus();
    // Detection loads the Midnight stack only once the modal is opened.
    market
      .loadLace()
      .then((l) => l.isAvailable())
      .then(setAvailable)
      .catch(() => setAvailable(false));
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market.walletOpen]);

  const connecting = wallet.status === 'connecting';
  const connected = wallet.status === 'connected';

  return (
    <AnimatePresence>
      {market.walletOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            className="absolute inset-0 bg-void/70 backdrop-blur-md"
            aria-label="Close wallet dialog"
            onClick={market.closeWallet}
          />
          <motion.div
            ref={dialog}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-title"
            initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative w-full max-w-[440px] overflow-hidden border border-white/8 bg-abyss p-7 outline-none sm:rounded-2xl"
          >
            <div
              className="ember-haze pointer-events-none absolute -right-24 -top-24 h-64 w-64"
              aria-hidden
            />
            <div className="relative flex items-start justify-between">
              <div>
                <Label tone={connected ? 'ember' : 'muted'} live={connected}>
                  {connected ? 'Connected' : connecting ? 'Connecting' : 'Wallet'}
                </Label>
                <h2 id="wallet-title" className="mt-4 text-[28px] leading-none tracking-[-0.04em]">
                  {connected ? 'You are in.' : 'Connect wallet'}
                </h2>
              </div>
              <button
                onClick={market.closeWallet}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/8 text-white/48 hover:text-white"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {!connected && (
              <div className="relative mt-8 space-y-3">
                <button
                  onClick={() => market.connect()}
                  disabled={connecting || available === false}
                  className="group flex w-full items-center gap-4 border border-white/8 bg-panel px-5 py-4 text-left transition-colors hover:border-white/28 disabled:opacity-60"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-raised">
                    {connecting ? (
                      <Loader2 size={16} className="animate-spin text-ember" />
                    ) : (
                      <LogoMark size={18} />
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px]">
                      {wallet.status === 'error' || market.connectHint
                        ? 'Lace · try again'
                        : 'Lace'}
                    </span>
                    <span className="block text-[13px] text-white/48">
                      {connecting
                        ? (market.connectHint ?? 'Approve the request in Lace')
                        : available === false
                          ? 'Not detected in this browser'
                          : 'Midnight Preprod'}
                    </span>
                  </span>
                  <span className="label text-white/28 group-hover:text-white/72">
                    {available === null ? 'Detecting' : available ? 'Detected' : ''}
                  </span>
                </button>

                {connecting && (
                  <p className="border-l border-white/16 pl-3 text-[13px] leading-relaxed text-white/72">
                    No Lace window? Click the Lace icon in your browser toolbar: the request is
                    waiting there. Browsers only open an extension window from a click, so if the
                    request expires, press Connect again.
                  </p>
                )}

                {market.connectHint && !connecting && (
                  <p className="border-l border-ember pl-3 text-[13px] leading-relaxed text-white">
                    {market.connectHint}
                  </p>
                )}

                {available === false && (
                  <a href={LACE_URL} target="_blank" rel="noreferrer" className="btn-quiet">
                    Install Lace <ArrowUpRight size={14} aria-hidden />
                  </a>
                )}

                {wallet.status === 'error' && wallet.error && (
                  <div className="border-l border-bad/60 pl-3">
                    <p className="text-[13px] leading-relaxed text-white/72">{wallet.error}</p>
                    {/^Lace restarted/.test(wallet.error) && (
                      <button
                        onClick={() => window.location.reload()}
                        className="btn-quiet mt-2 text-ember"
                      >
                        Reload the page
                      </button>
                    )}
                  </div>
                )}

                <p className="pt-4 text-[13px] leading-relaxed text-white/48">
                  MidBid never sees your recovery phrase. Lace signs every action.{' '}
                  {market.provingNotice}
                </p>
              </div>
            )}

            {connected && (
              <div className="relative mt-8">
                <dl className="divide-y divide-white/8 border-y border-white/8">
                  <Row
                    k="Account"
                    v={<span className="num font-mono">{wallet.maskedAddress}</span>}
                  />
                  <Row k="Network" v="Midnight Preprod" />
                  <Row
                    k="DUST"
                    v={wallet.dust ? (wallet.dust.balance > 0n ? 'Available' : 'Empty') : 'Unknown'}
                  />
                  <Row
                    k="Proof server"
                    v={
                      market.proofServerOk === null
                        ? 'Checking'
                        : market.proofServerOk
                          ? 'Running'
                          : 'Not reachable'
                    }
                  />
                </dl>
                {market.proofServerOk === false && (
                  <div className="mt-5">
                    <p className="text-[13px] text-white/48">Start it to place private bids:</p>
                    <code className="mt-2 block overflow-x-auto bg-panel px-3 py-2.5 font-mono text-[11px] text-white/72">
                      {market.proofServerCommand}
                    </code>
                    <button onClick={() => market.refreshProofServer()} className="btn-quiet mt-3">
                      Check again
                    </button>
                  </div>
                )}
                <div className="mt-6">
                  <ProvingSwitch />
                </div>
                <div className="mt-7 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[13px] text-white/72">
                    <Check size={14} className="text-ember" /> Only this masked address is shown
                  </span>
                  <button onClick={market.disconnect} className="btn-quiet">
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 text-[14px]">
      <dt className="label">{k}</dt>
      <dd className="text-white/72">{v}</dd>
    </div>
  );
}
