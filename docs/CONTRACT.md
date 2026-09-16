# Contract reference

Toolchain: Compact 0.31.1, language 0.23, `@midnight-ntwrk/compact-runtime` 0.16.0.

## auction.compact

One deployment is one auction. Source: [`src/contracts/auction.compact`](../src/contracts/auction.compact).

### Ledger

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `metadata` | `Opaque<"string">` | constructor | JSON: title, description, category, image URL, settlement mode |
| `sellerKey` | `Bytes<32>` | constructor | `persistentHash("midbid:seller:v1", sellerSecret)` |
| `startingBid` | `Uint<64>` | constructor | Minimum first bid |
| `minIncrement` | `Uint<64>` | constructor | Minimum raise over the high bid |
| `startsAt` | `Uint<64>` | constructor | Seconds since epoch, compared to block time |
| `endsAt` | `Uint<64>` | constructor | Seconds since epoch, compared to block time |
| `circuitCommitment` | `Bytes<32>` | constructor | SHA-256 over every circuit's verifier key |
| `status` | `Status` | circuits | `OPEN`, `CANCELLED`, `UNSOLD`, `WON`, `SETTLED` |
| `highBid` | `Uint<64>` | `placeBid` | Current public price, 0 before any bid |
| `bidCount` | `Counter` | `placeBid` | Accepted bids |
| `leader` | `Bytes<32>` | `placeBid` | `persistentHash("midbid:leader:v1", bidderSecret, nonce)` |

### Witnesses

| Witness | Returns | Source |
|---|---|---|
| `bidderSecret()` | `Bytes<32>` | Private state for this auction, created on first bid |
| `bidNonce()` | `Bytes<32>` | Fresh per bid; for `claimWin`, the nonce of the leading bid |
| `sellerSecret()` | `Bytes<32>` | Private state written at deploy |

### Constructor

`constructor(meta, seller, starting, increment, opensAt, closesAt, circuits)`

Asserts `starting > 0`, `increment > 0`, `opensAt < closesAt`. Sets `status = OPEN`,
`highBid = 0`.

### Circuits

| Circuit | Asserts, in order | Effect |
|---|---|---|
| `placeBid(amount)` | `status == OPEN`; `blockTimeGte(startsAt)`; `blockTimeLt(endsAt)`; `amount >= (bidCount == 0 ? startingBid : highBid + minIncrement)` | `highBid = amount`, `leader = commit(secret, nonce)`, `bidCount += 1` |
| `claimWin()` | `status == OPEN`; `blockTimeGte(endsAt)`; `bidCount > 0`; `commit(secret, nonce) == leader` | `status = WON` |
| `closeUnsold()` | `status == OPEN`; `blockTimeGte(endsAt)`; `bidCount == 0` | `status = UNSOLD` |
| `settle()` | `status == WON`; `sellerPublicKey(sellerSecret) == sellerKey` | `status = SETTLED` |
| `cancel()` | `status == OPEN`; `bidCount == 0`; `blockTimeLt(endsAt)`; `sellerPublicKey(sellerSecret) == sellerKey` | `status = CANCELLED` |

Pure circuits `sellerPublicKey(secret)` and `leaderCommitment(secret, nonce)` are exported,
so the app computes the same hashes locally.

### Assert messages

The app maps these to user-facing text in `explainFailure`
([service.js](../src/lib/auction/service.js)).

`auction is not open`, `auction has not started`, `auction has ended`,
`bid is below the minimum`, `auction has not ended`, `auction has no bids`,
`not the winning bid`, `auction has bids`, `no claimed winner to settle with`,
`only the seller can settle`, `cannot cancel after a bid`, `only the seller can cancel`,
`starting bid must be above zero`, `minimum increment must be above zero`,
`auction must end after it starts`.

### Design decisions

- **Time comes from the block, not the client.** `blockTimeLt` and `blockTimeGte` compare
  against the block's timestamp when the transaction executes. A client with a wrong clock
  can build a proof, but the transaction fails on chain.
- **No `ownPublicKey()` for authorization.** `ownPublicKey()` is an unconstrained input that
  the prover supplies, so it cannot prove identity. Authorization uses knowledge of a secret
  whose hash is on the ledger.
- **Fresh nonce per bid.** Using only `hash(secret)` as the leader would let observers link a
  bidder's bids. The nonce makes each commitment new.
- **Anyone may call `closeUnsold`.** It changes nothing but the label on an auction nobody
  bid in.
- **No escrow.** Bids are commitments to pay. Settlement is recorded by the seller. See the
  roadmap in the README.

## registry.compact

| Field | Type | Meaning |
|---|---|---|
| `listings` | `Set<Bytes<32>>` | Auction contract addresses |
| `listingCount` | `Counter` | Number of listings |

`list(auction)` asserts the address is not already listed, inserts it and increments the
count. Anyone may list anything; the app decodes each listed address and shows it only if its
stored `circuitCommitment` matches MidBid's.

## Provenance

`scripts/provenance.js` hashes every `managed/auction/keys/*.verifier` file, with its name, in
name order, and writes the result to `src/provenance.js`. The app passes it to the constructor
and checks it when reading. Because compilation is deterministic, anyone can recompile from
source and get the same value. CI enforces this.
