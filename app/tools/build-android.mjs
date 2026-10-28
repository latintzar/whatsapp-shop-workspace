import { build } from 'vite';
import { copyFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await build({ root, configFile: resolve(root, 'vite.android.config.ts') });
const out = resolve(root, 'dist-android');
renameSync(resolve(out, 'android.html'), resolve(out, 'index.html'));
for (const folder of ['brand', 'bodega-artwork', 'fonts/fraunces']) mkdirSync(resolve(out, folder), { recursive: true });
copyFileSync(resolve(root, 'public/brand/rocoto-mark.svg'), resolve(out, 'brand/rocoto-mark.svg'));
for (const name of ['fraunces-latin-500-700.woff2', 'OFL.txt']) {
  copyFileSync(resolve(root, `public/fonts/fraunces/${name}`), resolve(out, `fonts/fraunces/${name}`));
}
copyFileSync(resolve(root, 'public/bodega-artwork/welcome-fish-tiles.webp'), resolve(out, 'bodega-artwork/welcome-fish-tiles.webp'));
for (const name of ['hero-arrival', 'hero-arrival-wide', 'hero-referrals', 'hero-referrals-wide', 'hero-money']) {
  copyFileSync(resolve(root, `public/bodega-artwork/${name}.png`), resolve(out, `bodega-artwork/${name}.png`));
}
console.log('Bundled Android onboarding: dist-android/index.html');
