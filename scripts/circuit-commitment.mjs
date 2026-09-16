// circuitCommitment: one hash identifying every proof circuit in the contract.
//
// It covers each *.verifier key in the keys directory, in file-name order, with
// the file name hashed alongside the bytes. Adding, removing, renaming or
// changing any proof circuit therefore changes the commitment, so a reviewer
// can confirm the deployed contract runs exactly these circuits and no others.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const KEYS_DIR = 'managed/auction/keys';

export function verifierKeys(dir = KEYS_DIR) {
  return readdirSync(dir).filter((f) => f.endsWith('.verifier')).sort();
}

export function circuitCommitmentOf(dir = KEYS_DIR) {
  const files = verifierKeys(dir);
  if (files.length === 0) {
    throw new Error(`No verifier keys in ${dir}. Run: npm run compact`);
  }
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(join(dir, file)));
  }
  return hash.digest('hex');
}
