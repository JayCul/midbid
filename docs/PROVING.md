# Where proofs are built

A bid in MidBid is a zero-knowledge proof. Something has to build it, and that
something sees the witness data: **the bid amount and the bidder secret**.

There are two options, and the difference between them is the whole privacy
story, so MidBid never picks for you.

| | On your machine (default) | Hosted |
|---|---|---|
| Who sees your bid amount and secret | Only you | The hosted proof server operator |
| Setup | Docker, one command | None |
| Privacy claim | Holds in full | Reduced, and the app says so every time |
| Recommended for | Anything you care about | Trying MidBid on Preprod test tokens |

## The hosted option

The hosted option is **Midnight's public Preprod proof server**,
`https://proof-server.preprod.midnight.network`. Lace points at the same server
by default for its own proving, so many testers are already using it without
having thought about it.

It is operated by Midnight, not by MidBid. We did not build it, we do not run it,
and we cannot make promises about what it logs. An operator can point MidBid
somewhere else, or remove the option, with `VITE_HOSTED_PROOF_SERVER_URL`.

> **Not verified end to end yet.** MidBid pins the Mainnet-compatible toolchain
> (Compact 0.31.1, ledger 8), and the public prover advertises a newer
> transaction format in its error messages. Whether a MidBid bid proves cleanly
> there is a question for a real bid on Preprod, not for a health check. This
> note stays here until a bid has been placed through it, and
> [FEEDBACK.md](FEEDBACK.md) records the result either way.

## Why hosted proving exists

Early pilot sessions made one thing obvious: asking someone to install Docker
before they can place a single test bid loses most of them. Hosted proving lets a
newcomer bid on Preprod in a minute, see how the auction behaves, and decide
whether MidBid is worth setting up properly.

We considered not shipping it, because it weakens the claim the product is built
on. We shipped it as an opt-in with the cost stated at every decision point
instead, on the grounds that a tester who cannot bid gives no feedback at all.

## How it is kept honest

- **Local is the default.** Hosted is never selected for you, and a fresh browser
  is always local.
- **It does not exist unless configured.** Without `VITE_HOSTED_PROOF_SERVER_URL`
  the option is not rendered and cannot be selected, in code or in storage.
- **The cost is repeated, not buried.** The option itself says the server sees
  your amount and secret, the wallet dialog repeats it, and the bid form carries a
  line above the button every time hosted proving is on.
- **The activity log records the switch**, so it is visible in the session log
  that proving moved off your machine.
- **Tests enforce this**: see [`test/proving.test.ts`](../test/proving.test.ts).

## What hosted proving does not change

- Contract state still records no bidder. The auction cannot tell who bid.
- The proof is still verified by the network the same way.
- Losing bids are still never submitted.

The disclosure is to the **proof server operator**, not to the chain or to other
bidders. That is a narrower leak than it first sounds, and still a real one:
whoever runs that server could log amounts and secrets, and a secret is what
claims a win.

## Running your own hosted prover

The most honest version of hosted proving is one you run yourself, for people you
already trust, and this is what we recommend to anyone hosting MidBid.

```bash
# Any host that can run a container and serve HTTPS
docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

Running your own also pins the version, which matters: a prover built for a
different ledger version can reject transactions your client builds.

Then point the build at it:

```bash
VITE_HOSTED_PROOF_SERVER_URL=https://prover.example.com   # or "off" to remove the option
```

Requirements:

- **HTTPS.** The app is served over HTTPS, so a plain HTTP prover is blocked as
  mixed content. `127.0.0.1` is the exception browsers allow, which is why local
  proving needs no certificate.
- **Cross-origin requests must be allowed** from the site's origin.
- **Capacity.** Proving is CPU heavy. One small instance is fine for a pilot and
  will queue under a crowd.
- **Say who runs it.** If you operate a prover for other people, tell them, in the
  app, that you can see their amounts and secrets.
