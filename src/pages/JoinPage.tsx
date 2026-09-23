// The pilot page: join the public list, and read it.
//
// This is the one place in MidBid where a wallet address is published, and it
// only happens because someone chose to. The page says exactly what is
// disclosed before the wallet is asked for anything.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, EyeOff, ShieldCheck } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { useLoader } from '../hooks/useTime';
import { maskAddress } from '../lib/auction/view';
import type { Member, RoleName } from '../services/midnight/PilotService';
import type { Receipt } from '../types/auction';
import { Notice, PageHead, Readiness, ReceiptLine } from '../components/AppBits';
import { EASE, Label } from '../components/primitives';

const ROLE_OPTIONS: { id: RoleName; label: string; hint: string }[] = [
  { id: 'BIDDER', label: 'Bidder', hint: 'I want to bid on lots' },
  { id: 'SELLER', label: 'Seller', hint: 'I want to run auctions' },
  { id: 'BUILDER', label: 'Builder', hint: 'I build on Midnight' },
  { id: 'TESTER', label: 'Tester', hint: 'I am here to break things' },
];

const TARGET = 50;

export default function JoinPage() {
  const market = useMarket();
  const [role, setRole] = useState<RoleName>('BIDDER');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Receipt | null>(null);
  const [pilot, setPilot] = useState<any>(null);

  useEffect(() => {
    let live = true;
    market.loadLace().then((l) => live && setPilot(l.pilot()));
    return () => {
      live = false;
    };
  }, [market.loadLace, market.wallet.status]);

  const list = useLoader(
    async () => (pilot ? ((await pilot.members()) as Member[]) : []),
    [pilot, done],
    30000,
  );
  const members = list.data ?? [];
  const connected = market.wallet.status === 'connected';

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      setDone(await pilot.join(handle, role));
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell pb-32">
      <PageHead label="Pilot" title={<>Be counted, on your terms.</>}>
        <div className="text-right">
          <p className="num text-5xl tracking-[-0.04em]">
            {members.length}
            <span className="text-white/28">/{TARGET}</span>
          </p>
          <Label className="mt-2">Wallets joined</Label>
        </div>
      </PageHead>

      <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <p className="text-[19px] leading-relaxed text-white/72">
            MidBid cannot tell you who its bidders are. A bid carries a commitment, never a wallet,
            so there is no list to export. If you want your participation to be public, you say so
            here, in a separate contract, with a separate transaction.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="border-l border-ember pl-4">
              <Label tone="ember">This publishes</Label>
              <ul className="mt-3 space-y-1.5 text-[15px] text-white/72">
                <li>Your shielded address</li>
                <li>A handle, if you add one</li>
                <li>The role you pick and the time</li>
              </ul>
            </div>
            <div className="border-l border-white/16 pl-4">
              <Label>This stays private</Label>
              <ul className="mt-3 space-y-1.5 text-[15px] text-white/72">
                <li>Which auctions you bid in</li>
                <li>What you bid</li>
                <li>Whether you bid at all</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <fieldset>
              <legend className="label">Why are you here</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    aria-pressed={role === r.id}
                    title={r.hint}
                    className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${
                      role === r.id
                        ? 'border-ember text-white'
                        : 'border-white/8 text-white/48 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="handle" className="label">
                Handle, optional
              </label>
              <input
                id="handle"
                className="field mt-2 text-lg"
                value={handle}
                maxLength={40}
                placeholder="@you, or leave blank"
                onChange={(e) => setHandle(e.target.value)}
              />
              <p className="mt-2 text-[13px] text-white/48">
                A handle makes the list readable. Leaving it blank publishes only the address.
              </p>
            </div>

            {!market.pilotAddress && (
              <Notice tone="warn">No pilot register is configured for this build yet.</Notice>
            )}
            {error && <Notice tone="bad">{error}</Notice>}
            {done && (
              <Notice tone="good">
                <p className="flex items-center gap-2 text-white">
                  <Check size={14} className="text-ember" aria-hidden /> You are on the list.
                </p>
                <div className="mt-2">
                  <ReceiptLine receipt={done} />
                </div>
              </Notice>
            )}

            <Readiness action="join the pilot" />
            <button
              className="btn-primary w-full sm:w-auto"
              disabled={!connected || busy || !market.pilotAddress || Boolean(done)}
              onClick={join}
            >
              {busy ? 'Approve in Lace…' : done ? 'Joined' : 'Publish my address'}
            </button>
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-white/48">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ember" aria-hidden />
              One transaction from your own wallet. You can bid without ever doing this.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="flex items-baseline justify-between">
            <Label>The cohort</Label>
            <Label className="text-white/28">Read from Preprod</Label>
          </div>
          <div className="mt-5 h-1 w-full bg-white/8">
            <motion.div
              className="h-1 bg-ember"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (members.length / TARGET) * 100)}%` }}
              transition={{ duration: 1, ease: EASE }}
            />
          </div>

          {list.error && (
            <div className="mt-6">
              <Notice tone="bad">{list.error}</Notice>
            </div>
          )}

          <ol className="mt-6 divide-y divide-white/8 border-y border-white/8">
            {members.map((m, i) => (
              <li key={m.key} className="flex items-center justify-between gap-4 py-3.5">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="num w-6 text-[13px] text-white/28">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-[15px]">{m.handle || 'Anonymous tester'}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Label className="hidden sm:inline-flex">{m.role.toLowerCase()}</Label>
                  <span className="num font-mono text-[12px] text-white/48" title={m.address}>
                    {maskAddress(m.address)}
                  </span>
                </span>
              </li>
            ))}
            {members.length === 0 && !list.loading && (
              <li className="py-6 text-[15px] text-white/48">Nobody has joined yet. Be first.</li>
            )}
          </ol>

          <p className="mt-6 flex items-start gap-2 text-[13px] leading-relaxed text-white/48">
            <EyeOff size={14} className="mt-0.5 shrink-0" aria-hidden />
            Addresses are shortened here. The full list, with the transaction that recorded each
            entry, is in docs/USERS.md and readable straight from the contract.
          </p>
        </div>
      </div>
    </div>
  );
}
