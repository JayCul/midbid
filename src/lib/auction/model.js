// The auction as the app sees it, derived from public ledger state.
//
// Nothing here decides a rule. The contract enforces every rule against block
// time; these helpers only predict the outcome so the UI can explain it before
// the wallet is asked to approve anything.

/** Stored status, in the order of the contract's Status enum. */
export const STORED = ['OPEN', 'CANCELLED', 'UNSOLD', 'WON', 'SETTLED'];

/**
 * Display lifecycle. DRAFT exists only before deploy. SCHEDULED, ACTIVE and
 * ENDED are OPEN read against the clock.
 */
export const LIFECYCLE = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'ENDED',
  'SETTLING',
  'SETTLED',
  'CANCELLED',
  'UNSOLD',
];

export const nowSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Maps stored status plus the clock to the lifecycle the UI shows.
 * WON means the winner has claimed and the seller has not yet settled.
 */
export function deriveStatus({ status, startsAt, endsAt }, now = nowSeconds()) {
  const stored = typeof status === 'number' ? STORED[status] : status;
  switch (stored) {
    case 'CANCELLED':
      return 'CANCELLED';
    case 'UNSOLD':
      return 'UNSOLD';
    case 'WON':
      return 'SETTLING';
    case 'SETTLED':
      return 'SETTLED';
    case 'OPEN': {
      const t = BigInt(now);
      if (t < BigInt(startsAt)) return 'SCHEDULED';
      if (t < BigInt(endsAt)) return 'ACTIVE';
      return 'ENDED';
    }
    default:
      throw new Error(`Unknown auction status: ${String(status)}`);
  }
}

/** The smallest bid the contract will accept next. */
export function minimumNextBid({ bidCount, highBid, startingBid, minIncrement }) {
  return BigInt(bidCount) === 0n ? BigInt(startingBid) : BigInt(highBid) + BigInt(minIncrement);
}

/**
 * Why a bid would be rejected, checked the same way the circuit checks it, or
 * null when the contract should accept it. Block time can differ slightly from
 * this device's clock, so a bid in the last seconds can still be refused.
 */
export function bidProblem(auction, amount, now = nowSeconds()) {
  const phase = deriveStatus(auction, now);
  if (phase === 'SCHEDULED') return 'This auction has not started yet.';
  if (phase !== 'ACTIVE') return 'This auction is no longer taking bids.';
  let value;
  try {
    value = BigInt(amount);
  } catch {
    return 'Enter a whole number.';
  }
  if (value <= 0n) return 'Enter an amount above zero.';
  if (value >= 2n ** 64n) return 'That amount is too large.';
  const minimum = minimumNextBid(auction);
  if (value < minimum) return `The minimum bid is ${formatAmount(minimum)}.`;
  return null;
}

/** Seconds left until the end, never negative. */
export const secondsLeft = ({ endsAt }, now = nowSeconds()) =>
  Math.max(0, Number(BigInt(endsAt) - BigInt(now)));

export function formatDuration(seconds) {
  if (seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export const formatAmount = (value, unit = 'tNIGHT') =>
  `${BigInt(value).toLocaleString('en-US')} ${unit}`;

// ------------------------------------------------------------- metadata ---

export const CATEGORIES = [
  'Digital Collectibles',
  'Art',
  'Gaming Assets',
  'Creator Drops',
  'Community Auctions',
  'Private Sales',
];

export const METADATA_LIMITS = { title: 80, description: 600, imageUrl: 300 };

/**
 * Metadata is public: it is written into the contract so every bidder sees the
 * same listing. It never holds anything about bidders.
 */
export function buildMetadata({ title, description = '', category = 'Art', imageUrl = '' }) {
  const clean = {
    v: 1,
    title: String(title ?? '').trim(),
    description: String(description ?? '').trim(),
    category: CATEGORIES.includes(category) ? category : 'Art',
    imageUrl: String(imageUrl ?? '').trim(),
    // Only manual settlement exists today: the winner and seller complete the
    // exchange off chain, and the seller records it with settle().
    settlement: 'manual',
  };
  const problems = metadataProblems(clean);
  if (problems.length) throw new Error(problems[0]);
  return JSON.stringify(clean);
}

export function metadataProblems(meta) {
  const problems = [];
  if (!meta.title) problems.push('Give the auction a title.');
  if (meta.title.length > METADATA_LIMITS.title)
    problems.push(`Keep the title under ${METADATA_LIMITS.title} characters.`);
  if (meta.description.length > METADATA_LIMITS.description)
    problems.push(`Keep the description under ${METADATA_LIMITS.description} characters.`);
  if (meta.imageUrl && !/^https:\/\/\S+$/i.test(meta.imageUrl))
    problems.push('Image links must start with https://');
  if (meta.imageUrl.length > METADATA_LIMITS.imageUrl)
    problems.push('That image link is too long.');
  return problems;
}

/** Reads metadata defensively: it is public input anyone could have written. */
export function parseMetadata(raw) {
  try {
    const m = JSON.parse(raw);
    return {
      title: typeof m.title === 'string' && m.title ? m.title.slice(0, 80) : 'Untitled auction',
      description: typeof m.description === 'string' ? m.description.slice(0, 600) : '',
      category: CATEGORIES.includes(m.category) ? m.category : 'Art',
      imageUrl:
        typeof m.imageUrl === 'string' && /^https:\/\/\S+$/i.test(m.imageUrl) ? m.imageUrl : '',
      settlement: 'manual',
    };
  } catch {
    return {
      title: 'Untitled auction',
      description: '',
      category: 'Art',
      imageUrl: '',
      settlement: 'manual',
    };
  }
}

// ---------------------------------------------------------------- terms ---

export const DURATION_PRESETS = [
  { label: '10 minutes', seconds: 600 },
  { label: '1 hour', seconds: 3600 },
  { label: '24 hours', seconds: 86400 },
  { label: '3 days', seconds: 259200 },
  { label: '7 days', seconds: 604800 },
];

/**
 * Validates the create form and returns contract-ready terms.
 * `startDelay` is seconds from now; 0 opens immediately.
 */
export function buildTerms(
  { startingBid, minIncrement, durationSeconds, startDelay = 0 },
  now = nowSeconds(),
) {
  const toBig = (v, name) => {
    if (v === '' || v == null || !/^\d+$/.test(String(v).trim()))
      throw new Error(`${name} must be a whole number.`);
    return BigInt(String(v).trim());
  };
  const starting = toBig(startingBid, 'Starting bid');
  const increment = toBig(minIncrement, 'Minimum increment');
  if (starting <= 0n) throw new Error('Starting bid must be above zero.');
  if (increment <= 0n) throw new Error('Minimum increment must be above zero.');
  const duration = Number(durationSeconds);
  if (!Number.isInteger(duration) || duration < 300)
    throw new Error('Auctions must run for at least 5 minutes.');
  if (duration > 30 * 86400) throw new Error('Auctions can run for at most 30 days.');
  // Times are in seconds, compared by the contract against block time. The
  // auction opens as soon as the deploy lands unless a delay is chosen.
  const startsAt = BigInt(now + Math.max(0, Number(startDelay)));
  const endsAt = startsAt + BigInt(duration);
  return { startingBid: starting, minIncrement: increment, startsAt, endsAt };
}
