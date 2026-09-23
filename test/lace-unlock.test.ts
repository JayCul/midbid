// Unlocking a wallet takes as long as it takes. A refusal while locked must not
// end the attempt, or the password gets entered once per try.
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

/** A connector that refuses `lockedTimes` times, then opens. */
function fakeLace(lockedTimes: number) {
  let calls = 0;
  const connector = {
    name: 'lace',
    connect: async () => {
      calls += 1;
      if (calls <= lockedTimes) throw lockedError();
      return session;
    },
  };
  (globalThis as any).window = { midnight: { lace: connector } };
  return () => calls;
}

describe('connecting while Lace is locked', () => {
  it('recognises the locked refusal', () => {
    expect(isLocked(lockedError())).toBe(true);
    expect(isLocked(new Error('something else'))).toBe(false);
  });

  it('keeps waiting and connects once the wallet is unlocked', async () => {
    vi.useFakeTimers();
    const calls = fakeLace(3);
    const onStatus = vi.fn();
    const pending = connectLace({ onStatus });
    await vi.advanceTimersByTimeAsync(6000);
    const s = await pending;
    expect(s.addresses.shielded).toBe('mn_shield-addr_preprod1abc');
    expect(calls()).toBe(4);
    // Told once that it is waiting, not once per attempt.
    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith('locked');
    vi.useRealTimers();
  });

  it('gives up when the wallet stays locked past the deadline', async () => {
    vi.useFakeTimers();
    fakeLace(Number.MAX_SAFE_INTEGER);
    const pending = connectLace({ waitForUnlockMs: 3000 }).catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(String(await pending)).toMatch(/locked/i);
    vi.useRealTimers();
  });
});
