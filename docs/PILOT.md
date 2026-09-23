# The Preprod pilot

MidBid is being tested by real people on Midnight Preprod. This document explains
how participation is counted, why counting it needed a second contract, and what
joining does and does not disclose.

## The problem with counting users of a privacy product

A normal dApp can list its users: every action carries an account, so the chain
already knows who they are. MidBid is built to prevent exactly that. A bid
publishes a price and a fresh commitment, never a wallet, and no two bids from
the same person share a commitment.

So MidBid **cannot** produce a list of its bidders. If it could, the product would
not work. That is not a gap in the implementation; it is the implementation.

## What we built instead

A separate contract, [`pilot.compact`](../src/contracts/pilot.compact), holding an
opt-in list. A participant who wants to be counted publicly goes to
[`/join`](https://midbid-plum.vercel.app/join), sees exactly what will be
published, and sends one transaction from their own wallet.

| | Auction contracts | Pilot register |
|---|---|---|
| Written by | Bids, claims, settlements | Joining, once per address |
| Holds | Price, bid count, status, commitments | Address, optional handle, role, time |
| Says who bid | No, by design | No. It says only "this address tests MidBid" |
| Required to use MidBid | Yes, to bid | No. Bidding never needs it |

Joining is a statement about participation, not about bidding. Somebody on the
list may have bid twenty times or never bid at all, and nothing on chain links a
list entry to any auction.

## What the register can and cannot prove

**It can prove** that each entry cost a real transaction, signed and paid for by a
funded Preprod wallet, at a known block height.

**It cannot prove** that the person who joined controls the address they
submitted. A Compact circuit cannot check a wallet signature over an address, and
`ownPublicKey()` is an unconstrained prover input, so it proves nothing (see
[CONTRACT.md](CONTRACT.md)). The app fills the address from the connected wallet,
so an honest participant publishes their own address, and a dishonest one could
publish somebody else's.

We state that plainly rather than implying stronger proof. The uniqueness check in
the contract is on the address key, so each address appears once.

## Reading the list

The list in [USERS.md](USERS.md) is generated, never typed by hand:

```bash
npm run users -- <pilot register address>
```

The script reads contract state from the public Preprod indexer, so it does not
depend on anything MidBid hosts. The `/join` page renders the same data, with
addresses shortened.

## Privacy notes for participants

- Joining publishes your shielded address and, if you add one, a handle. Both are
  permanent and public.
- You can use MidBid fully without joining. Nothing about bidding requires it.
- Once an address is on the list, chain analysis can connect it to other public
  activity of that address, as with any published address. Use an address you are
  comfortable publishing.
- There is no way to remove an entry. The contract has no delete circuit, and
  on-chain data is permanent.
