// Reads a Midbid auction or registry straight from the Preprod indexer and
// checks it is genuine, without the app or a wallet.
//
//   node scripts/find-auction.mjs <auctionAddress>
//   node scripts/find-auction.mjs --registry <registryAddress>
//
// An auction is genuine if its ledger decodes with the auction layout and its
// stored circuit commitment equals the one computed from managed/auction.
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import * as Auction from '../managed/auction/contract/index.js';
import * as Registry from '../managed/registry/contract/index.js';
import { circuitCommitmentOf } from './circuit-commitment.mjs';

const INDEXER =
  process.env.VITE_INDEXER_URL ?? 'https://indexer.preprod.midnight.network/api/v4/graphql';
const STATUS = ['OPEN', 'CANCELLED', 'UNSOLD', 'WON', 'SETTLED'];

const args = process.argv.slice(2);
const isRegistry = args[0] === '--registry';
const address = (isRegistry ? args[1] : args[0])?.toLowerCase();
if (!address || !/^[0-9a-f]{64}$/.test(address)) {
  console.error('usage: node scripts/find-auction.mjs [--registry] <64-hex contract address>');
  process.exit(2);
}

const res = await fetch(INDEXER, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    query: `query($a: HexEncoded!) { contractAction(address: $a) {
      __typename address state transaction { hash block { height timestamp } } } }`,
    variables: { a: address },
  }),
});
const body = await res.json();
if (body.errors) throw new Error(JSON.stringify(body.errors).slice(0, 300));
const action = body.data.contractAction;
if (!action) {
  console.log(`No contract at ${address} on Preprod.`);
  process.exit(1);
}

const state = ContractState.deserialize(Buffer.from(action.state, 'hex'));
const hex = (b) => Buffer.from(b).toString('hex');
console.log(`${action.__typename} ${action.address}`);
console.log(`  last tx  ${action.transaction.hash}`);
console.log(
  `  block    ${action.transaction.block.height}  ${new Date(action.transaction.block.timestamp).toISOString()}`,
);

if (isRegistry) {
  const l = Registry.ledger(state.data);
  console.log(`  listings ${l.listingCount}`);
  for (const a of l.listings) console.log(`    ${hex(a)}`);
  process.exit(0);
}

let l;
let genuine = false;
try {
  l = Auction.ledger(state.data);
  genuine = hex(l.circuitCommitment) === circuitCommitmentOf();
  void STATUS[l.status].length;
} catch {
  genuine = false;
}
if (!genuine) {
  console.log('  genuine  NO, not a Midbid auction built from managed/auction');
  process.exit(1);
}
console.log(`  status   ${STATUS[l.status]}`);
console.log(`  terms    starting ${l.startingBid}, increment ${l.minIncrement}`);
console.log(
  `  window   ${new Date(Number(l.startsAt) * 1000).toISOString()} .. ${new Date(Number(l.endsAt) * 1000).toISOString()}`,
);
console.log(`  high bid ${l.highBid} over ${l.bidCount} accepted bids`);
console.log(`  metadata ${l.metadata}`);
console.log('  genuine  yes, circuit commitment matches managed/auction');
