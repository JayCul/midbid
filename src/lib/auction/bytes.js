export const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const fromHex = (hex) => {
  const clean = String(hex).trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    throw new Error('Expected a 32-byte hex value (64 hex characters).');
  }
  return Uint8Array.from(clean.match(/../g), (pair) => parseInt(pair, 16));
};

export const randomBytes32 = () => crypto.getRandomValues(new Uint8Array(32));
