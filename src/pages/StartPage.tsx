// Get ready: the four things a Preprod bidder needs, each with live status.
//
// Written because the first pilot testers all stalled in the same places, and a
// checklist that checks itself beats a page of instructions.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Copy, Loader2, X } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { PageHead } from '../components/AppBits';
import { Label } from '../components/primitives';

type State = 'unknown' | 'checking' | 'ready' | 'missing';

function Status({ state }: { state: State }) {
  if (state === 'ready')
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-ember text-void">
        <Check size={14} aria-label="ready" />
      </span>
    );
  if (state === 'checking')
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border border-white/16 text-white/48">
        <Loader2 size={13} className="animate-spin" aria-label="checking" />
      </span>
    );
  if (state === 'missing')
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border border-white/28 text-white/48">
        <X size={13} aria-label="not ready" />
      </span>
    );
  return <span className="grid h-7 w-7 place-items-center rounded-full border border-white/8" />;
}

function Step({
  n,
  title,
  state,
  children,
}: {
  n: string;
  title: string;
  state: State;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[28px_1fr] gap-5 border-t border-white/8 py-8">
      <Status state={state} />
      <div>
        <Label className={state === 'ready' ? 'text-ember' : ''}>Step {n}</Label>
        <h2 className="mt-3 text-[26px] leading-none tracking-[-0.035em]">{title}</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-white/72">{children}</div>
      </div>
    </li>
  );
}

export default function StartPage() {
  const market = useMarket();
  const [laceFound, setLaceFound] = useState<State>('checking');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    market
      .loadLace()
      .then((l) => l.isAvailable())
      .then((ok) => setLaceFound(ok ? 'ready' : 'missing'))
      .catch(() => setLaceFound('missing'));
    market.refreshProofServer().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connected = market.wallet.status === 'connected';
  const dust = market.wallet.dust;
  const walletState: State = connected ? 'ready' : laceFound === 'missing' ? 'missing' : 'unknown';
  const dustState: State = !connected ? 'unknown' : dust && dust.balance > 0n ? 'ready' : 'missing';
  const proofState: State =
    market.proofServerOk === null ? 'checking' : market.proofServerOk ? 'ready' : 'missing';
  const ready = connected && proofState === 'ready' && dustState === 'ready';

  const copy = () => {
    navigator.clipboard?.writeText(market.proofServerCommand).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  };

  return (
    <div className="shell max-w-4xl pb-32">
      <PageHead label="Get ready" title={<>Four things, then you can bid.</>}>
        <p className="max-w-xs text-[15px] leading-relaxed text-white/48">
          This page checks itself. Anything already set up shows a tick.
        </p>
      </PageHead>

      <p className="mt-10 text-[17px] leading-relaxed text-white/72">
        Want to look around first? The{' '}
        <Link to="/explore" className="text-ember hover:underline">
          demo market
        </Link>{' '}
        works with no wallet and no setup at all. The steps below are only for bidding on Midnight
        Preprod with test tokens.
      </p>

      <ol className="mt-12">
        <Step n="01" title="Install Lace and switch it to Preprod" state={walletState}>
          <p>
            MidBid signs every action through the Lace wallet extension and never sees your recovery
            phrase.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.lace.io/"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary h-10 px-4 text-[14px]"
            >
              Get Lace <ArrowUpRight size={14} aria-hidden />
            </a>
            <button onClick={market.openWallet} className="btn-primary h-10 px-4 text-[14px]">
              {connected ? `Connected ${market.wallet.maskedAddress}` : 'Connect wallet'}
            </button>
          </div>
        </Step>

        <Step
          n="02"
          title="Get test tNIGHT from the faucet"
          state={dustState === 'ready' ? 'ready' : 'unknown'}
        >
          <p>
            Preprod runs on test tokens with no value. Paste your address from Lace into the faucet.
          </p>
          <a
            href="https://faucet.preprod.midnight.network"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary h-10 px-4 text-[14px]"
          >
            Open the faucet <ArrowUpRight size={14} aria-hidden />
          </a>
        </Step>

        <Step n="03" title="Register tNIGHT so it generates DUST" state={dustState}>
          <p>
            DUST pays transaction fees, and it is generated by tNIGHT you have registered in Lace.
            Without it, a bid cannot be submitted.
          </p>
          {connected && dustState === 'missing' && (
            <p className="text-white">
              Your wallet is connected but has no DUST yet. Register your tNIGHT in Lace, wait a few
              minutes, then reconnect.
            </p>
          )}
        </Step>

        <Step n="04" title="Start your local proof server" state={proofState}>
          <p>
            Your bid is proven on your own machine, which is what keeps the amount and your secret
            off the network. The proof server is one Docker command.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 overflow-x-auto bg-panel px-3 py-2.5 font-mono text-[12px] text-white/72">
              {market.proofServerCommand}
            </code>
            <button
              onClick={copy}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/16 text-white/48 hover:text-white"
              aria-label="Copy the command"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-[13px] text-white/48">
            On the hosted site, Chrome asks once for permission to reach apps on your device. Allow
            it, or this check fails even while the server runs.
          </p>
          <button onClick={() => market.refreshProofServer()} className="btn-quiet">
            Check again
          </button>
        </Step>
      </ol>

      <div className="mt-12 border-t border-white/8 pt-10">
        {ready ? (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-[22px] tracking-[-0.03em]">You are ready to bid.</p>
            <Link to="/explore" className="btn-primary">
              Find a lot <ArrowRight size={16} className="arrow" aria-hidden />
            </Link>
            <Link to="/join" className="btn-secondary">
              Join the pilot
            </Link>
          </div>
        ) : (
          <p className="text-[15px] text-white/48">
            Stuck on a step? Use the Feedback button in the corner and tell us where. That is
            exactly the kind of report that changes this page.
          </p>
        )}
      </div>
    </div>
  );
}
