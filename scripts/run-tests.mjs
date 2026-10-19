import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function collectTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectTests(path) : entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

// Pass explicit paths: Node 20 and different shells do not expand ** alike.
const files = collectTests('tests').sort();
if (!files.length) throw new Error('No regression tests found.');
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
