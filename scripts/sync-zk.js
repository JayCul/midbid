// Copies the compiled circuits and keys into public/zk so the browser can fetch
// them through FetchZkConfigProvider. Served from /zk rather than /managed so
// Vite never confuses them with the source modules it also imports.
import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';

const CONTRACTS = ['auction', 'registry'];

rmSync('public/zk', { recursive: true, force: true });
mkdirSync('public/zk', { recursive: true });
for (const name of CONTRACTS) {
  if (!existsSync(`managed/${name}`)) {
    console.error(`managed/${name} missing. Run: npm run compact`);
    process.exit(1);
  }
  cpSync(`managed/${name}`, `public/zk/${name}`, { recursive: true });
  console.log(`synced managed/${name} -> public/zk/${name}`);
}
