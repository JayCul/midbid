// Lace fails in ways that mean nothing to a tester. Those failures have to come
// out of the app as something the person can act on.
import { describe, expect, it } from 'vitest';
// @ts-expect-error JavaScript module, no declarations
import { isStaleConnector } from '../src/lib/midnight/lace.js';
// @ts-expect-error JavaScript module, no declarations
import { describeError } from '../src/lib/midnight/instrument.js';

const shutdown = Object.assign(
  new Error("Remote API with channel 'feature-flags' was shutdown: object can no longer be used."),
  {
    name: 'RemoteApiShutdownError',
  },
);

describe('stale Lace connector', () => {
  it('recognises the shutdown error, whatever channel it names', () => {
    expect(isStaleConnector(shutdown)).toBe(true);
    expect(isStaleConnector({ name: 'RemoteApiShutdownError', message: '' })).toBe(true);
    expect(isStaleConnector(new Error('User rejected the request'))).toBe(false);
    expect(isStaleConnector(null)).toBe(false);
  });

  it('is described as something the tester can do, not as an internal channel', () => {
    const text = describeError(shutdown);
    expect(text).toMatch(/Reload this page/i);
    expect(text).not.toMatch(/feature-flags|RemoteApiShutdown/);
  });

  it('leaves other failures alone', () => {
    expect(describeError(new Error('Wallet is on mainnet, but this app targets preprod'))).toMatch(
      /targets preprod/,
    );
  });
});
