// Where proofs are generated.
//
// Local is the default and the only private option: the proof server runs on the
// bidder's own machine, so the bid amount and the bidder secret never leave it.
//
// Hosted proving exists because a local Docker container stops most people from
// ever placing a bid on Preprod. It is opt-in, it is never remembered silently,
// and every screen that can spend it says what it costs: the hosted server sees
// the witness data for the proof it builds, which is the bid amount and the
// bidder secret. On Preprod that is test tokens, but the disclosure is real, so
// the UI says so every time rather than once.
import { PREPROD } from '../../config.js';

export type ProvingMode = 'local' | 'hosted';

const KEY = 'midbid.proving.v1';

const env: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta.env as any)) || {};

/** Configured by the operator. Without it, hosted proving is not offered. */
export const HOSTED_PROOF_SERVER: string | null = env.VITE_HOSTED_PROOF_SERVER_URL || null;

export const LOCAL_PROOF_SERVER: string = PREPROD.proofServer;

export const hostedAvailable = (): boolean => Boolean(HOSTED_PROOF_SERVER);

export function readMode(): ProvingMode {
  if (!hostedAvailable()) return 'local';
  try {
    return localStorage.getItem(KEY) === 'hosted' ? 'hosted' : 'local';
  } catch {
    return 'local';
  }
}

export function writeMode(mode: ProvingMode): ProvingMode {
  const next: ProvingMode = mode === 'hosted' && hostedAvailable() ? 'hosted' : 'local';
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* the choice lasts for this page only */
  }
  return next;
}

/** The proof server URL for a mode. */
export function proofServerUrl(mode: ProvingMode = readMode()): string {
  return mode === 'hosted' && HOSTED_PROOF_SERVER ? HOSTED_PROOF_SERVER : LOCAL_PROOF_SERVER;
}

/** One sentence, shown wherever a proof is about to be built. */
export function provingNotice(mode: ProvingMode = readMode()): string {
  return mode === 'hosted'
    ? 'Hosted proving is on. The proof server sees your bid amount and your bidder secret.'
    : 'Proofs are built on your machine. Your bid amount and secret never leave it.';
}
