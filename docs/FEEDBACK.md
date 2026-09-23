# Feedback loop

How feedback reaches MidBid, how it gets prioritised, and what changed because of
it. Every entry in the log below links to the issue that caused the change and the
commit that made it.

## How to give feedback

1. **In the app.** The Feedback button in the corner of every page opens a short
   form: what you were doing, what happened, what you expected, and how clear the
   privacy behaviour was. It then opens a GitHub issue with your answers filled
   in. Nothing leaves the page until you press submit, and MidBid collects nothing
   in the background. There is no analytics script on the site.
2. **Directly on GitHub.** [Pilot feedback](https://github.com/JayCul/midbid/issues/new?template=feedback.yml)
   or [bug report](https://github.com/JayCul/midbid/issues/new?template=bug.yml).
3. **In a pilot session.** Notes taken live during a Bid Night are written up as
   issues with the `pilot` label, so they follow the same path as everything else.

Never paste a recovery phrase, private key or seed into any of these. A shielded
address is fine.

## How it is triaged

Issues are labelled `feedback` plus one of:

| Label | Meaning | Target |
|---|---|---|
| `blocker` | A tester cannot complete a bid at all | Fix before anything else |
| `confusion` | The product works, but the person could not tell what it did | High: a privacy product that is not understood has failed |
| `friction` | Extra steps, waiting, or repeated mistakes | Batch and fix together |
| `wish` | A feature beyond the MVP | Roadmap, not this cycle |

Ranking rule, in order: anything that blocks bidding, then anything where someone
misunderstood what stays private, then friction, then wishes. Confusion outranks
friction on purpose. If a tester cannot say what MidBid keeps private, the product
has not done its job, even when every transaction succeeded.

## What changed

Newest first. This table is the record for Level 5, and it stays honest: items are
only added once the change is merged.

| Date | Source | What we heard | What changed | Commit |
|---|---|---|---|---|
| 2026-09-23 | Building and demoing on Preprod | Getting to a first bid needs Lace, tNIGHT, DUST and a proof server, and there was no single place that said so or showed what was missing | Added the self-checking [Get ready](https://midbid-plum.vercel.app/start) page, linked from every readiness prompt | `bb86f11` |
| 2026-09-23 | Level 5 requirements review | A privacy product cannot produce a user list, but the pilot needs verifiable participants | Added the opt-in pilot register contract, the join page, and a generated [USERS.md](USERS.md) | `e8b8fec`, `c746079` |

## Open, not yet answered

- **Does Midnight's public Preprod prover accept MidBid's proofs?** It is
  reachable and allows browser requests, but MidBid pins ledger 8 and the public
  prover advertises a newer transaction format. Needs one real bid with hosted
  proving on. Result goes in the table above either way.

## Open questions we are asking testers

These are deliberately not leading, and the answers go in the table above.

1. After your first bid, what did you believe was public? Check the auction page
   and tell us whether you were right.
2. Where did you stop, wait, or have to ask something?
3. Would you run an auction here for something you actually own? If not, what is
   missing?
4. Did anything make you trust the privacy claim less?
