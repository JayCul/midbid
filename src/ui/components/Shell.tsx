import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Code2, LogOut, Menu, ScrollText, Wallet, X } from 'lucide-react';
import type { MidbidApi } from '../useMidbid';
import type { Theme } from '../useTheme';
import { Logo, Notice, ThemeToggle, short } from './bits';

// Set VITE_X_PROFILE_URL once the product profile exists; the link hides until then.
export const X_PROFILE_URL: string | undefined = import.meta.env.VITE_X_PROFILE_URL || undefined;
export const REPO_URL = 'https://github.com/JayCul/midbid';

const NAV = [
  { to: '#/browse', label: 'Browse', page: 'browse' },
  { to: '#/create', label: 'Create', page: 'create' },
  { to: '#/me', label: 'My activity', page: 'me' },
];

export function Header({
  api,
  page,
  theme,
  onToggleTheme,
  onOpenLog,
}: {
  api: MidbidApi;
  page: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenLog: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-canvas items-center gap-4 px-4 sm:px-6">
        <a href="#/" className="flex items-center gap-2.5" aria-label="Midbid home">
          <Logo />
          <span className="font-display text-lg font-semibold tracking-tight">Midbid</span>
          <span className="hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:inline">
            Preprod
          </span>
        </a>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <a
              key={n.to}
              href={n.to}
              aria-current={page === n.page ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                page === n.page ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenLog}
            className="hidden h-9 items-center gap-2 rounded-xl border border-line px-3 text-xs text-muted transition hover:text-ink sm:inline-flex"
            aria-label="Open activity log"
          >
            <ScrollText size={14} aria-hidden /> Log
            {api.logs.some((l) => l.kind === 'err') && (
              <span className="h-1.5 w-1.5 rounded-full bg-bad" aria-label="has errors" />
            )}
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <ConnectButton api={api} />
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-line md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col px-4 py-2">
              {[...NAV, { to: '#/', label: 'Home', page: 'home' }].map((n) => (
                <a
                  key={n.to}
                  href={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-sm text-muted hover:text-ink"
                >
                  {n.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenLog();
                }}
                className="rounded-lg px-2 py-3 text-left text-sm text-muted hover:text-ink"
              >
                Activity log
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function ConnectButton({ api, full = false }: { api: MidbidApi; full?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  if (api.wallet) {
    return (
      <div className="flex items-center gap-1">
        <span
          className="hidden h-9 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-mono text-xs sm:inline-flex"
          title={api.wallet.shielded}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden />
          {short(api.wallet.shielded, 14, 4)}
        </span>
        <button
          onClick={api.disconnect}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line text-muted hover:text-ink"
          aria-label="Disconnect wallet"
          title="Disconnect"
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }
  return (
    <div className={full ? 'flex flex-col gap-2' : ''}>
      <button
        onClick={() => {
          setError(null);
          api.connect().catch((err) => setError(err?.message ?? String(err)));
        }}
        disabled={api.connecting}
        className={`btn-primary ${full ? '' : 'h-9 px-3.5 py-0'}`}
      >
        <Wallet size={15} aria-hidden />
        {api.connecting ? 'Connecting…' : full ? 'Connect Lace wallet' : 'Connect'}
      </button>
      {full && error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}

/** Explains what is missing before an action fails deep in the provider stack. */
export function Readiness({ api, action }: { api: MidbidApi; action: string }) {
  if (!api.wallet) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-muted">
          Connect Lace on Preprod to {action}. Midbid never sees your seed; Lace signs every
          transaction.
        </p>
        <ConnectButton api={api} full />
      </div>
    );
  }
  if (api.proofServerOk === false) {
    return (
      <Notice tone="warn">
        <p className="font-medium">Start your local proof server to {action}.</p>
        <p className="mt-1 text-muted">
          Proofs are generated on your machine, so your bidder and seller secrets never leave it.
        </p>
        <code className="mt-2 block overflow-x-auto rounded-lg bg-canvas px-3 py-2 font-mono text-xs">
          {api.proofServerCommand}
        </code>
        <button onClick={() => api.refreshProofServer()} className="btn-ghost mt-3 py-1.5 text-xs">
          Check again
        </button>
        <p className="mt-2 text-xs text-muted">
          On the hosted site, Chrome asks to let this page reach apps on your device. Allow it, or
          the check fails even with the server running.
        </p>
      </Notice>
    );
  }
  if (api.wallet.dust && api.wallet.dust.balance === 0n) {
    return (
      <Notice tone="warn">
        Your wallet has no DUST, so it cannot pay transaction fees. Register tNIGHT for DUST
        generation in Lace, then reconnect.
      </Notice>
    );
  }
  return null;
}

export function LogDrawer({
  api,
  open,
  onClose,
}: {
  api: MidbidApi;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Activity log"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-semibold">Activity log</h2>
                <p className="text-xs text-muted">
                  Every wallet, proof and network step, as it happens.
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line"
                aria-label="Close log"
              >
                <X size={14} />
              </button>
            </div>
            <ol className="flex-1 space-y-1 overflow-y-auto p-4 font-mono text-xs">
              {api.logs.length === 0 && <li className="text-muted">Nothing yet.</li>}
              {api.logs.map((l) => (
                <li
                  key={l.id}
                  className={`break-words ${l.kind === 'err' ? 'text-bad' : l.kind === 'ok' ? 'text-good' : 'text-muted'}`}
                >
                  <span className="opacity-50">{new Date(l.at).toLocaleTimeString()} </span>
                  {l.text}
                </li>
              ))}
            </ol>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-canvas flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span>Midbid runs on Midnight Preprod. Test tokens only.</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-ink"
          >
            <Code2 size={14} aria-hidden /> Source
          </a>
          {X_PROFILE_URL && (
            <a href={X_PROFILE_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
              X / Twitter
            </a>
          )}
          <a href="#/setup" className="hover:text-ink">
            Operator
          </a>
        </div>
      </div>
    </footer>
  );
}
