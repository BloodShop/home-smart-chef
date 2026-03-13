import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const seedPackPath = path.join(projectRoot, 'src', 'data', 'seed-pack.json');
const contentDir = path.join(projectRoot, 'content');
const packsDir = path.join(contentDir, 'packs');
const latestPackPath = path.join(packsDir, 'daily-he-latest.json');
const manifestPath = path.join(contentDir, 'manifest.json');

const now = new Date();
const dayKey = now.toISOString().slice(0, 10);

fs.mkdirSync(packsDir, { recursive: true });

const seedPack = JSON.parse(fs.readFileSync(seedPackPath, 'utf8'));
const recipes = Array.isArray(seedPack.recipes) ? seedPack.recipes.slice() : [];

recipes.sort((left, right) => {
  const leftPrep = Number(left.prepTimeMinutes) || 0;
  const rightPrep = Number(right.prepTimeMinutes) || 0;
  if (leftPrep !== rightPrep) return leftPrep - rightPrep;
  return String(left.titleHe).localeCompare(String(right.titleHe), 'he');
});

const dailyPack = {
  id: 'daily-he-latest',
  version: `${dayKey}-daily-he-latest`,
  generatedAt: now.toISOString(),
  recipes,
};

const manifest = {
  version: `${dayKey}-content`,
  generatedAt: now.toISOString(),
  packs: [
    {
      id: dailyPack.id,
      version: dailyPack.version,
      url: 'packs/daily-he-latest.json',
    },
  ],
};

fs.writeFileSync(latestPackPath, `${JSON.stringify(dailyPack, null, 2)}\n`);
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Refreshed content manifest for ${dayKey}`);
