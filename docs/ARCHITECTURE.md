# Architecture

Midbid is a static single-page app talking to Midnight Preprod. There is no backend.

```mermaid
flowchart LR
    subgraph Browser
        UI[React pages] --> Hook[useMidbid]
        Hook --> Service[AuctionService]
        Service --> PSP[(Encrypted private state)]
        Service --> ZK[FetchZkConfigProvider<br/>/zk/auction, /zk/registry]
    end
    Service -- prove --> Proof[Local proof server :6300]
    Service -- balance, sign, submit --> Lace[Lace wallet]
    Service -- read state --> Indexer[Preprod indexer]
    Lace --> Node[Preprod node]
    Node --> Auctions[(Auction contracts)]
    Node --> Registry[(Registry contract)]
    Indexer --> Auctions
    Indexer --> Registry
```

## Layers

| Layer | Files | Responsibility |
|---|---|---|
| Contracts | `src/contracts/*.compact`, `managed/` | Rules, state, proofs |
| Model | `src/lib/auction/model.js` | Pure functions: lifecycle, bid checks, metadata, terms |
| Service | `src/lib/auction/service.js` | Every midnight-js call: deploy, find, call, read, private state |
| Wallet | `src/lib/lace.js`, `src/lib/txcodec.js` | Lace connector to midnight-js wallet and midnight providers |
| Hook | `src/ui/useMidbid.ts` | Session, providers, log, proof server status, local index |
| Pages | `src/ui/pages/*` | Presentation only |

Pages never import midnight-js. They call the service through the hook, and the service
returns plain objects and real transaction identifiers.

## Provider stack

Built once per wallet connection in `useMidbid`:

| Provider | Implementation | Notes |
|---|---|---|
| `publicDataProvider` | `indexerPublicDataProvider` | Also used without a wallet for reads |
| `privateStateProvider` | `levelPrivateStateProvider` | Scoped by wallet account, then `setContractAddress` per auction |
| `zkConfigProvider` | `FetchZkConfigProvider` | One per contract, from `/zk/<name>` |
| `proofProvider` | `httpClientProofProvider` | Local proof server |
| `walletProvider` | Lace adapter | `balanceUnsealedTransaction`, parsed back to a ledger `Transaction` |
| `midnightProvider` | Lace adapter | `submitTransaction`; returns `tx.identifiers()[0]` for watching |

`setNetworkId('preprod')` runs at module load, before any provider is built.

## Data flows

### Create

1. The form is validated by `buildMetadata` and `buildTerms`, the same rules the constructor
   asserts.
2. The service generates `sellerSecret`, computes `sellerPublicKey` locally, and calls
   `deployContract` with the secret as initial private state.
3. The deploy is proven locally, balanced and signed by Lace, and submitted.
4. The service calls `registry.list(address)`. If that fails, the auction still exists and the
   seller can retry from the auction page.
5. The address is added to this browser's local index.

### Bid

1. `bidProblem` checks phase and minimum against the latest indexer state.
2. The service loads or creates `bidderSecret`, generates a nonce, and writes both plus a
   `pending` bid record to private state **before** proving, so a closed tab cannot lose the
   nonce of a bid that lands.
3. `callTx.placeBid(amount)` proves locally. If another bid landed first, proving or the
   on-chain check fails, and the record is marked `failed`.
4. On success the record is marked `confirmed` with the transaction identifier.

### Position

`myPosition` reads private state and, for each of this device's bids, computes
`leaderCommitment(bidderSecret, nonce)` and compares it with the public `leader`. The match is
the leading bid. Nothing is sent anywhere.

### Discovery

Browse reads `registry.listings`, merges this browser's local index, fetches each address, and
keeps only contracts whose ledger decodes as an auction and whose `circuitCommitment` matches
`src/provenance.js`.

## Build

- Vite 5 with `vite-plugin-wasm` and `vite-plugin-node-polyfills`, target `esnext`
- `optimizeDeps.exclude` keeps the ledger and onchain-runtime WASM packages out of esbuild
- `overrides` pins `@midnight-ntwrk/onchain-runtime-v3` to 3.0.0 so the bundle carries one
  runtime copy; two copies break `instanceof` checks between packages
- `scripts/sync-zk.js` copies `managed/<name>` to `public/zk/<name>`; served from `/zk` so
  Vite never confuses keys with source modules
