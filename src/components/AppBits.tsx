// Pieces used by the application pages: market switch, readiness, receipts, log.
import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useMarket, type MarketMode } from '../hooks/useMarket';
import type { Receipt } from '../types/auction';
import { EASE, Label } from './primitives';

export function PageHead({
  label,
  title,
  children,
}: {
  label: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-8 border-b border-white/8 pb-12 pt-36 md:grid-cols-12 md:items-end sm:pt-44">
      <div className="md:col-span-7">
        <Label tone="ember">{label}</Label>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-6 text-display"
        >
          {title}
        </motion.h1>
      </div>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="md:col-span-5 md:justify-self-end"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

/** Live Preprod or demo market. The choice is always visible. */
export function MarketSwitch() {
  const market = useMarket();
  const options: { id: MarketMode; label: string }[] = [
    { id: 'live', label: 'Midnight Preprod' },
    { id: 'demo', label: 'Demo market' },
  ];
  return (
    <div
      className="inline-flex rounded-full border border-white/8 p-1"
      role="radiogroup"
      aria-label="Market"
    >
      {options.map((o) => {
        const on = market.mode === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={on}
            onClick={() => market.setMode(o.id)}
            className={`relative rounded-full px-4 py-2 text-[13px] transition-colors ${on ? 'text-void' : 'text-white/48 hover:text-white'}`}
          >
            {on && (
              <motion.span
                layoutId="market-switch"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ duration: 0.4, ease: EASE }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-l border-white/28 pl-4 text-[14px] leading-relaxed text-white/72">
      <Label className="mt-[5px] shrink-0 text-white/48">Demo</Label>
      <span>
        {children ??
          'Sample data in your browser. Nothing is sent to Midnight and no transaction is created.'}
      </span>
    </div>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'bad' | 'good';
  children: ReactNode;
}) {
  const color = {
    info: 'border-white/28',
    warn: 'border-ember',
    bad: 'border-bad',
    good: 'border-ember',
  }[tone];
  return (
    <div
      className={`border-l ${color} pl-4 text-[14px] leading-relaxed text-white/72`}
      role="status"
    >
      {children}
    </div>
  );
}

/** What an action actually produced. A demo receipt never shows an identifier. */
export function ReceiptLine({ receipt }: { receipt: Receipt | null | undefined }) {
  if (!receipt) return null;
  if (receipt.kind === 'demo')
    return <Label className="text-white/28">Demo · no transaction created</Label>;
  const id = receipt.txHash ?? receipt.txId;
  if (!id) return <Label>Accepted by the contract</Label>;
  return (
    <span className="inline-flex items-center gap-3">
      <Label>Transaction</Label>
      <span className="num max-w-[220px] truncate font-mono text-[12px] text-white/72" title={id}>
        {id}
      </span>
    </span>
  );
}

/** What a live action needs, explained before it fails deep in the stack. */
export function Readiness({ action }: { action: string }) {
  const market = useMarket();
  if (market.wallet.status !== 'connected') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border border-white/8 p-5">
        <p className="text-[14px] text-white/72">Connect Lace on Preprod to {action}.</p>
        <button onClick={market.openWallet} className="btn-primary h-10 px-5 text-[14px]">
          Connect Wallet
        </button>
      </div>
    );
  }
  if (market.proofServerOk === false) {
    return (
      <Notice tone="warn">
        <p className="text-white">Start your local proof server to {action}.</p>
        <p className="mt-1">Proofs are made on your machine, so your secrets never leave it.</p>
        <code className="mt-3 block overflow-x-auto bg-panel px-3 py-2.5 font-mono text-[11px]">
          {market.proofServerCommand}
        </code>
        <button onClick={() => market.refreshProofServer()} className="btn-quiet mt-3">
          Check again
        </button>
      </Notice>
    );
  }
  if (market.wallet.dust && market.wallet.dust.balance === 0n) {
    return (
      <Notice tone="warn">
        This wallet has no DUST for fees. Register tNIGHT for DUST generation in Lace, then
        reconnect.
      </Notice>
    );
  }
  return null;
}

export function useLiveReady() {
  const market = useMarket();
  return market.wallet.status === 'connected' && market.proofServerOk !== false;
}

export function LogPanel() {
  const market = useMarket();
  const [open, setOpen] = useState(false);
  if (market.logs.length === 0) return null;
  return (
    <div className="border-t border-white/8 pt-4">
      <button onClick={() => setOpen((o) => !o)} className="btn-quiet" aria-expanded={open}>
        Network activity
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 max-h-64 space-y-1 overflow-y-auto font-mono text-[11px]"
          >
            {market.logs.map((l) => (
              <li
                key={l.id}
                className={
                  l.kind === 'err'
                    ? 'text-bad'
                    : l.kind === 'ok'
                      ? 'text-ember-soft'
                      : 'text-white/48'
                }
              >
                <span className="text-white/28">{new Date(l.at).toLocaleTimeString()} </span>
                {l.text}
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
