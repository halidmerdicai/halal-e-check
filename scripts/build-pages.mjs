import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, GITHUB_ACTIONS: 'true', NEXT_PUBLIC_SITE_URL: 'https://halidmerdicai.github.io/halal-e-check' }
});
process.exit(result.status ?? 1);
