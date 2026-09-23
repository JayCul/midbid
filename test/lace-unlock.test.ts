// Connecting must be one attempt per click.
//
// An earlier version retried on a timer while the wallet was locked, so that
// unlocking would continue on its own. Browsers only open an extension window
// from a click, so those retries asked Lace for a session while no prompt could
// appear, and the dialog sat on "Approve the request in Lace" forever.
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error JavaScript module, no declarations
import { connectLace, isLocked } from '../src/lib/midnight/lace.js';

const lockedError = () =>
  Object.assign(new Error('Wallet is locked. Please unlock the wallet first.'), {
    name: 'APIError',
  });

const session = {
  getShieldedAddresses: async () => ({
    shieldedAddress: 'mn_shield-addr_preprod1abc',
    shieldedCoinPublicKey: 'cpk',
    shieldedEncryptionPublicKey: 'epk',
  }),
  getUnshieldedAddress: async () => ({ unshieldedAddress: 'mn_addr_preprod1abc' }),
  getDustAddress: async () => ({ dustAddress: 'mn_dust_preprod1abc' }),
};

function fakeLace(behaviour: 'locked' | 'open') {
  let calls = 0;
  (globalThis as any).window = {
    midnight: {
      lace: {
        name: 'lace',
        connect: async () => {
          calls += 1;
          if (behaviour === 'locked') throw lockedError();
          return session;
        },
      },
    },
  };
  return () => calls;
}

describe('connecting to Lace', () => {
  it('recognises the locked refusal', () => {
    expect(isLocked(lockedError())).toBe(true);
    expect(isLocked(new Error('something else'))).toBe(false);
  });

  it('asks once and reports the lock, rather than retrying without a click', async () => {
    const calls = fakeLace('locked');
    const onStatus = vi.fn();
    await expect(connectLace({ onStatus })).rejects.toThrow(/locked/i);
    expect(calls()).toBe(1);
    expect(onStatus).toHaveBeenCalledWith('locked');
  });

  it('returns the session when the wallet is open', async () => {
    fakeLace('open');
    const s = await connectLace();
    expect(s.addresses.shielded).toBe('mn_shield-addr_preprod1abc');
  });
});
