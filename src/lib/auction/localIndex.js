// Which auctions this browser created or bid in, so My Activity can find them
// again. Addresses only: amounts, nonces and secrets stay in the encrypted
// private state store. Lost site data only loses the shortcut, never a bid.
const KEY = 'midbid.index.v1';

/** @typedef {{ created: string[], bid: string[] }} LocalIndex */

/** @returns {LocalIndex} */
const empty = () => ({ created: [], bid: [] });

/** @returns {LocalIndex} */
export function readIndex() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!raw || !Array.isArray(raw.created) || !Array.isArray(raw.bid)) return empty();
    const valid = (a) => typeof a === 'string' && /^[0-9a-f]{64}$/.test(a);
    return { created: raw.created.filter(valid), bid: raw.bid.filter(valid) };
  } catch {
    return empty();
  }
}

export function addToIndex(kind, address) {
  const index = readIndex();
  if (!index[kind].includes(address)) index[kind] = [address, ...index[kind]];
  try {
    localStorage.setItem(KEY, JSON.stringify(index));
  } catch {
    /* private windows: the shortcut lasts for this page only */
  }
  return index;
}
