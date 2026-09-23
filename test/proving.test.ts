// @vitest-environment jsdom
// Hosted proving is a disclosure, so it must be impossible to end up in it by
// accident: not by default, not without an operator configuring it, and never
// without the UI saying what it costs.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const load = async (hostedUrl?: string) => {
  vi.resetModules();
  vi.stubEnv('VITE_HOSTED_PROOF_SERVER_URL', hostedUrl ?? '');
  return import('../src/lib/midnight/proving');
};

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe('proving mode', () => {
  it('defaults to the bidder’s own machine', async () => {
    const p = await load('https://prover.example');
    expect(p.readMode()).toBe('local');
    expect(p.proofServerUrl()).toBe(p.LOCAL_PROOF_SERVER);
  });

  it('is not offered at all when no hosted server is configured', async () => {
    const p = await load();
    expect(p.hostedAvailable()).toBe(false);
    expect(p.writeMode('hosted')).toBe('local');
    expect(p.proofServerUrl('hosted')).toBe(p.LOCAL_PROOF_SERVER);
  });

  it('switches to the hosted server once chosen, and back again', async () => {
    const p = await load('https://prover.example');
    expect(p.writeMode('hosted')).toBe('hosted');
    expect(p.readMode()).toBe('hosted');
    expect(p.proofServerUrl()).toBe('https://prover.example');
    expect(p.writeMode('local')).toBe('local');
    expect(p.proofServerUrl()).toBe(p.LOCAL_PROOF_SERVER);
  });

  it('states the cost of hosted proving, and the benefit of local', async () => {
    const p = await load('https://prover.example');
    expect(p.provingNotice('hosted')).toMatch(/sees your bid amount and your bidder secret/i);
    expect(p.provingNotice('local')).toMatch(/never leave/i);
  });

  it('falls back to local when storage is unavailable', async () => {
    const p = await load('https://prover.example');
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(p.readMode()).toBe('local');
    getItem.mockRestore();
  });
});
