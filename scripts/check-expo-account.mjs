import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const appConfigPath = path.join(projectRoot, 'app.json');

const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
const expectedAccount = appConfig?.expo?.extra?.expoAccount;

if (!expectedAccount?.username) {
  console.error('Missing expo.extra.expoAccount.username in app.json');
  process.exit(1);
}

const raw = execSync('eas whoami', {
  cwd: projectRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const lines = raw
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !line.includes('DeprecationWarning'))
  .filter((line) => !line.startsWith('(Use `node --trace-deprecation'));

const username = lines[0] ?? '';
const email = lines[1] ?? '';

if (username !== expectedAccount.username) {
  console.error(`Expo account mismatch. Expected "${expectedAccount.username}" but got "${username || 'unknown'}".`);
  process.exit(1);
}

if (expectedAccount.email && email && email !== expectedAccount.email) {
  console.error(`Expo email mismatch. Expected "${expectedAccount.email}" but got "${email}".`);
  process.exit(1);
}

console.log(`Expo account OK: ${username}${email ? ` (${email})` : ''}`);
