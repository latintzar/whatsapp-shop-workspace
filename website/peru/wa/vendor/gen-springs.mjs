/* Ask Motion (vendored, MIT) for the exact curve of each spring we measured on the reference,
   and write them into peru/wa/wa.css as CSS linear() easings. Run with: node gen-springs.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const VERSION = '13.4.0';

/* the vendored browser build, run the way a browser runs it */
const sandbox = { console, performance, setTimeout, clearTimeout, queueMicrotask };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(here, 'motion.js'), 'utf8'), sandbox, { filename: 'motion.js' });
const M = sandbox.Motion;
const cssPath = join(here, '..', 'wa.css');

const SPRINGS = [
  ['sheet',  240, 30],   // the in-chat browser, the chat push
  ['banner', 260, 28],   // the notification banner
  ['card',   300, 32]    // a card or a page inside the sheet
];

const lines = SPRINGS.map(([name, stiffness, damping]) => {
  const gen = M.spring({ keyframes: [0, 1], stiffness, damping, mass: 1 });
  const duration = Math.round(M.calcGeneratorDuration(gen));
  const easing = M.generateLinearEasing(p => gen.next(p * duration).value, duration);
  return `  --wa-sp-${name}: ${easing};\n  --wa-sp-${name}-t: ${duration}ms;   /* spring ${stiffness}/${damping}/1 */`;
}).join('\n');

const block = `/* == springs (generated) ==\n   Motion ${VERSION} spring solver, sampled to CSS linear().\n   Regenerate with: node peru/wa/vendor/gen-springs.mjs */\n:root{\n${lines}\n}\n/* == end springs == */`;

const css = readFileSync(cssPath, 'utf8');
const re = /\/\* == springs \(generated\) ==[\s\S]*?\/\* == end springs == \*\//;
writeFileSync(cssPath, re.test(css) ? css.replace(re, block) : css.replace(/^(:root\{)/m, block + '\n\n$1'));
console.log(block.split('\n').map(l => l.slice(0, 96)).join('\n'));
