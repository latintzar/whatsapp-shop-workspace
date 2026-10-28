/* ──────────────────────────────────────────────────────────────────────────────────────────────
   THE HANDSET — the licensed iPhone, lit and rendered while the reader scrolls.

   The object is `model/iphone-15-pro-max.glb` («Apple iPhone 15 Pro Max Black» by polyman,
   CC BY 4.0, credited in the footer and in `model/CREDITS.md`), put into our millimetres by
   `model.js`. Without a `model` url this builds the procedural handset it was written around,
   which `demo.html` keeps for comparison.

   THE ROOM IS THE CRAFT REFERENCE'S ROOM, value for value (SPEC, «The craft reference»): three's
   own `RoomEnvironment` through `PMREMGenerator` at sigma 0.04, one `HemisphereLight` and three
   `DirectionalLight`s, sRGB out, ACES filmic at exposure 1, anisotropy capped at 8. The bespoke
   studio of seventy emissive panels is now a dynamic import (`studio-rig.js`), reached only by
   `lighting: 'studio'`, which is the bake-time comparison and never the page. The ONE reference
   setting not taken is the lens: 34° there, 14° here, because every registration number this
   page owns was measured off a 14° bake (see `fov` below).

   NOTHING IS DRAWN UNTIL THE SHADERS ARE READY. The first real draw of a 31-material PBR scene
   compiles and links every program, and on ANGLE/Metal that is many seconds of blocked main
   thread — «Page Unresponsive». So the scene is handed to `renderer.compile()` and then
   `KHR_parallel_shader_compile`'s completion flag is polled from a timer, yielding to the event
   loop between looks; `draw()` is inert until that lands. A caller that runs out of patience
   disposes this and keeps the baked sequence.

   The screen is not painted in WebGL. A live 390×844 HTML document (an <iframe>) sits ON the
   glass as a DOM layer: every frame we project the screen quad's four corners to CSS pixels,
   solve the homography from the flat 390×844 element to those four points, and hand it to the
   compositor as `matrix3d`. Text stays vector-crisp at any angle, the demo keeps running, and the
   phone keeps turning. Past ~88° of turn the glass faces away and the layer is hidden.

   RENDER ON DEMAND ONLY. There is no animation loop in here; the page scrubs `setPose` from its
   own rAF and we draw one frame per call — and none at all while the container is off screen or
   the tab is in the background.

     const h = await createHandset(container, { screen: screenEl });
     h.setPose({ rotY, rotZ, rotX });   // radians
     h.resize();  h.dispose();  h.timings

   The container is the render box: give it aspect-ratio .78 and the handset sits in the middle
   ~58 % of its width, so a quarter turn never clips.

   WHAT THE PAGE OWES IT
   · a container with `aspect-ratio: .78` and nothing clipping it;
   · a `screen` element whose ONLY child chrome is the 390×844 demo — the module takes over its
     position, size, transform-origin, radius, clip and z-index, and the iframe inside it must sit
     at `inset: 0` with NO scale of its own (drop the `--ph-s` scale while `data-handset=live`);
   · the import, AFTER first paint. The static frame carries the page until then. On success the
     container gets `data-handset="live"` and fires `handset:ready`; on a box without WebGL the
     call throws and the page keeps the frame it already showed.

   OPTIONS   screen · island (element | true) · finish ('graphite' | 'titanium') · sheen · shadow ·
             fov · fill · lighting ('room' | 'studio') · envIntensity · superSample · pixelRatio ·
             exposure · reducedMotion · size · prepare · deadline · onStage(name, ms)
   READS     h.pose · h.cost (ms of the last frame) · h.pixelRatio · h.box() · h.screenQuad() ·
             h.screenEl · h.islandEl · h.timings · h.three (THREE, renderer, scene, camera, group)
   ────────────────────────────────────────────────────────────────────────────────────────────── */

import * as THREE from '../vendor/three/three.slim.module.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { mountModel } from './model.js';

/* ── the device, in millimetres ──────────────────────────────────────────────────────────────
   A 71.5 × 146.6 × 8.25 mm class handset, and the box the LOADED model is scaled into: `DEV.h`
   is the one number `model.js` fits the file to, so the camera below frames either object the
   same way. The procedural display is 65.0 × 140.7 mm, which is 390 : 844 to four decimal places
   — that is why the demos are authored 390 wide. The loaded model brings its own display and its
   own 13 % / 6.02 % corner; these two constants describe the procedural handset only. */

const DEV = { w: 71.5, h: 146.6, d: 8.25, r: 13.2 };
const SCR = { w: 65.0, h: 140.7, r: 10.4 };

/* How much of the front face the metal takes back off the glass. It sets BOTH front-pose
   proportions at once, because the screen rectangle is fixed: band = GLASS_INSET + the 0.10 mm
   silhouette bulge, bezel = (DEV.w − SCR.w)/2 − GLASS_INSET. At 1.00 that is a 1.10 mm band and a
   2.25 mm bezel on a 71.5 mm body — 1.54 % and 3.15 % of the width. The bezel cannot go below
   about 3 % without moving the screen rectangle, and the screen rectangle is the slot. */
const GLASS_INSET = 1.00;
const Z_FRONT = DEV.d / 2;  // 4.125
const Z_GLASS = Z_FRONT + 0.004;
const Z_SCREEN = Z_FRONT + 0.03;

/* The cross-section of the band, ordered back → front (z increasing). `t` is inward offset from
   the silhouette. Flat in the middle with a 0.1 mm outward bulge, then a rolled chamfer at each
   face. The bulge is what turns a hard specular edge into a highlight that sweeps. */
const BAND_PROFILE = [
  { t: 0.62, z: -Z_FRONT },
  { t: 0.42, z: -Z_FRONT + 0.10 },
  { t: 0.20, z: -Z_FRONT + 0.26 },
  { t: 0.06, z: -Z_FRONT + 0.52 },
  { t: 0.00, z: -Z_FRONT + 0.95 },
  { t: -0.05, z: -2.05 },
  { t: -0.10, z: 0 },
  { t: -0.05, z: 2.05 },
  { t: 0.00, z: Z_FRONT - 0.95 },
  { t: 0.06, z: Z_FRONT - 0.52 },
  { t: 0.26, z: Z_FRONT - 0.26 },
  { t: 0.52, z: Z_FRONT - 0.09 },
  { t: 0.74, z: Z_FRONT - 0.035 }
];

/* The lip is the last 0.5 mm of the chamfer, carried on its own polished material — a phone's
   diamond-cut edge. It is what keeps the handset from collapsing into one black outline at the
   front pose and at 240 px: it holds a bright hairline all the way round, at every angle.
   It starts on BAND_PROFILE's last point exactly, so the two sweeps share vertices and the break
   is a shading break, not a crack. */
const LIP_PROFILE = [
  { t: 0.74, z: Z_FRONT - 0.035 },
  { t: 0.88, z: Z_FRONT - 0.012 },
  { t: GLASS_INSET + 0.02, z: Z_FRONT }
];

