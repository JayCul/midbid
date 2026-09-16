import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Lock, Rocket } from 'lucide-react';
import type { MidbidApi } from '../useMidbid';
import { useNow } from '../hooks';
import { AuctionCard } from '../components/AuctionCard';
import { Notice, TxRef } from '../components/bits';
import { Readiness } from '../components/Shell';
import {
  CATEGORIES,
  DURATION_PRESETS,
  METADATA_LIMITS,
  buildMetadata,
  buildTerms,
  formatAmount,
  metadataProblems,
} from '../../lib/auction/model.js';

const STEPS = ['Item', 'Terms', 'Review'];

type Form = {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  startingBid: string;
  minIncrement: string;
  durationSeconds: number;
};

type Progress =
  | { stage: 'idle' }
  | { stage: 'deploying' }
  | { stage: 'done'; address: string; deploy: any; listing: any; listingError: string | null }
  | { stage: 'error'; message: string };

export default function Create({ api }: { api: MidbidApi }) {
  const now = useNow();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    title: '',
    description: '',
    category: 'Art',
    imageUrl: '',
    startingBid: '100',
    minIncrement: '10',
    durationSeconds: 3600,
  });
  const [progress, setProgress] = useState<Progress>({ stage: 'idle' });
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

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

  const preview = useMemo(() => {
    const terms = termsProblem ? null : buildTerms(form, now);
    return {
      address: 'preview',
      metadata: {
        title: form.title.trim() || 'Your auction title',
        description: form.description,
        category: form.category,
        imageUrl: /^https:\/\//.test(form.imageUrl) ? form.imageUrl : '',
      },
      startingBid: terms?.startingBid ?? 0n,
      minIncrement: terms?.minIncrement ?? 0n,
      startsAt: BigInt(now),
      endsAt: terms?.endsAt ?? BigInt(now + form.durationSeconds),
      highBid: 0n,
      bidCount: 0n,
      phase: 'DRAFT',
    };
  }, [form, now, termsProblem]);

  const canNext = step === 0 ? itemProblems.length === 0 : step === 1 ? !termsProblem : false;
  const ready = Boolean(api.wallet) && api.proofServerOk !== false;

  const deploy = async () => {
    setProgress({ stage: 'deploying' });
    try {
      const metadata = buildMetadata(form);
      // Terms are rebuilt at the moment of deploy so the start time is fresh.
      const terms = buildTerms(form);
      const result = await api.service.createAuction({ metadata, terms });
      api.remember('created', result.address);
      setProgress({ stage: 'done', ...result });
    } catch (err: any) {
      setProgress({ stage: 'error', message: err?.message ?? String(err) });
    }
  };

  if (progress.stage === 'done') {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-good/15 text-good">
            <Check size={22} aria-hidden />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Your auction is live on Preprod
          </h1>
          <p className="mt-2 text-sm text-muted">
            The terms are now fixed in the contract. Only this browser holds the seller secret that
            can cancel or settle it, so keep using it for this auction.
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="label">Contract address</dt>
              <dd className="break-all font-mono text-xs">{progress.address}</dd>
            </div>
            <div className="flex flex-wrap gap-4">
              <TxRef tx={progress.deploy} />
              {progress.listing && <TxRef tx={progress.listing} />}
            </div>
          </dl>
          {progress.listingError && (
            <div className="mt-4">
              <Notice tone="warn">
                The auction exists, but listing it in Browse failed: {progress.listingError}. Share
                the link below, or retry listing from the auction page.
              </Notice>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`#/auction/${progress.address}`} className="btn-primary">
              Open auction <ArrowRight size={15} aria-hidden />
            </a>
            <button
              className="btn-ghost"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(`${window.location.origin}/#/auction/${progress.address}`)
                  .catch(() => {})
              }
            >
              Copy share link
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-canvas px-4 pt-10 sm:px-6">
      <p className="eyebrow">Create</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Open an auction</h1>

      <ol className="mt-8 flex items-center gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              aria-current={i === step ? 'step' : undefined}
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                i < step
                  ? 'bg-good/20 text-good'
                  : i === step
                    ? 'bg-accent text-accent-ink'
                    : 'border border-line text-muted'
              }`}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </span>
            <span className={`text-sm ${i === step ? 'text-ink' : 'text-muted'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-2 h-px w-8 bg-line sm:w-16" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <Field label="Title" hint={`${form.title.length}/${METADATA_LIMITS.title}`}>
                    <input
                      className="input"
                      value={form.title}
                      maxLength={METADATA_LIMITS.title}
                      onChange={(e) => set({ title: e.target.value })}
                      placeholder="Signed first-edition print"
                    />
                  </Field>
                  <Field label="Category" group>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => set({ category: c })}
                          aria-pressed={form.category === c}
                          className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                            form.category === c
                              ? 'border-accent bg-accent/10 text-ink'
                              : 'border-line text-muted hover:text-ink'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field
                    label="Description"
                    hint={`${form.description.length}/${METADATA_LIMITS.description}`}
                  >
                    <textarea
                      className="input min-h-28"
                      value={form.description}
                      maxLength={METADATA_LIMITS.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Condition, what the winner receives, and how you will hand it over."
                    />
                  </Field>
                  <Field label="Image link (optional)">
                    <input
                      className="input"
                      value={form.imageUrl}
                      onChange={(e) => set({ imageUrl: e.target.value })}
                      placeholder="https://…"
                      inputMode="url"
                    />
                  </Field>
                  <p className="flex items-start gap-2 text-xs text-muted">
                    <Lock size={13} className="mt-0.5 shrink-0" aria-hidden />
                    Listing details are public and fixed once deployed. Do not include anything you
                    would not publish.
                  </p>
                  {form.title && itemProblems.length > 0 && (
                    <p className="text-sm text-bad">{itemProblems[0]}</p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Starting bid (tNIGHT)">
                      <input
                        className="input"
                        inputMode="numeric"
                        value={form.startingBid}
                        onChange={(e) => set({ startingBid: e.target.value.replace(/[^\d]/g, '') })}
                      />
                    </Field>
                    <Field label="Minimum increment">
                      <input
                        className="input"
                        inputMode="numeric"
                        value={form.minIncrement}
                        onChange={(e) =>
                          set({ minIncrement: e.target.value.replace(/[^\d]/g, '') })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Duration" group>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_PRESETS.map((p) => (
                        <button
                          key={p.seconds}
                          type="button"
                          aria-pressed={form.durationSeconds === p.seconds}
                          onClick={() => set({ durationSeconds: p.seconds })}
                          className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                            form.durationSeconds === p.seconds
                              ? 'border-accent bg-accent/10 text-ink'
                              : 'border-line text-muted hover:text-ink'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
                    <p className="font-medium text-ink">What the contract will enforce</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>First bid of at least the starting bid</li>
                      <li>Each later bid beats the high bid by the increment</li>
                      <li>No bids once block time reaches the end</li>
                      <li>You may cancel only before the first bid</li>
                    </ul>
                    <p className="mt-3 text-xs">
                      Bids are commitments to pay, not escrowed funds. The winner and seller
                      complete the exchange, then the seller records settlement on chain.
                    </p>
                  </div>
                  {termsProblem && <p className="text-sm text-bad">{termsProblem}</p>}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold">Review and deploy</h2>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <Term k="Starting bid" v={formatAmount(preview.startingBid)} />
                    <Term k="Increment" v={formatAmount(preview.minIncrement)} />
                    <Term
                      k="Duration"
                      v={
                        DURATION_PRESETS.find((p) => p.seconds === form.durationSeconds)?.label ??
                        ''
                      }
                    />
                    <Term
                      k="Ends about"
                      v={new Date(Number(preview.endsAt) * 1000).toLocaleString()}
                    />
                  </dl>
                  <Notice>
                    Deploying creates a new contract, then lists it so others can find it. Lace asks
                    you to approve both. Proofs are generated by your local proof server.
                  </Notice>
                  <Readiness api={api} action="deploy an auction" />
                  {progress.stage === 'error' && <Notice tone="bad">{progress.message}</Notice>}
                  <button
                    onClick={deploy}
                    disabled={!ready || progress.stage === 'deploying'}
                    className="btn-primary w-full py-3"
                  >
                    <Rocket size={16} aria-hidden />
                    {progress.stage === 'deploying'
                      ? 'Deploying… approve in Lace'
                      : 'Deploy auction to Preprod'}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between border-t border-line pt-5">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost"
            >
              <ArrowLeft size={15} aria-hidden /> Back
            </button>
            {step < 2 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="btn-primary"
              >
                Continue <ArrowRight size={15} aria-hidden />
              </button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="label">Preview</p>
          <AuctionCard auction={preview} now={now} preview />
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  group = false,
  children,
}: {
  label: string;
  hint?: string;
  group?: boolean;
  children: React.ReactNode;
}) {
  const heading = (
    <span className="label flex justify-between">
      {label}
      {hint && <span className="normal-case tracking-normal">{hint}</span>}
    </span>
  );
  // A group of toggle buttons is a fieldset, not a label: a label would forward
  // clicks to its first button.
  if (group) {
    return (
      <fieldset>
        <legend className="contents">{heading}</legend>
        {children}
      </fieldset>
    );
  }
  return (
    <label className="block">
      {heading}
      {children}
    </label>
  );
}

function Term({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-1 font-medium">{v}</dd>
    </div>
  );
}
