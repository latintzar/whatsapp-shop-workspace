/* ──────────────────────────────────────────────────────────────────────────────────────────────
   peru/handset/live.js — THE HANDSET, RENDERED WHILE THE READER SCROLLS

   `handset.js` is the object. This is the small piece of policy that puts it on the page, and it
   exists so that `peru.js` — a classic script that runs on every viewport — never carries an
   `import` of three.js. The page asks for this module only once a desk has started turning a
   handset; a reader who never gets one never pays for it, and a reader whose browser cannot give
   it a WebGL context keeps the baked sequence and never learns there was a second path.

   THE OBJECT IS THE LICENSED IPHONE (`model/CREDITS.md`), and THE SCENE IS THE BAKE'S SCENE, to
   the decimal. `bake.html` builds it with exactly the options below — the same model, the graphite
   finish, a 14° lens, the device filling 0.925 of the box's height, exposure 1.00, no contact
   shadow, no glass sheen — so `front.webp` and this canvas are two renders of one scene. That is
   the whole point: the swap from the baked frame to the live one happens under the reader's eye
   and must not be a cut. Change a number here and the same number changes in `bake.html`, or the
   handset visibly steps the moment it starts to turn.

   THE PAGE KEEPS THE GLASS. `handset.js` can carry the 390 × 844 document itself, but the page
   already has that machinery — `phone.css` gives `.ph-screen` its box and `HANDSET.matrixFor`
   lays it on four corners — and it has to keep it anyway for the baked path. So this module is
   handed no screen: it draws metal into a transparent canvas and answers with the glass's four
   corners in PER CENT of the render box, which is the same shape `handset.json` carries for every
   baked pose. One placement path serves both handsets.

     const live = await mountHandset({ stage, size, pixelRatio });
     const quad = live.pose(rotYdeg, rotZdeg);   // → [[x%,y%] × 4] or null past the cut-off
     live.rest();  live.resize();  live.dispose();
   ────────────────────────────────────────────────────────────────────────────────────────────── */

import { createHandset } from './handset.js';

/* PAST THIS THE GLASS IS A SMEAR AND THE RAIL IS THE WHOLE OBJECT. A live document squeezed into
   a five-pixel sliver reads as noise, and the model draws its own dark glass there, edge-lit, in
   the same rectangle. The page hides its iframe and the pose finishes in metal. */
const GLASS_OFF = 80;

/* The handset itself. `bake.html` names the same file, and `.vercelignore` ships it. */
const MODEL = new URL('./model/iphone-15-pro-max.glb', import.meta.url).href;

export async function mountHandset(opts) {
  const stage = opts.stage;

  const h = await createHandset(stage, {
    model: MODEL,
    /* the page's own glass: this module never touches `.ph-screen` */
    screen: null,
    island: null,
    sheen: false,
    /* the contact shadow lives on `.ph-body`, in the layout box, where it belongs */
    shadow: false,
    finish: 'graphite',
    fov: 14,
    fill: 0.925,
    exposure: 1.00,
    /* THE PIXEL RATIO IS THE SUPERSAMPLE. `superSample` would lift a 3× display to 3×, which is
       9 MB of backing store for a 1 px hairline; the page caps it at 2 and hands it in. */
    superSample: false,
    pixelRatio: opts.pixelRatio || 2,
    reducedMotion: false,
    /* THE BOX IS TOLD, NOT MEASURED. The travelling handset sits inside a CSS `scale()`, so the
       stage's rect on the page is the box AFTER that scale — and the matrix this module hands
       back is applied to an element INSIDE the same scale, which would apply it twice. The page
       owns the unscaled number and passes it. */
    size: opts.size,
    /* HOW LONG THE READER WAITS, AND WHO HEARS ABOUT IT. Past the deadline the mount throws and
       the page keeps the baked sequence for the session; `onStage` is how the page builds
       `window.__handsetTimings`, which is the only thing a machine that freezes can hand back. */
    deadline: typeof opts.deadline === 'number' ? opts.deadline : 6000,
    onStage: opts.onStage || null
  });

  const canvas = h.el;
  /* UNDER THE GLASS. The model renders its own screen surface; the page's demo is a DOM layer on
     the same four corners, so it must be the one the reader sees. The baked plate is z-index 3
     and paints OVER this canvas, which is exactly what keeps the handset baked until the page
     hides the plate — which it does on the frame after the first `pose`, once there is something
     under it. */
  canvas.style.zIndex = '1';
  canvas.style.visibility = 'hidden';

  let shown = false;
  let lastY = null;
  let lastZ = null;
  let stopped = false;

  /* ONE DRAW PER POSE, NEVER A LOOP. `setPose` renders; called with the pose it already holds it
     does nothing at all, so a scroll frame that does not move the handset costs one comparison. */
  function pose(rotYdeg, rotZdeg) {
    if (stopped) return null;
    if (rotYdeg !== lastY || rotZdeg !== lastZ) {
      lastY = rotYdeg;
      lastZ = rotZdeg;
      h.setPose({ rotX: 0, rotY: rotYdeg * Math.PI / 180, rotZ: rotZdeg * Math.PI / 180 });
    }
    if (!shown) {
      shown = true;
      canvas.style.visibility = 'visible';
    }
    if (Math.abs(rotYdeg) >= GLASS_OFF) return null;
    const b = h.box();
    if (!(b.w > 0) || !(b.h > 0)) return null;
    const q = h.screenQuad();
    return [
      [q[0][0] / b.w * 100, q[0][1] / b.h * 100],
      [q[1][0] / b.w * 100, q[1][1] / b.h * 100],
      [q[2][0] / b.w * 100, q[2][1] / b.h * 100],
      [q[3][0] / b.w * 100, q[3][1] / b.h * 100]
    ];
  }

  /* THE BAKED FRAME, BACK ON TOP. Nothing is disposed — the reader is one scroll away from
     turning the handset again — the canvas simply steps aside. The page does not use this while
     the journey is running (a swap mid-scroll is a swap the reader can catch); it is here for a
     caller that wants the render only while something moves. */
  function rest() {
    if (!shown) return;
    shown = false;
    canvas.style.visibility = 'hidden';
  }

  function resize() {
    if (stopped) return;
    lastY = null;
    lastZ = null;
    h.resize();
  }

  function dispose() {
    if (stopped) return;
    stopped = true;
    h.dispose();
  }

  return {
    pose: pose,
    rest: rest,
    resize: resize,
    dispose: dispose,
    canvas: canvas,
    get cost() { return h.cost; },
    get pixelRatio() { return h.pixelRatio; },
    get timings() { return h.timings; },
    box: h.box
  };
}

export default mountHandset;