const PLATEAU = { x: -13.4, y: 49.6, s: 37.4, r: 11.6, rise: 1.5 };
const LENSES = [
  { x: -9.4, y: 9.4, r: 7.45 },
  { x: -9.4, y: -9.4, r: 7.45 },
  { x: 9.4, y: -9.4, r: 7.45 }
];

const BUTTONS = [
  { side: -1, y: 47.0, len: 8.0, w: 3.4 },   // action
  { side: -1, y: 33.0, len: 14.5, w: 3.4 },  // volume up
  { side: -1, y: 16.6, len: 14.5, w: 3.4 },  // volume down
  { side: 1, y: 33.5, len: 23.0, w: 3.4 }    // wake
];

/* ── outlines and sweeps ─────────────────────────────────────────────────────────────────────
   A rounded rectangle as a closed polyline that carries its own exact outward normal. Everything
   on this object is built by sweeping a profile along one of these, so every normal is analytic —
   no `computeVertexNormals`, no smoothing-angle guesswork, no seams. */

function roundedRect(w, h, r, cornerSegs) {
  const hw = w / 2 - r, hh = h / 2 - r;
  const pts = [];
  const corners = [
    { cx: hw, cy: hh, a0: 0 },            // NE
    { cx: -hw, cy: hh, a0: Math.PI / 2 },  // NW
    { cx: -hw, cy: -hh, a0: Math.PI },      // SW
    { cx: hw, cy: -hh, a0: Math.PI * 1.5 } // SE
  ];
  for (const c of corners) {
    for (let i = 0; i <= cornerSegs; i++) {
      // skip the duplicated joint between arcs — the straight run between them is implicit
      if (i === 0 && pts.length) {
        const prev = pts[pts.length - 1];
        const a = c.a0;
        const nx = Math.cos(a), ny = Math.sin(a);
        const x = c.cx + nx * r, y = c.cy + ny * r;
        if (Math.abs(x - prev.x) < 1e-9 && Math.abs(y - prev.y) < 1e-9) continue;
      }
      const a = c.a0 + (i / cornerSegs) * (Math.PI / 2);
      const nx = Math.cos(a), ny = Math.sin(a);
      pts.push({ x: c.cx + nx * r, y: c.cy + ny * r, nx, ny });
    }
  }
  return pts;
}

/* Sweep a profile around a closed outline.
   P(u,v) = C(u) − n(u)·t(v) + ẑ·z(v)   and the exact normal falls out as (nx·dz, ny·dz, dt). */
function sweepGeometry(outline, profile) {
  const N = outline.length, M = profile.length;
  const pos = new Float32Array(N * M * 3);
  const nor = new Float32Array(N * M * 3);
  const uvs = new Float32Array(N * M * 2);

  // arc length along the outline, for UVs (and any future anisotropy)
  const s = new Float32Array(N + 1);
  for (let i = 0; i < N; i++) {
    const a = outline[i], b = outline[(i + 1) % N];
    s[i + 1] = s[i] + Math.hypot(b.x - a.x, b.y - a.y);
  }
  const total = s[N] || 1;

  for (let j = 0; j < M; j++) {
    const p = profile[j];
    const pPrev = profile[Math.max(0, j - 1)];
    const pNext = profile[Math.min(M - 1, j + 1)];
    let dt = pNext.t - pPrev.t;
    let dz = pNext.z - pPrev.z;
    const len = Math.hypot(dt, dz) || 1;
    dt /= len; dz /= len;
    for (let i = 0; i < N; i++) {
      const o = outline[i];
      const k = (j * N + i) * 3;
      pos[k] = o.x - o.nx * p.t;
      pos[k + 1] = o.y - o.ny * p.t;
      pos[k + 2] = p.z;
      const nl = Math.hypot(dz, dt) || 1;
      nor[k] = (o.nx * dz) / nl;
      nor[k + 1] = (o.ny * dz) / nl;
      nor[k + 2] = dt / nl;
      const q = (j * N + i) * 2;
      uvs[q] = s[i] / total;
      uvs[q + 1] = j / (M - 1);
    }
  }

  const idx = [];
  for (let j = 0; j < M - 1; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * N + i, b = j * N + ((i + 1) % N);
      const c = (j + 1) * N + i, d = (j + 1) * N + ((i + 1) % N);
      idx.push(a, b, c, b, d, c);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
}

/* A flat rounded-rect face, fanned from the centre. One constant normal, so a fan is exact. */
function capGeometry(outline, inset, z, dir) {
  const N = outline.length;
  const pos = new Float32Array((N + 1) * 3);
  const nor = new Float32Array((N + 1) * 3);
  const uvs = new Float32Array((N + 1) * 2);
  pos[0] = 0; pos[1] = 0; pos[2] = z;
  nor[2] = dir;
  uvs[0] = 0.5; uvs[1] = 0.5;
  let maxx = 1e-6, maxy = 1e-6;
  for (const o of outline) { maxx = Math.max(maxx, Math.abs(o.x)); maxy = Math.max(maxy, Math.abs(o.y)); }
  for (let i = 0; i < N; i++) {
    const o = outline[i], k = (i + 1) * 3, q = (i + 1) * 2;
    pos[k] = o.x - o.nx * inset;
    pos[k + 1] = o.y - o.ny * inset;
    pos[k + 2] = z;
    nor[k + 2] = dir;
    uvs[q] = pos[k] / (2 * maxx) + 0.5;
    uvs[q + 1] = pos[k + 1] / (2 * maxy) + 0.5;
  }
  const idx = [];
  for (let i = 0; i < N; i++) {
    const a = 1 + i, b = 1 + ((i + 1) % N);
    if (dir > 0) idx.push(0, a, b); else idx.push(0, b, a);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
}

/* A rounded slab with rolled edges — buttons, the camera plateau. Built with the same machinery,
   so its edges catch light the same way the band does. */
function roundedSlab(w, h, d, r, roll, segs) {
  const outline = roundedRect(w, h, r, segs);
  const hz = d / 2;
  const prof = [
    { t: roll, z: -hz },
    { t: roll * 0.5, z: -hz + roll * 0.42 },
    { t: roll * 0.13, z: -hz + roll * 0.78 },
    { t: 0, z: -hz + roll },
    { t: 0, z: hz - roll },
    { t: roll * 0.13, z: hz - roll * 0.78 },
    { t: roll * 0.5, z: hz - roll * 0.42 },
    { t: roll, z: hz }
  ];
  const parts = [
    sweepGeometry(outline, prof),
    capGeometry(outline, roll, hz, 1),
    capGeometry(outline, roll, -hz, -1)
  ];
  return mergeGeometries(parts);
}

function mergeGeometries(list) {
  let vCount = 0, iCount = 0;
  for (const g of list) { vCount += g.attributes.position.count; iCount += g.index.count; }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const g of list) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    uvs.set(g.attributes.uv.array, vo * 2);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += n; io += gi.length;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

/* ── homography ──────────────────────────────────────────────────────────────────────────────
   Four point pairs determine a projective map exactly, and a plane under a perspective camera IS
   a projective map, so this is not an approximation: the iframe lands on the glass to the pixel. */

function solveHomography(dst) {
  // src is the flat element: (0,0) (390,0) (390,844) (0,844)
  const src = [[0, 0], [390, 0], [390, 844], [0, 844]];
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]); b.push(v);
  }
  // Gauss–Jordan with partial pivoting
  for (let i = 0; i < 8; i++) {
    let p = i;
    for (let k = i + 1; k < 8; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    if (p !== i) { const t = A[p]; A[p] = A[i]; A[i] = t; const tb = b[p]; b[p] = b[i]; b[i] = tb; }
    const d = A[i][i];
    if (!d) return null;
    for (let k = i; k < 8; k++) A[i][k] /= d;
    b[i] /= d;
    for (let k = 0; k < 8; k++) {
      if (k === i) continue;
      const f = A[k][i];
      if (!f) continue;
      for (let m = i; m < 8; m++) A[k][m] -= f * A[i][m];
      b[k] -= f * b[i];
    }
  }
  return b; // a b c d e f g h
}

