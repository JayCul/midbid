# Privacy model

Midbid's claim is narrow and deliberate: **contract state reveals the price, never the
bidder.** This document sets out exactly what that covers and what it does not.

Midbid uses the terms *private bidding*, *private bidder identity* and *selective
disclosure*. It does not claim anonymity.

## What each party learns

### Anyone reading the chain

| Learns | Because |
|---|---|
| Listing metadata, starting bid, increment, start and end | Written by the constructor so every bidder can audit the terms |
| The current high bid | Disclosed by `placeBid`: an ascending auction needs a price to beat |
| How many bids were accepted | `bidCount`, a public counter |
| The current leader commitment | `hash("midbid:leader:v1", bidderSecret, nonce)` |
| The seller key | `hash("midbid:seller:v1", sellerSecret)` |
| Status transitions and when they happened | Each is a transaction |
| That a wallet submitted a transaction to this contract, and paid its fee | Ordinary chain visibility, see Limits |

### What nobody learns from contract state

| Hidden | Because |
|---|---|
| Which bidder holds the high bid | The leader is a commitment. Opening it needs the secret and nonce, which never leave the bidder's device |
| Whether two bids came from the same bidder | Every bid uses a fresh random nonce, so each leader commitment is new |
| How many distinct bidders took part | Follows from the line above |
| Bids that would not have led | The circuit's minimum check fails during local proving, so the transaction is never built. A bid that loses a race is rejected by the contract and not recorded |
| The seller's secret | Only its hash is stored; `cancel` and `settle` prove knowledge of it |
| A losing bidder's history | Held in the bidder's own encrypted private state |

### The seller

Learns the same as anyone else. The seller cannot see who is bidding. After the winner
claims, the winner and seller arrange the exchange off chain, and at that point the winner
chooses what to reveal to the seller. That is the selective disclosure step.

### The Midbid app and its host

The app has no backend. Secrets and bid history are stored in the browser's encrypted
private state store, scoped to the wallet account and to each auction's address. The hosting
provider serves static files and sees ordinary web traffic.

## Where each value lives

| Value | Location | Protection |
|---|---|---|
| `bidderSecret` | Browser, `midbid-private-state` store | AES-GCM, key from PBKDF2 |
| Per-bid `nonce` and amount | Same store, per auction | Same |
| `sellerSecret` | Same store, set at deploy | Same |
| Addresses of auctions this browser touched | `localStorage` | None needed: addresses only |
| Everything else | Contract state on Preprod | Public |

## How disclosure is controlled

Compact treats circuit parameters and witness values as private by default. Writing one to
the ledger, or branching on it in a way that affects public state, requires an explicit
`disclose()`, or the compiler refuses to compile. Every `disclose()` in
[`auction.compact`](../src/contracts/auction.compact) is deliberate:

| Circuit | Disclosed | Why |
|---|---|---|
| constructor | All terms, seller key, circuit commitment | Public terms bidders can audit |
| `placeBid` | The amount | It becomes the public price |
| `placeBid` | The comparison `amount >= minimum` | Its outcome is the transaction succeeding |
| `placeBid` | The new leader commitment | Lets the winner prove the win later |
| `claimWin` | Whether the opened commitment equals `leader` | Its outcome is the claim succeeding |
| `settle`, `cancel` | Whether the proven key equals `sellerKey` | Its outcome is the action succeeding |

The secrets and nonces themselves are never disclosed.

## Limits

These are real and stated plainly.

1. **The fee payer can be visible.** Every transaction is balanced and paid by the bidder's
   own Lace wallet. Contract state never names the bidder, but chain analysis of fee
   payments and transaction timing may link a bid transaction to a wallet. Removing this
   needs relayed or sponsored submission, which is on the roadmap. Until then, Midbid keeps
   bidder identity out of *contract state* and does not claim to hide *network-level
   metadata*.
2. **Timing correlation.** The high bid changes the moment a bid lands. Someone who knows
   when a particular person clicked can correlate.
3. **Accepted bid amounts are public.** This is the product: see the price. A sealed-bid
   mode, where even the high bid is hidden until the end, is a different auction design and
   is on the roadmap.
4. **Claiming reveals the winner's commitment opening.** The claim proves the winning
   commitment was theirs. It still does not write a wallet or name to contract state, but it
   is a transaction from the winner's wallet, with limit 1 applying.
5. **Device loss.** Secrets live in one browser. Clearing site data loses the ability to
   claim a win or settle as seller. There is no recovery, by design, because a recovery path
   would be a way for someone else to claim.
6. **Metadata is public.** Sellers are warned in the create flow not to include anything
   they would not publish.
7. **Local key storage.** The private state password is generated per browser and kept in
   `localStorage` beside the encrypted store. This protects against casual inspection, not
   against an attacker with full access to the browser profile. Deriving it from a wallet
   signature is a planned improvement.
