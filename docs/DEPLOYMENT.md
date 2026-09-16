# Deployment

Midbid has no server and no deploy key. Contracts are deployed from the browser and signed by
Lace. Deploying Midbid means: one registry contract on Preprod, then the static site.

## 1. Prerequisites

- Lace set to Preprod with tNIGHT registered for DUST generation
- Proof server running: `npm run proof-server`
- The app running locally: `npm run dev`

## 2. Deploy the registry

1. Open <http://localhost:5174/#/setup>.
2. Connect Lace and click **Deploy registry**. Approve in Lace.
3. Copy the address shown.
4. Verify it from the command line:

   ```bash
   npm run find -- --registry <address>
   ```

5. Put it in `.env.local` as `VITE_REGISTRY_ADDRESS=<address>`.

Before rebuilding, any build can use a registry with `?registry=<address>`.

## 3. Create a first auction

Open Create, deploy an auction, approve both transactions, then verify:

```bash
npm run find -- <auction address>
```

The output ends with `genuine  yes` when the stored circuit commitment matches the source.

## 4. Deploy the site to Vercel

`vercel.json` sets the build command, output directory and long-lived caching for `/zk`.

1. Import `JayCul/midbid` in Vercel. Framework: Vite.
2. Add environment variables: `VITE_REGISTRY_ADDRESS`, and `VITE_X_PROFILE_URL` once the
   profile exists.
3. Deploy. Pushes to `main` redeploy automatically.

To check configuration before a manual deploy:

```bash
npm run deploy:preprod
```

This confirms the registry exists on Preprod and builds `dist/`.

## 5. Visitors on the hosted site

- They need Lace on Preprod and their own proof server.
- Chrome prompts the HTTPS page for permission to reach `http://127.0.0.1:6300`. They must
  allow it, or the proof server check fails even when the server is running.

## Toolchain pinning

Keep Compact on the 0.31 line until Mainnet upgrades its ledger. Newer toolchains target a
ledger version Mainnet does not run yet, and contracts compiled with them will not deploy
there.

```bash
compact update 0.31
compact compile --version   # 0.31.1
```