function matrix3dFrom(H) {
  const [a, b, c, d, e, f, g, h] = H;
  const n = (v) => (Math.abs(v) < 1e-10 ? 0 : v);
  return 'matrix3d(' + [n(a), n(d), 0, n(g), n(b), n(e), 0, n(h), 0, 0, 1, 0, n(c), n(f), 0, 1]
    .map((v) => (typeof v === 'number' ? v.toFixed(8) : v)).join(',') + ')';
}

/* ── the component ───────────────────────────────────────────────────────────────────────── */

export async function createHandset(container, opts = {}) {
  const o = Object.assign({
    screen: null,          // the 390×844 wrapper that carries the live demo
    island: null,          // optional dynamic-island element; it is moved onto the glass
    finish: 'graphite',    // 'graphite' (near-black titanium, the default) or 'titanium'
    sheen: true,           // a glass sweep drawn over the demo
    shadow: true,          // the soft elliptical contact shadow
    /* THE LENS IS OURS, AND IT IS THE ONE REFERENCE SETTING THIS PAGE DOES NOT TAKE. The
       reference frames its handset through 34°, which stands the camera 1.78 device-heights
       away; ours is 14°, which stands it 4.4 away and flattens the perspective. That is a
       FRAMING choice rather than a cost — a lens changes no shader, no texture and no draw — and
       every registration number this page owns was measured off a 14° bake: `--ph-ar`, `--ph-s`,
       the stage box in `phone.css`, the glass's four percentages, `handset.json`. Moving it
       moves every phone on the page by about 2 %, which is a geometry change, not this one.
       `bake.html` and `live.js` both name it explicitly, so the two stay one object. */
    fov: 14,
    fill: 0.925,           // the device's height as a fraction of the box's height
    /* THE ROOM. 'room' is three's own `RoomEnvironment` at sigma 0.04 plus four lights — what
       the page and every baked frame use. 'studio' dynamically imports the bespoke panel rig,
       which is kept for the procedural handset and costs seconds on a first frame. */
    lighting: 'room',
    /* THE ROOM'S WEIGHT ON THE OBJECT, and the one number here that is ours rather than the
       reference's. It raises the materials' floor to at least 1.35, as the reference does, and
       sets `scene.environmentIntensity` — which is the uniform three actually sends (see the room
       below). 1.35 leaves a near-black body: measured on the dark band, whose own luminance is
       21, the edge-on pose came back at a median of 16, a sliver darker than the ground it
       stands on. Swept on both grounds at 0 / 45 / 75 / 90 and looked at, 3.6 is where the rail
       is a lit band at every angle (90° median 52) and the body is still black titanium rather
       than silver. */
    envIntensity: 3.6,
    superSample: false,    // a 2× ceiling is the policy; an explicit `pixelRatio` overrides it
    pixelRatio: null,
    exposure: 1.00,
    reducedMotion: null,
    /* SHADER PREPARATION, AND HOW LONG THE CALLER WILL WAIT FOR IT. Past this the mount fails
       and the caller keeps whatever it was already showing. */
    prepare: true,
    deadline: 6000,
    onStage: null,         // (name, msSinceMount) — every stage, for `window.__handsetTimings`
    /* THE REAL HANDSET. A URL loads the licensed iPhone through `model.js` and that object IS
       the handset; left null the module builds its own. Everything downstream — the camera, the
       projection, the silhouette — reads the same three numbers either way. */
    model: null,
    /* THE BOX, TOLD RATHER THAN MEASURED — `() => ({ width, height })` in CSS pixels. A caller
       that puts the container inside a CSS `scale()` measures the box AFTER that scale, and the
       matrix3d this module solves would then be applied inside the same scale a second time. Such
       a caller owns the unscaled number and hands it in. Left null, the container is measured. */
    size: null
  }, opts);

  const reduced = o.reducedMotion !== null
    ? o.reducedMotion
    : (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── the clock ────────────────────────────────────────────────────────────────────────────
     EVERY STAGE IS TIMED, because the failure this module was rebuilt around is a stage that
     takes seconds on hardware it was never run on. `timings` is handed back and the page puts it
     on `window.__handsetTimings`, so a machine that stutters can say WHERE. */
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const T0 = now();
  const timings = { start: T0, stages: {}, order: [], prepared: false, reason: null };
  function mark(name) {
    const at = Math.round((now() - T0) * 10) / 10;
    timings.stages[name] = at;
    timings.order.push(name);
    if (typeof o.onStage === 'function') { try { o.onStage(name, at); } catch (e) {} }
    return at;
  }
  /* EVERY AWAIT YIELDS. A promise that is already settled still resolves in a microtask, which
     runs BEFORE the browser gets a turn; between two heavy stages the page needs a task. */
  const breathe = () => new Promise((res) => setTimeout(res, 0));

  /* ── the deadline ─────────────────────────────────────────────────────────────────────────
     ONE CLOCK OVER THE WHOLE MOUNT, and it is the reader's patience rather than any one stage's
     budget: a machine that needs seven seconds to link its shaders and a machine that needs
     seven seconds to fetch the model are the same page to the person looking at it. When it
     fires, the shader poll is stopped on the spot, the stage it died in is written into
     `timings.reason`, and the mount throws — so the caller keeps the baked handset it was
     already showing, for the rest of the session. Nothing waits for a slow stage to finish
     first; the only thing that can still be running is a fetch, and its bytes are cached. */
  let cancelPreparation = () => {};
  const DEADLINE = Math.max(0, o.deadline || 0);
  let expired = false;
  let fireExpiry = null;
  const expiry = DEADLINE > 0 ? new Promise((res) => { fireExpiry = res; }) : null;
  const deadlineTimer = DEADLINE > 0 ? setTimeout(() => {
    expired = true;
    timings.reason = 'deadline:' + (timings.order[timings.order.length - 1] || 'start');
    cancelPreparation();
    if (fireExpiry) fireExpiry();
  }, DEADLINE) : 0;

  /* A STAGE THAT CANNOT BE CANCELLED IS RACED INSTEAD. A fetch in flight cannot be called back;
     what matters is that the READER stops waiting for it, so the clock wins the race and the
     bytes land in the cache for a reader who comes back. */
  async function within(p, stage) {
    if (!expiry) return p;
    p.catch(() => {});
    const won = await Promise.race([p.then((v) => ({ v: v })), expiry.then(() => null)]);
    if (!won) throw abort('deadline:' + stage);
    return won.v;
  }
  function stopClock() { if (deadlineTimer) clearTimeout(deadlineTimer); }

  /* GIVING UP BEFORE THERE IS A HANDSET. `dispose()` below tears down a mounted object; this is
     the other half — the context, the clone and the canvas go, and the caller is handed an error
     carrying the stage it died in. It touches nothing that is built after the model, so it is
     safe from the first await onwards. */
  let aborted = false;
  function abort(why) {
    if (!aborted) {
      aborted = true;
      timings.reason = timings.reason || why;
      stopClock();
      cancelPreparation();
      try { if (fitted) fitted.dispose(); } catch (e) {}
      try { for (const g of geos) g.dispose(); } catch (e) {}
      try { for (const k in M) M[k].dispose(); } catch (e) {}
      try { renderer.dispose(); } catch (e) {}
      /* and nothing forces the context loss — see `dispose` below: it costs 13 seconds of main
         thread on a page that has other contexts on it */
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      container.removeAttribute('data-handset');
    }
    /* THE ERROR CARRIES THE CLOCK. The caller never gets a handset to ask, and the stage this
       died in is the one thing worth knowing about a machine that cannot run it. */
    const err = new Error('handset: ' + (timings.reason || why));
    err.timings = timings;
    return err;
  }

  /* ── canvas ───────────────────────────────────────────────────────────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.className = 'hs-canvas';
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    display: 'block', pointerEvents: 'none'
  });

  let renderer;
  try {
    /* THE REFERENCE'S CONTEXT, exactly: transparent, multisampled, and asking for the discrete
       GPU. Nothing else is set — every extra attribute is another way for a driver to hand back
       a context it then renders slowly. */
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, powerPreference: 'high-performance'
    });
  } catch (err) {
    throw new Error('handset: no WebGL (' + err.message + ')');
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(o.fov, 1, 40, 4000);

  /* ── materials ────────────────────────────────────────────────────────────────────────── */
  /* GRAPHITE is the default and the product shot: a near-black titanium, not a black outline.
     The distinction is the albedo. A metal renders as albedo × the room, so an albedo of about
     0.08 linear (the band below) puts the dark half of the room at #14 and the ribbon at #c8 —
     a body that reads properly dark on paper while still carrying a white-hot hairline. Paint it
     0x101014 instead and every direction collapses to black; paint it 0xa0a0a0 and it is silver.

     The lip — the last half-millimetre of the chamfer, diamond-cut — is a full stop brighter and
     much smoother than the band. It is what survives at 236 px, and it is the reason the front
     pose has an edge at all. TITANIUM is kept for the light finish; the room is tuned for the
     dark one, so it carries a gain that pulls the room back down. */
  const FINISH = {
    graphite: {
      band: { color: 0x1e2024, roughness: 0.20, envMapIntensity: 1.30, anisotropy: 0.34 },
      lip: { color: 0x767c88, roughness: 0.07, envMapIntensity: 1.45 },
      button: { color: 0x2b2d33, roughness: 0.30, envMapIntensity: 1.15 },
      lens: { color: 0x666a74, roughness: 0.10, envMapIntensity: 1.5 },
      back: { color: 0x141519, roughness: 0.32, clearcoat: 0.65, envMapIntensity: 1.0 },
      glass: 0x141419,
      gain: 1
    },
    titanium: {
      band: { color: 0xc4bfb6, roughness: 0.34, envMapIntensity: 1.12, anisotropy: 0.45 },
      lip: { color: 0xe8e4dc, roughness: 0.26, envMapIntensity: 1.65 },
      button: { color: 0xb8b3aa, roughness: 0.44, envMapIntensity: 1.0 },
      lens: { color: 0xd4d0c8, roughness: 0.22, envMapIntensity: 1.3 },
      back: { color: 0xcfcac1, roughness: 0.52, clearcoat: 0.42, envMapIntensity: 0.95 },
      glass: 0x070709,
      gain: 0.42
    }
  };
  const F = FINISH[o.finish] || FINISH.graphite;

  const M = {
    band: new THREE.MeshPhysicalMaterial({
      color: F.band.color, metalness: 1, roughness: F.band.roughness,
      envMapIntensity: F.band.envMapIntensity,
      // the brush runs along the band's length (u), so the lobe smears the same way and the
      // hairline stays a LINE instead of breaking into beads as the object turns
      anisotropy: F.band.anisotropy, anisotropyRotation: 0
    }),
    lip: new THREE.MeshPhysicalMaterial({
      color: F.lip.color, metalness: 1, roughness: F.lip.roughness,
      envMapIntensity: F.lip.envMapIntensity
    }),
    /* the bezel ring under the front glass. It is the black frame that makes the screen read as
       a screen, and at the resting pose it is flat, head-on and 2.25 mm wide — a mirror pointed
       straight back at the room. Two clearcoats' worth of Fresnel at normal incidence is only
       ~4.5 %, but 4.5 % of a soft box is still a mid-grey wash, and a grey bezel merges into the
       band and the handset loses its frame. So the stack is deliberately weak head-on: one thin
       coat, a third of the room's intensity, and an environment with nothing in the frontal cone
       to reflect. */
    glass: new THREE.MeshPhysicalMaterial({
      color: F.glass, metalness: 0.03, roughness: 0.05,
      clearcoat: 0.55, clearcoatRoughness: 0.02, envMapIntensity: 0.34
    }),
    back: new THREE.MeshPhysicalMaterial({
      color: F.back.color, metalness: 0.14, roughness: F.back.roughness,
      clearcoat: F.back.clearcoat, clearcoatRoughness: 0.3,
      envMapIntensity: F.back.envMapIntensity
    }),
    screen: new THREE.MeshPhysicalMaterial({
      color: 0x050506, metalness: 0.05, roughness: 0.09,
      clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.62
    }),
    lensRing: new THREE.MeshPhysicalMaterial({
      color: F.lens.color, metalness: 1, roughness: F.lens.roughness,
      envMapIntensity: F.lens.envMapIntensity
    }),
    lensGlass: new THREE.MeshPhysicalMaterial({
      color: 0x050608, metalness: 0.4, roughness: 0.04,
      clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.5
    }),
    button: new THREE.MeshPhysicalMaterial({
      color: F.button.color, metalness: 1, roughness: F.button.roughness,
      envMapIntensity: F.button.envMapIntensity
    }),
    trim: new THREE.MeshPhysicalMaterial({
      color: 0x2a2b30, metalness: 0.3, roughness: 0.55, envMapIntensity: 0.7
    })
  };

  /* ── the object ───────────────────────────────────────────────────────────────────────── */
  const group = new THREE.Group();
  scene.add(group);
  const geos = [];
  const keep = (g) => { geos.push(g); return g; };

  /* THE OBJECT IS EITHER THE FILE OR THE CODE. `model` is the licensed iPhone (see
     `model.js`); without it the handset is the procedural one this module was written around,
     which is what `demo.html` uses to compare the two and what answers if the file will not
     load. Both end up as children of the same `group`, in the same millimetres, with the glass
     facing +Z — so everything past this point is written once. */
  let fitted = null;
  let SCREEN = { w: SCR.w, h: SCR.h, x: 0, y: 0, z: Z_SCREEN };
  let SOLID = { w: DEV.w, h: DEV.h, d: DEV.d };

  function buildProcedural() {
    const body = roundedRect(DEV.w, DEV.h, DEV.r, 26);
    group.add(new THREE.Mesh(keep(sweepGeometry(body, BAND_PROFILE)), M.band));
    group.add(new THREE.Mesh(keep(sweepGeometry(body, LIP_PROFILE)), M.lip));

    // front glass, a hair inside the band so a bright metal rim survives at every angle
    group.add(new THREE.Mesh(keep(capGeometry(body, GLASS_INSET, Z_GLASS, 1)), M.glass));

    // the display — what the iframe lands on, and what shows when it has not loaded
    const screenOutline = roundedRect(SCR.w, SCR.h, SCR.r, 22);
    group.add(new THREE.Mesh(keep(capGeometry(screenOutline, 0, Z_SCREEN, 1)), M.screen));

    // back panel
    group.add(new THREE.Mesh(keep(capGeometry(body, GLASS_INSET, -Z_GLASS, -1)), M.back));

    // camera plateau, raised off the back with its own rolled edge
    {
      const slab = roundedSlab(PLATEAU.s, PLATEAU.s, PLATEAU.rise * 2, PLATEAU.r, 0.55, 16);
      const mesh = new THREE.Mesh(keep(slab), M.back);
      mesh.position.set(PLATEAU.x, PLATEAU.y, -Z_FRONT);
      group.add(mesh);

      const face = -Z_FRONT - PLATEAU.rise;   // the plateau's outer face

      for (const L of LENSES) {
        // a short collar, a rolled rim, then the glass sunk inside it
        const ring = new THREE.Mesh(
          keep(new THREE.CylinderGeometry(L.r, L.r * 0.99, 0.62, 48, 1, true)), M.lensRing
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(PLATEAU.x + L.x, PLATEAU.y + L.y, face - 0.31);
        group.add(ring);

        const rim = new THREE.Mesh(keep(new THREE.TorusGeometry(L.r - 0.26, 0.26, 12, 48)), M.lensRing);
        rim.position.set(PLATEAU.x + L.x, PLATEAU.y + L.y, face - 0.62);
        group.add(rim);

        const glassDisc = new THREE.Mesh(
          keep(new THREE.CylinderGeometry(L.r - 0.52, L.r - 0.52, 0.5, 44)), M.lensGlass
        );
        glassDisc.rotation.x = Math.PI / 2;
        glassDisc.position.set(PLATEAU.x + L.x, PLATEAU.y + L.y, face - 0.42);
        group.add(glassDisc);

        const iris = new THREE.Mesh(
          keep(new THREE.CylinderGeometry(L.r * 0.34, L.r * 0.46, 0.3, 32)), M.lensGlass
        );
        iris.rotation.x = Math.PI / 2;
        iris.position.set(PLATEAU.x + L.x, PLATEAU.y + L.y, face - 0.3);
        group.add(iris);
      }

      // flash and sensor, top right of the plateau
      const flash = new THREE.Mesh(keep(new THREE.CylinderGeometry(3.0, 3.0, 0.36, 28)), M.lensRing);
      flash.rotation.x = Math.PI / 2;
      flash.position.set(PLATEAU.x + 9.6, PLATEAU.y + 9.8, face - 0.18);
      group.add(flash);

      const sensor = new THREE.Mesh(keep(new THREE.CylinderGeometry(1.45, 1.45, 0.3, 20)), M.lensGlass);
      sensor.rotation.x = Math.PI / 2;
      sensor.position.set(PLATEAU.x + 9.6, PLATEAU.y + 1.6, face - 0.15);
      group.add(sensor);
    }

    // buttons: three on the left, one on the right — the side the quarter turn shows you
    for (const b of BUTTONS) {
      // thickness runs along x, so most of the slab is buried in the band and only the
      // rolled face shows — a button set INTO the metal, not a peg stuck onto it
      const g = keep(roundedSlab(b.w, b.len, 1.6, 1.6, 0.20, 10));
      const mesh = new THREE.Mesh(g, M.button);
      mesh.rotation.y = b.side * Math.PI / 2;
      mesh.position.set(b.side * (DEV.w / 2 - 0.44), b.y, 0);
      group.add(mesh);
    }

    // antenna breaks on the top and bottom rails
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const g = keep(new THREE.BoxGeometry(1.05, 0.5, DEV.d - 1.3));
        const m = new THREE.Mesh(g, M.trim);
        m.position.set(sx * 19.5, sy * (DEV.h / 2 - 0.12), 0);
        group.add(m);
      }
    }
  }

  if (o.model) {
    /* THE DISPLAY, OFF. `M.screen` was tuned for a procedural glass that sits a hair BELOW a
       bezel; the file's display is the outermost surface on the front face, so the same clearcoat
       catches the studio's sky across the whole rectangle and the phone reads as if its screen
       were lit white. A real switched-off OLED is a dark mirror: almost no diffuse, a narrow
       specular, and the room only at grazing angles. That is this material, and it is what the
       reader sees past 80°, where the live document steps aside. */
    M.modelGlass = new THREE.MeshPhysicalMaterial({
      color: 0x050507, metalness: 0.04, roughness: 0.055,
      clearcoat: 0.9, clearcoatRoughness: 0.035, envMapIntensity: 0.16
    });
    mark('build');
    fitted = await within(mountModel(group, o.model, {
      height: DEV.h,
      screenMaterial: M.modelGlass,
      tone: o.lighting === 'studio' ? F.gain : 1,
      /* the reference's two numbers for a loaded file: the room weighed at least 1.35 on every
         standard/physical material, and every texture resampled at up to 8× anisotropy */
      env: o.lighting === 'studio' ? null : o.envIntensity,
      anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy())
    }), 'model');
    mark('model');
    if (expired) throw abort('deadline:model');
    await breathe();
    SCREEN = {
      w: fitted.screen.w, h: fitted.screen.h,
      x: fitted.screen.x, y: fitted.screen.y,
      /* the DOM layer sits a hair proud of the display, exactly as it does on the
         procedural handset, so the glass never z-fights the mesh under it */
      z: fitted.screen.z + 0.03
    };
    SOLID = fitted.metrics.mm;
  } else {
    buildProcedural();
  }

  /* ── the room ─────────────────────────────────────────────────────────────────────────────
     THE CRAFT REFERENCE'S ROOM, value for value. `RoomEnvironment` is three's own model-viewer
     room — a handful of boxes and area lights — and a PMREM of it at sigma 0.04 is ONE pass over
     a small scene. The rig this replaced hung about seventy emissive panels and asked PMREM to
     keep them sharp at sigma 0.008, which is where the seconds went.

     Four lights sit on top of it, and they are the reference's four. A metal has no diffuse term,
     so what they add is the crisp specular a room alone cannot give: the hard little travelling
     highlight down the rail. Their positions are directions — a directional light aims at the
     origin — so the reference's numbers carry over to our millimetres unchanged. */
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT;
  if (o.lighting === 'studio') {
    const { studioEnvironment } = await import('./studio-rig.js');
    const envScene = studioEnvironment(THREE, F.gain);
    envRT = pmrem.fromScene(envScene, 0.008);       // barely blurred: the ribbon must stay a line
    envScene.traverse((n) => {
      if (n.isMesh) { n.geometry.dispose(); n.material.dispose(); }
    });
  } else {
    const room = new RoomEnvironment();
    envRT = pmrem.fromScene(room, 0.04);
    room.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x071018, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(-6, 8, 11);
    scene.add(key);
    const fillLight = new THREE.DirectionalLight(0xdde7f5, 0.95);
    fillLight.position.set(6, -1, 8);
    scene.add(fillLight);
    const rim = new THREE.DirectionalLight(0xc9dcff, 1.1);
    rim.position.set(5, 4, -5);
    scene.add(rim);
  }
  scene.environment = envRT.texture;
  /* THE ROOM'S WEIGHT, AND THE ONLY UNIFORM THAT CARRIES IT. Three r169 overrides a standard
     material's own `envMapIntensity` whenever the material has no `envMap` of its own and the
     scene has an `environment` (WebGLRenderer, «material.isMeshStandardMaterial && material.envMap
     === null»): the uniform it sends is `scene.environmentIntensity`. Measured here — the rail's
     median on the dark band was identical at 1.35, 2.6 and 8 on the material — so the number that
     does the work is this one. `model.js` still raises the materials' own floor, for the day a
     material arrives carrying its own map. */
  scene.environmentIntensity = o.lighting === 'studio' ? 1 : o.envIntensity;

  /* THE DISPLAY KEEPS ITS OWN WEIGHT. The override above applies to every material WITHOUT an
     `envMap` of its own — the switched-off screen included, which would then brighten with the
     metal until the glass read as a grey slab. Handing that one material the room's texture
     directly puts it back under its own number, so the body can carry the room and the display
     stays the dark mirror a screen that is off actually is. */
  if (M.modelGlass) {
    M.modelGlass.envMap = envRT.texture;
    M.modelGlass.envMapIntensity = 0.16 * (o.lighting === 'studio' ? 1 : o.envIntensity);
    M.modelGlass.needsUpdate = true;
  }
  pmrem.dispose();
  mark('room');

  /* ── DOM layers ───────────────────────────────────────────────────────────────────────── */
  const cs = getComputedStyle(container);
  if (cs.position === 'static') container.style.position = 'relative';

  let shadowEl = null;
  if (o.shadow) {
    shadowEl = document.createElement('i');
    shadowEl.className = 'hs-shadow';
    Object.assign(shadowEl.style, {
      position: 'absolute', left: '50%', top: '0', display: 'block',
      background: 'rgba(10,14,20,.21)',
      borderRadius: '50%', pointerEvents: 'none', willChange: 'transform,opacity', zIndex: '0'
    });
    container.insertBefore(shadowEl, container.firstChild);
  }
  container.appendChild(canvas);

  const screenEl = o.screen || null;
  let sheenEl = null;
  let islandEl = null;
  if (screenEl) {
    Object.assign(screenEl.style, {
      position: 'absolute', top: '0', left: '0',
      width: '390px', height: '844px',
      transformOrigin: '0 0',
      borderRadius: '13% / 6.02%',
      overflow: 'hidden',
      clipPath: 'inset(0 round 13% / 6.02%)',
      pointerEvents: 'none',
      backfaceVisibility: 'hidden',
      zIndex: '2',
      willChange: 'transform'
    });
    /* The island rides the glass, so it lives INSIDE the 390×844 element and the homography
       carries it. `island: true` makes one; passing an element moves the page's own. */
    if (o.island) {
      const isl = o.island === true ? document.createElement('i') : o.island;
      if (o.island === true) isl.className = 'hs-island';
      screenEl.appendChild(isl);
      Object.assign(isl.style, {
        position: 'absolute', top: '11px', left: '50%', display: 'block',
        width: '125px', height: '37px', margin: '0',
        transform: 'translateX(-50%)', borderRadius: '999px', zIndex: '4',
        pointerEvents: 'none'
      });
      if (o.island === true) isl.style.background = '#0b0b0c';
      islandEl = isl;
    }
    if (o.sheen) {
      sheenEl = screenEl.querySelector('.hs-sheen');
      if (!sheenEl) {
        sheenEl = document.createElement('i');
        sheenEl.className = 'hs-sheen';
        Object.assign(sheenEl.style, {
          position: 'absolute', inset: '0', display: 'block',
          pointerEvents: 'none', mixBlendMode: 'screen', zIndex: '5', opacity: '0'
        });
        screenEl.appendChild(sheenEl);
      }
    }
  }

  /* ── sizing ─────────────────────────────────────────────────────────────────────────────
     NEVER LARGER THAN THE BOX NEEDS. The backing store is the CSS box times a pixel ratio that
     is capped at 2 — the reference's cap, and the reason is arithmetic: a 3× display would ask
     for nine times the memory and nine times the fill to draw a band that is one CSS pixel wide.
     The baker overrides it with an explicit `pixelRatio`, which is the only supersampling here.

     THE SAME BOX IS NEVER ALLOCATED TWICE. The travelling handset's container is inside a CSS
     `scale()`, so its own rect changes on every frame of the journey; the page hands us the
     unscaled number, and this returns without touching the renderer whenever that number and the
     display's density are what we already have. */
  const DPR_MIN = 1, DPR_MAX = 2;
  let W = 0, H = 0, dpr = 1, metricsW = 0, metricsH = 0, metricsD = 0;

  function measure() {
    const r = o.size ? o.size() : container.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    const raw = (typeof devicePixelRatio === 'number' && isFinite(devicePixelRatio))
      ? devicePixelRatio : 1;
    const d = o.pixelRatio || Math.min(DPR_MAX, Math.max(DPR_MIN, o.superSample ? Math.max(raw, 2) : raw));
    if (w === metricsW && h === metricsH && Math.abs(d - metricsD) < 0.01) return false;
    metricsW = w; metricsH = h; metricsD = d;
    W = w; H = h; dpr = d;
    /* one operation, one allocation: `setPixelRatio` followed by `setSize` sizes the backing
       store twice, and the intermediate is the expensive one */
    renderer.setDrawingBufferSize(W, H, dpr);
    camera.aspect = W / H;
    // frame the device: its height fills `fill` of the box, whatever the box's aspect
    const halfH = (SOLID.h / 2) / o.fill;
    camera.position.set(0, 0, halfH / Math.tan((o.fov * Math.PI / 180) / 2));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    return true;
  }

  /* ── projection ───────────────────────────────────────────────────────────────────────── */
  /* THE GLASS'S FOUR CORNERS, in the object's own millimetres: clockwise from top-left, which
     is the order `solveHomography` pairs against (0,0) (390,0) (390,844) (0,844). `SCREEN` is
     the procedural display, or the rectangle measured off the loaded file. */
  const CORNERS = [
    new THREE.Vector3(SCREEN.x - SCREEN.w / 2, SCREEN.y + SCREEN.h / 2, SCREEN.z),
    new THREE.Vector3(SCREEN.x + SCREEN.w / 2, SCREEN.y + SCREEN.h / 2, SCREEN.z),
    new THREE.Vector3(SCREEN.x + SCREEN.w / 2, SCREEN.y - SCREEN.h / 2, SCREEN.z),
    new THREE.Vector3(SCREEN.x - SCREEN.w / 2, SCREEN.y - SCREEN.h / 2, SCREEN.z)
  ];
  const _v = new THREE.Vector3();
  const _n = new THREE.Vector3();
  const _c = new THREE.Vector3();

  function projectScreen() {
    group.updateMatrixWorld(true);
    const out = [];
    for (const c of CORNERS) {
      _v.copy(c).applyMatrix4(group.matrixWorld).project(camera);
      out.push([(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H]);
    }
    return out;
  }

  function facing() {
    _n.set(0, 0, 1).transformDirection(group.matrixWorld);
    _c.set(SCREEN.x, SCREEN.y, SCREEN.z).applyMatrix4(group.matrixWorld);
    _v.copy(camera.position).sub(_c).normalize();
    return _n.dot(_v);
  }

  /* device silhouette, in CSS px, for the shadow */
  function silhouette(rotY) {
    const scale = H / ((SOLID.h / o.fill)); // px per mm at the device plane
    const w = Math.abs(SOLID.w * Math.cos(rotY)) + Math.abs(SOLID.d * Math.sin(rotY));
    return { w: w * scale, h: SOLID.h * scale, scale };
  }

  /* ── pose ─────────────────────────────────────────────────────────────────────────────── */
  const pose = { rotX: 0, rotY: 0, rotZ: 0 };
  let disposed = false;
  let lastCost = 0;

  /* ── WHEN THIS RENDERS AT ALL ─────────────────────────────────────────────────────────────
     Three gates, and all three have to be open:
       · `prepared` — the shaders are linked. Before that a render IS the compile, on the main
         thread, and that is the freeze this module was rebuilt around.
       · `onScreen` — an IntersectionObserver with a 160 px margin. The backing store is kept at
         full size (the travelling handset can come back from a docked, off-screen slot inside a
         single scroll frame, and a 1×1 canvas resumed on that frame is a blank phone); what is
         dropped is the drawing.
       · the tab is in front.
     A pose set while a gate is shut is remembered, and drawn on the frame the gate opens. */
  let prepared = false;
  let onScreen = true;
  let pending = false;

  const canDraw = () => prepared && !disposed && onScreen
    && !(typeof document !== 'undefined' && document.hidden);

  function draw() {
    if (!canDraw()) { pending = true; return; }
    pending = false;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : 0);

    group.rotation.set(pose.rotX, pose.rotY, pose.rotZ, 'YXZ');
    group.updateMatrixWorld(true);
    renderer.render(scene, camera);

    if (screenEl) {
      const f = facing();
      if (f < Math.cos(88 * Math.PI / 180)) {
        screenEl.style.visibility = 'hidden';
      } else {
        const quad = projectScreen();
        const Hm = solveHomography(quad);
        if (Hm) {
          screenEl.style.visibility = 'visible';
          screenEl.style.transform = matrix3dFrom(Hm);
        } else {
          screenEl.style.visibility = 'hidden';
        }
        if (sheenEl) {
          const a = Math.min(1, Math.abs(pose.rotY) / (Math.PI / 2));
          const shift = -30 + a * 150;
          sheenEl.style.opacity = String(0.05 + 0.13 * Math.sin(a * Math.PI));
          sheenEl.style.background =
            'linear-gradient(' + (104 - a * 26).toFixed(1) + 'deg,' +
            'rgba(255,255,255,0) ' + (shift - 26).toFixed(1) + '%,' +
            'rgba(255,255,255,.55) ' + (shift + 2).toFixed(1) + '%,' +
            'rgba(255,255,255,.08) ' + (shift + 13).toFixed(1) + '%,' +
            'rgba(255,255,255,0) ' + (shift + 34).toFixed(1) + '%)';
        }
      }
    }

    if (shadowEl) {
      const s = silhouette(pose.rotY);
      const a = Math.min(1, Math.abs(pose.rotY) / (Math.PI / 2));
      // an ellipse straddling the base: its top half is hidden behind the handset, the spill
      // at the sides is the only part you see — which is what a contact shadow actually is
      const w = Math.max(W * 0.30, s.w * 1.15);
      const h = Math.max(12, H * 0.052);
      shadowEl.style.width = w.toFixed(2) + 'px';
      shadowEl.style.height = h.toFixed(2) + 'px';
      shadowEl.style.transform =
        'translate(-50%,0) translateY(' + (H * 0.972 - h / 2).toFixed(2) + 'px)';
      shadowEl.style.opacity = (0.78 - 0.26 * a).toFixed(3);
      shadowEl.style.filter = 'blur(' + Math.max(6, H * 0.020).toFixed(1) + 'px)';
    }

    lastCost = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
  }

  function setPose(p) {
    if (disposed) return;
    if (reduced) { pose.rotX = 0; pose.rotY = 0; pose.rotZ = 0; }
    else {
      if (p && typeof p.rotX === 'number') pose.rotX = p.rotX;
      if (p && typeof p.rotY === 'number') pose.rotY = p.rotY;
      if (p && typeof p.rotZ === 'number') pose.rotZ = p.rotZ;
    }
    draw();
  }

  function resize() {
    if (disposed) return;
    /* RESIZING CLEARS THE BUFFER, so the frame that follows one is not optional: a deferred
       draw shows the reader an empty box for a frame at the dock and at the undock. A box that
       did not change costs a comparison and returns. */
    if (measure()) draw();
  }

  /* ── off screen, and in the background ────────────────────────────────────────────────── */
  let io = null;
  if (typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver((entries) => {
      const vis = entries[entries.length - 1].isIntersecting;
      if (vis === onScreen) return;
      onScreen = vis;
      if (vis && pending) draw();
    }, { rootMargin: '160px 0px', threshold: 0.01 });
    io.observe(container);
  }
  const onVisibility = () => { if (!document.hidden && pending) draw(); };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

  /* A CALLER THAT TELLS US THE BOX DOES NOT GET WATCHED. The travelling handset lives inside a
     CSS `scale()`, so its container's border box changes on every frame of the journey — and an
     observer on it would answer each of those with a second full render of a scene that has not
     changed. The page owns that number and re-sizes us itself. */
  let ro = null;
  if (!o.size && typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => resize());
    ro.observe(container);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopClock();
    cancelPreparation();
    if (ro) ro.disconnect();
    if (io) io.disconnect();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    for (const g of geos) g.dispose();
    for (const k in M) M[k].dispose();
    if (fitted) fitted.dispose();
    if (envRT) envRT.dispose();
    renderer.dispose();
    /* THE CONTEXT IS NOT FORCED BACK. `renderer.forceContextLoss()` looks like good hygiene and
       it is a trap: measured on this page, losing the context made Chromium rebuild every other
       context on it — the demos are iframes — as ONE task of 13.4 seconds, which is the freeze
       this module exists to remove, arriving at the moment the page walks away from 3D. Removing
       that one line took the run from a 13.4 s task to none at all. Dropping the renderer and
       taking the canvas out of the document is what returns the context, in the browser's own
       time. */
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (shadowEl && shadowEl.parentNode) shadowEl.parentNode.removeChild(shadowEl);
    if (sheenEl && sheenEl.parentNode) sheenEl.parentNode.removeChild(sheenEl);
    if (islandEl && islandEl.className === 'hs-island' && islandEl.parentNode) islandEl.parentNode.removeChild(islandEl);
    if (screenEl) {
      screenEl.style.transform = '';
      screenEl.style.visibility = '';
    }
    container.removeAttribute('data-handset');
  }

  /* ── SHADER PREPARATION, OFF THE CRITICAL PATH ────────────────────────────────────────────
     THE BUG THIS EXISTS FOR. The first `renderer.render` of this scene compiles and links a
     program for every material it meets — thirty-one of them on the licensed file — and on
     ANGLE/Metal each link is hundreds of milliseconds of the MAIN THREAD. Thirty-one of those
     back to back is «Page Unresponsive», which is exactly what a real GPU did with the version
     before this one. It never showed here, because software GL compiles a much simpler program
     set and the page was only ever measured on it.

     `renderer.compile` hands the whole scene to the driver in one go. `KHR_parallel_shader_compile`
     then lets us ASK whether the driver has finished instead of waiting for it: the link runs on
     the driver's own threads and this polls a flag from a timer, so between two looks the page
     scrolls, lays out and paints. Only when every program reports COMPLETION_STATUS_KHR — and
     then LINK_STATUS, because «the compiler stopped» is not «it worked» — is the first frame
     drawn and the canvas allowed to show.

     WITHOUT THE EXTENSION nothing is lost and nothing is gained: `compile` is still called, the
     driver still blocks somewhere, and the deadline above is what protects the reader.

     `cancelPreparation` is declared with the clock at the top of this function, because the
     deadline has to be able to stop this poll from a timer that may fire before the poll exists. */

  function prepareShaders() {
    if (!o.prepare) return Promise.resolve(true);
    const gl = renderer.getContext();
    const parallel = renderer.extensions.get('KHR_parallel_shader_compile');
    renderer.compile(scene, camera);
    mark('compile');
    if (!parallel) {
      timings.parallel = false;
      return Promise.resolve(true);
    }
    timings.parallel = true;
    const programs = renderer.info.programs.map((entry) => entry.program);
    timings.programs = programs.length;
    return new Promise((resolve) => {
      let timer = 0;
      const finish = (ready) => {
        clearTimeout(timer);
        cancelPreparation = () => {};
        resolve(ready);
      };
      cancelPreparation = () => finish(false);
      const look = () => {
        if (disposed) return finish(false);
        try {
          if (gl.isContextLost()) return finish(false);
          for (const program of programs) {
            if (!gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
              timer = setTimeout(look, 16);
              return;
            }
          }
          for (const program of programs) {
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return finish(false);
          }
          finish(true);
        } catch (err) {
          finish(false);
        }
      };
      /* the first look is a task away, so input, layout and scroll all get a turn before we
         start asking the driver about programs it has only just been handed */
      timer = setTimeout(look, 0);
    });
  }

  measure();
  mark('size');
  const linked = await prepareShaders();
  mark('shaders');
  if (disposed) throw abort('disposed');
  if (!linked) throw abort(expired ? 'deadline:shaders' : 'shaders');
  await breathe();

  /* THE FIRST FRAME, and the only one this module draws on its own. The canvas stays hidden
     until the caller has posed it; `live.js` owns that swap.

     THE CLOCK STOPS HERE, NOT EARLIER. Everything above it is the reader waiting; this draw is
     the first one the driver has all its programs for, and on a GPU it is a frame. */
  prepared = true;
  timings.prepared = true;
  draw();
  mark('first-frame');
  stopClock();
  timings.total = timings.stages['first-frame'];

  container.setAttribute('data-handset', 'live');
  container.dispatchEvent(new CustomEvent('handset:ready', { bubbles: true }));

  const api = {
    ready: Promise.resolve(),
    setPose, resize, dispose, draw,
    el: canvas,
    screenEl,
    get islandEl() { return islandEl; },
    get pose() { return { rotX: pose.rotX, rotY: pose.rotY, rotZ: pose.rotZ }; },
    get reducedMotion() { return reduced; },
    get cost() { return lastCost; },
    get pixelRatio() { return dpr; },
    get timings() { return timings; },
    get onScreen() { return onScreen; },
    screenQuad: projectScreen,
    /* what the baker writes into handset.json, and what `demo.html` prints */
    get metrics() {
      return {
        source: o.model ? 'model' : 'procedural',
        mm: { w: SOLID.w, h: SOLID.h, d: SOLID.d },
        screen: { w: SCREEN.w, h: SCREEN.h, x: SCREEN.x, y: SCREEN.y, z: SCREEN.z },
        model: fitted ? fitted.metrics : null
      };
    },
    box: () => ({ w: W, h: H }),
    three: { THREE, renderer, scene, camera, group, materials: M }
  };
  api.ready = Promise.resolve(api);
  return api;
}

export default createHandset;
