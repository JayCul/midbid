# Threat model

## Assets

- Bidder identity: which person placed which bid
- The integrity of the auction rules: minimum, increment, timing, who wins
- The right to claim a win and the right to cancel or settle
- Bidder and seller secrets

## Actors

| Actor | Capabilities |
|---|---|
| Chain observer | Reads all contract state and transactions |
| Rival bidder | Observer, plus submits transactions and custom proofs |
| Malicious seller | Controls auction terms and the seller secret |
| Malicious frontend host | Serves modified JavaScript |
| Device thief | Access to one browser profile |

## Threats and mitigations

| # | Threat | Mitigation | Residual risk |
|---|---|---|---|
| 1 | Observer identifies the high bidder from contract state | Leader is a commitment to a secret and fresh nonce; no account is written | Fee-payer and timing analysis, see PRIVACY.md limits |
| 2 | Observer links a bidder's multiple bids | Fresh nonce per bid, so commitments never repeat | Timing and fee payer |
| 3 | Bid below the minimum or increment | Asserted in `placeBid` against ledger state | None |
| 4 | Bid after the end, or before the start | `blockTimeLt(endsAt)`, `blockTimeGte(startsAt)` checked against block time | Block time tolerance of a few seconds |
| 5 | Client clock manipulated to bid late | Time comes from the block, not the client | None |
| 6 | Outbid bidder claims the win | `claimWin` requires opening the current `leader` | None |
| 7 | Someone learns a winning nonce and claims | The commitment also needs `bidderSecret` | Theft of the device's private state |
| 8 | Impersonating the seller to cancel or settle | Proof of knowledge of `sellerSecret` behind `sellerKey` | Theft of the seller's private state |
| 9 | `ownPublicKey()` spoofing | Not used; it is an unconstrained prover input | None |
| 10 | Seller cancels after seeing bids | `cancel` asserts `bidCount == 0` | None |
| 11 | Seller changes terms mid-auction | Terms are written once by the constructor; no circuit writes them | None |
| 12 | Double claim or double settle | Every transition asserts the current status | None |
| 13 | Replay of an old bid | A replayed bid no longer meets the moved minimum | None |
| 14 | Fake auction in the registry | Anyone can list, but the app hides contracts whose `circuitCommitment` differs | A malicious registry can list nothing useful; it can omit auctions |
| 15 | Contract with a look-alike layout | Provenance check on read; `npm run find` verifies from the CLI | None |
| 16 | Shill bidding by the seller | Not preventable without identity; the seller can bid like anyone | Accepted and documented |
| 17 | Winner never pays | No escrow in this version; settlement is manual | Escrow on the roadmap |
| 18 | Winner loses their device | No recovery by design | Auction stays ENDED; seller relists |
| 19 | Front-running: a bid lands first | The later transaction fails the minimum check and is not recorded | The losing bidder must bid again |
| 20 | Malicious host serves modified JS that exfiltrates secrets | Open source, deterministic contract build; users can run locally | Standard web-app trust in the host |
| 21 | Malicious metadata (script injection, trackers) | Metadata is parsed defensively, only `https:` image links, rendered as text; images load with `no-referrer` | Remote images reveal the viewer's IP to the image host |
| 22 | Seed phrase theft | The app never asks for or handles a seed; Lace signs everything | Wallet-level risks |
| 23 | Private state read from disk | AES-GCM encrypted at rest | Password is stored beside it; see PRIVACY.md limit 7 |

## Out of scope for this version

- Network-level anonymity (Tor, relays, fee sponsorship)
- Escrow and on-chain payment
- Dispute resolution between winner and seller
