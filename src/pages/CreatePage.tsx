import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { useNow } from '../hooks/useTime';
import type { Auction, Category, NewAuctionInput, Receipt } from '../types/auction';
import {
  buildTerms,
  CATEGORIES,
  DURATION_PRESETS,
  METADATA_LIMITS,
  metadataProblems,
} from '../lib/auction/model.js';
import { formatNumber, seedFrom } from '../lib/auction/view';
import { AuctionTile } from '../components/AuctionTile';
import {
  DemoNotice,
  LogPanel,
  MarketSwitch,
  Notice,
  PageHead,
  Readiness,
  ReceiptLine,
} from '../components/AppBits';
import { EASE, Label } from '../components/primitives';

const STEPS = ['Item', 'Terms', 'Review'];

type Done = { id: string; receipt: Receipt; note?: string };

export default function CreatePage() {
  const market = useMarket();
  const now = useNow();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<NewAuctionInput>({
    title: '',
    description: '',
    category: 'Digital Collectibles',
    imageUrl: '',
    startingBid: '1000',
    minIncrement: '100',
    durationSeconds: 86400,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const set = (patch: Partial<NewAuctionInput>) => setForm((f) => ({ ...f, ...patch }));

  const isDemo = market.mode === 'demo';
  const itemProblems = metadataProblems({
    title: form.title.trim(),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
  });
  const termsProblem = useMemo(() => {
    try {
      buildTerms(form, now);
      return null;
    } catch (err: any) {
      return err.message as string;
    }
  }, [form, now]);

  const preview: Auction = useMemo(() => {
    let starting = 0n;
    let increment = 0n;
    try {
      const t = buildTerms(form, now);
      starting = t.startingBid;
      increment = t.minIncrement;
    } catch {
      /* the preview shows zeros until the terms are valid */
    }
    return {
      id: 'preview',
      source: isDemo ? 'demo' : 'midnight',
      lot: 'New',
      title: form.title.trim() || 'Your auction',
      description: form.description,
      category: form.category,
      imageUrl: /^https:\/\//.test(form.imageUrl) ? form.imageUrl : '',
      visualSeed: seedFrom(form.title || 'midbid'),
      currency: 'tNIGHT',
      startingBid: starting,
      minIncrement: increment,
      highBid: 0n,
      bidCount: 0n,
      startsAt: BigInt(now),
      endsAt: BigInt(now + form.durationSeconds),
      storedStatus: 'OPEN',
      showHighBid: true,
      bidderPrivacy: 'private',
    };
  }, [form, now, isDemo]);

  const canNext = step === 0 ? itemProblems.length === 0 : !termsProblem;
  const ready = isDemo || (market.wallet.status === 'connected' && market.proofServerOk !== false);

  const submit = async () => {
    if (!market.market) return;
    setBusy(true);
    setError(null);
    try {
      setDone(await market.market.createAuction(form));
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="shell pb-32 pt-44">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl"
        >
          <Label tone="ember" live>
            {isDemo ? 'Open in the demo market' : 'Open on Midnight Preprod'}
          </Label>
          <h1 className="mt-6 text-display">Your auction is open.</h1>
          <p className="mt-6 text-[19px] leading-relaxed text-white/72">
            The terms are locked.{' '}
            {isDemo
              ? 'It lives in this browser for this visit.'
              : 'Only this browser holds the seller secret that can cancel or settle it.'}
          </p>
          <div className="mt-8">
            <ReceiptLine receipt={done.receipt} />
          </div>
          {done.note && (
            <div className="mt-6">
              <Notice tone="warn">{done.note}</Notice>
            </div>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={`/auction/${done.id}`} className="btn-primary">
              Open auction <ArrowRight size={16} className="arrow" aria-hidden />
            </Link>
            <button
              className="btn-secondary"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(`${window.location.origin}/auction/${done.id}`)
                  .catch(() => {})
              }
            >
              Copy link
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="shell pb-32">
      <PageHead
        label="Create"
        title={
          <>
            Your auction.
            <br />
            Your rules.
          </>
        }
      >
        <MarketSwitch />
      </PageHead>

      <ol className="mt-10 flex items-center gap-4" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-4">
            <span
              aria-current={i === step ? 'step' : undefined}
              className={`label num ${i === step ? 'text-ember' : i < step ? 'text-white/72' : ''}`}
            >
              {String(i + 1).padStart(2, '0')} {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-white/16 sm:w-16" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="mt-14 grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="space-y-10"
            >
              {step === 0 && (
                <>
                  <Field
                    label="Item"
                    hint={`${form.title.length}/${METADATA_LIMITS.title}`}
                    htmlFor="title"
                  >
                    <input
                      id="title"
                      className="field text-3xl tracking-[-0.03em]"
                      value={form.title}
                      maxLength={METADATA_LIMITS.title}
                      onChange={(e) => set({ title: e.target.value })}
                      placeholder="Limited Digital Artifact"
                    />
                  </Field>
                  <fieldset>
                    <legend className="label">Category</legend>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(CATEGORIES as Category[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => set({ category: c })}
                          aria-pressed={form.category === c}
                          className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${form.category === c ? 'border-ember text-white' : 'border-white/8 text-white/48 hover:text-white'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <Field
                    label="Description"
                    hint={`${form.description.length}/${METADATA_LIMITS.description}`}
                    htmlFor="desc"
                  >
                    <textarea
                      id="desc"
                      rows={3}
                      className="field resize-none text-[17px] leading-relaxed"
                      value={form.description}
                      maxLength={METADATA_LIMITS.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="What the winner receives, and how it is handed over."
                    />
                  </Field>
                  <Field label="Image link · optional" htmlFor="img">
                    <input
                      id="img"
                      className="field text-[17px]"
                      inputMode="url"
                      value={form.imageUrl}
                      onChange={(e) => set({ imageUrl: e.target.value })}
                      placeholder="https://"
                    />
                  </Field>
                  <p className="flex items-start gap-2 text-[13px] text-white/48">
                    <Lock size={13} className="mt-0.5" aria-hidden /> Listing details are public and
                    fixed once the auction opens.
                  </p>
                  {form.title && itemProblems.length > 0 && (
                    <p className="text-[14px] text-bad">{itemProblems[0]}</p>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid gap-10 sm:grid-cols-2">
                    <Field label="Starting bid · tNIGHT" htmlFor="start">
                      <input
                        id="start"
                        className="field num text-3xl tracking-[-0.03em]"
                        inputMode="numeric"
                        value={form.startingBid}
                        onChange={(e) => set({ startingBid: e.target.value.replace(/[^\d]/g, '') })}
                      />
                    </Field>
                    <Field label="Minimum increment · tNIGHT" htmlFor="inc">
                      <input
                        id="inc"
                        className="field num text-3xl tracking-[-0.03em]"
                        inputMode="numeric"
                        value={form.minIncrement}
                        onChange={(e) =>
                          set({ minIncrement: e.target.value.replace(/[^\d]/g, '') })
                        }
                      />
                    </Field>
                  </div>
                  <fieldset>
                    <legend className="label">Duration</legend>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {DURATION_PRESETS.map((p: { label: string; seconds: number }) => (
                        <button
                          key={p.seconds}
                          type="button"
                          aria-pressed={form.durationSeconds === p.seconds}
                          onClick={() => set({ durationSeconds: p.seconds })}
                          className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${form.durationSeconds === p.seconds ? 'border-ember text-white' : 'border-white/8 text-white/48 hover:text-white'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="flex items-center justify-between border-y border-white/8 py-5">
                    <span className="label">Display current high bid</span>
                    <span className="inline-flex items-center gap-3 text-[15px]">
                      On <Lock size={12} className="text-white/28" aria-label="always on" />
                    </span>
                  </div>
                  <ul className="space-y-2 text-[14px] text-white/48">
                    <li>The contract enforces the starting bid, the increment and the end time.</li>
                    <li>You can cancel only before the first bid.</li>
                    <li>Bids are commitments to pay, not escrowed funds.</li>
                  </ul>
                  {termsProblem && <p className="text-[14px] text-bad">{termsProblem}</p>}
                </>
              )}

              {step === 2 && (
                <>
                  <dl className="divide-y divide-white/8 border-y border-white/8">
                    <Row k="Item" v={preview.title} />
                    <Row k="Starting bid" v={`${formatNumber(preview.startingBid)} tNIGHT`} />
                    <Row k="Minimum increment" v={`${formatNumber(preview.minIncrement)} tNIGHT`} />
                    <Row
                      k="Duration"
                      v={
                        DURATION_PRESETS.find(
                          (p: { seconds: number }) => p.seconds === form.durationSeconds,
                        )?.label ?? ''
                      }
                    />
                    <Row k="Display current high bid" v="On" />
                  </dl>
                  {isDemo ? (
                    <DemoNotice>
                      This creates a demo auction in your browser. Switch to Midnight Preprod to
                      deploy a real one.
                    </DemoNotice>
                  ) : (
                    <>
                      <Notice>
                        Lace asks you to approve twice: once to create the auction contract, once to
                        list it in Explore.
                      </Notice>
                      <Readiness action="create an auction" />
                    </>
                  )}
                  {error && <Notice tone="bad">{error}</Notice>}
                  <button
                    onClick={submit}
                    disabled={!ready || busy || !market.market}
                    className="btn-primary w-full"
                  >
                    {busy ? (isDemo ? 'Creating…' : 'Approve in Lace…') : 'Create auction'}
                  </button>
                  {!isDemo && <LogPanel />}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-14 flex items-center justify-between border-t border-white/8 pt-6">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-quiet disabled:opacity-30"
            >
              <ArrowLeft size={15} aria-hidden /> Back
            </button>
            {step < 2 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="btn-primary"
              >
                Continue <Check size={15} aria-hidden />
              </button>
            )}
          </div>
        </div>

        <aside
          className="lg:col-span-4 lg:col-start-9 lg:sticky lg:top-28 lg:self-start"
          aria-label="Preview"
        >
          <Label>Preview</Label>
          <div className="pointer-events-none mt-5">
            <AuctionTile auction={preview} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label flex justify-between">
        {label}
        {hint && <span className="num normal-case tracking-normal text-white/28">{hint}</span>}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-4">
      <dt className="label">{k}</dt>
      <dd className="text-right text-[17px]">{v}</dd>
    </div>
  );
}
