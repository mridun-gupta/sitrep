/* Copies the installed maplibre-gl worker into public/vendor so the map
 * uses a self-hosted worker that always matches the bundled library version.
 * Runs via `predev`/`prebuild` — idempotent. */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
const destDir = join(root, 'public/vendor');
mkdirSync(destDir, { recursive: true });
copyFileSync(src, join(destDir, 'maplibre-worker.js'));
console.log('sync-worker: public/vendor/maplibre-worker.js updated');
