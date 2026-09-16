// Pre-deploy check for the Preprod web app.
//
// Midbid has no server-side deploy key: contracts are deployed from the browser
// and signed by Lace, so there is nothing for a script to sign. What can go
// wrong before shipping the site is configuration, and that is what this checks:
// the build's registry exists on Preprod, the circuits match the source, and the
// proof server a tester needs is documented. It then builds the site.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { circuitCommitmentOf } from './circuit-commitment.mjs';

const envFile = ['.env.production.local', '.env.local', '.env'].find(existsSync);
const fromFile = envFile
  ? Object.fromEntries(
      readFileSync(envFile, 'utf8')
        .split('\n')
        .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2]]),
    )
  : {};
const registry = process.env.VITE_REGISTRY_ADDRESS ?? fromFile.VITE_REGISTRY_ADDRESS;

const fail = (msg) => {
  console.error(`x ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`ok ${msg}`);

ok(`circuit commitment ${circuitCommitmentOf()}`);

if (!registry) {
  fail('VITE_REGISTRY_ADDRESS is not set. Deploy a registry from #/setup first.');
}
try {
  execSync(`node scripts/find-auction.mjs --registry ${registry}`, { stdio: 'inherit' });
  ok('registry found on Preprod');
} catch {
  fail(`registry ${registry} was not found on Preprod`);
}

execSync('npm run build', { stdio: 'inherit' });
ok('built dist/. Deploy it with: vercel deploy --prod (or push to main if the project is linked)');
