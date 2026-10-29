/* ──────────────────────────────────────────────────────────────────────────────────────────────
   peru/handset/model.js — THE REAL HANDSET, LOADED AND PUT INTO OUR COORDINATES

   The object on this page is «Apple iPhone 15 Pro Max Black» by polyman, CC BY 4.0 (see
   `model/CREDITS.md`, and the credit line in the page's footer). It arrives as a Draco-compressed
   glTF with WebP textures, so it needs three's GLTFLoader and Google's Draco decoder, both
   vendored next door.

   WHAT THIS MODULE DOES, and why each step exists:

   1. PUTS IT IN OUR AXES. The file is authored in metres with the glass facing −Z. Everything in
      `handset.js` — the camera framing, the screen projection, the silhouette — is written for
      millimetres with the glass facing +Z, because that is how the procedural handset was built
      and how every baked frame was shot. So the model is turned a half turn about Y and scaled by
      one number. It is a rotation, never a mirror: a mirrored model has inside-out normals and
      lights like a negative.

   2. SCALES IT BY ITS OWN HEIGHT. `DEV.h / modelHeight` is the only factor, so the proportions are
      the author's. It lands at 71.4 × 146.6 × 11.3 mm against the 71.5 × 146.6 × 8.25 mm the
      procedural handset used — the width is the same to a tenth of a millimetre, and the extra
      depth is the camera plateau, which is real.

   3. FINDS THE GLASS. The live 390 × 844 document is a DOM layer laid on four points, so the page
      has to know where the display is in model space. It is found by what it IS rather than by its
      name (the file's names are hashes): the flat, screen-shaped, centred mesh on the front face.
      Its own emissive wallpaper is then put out and its material replaced with black glass, so the
      only thing on the glass is the page's own conversation.

   4. LIGHTS IT AS A PRODUCT SHOT. The file's materials are the author's PBR set with roughness,
      metalness, normal and AO maps. They keep them; what changes is the environment's weight on
      each one. There are two policies, and `handset.js` picks one with its `lighting` option:

      · `env` A NUMBER — THE ROOM. The craft reference's own two lines for a loaded file: every
        standard or physical material's `envMapIntensity` is raised to AT LEAST that number, and
        every texture is resampled at up to 8× anisotropy. The object stays the author's, lit by
        three's `RoomEnvironment` and four lights. (On three r169 the renderer overrides that
        intensity with `scene.environmentIntensity` for any material with no `envMap` of its own,
        so `handset.js` sets both; this floor is what a material carrying its own map would use.)
      · `env` NULL — THE BESPOKE STUDIO. The weights in `DRESS` below, written for the rig of
        emissive panels in `studio-rig.js`. It is kept for the procedural handset and for
        comparing bakes; it is not what the page ships.
   ────────────────────────────────────────────────────────────────────────────────────────────── */

import * as THREE from '../vendor/three/three.slim.module.js';
import { GLTFLoader, DRACOLoader } from '../vendor/three/loaders.module.js';

const DRACO_PATH = new URL('../vendor/three/draco/', import.meta.url).href;

/* ONE DECODER FOR THE WHOLE SESSION. `DRACOLoader` starts a worker and compiles the wasm on first
   use; a second handset on the same page must reuse it rather than pay for both again. */
let _draco = null;
function dracoLoader() {
  if (!_draco) _draco = new DRACOLoader().setDecoderPath(DRACO_PATH);
  return _draco;
}

/* ONE FETCH FOR THE WHOLE SESSION, TOO. The parsed glTF is cached by URL and every handset clones
   it, which shares the geometry and the textures on the GPU. */
const _cache = new Map();

export function loadGLTF(url) {
  let p = _cache.get(url);
  if (!p) {
    p = new GLTFLoader().setDRACOLoader(dracoLoader()).loadAsync(url);
    _cache.set(url, p);
  }
  return p;
}

/* ── finding the display ──────────────────────────────────────────────────────────────────────
   The file names every node with a hash, so the glass is identified by its shape: a mesh with no
   thickness, roughly the size and the 0.462 aspect of a phone screen, centred on the body's axis,
   sitting at the extreme of the front face. Scored rather than matched, so a file whose display is
   a hair off-centre or 0.1 mm thick still wins. */
function findScreen(root, box) {
  const size = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const b = new THREE.Box3();
  const whole = box.getSize(new THREE.Vector3());
  let best = null;
  let bestScore = 0;

  root.traverse((n) => {
    if (!n.isMesh) return;
    b.setFromObject(n);
    b.getSize(size);
    b.getCenter(centre);
    const flat = size.z <= whole.z * 0.06;                       // no thickness worth the name
    const wide = size.x > whole.x * 0.6 && size.y > whole.y * 0.6; // most of the face
    if (!flat || !wide) return;
    const aspect = size.x / Math.max(size.y, 1e-6);
    let score = 1;
    score *= 1 / (1 + Math.abs(aspect - 390 / 844) * 12);        // a phone screen's ratio
    score *= 1 / (1 + (Math.abs(centre.x) / whole.x) * 10);      // on the axis
    score *= 1 / (1 + (Math.abs(centre.y) / whole.y) * 10);
    /* the display is the FRONTMOST of the flat faces (the cover glass sits a hair behind it), and
       the front of this file is −Z */
    score *= 1 / (1 + (centre.z - box.min.z) / Math.max(whole.z, 1e-6) * 4);
    const m = n.material;
    if (m && (m.emissiveMap || m.emissive && m.emissive.getHex() !== 0)) score *= 2.2;
    if (score > bestScore) { bestScore = score; best = { mesh: n, size: size.clone(), centre: centre.clone() }; }
  });
  return best;
}

/* ── the finish ───────────────────────────────────────────────────────────────────────────────
   A product shot of a black titanium phone is almost entirely reflection: the albedo carries
   nothing and the room carries everything. These weights are what make the band a lit rail rather
   than a grey slab when the object stands edge-on — the frame it is judged in — and they are read
   off renders on both grounds the page uses, the dark band (#1A1413) and the paper (#FAF7F3).

   `roughness` is a CEILING, not a value: the author's roughness map still draws the machining and
   the fingerprints, it is simply not allowed to go so matte that the ribbon breaks up. */
const DRESS = [
  /* the rail: the outer band, the buttons and every small metal part */
  { test: (s) => s.metalness >= 0.65, env: 1.34, roughMax: 0.30, roughMin: 0.06, sheen: 1.0 },
  /* the back glass and the camera plateau: satin, a soft wide reflection */
  { test: () => true, env: 0.92, roughMax: 0.62, roughMin: 0.10, sheen: 0.55 }
];

/* THE ROOM'S POLICY, the reference's, in two lines. `envMapIntensity` is a FLOOR rather than a
   value — a file whose author already asked for more keeps it — and the anisotropy is a ceiling,
   because past 8× a driver is resampling a texture nobody can see at a cost every frame pays. */
function light(mat, env, aniso, polish) {
  if (!mat || mat.__dressed) return;
  mat.__dressed = true;
  if (mat.map && aniso > 1) mat.map.anisotropy = Math.max(mat.map.anisotropy || 1, aniso);
  if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
    mat.envMapIntensity = Math.max(mat.envMapIntensity || 1, env);
  }
  /* THE ONE THING THE ROOM CANNOT DO BY ITSELF. A blurred room and a matte rail make each other
     invisible: measured on the dark band, the edge-on pose — the beat the whole scroll holds —
     came back at a median of 40 against a ground of 21, a dark sliver where the old rig read
     139. The author's roughness map still draws the machining and the fingerprints; it is simply
     not allowed to go so matte that the band stops being a mirror. It is a material property, so
     it costs nothing per frame — unlike the rig of panels that used to buy the same thing. */
  if (polish && typeof mat.roughness === 'number') {
    const rule = DRESS.find((r) => r.test(mat)) || DRESS[DRESS.length - 1];
    mat.roughness = Math.min(Math.max(mat.roughness, rule.roughMin), rule.roughMax);
  }
  mat.needsUpdate = true;
}

function dress(mat, tone) {
  if (!mat || mat.__dressed) return;
  mat.__dressed = true;
  const rule = DRESS.find((r) => r.test(mat)) || DRESS[DRESS.length - 1];
  mat.envMapIntensity = rule.env * tone;
  if (typeof mat.roughness === 'number') {
    mat.roughness = Math.min(Math.max(mat.roughness, rule.roughMin), rule.roughMax);
  }
  /* The author's file leaves the body white with a metalness map doing the work; on a page whose
     ground is paper, an unattenuated white metal is a mirror ball. The colour is pulled to the
     graphite the rest of the page's renders are lit for. */
  if (mat.color && rule.sheen >= 1) mat.color.multiplyScalar(0.92);
  mat.needsUpdate = true;
}

/* ──────────────────────────────────────────────────────────────────────────────────────────────
   mountModel — put the file into `group`, in our millimetres, and answer where the glass is.

     const fitted = await mountModel(group, url, { height: DEV.h, screenMaterial: M.screen });
     fitted.screen  →  { w, h, z, x, y }  in millimetres, glass facing +Z
   ────────────────────────────────────────────────────────────────────────────────────────────── */
export async function mountModel(group, url, opts) {
  const o = opts || {};
  const gltf = await loadGLTF(url);
  /* every handset gets its own graph; the geometry and the textures are shared by the clone */
  const root = gltf.scene.clone(true);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const found = findScreen(root, box);

  /* ONE UNIFORM SCALE, FROM THE MODEL'S OWN HEIGHT. */
  const k = (o.height || 146.6) / Math.max(size.y, 1e-9);

  /* A HALF TURN ABOUT Y, NOT A MIRROR: the file's glass faces −Z and this page's faces +Z.
     `pivot` carries the turn, `root` carries the centring, so the two never fight. */
  const pivot = new THREE.Group();
  pivot.rotation.y = Math.PI;
  pivot.scale.setScalar(k);
  root.position.set(-centre.x, -centre.y, -centre.z);
  pivot.add(root);
  group.add(pivot);

  /* THE HOLE IS THE DOCUMENT'S SHAPE, NOT THE PANEL'S. The file's display measures 0.4628 wide
     per unit high and the demos are authored 390 × 844, which is 0.4621: a seventh of a per cent
     apart, and a seventh of a per cent of a 450 px hole is two thirds of a pixel of daylight at
     the top and the bottom edge. So the rectangle the page is handed is the LARGEST 390 : 844
     rectangle inside the panel, centred on it. What is given up is 0.1 mm of width — a tenth of a
     pixel a side at the size this ships — and what is bought is a glass that registers with its
     hole at every scale, which is the one thing `phone.css` exists to guarantee. */
  const DOC = 390 / 844;
  function inscribe(w, h) {
    return (w / h > DOC) ? { w: h * DOC, h } : { w, h: w / DOC };
  }

  /* the glass, in the group's own millimetres, after the half turn: x flips, z flips */
  const panel = found ? inscribe(found.size.x * k, found.size.y * k) : null;
  const scr = found
    ? {
      w: panel.w,
      h: panel.h,
      x: -(found.centre.x - centre.x) * k,
      y: (found.centre.y - centre.y) * k,
      z: -(found.centre.z - centre.z) * k
    }
    /* a file whose display cannot be identified still gets a handset: the front face's own
       rectangle, 390 : 844, is close enough that the page reads while someone looks at it */
    : { w: size.x * k * 0.917, h: size.x * k * 0.917 * 844 / 390, x: 0, y: 0, z: (size.z / 2) * k };

  const tone = typeof o.tone === 'number' ? o.tone : 1;
  const env = typeof o.env === 'number' ? o.env : null;
  const aniso = Math.max(1, Math.min(8, o.anisotropy || 1));
  const seen = new Set();
  root.traverse((n) => {
    if (!n.isMesh) return;
    n.castShadow = false;
    n.receiveShadow = false;
    n.frustumCulled = false;
    if (found && n === found.mesh) {
      /* THE MODEL'S OWN SCREEN IS PUT OUT. The page's 390 × 844 document lands on exactly this
         rectangle, so anything the file draws here would show through the gaps of a rounded
         corner and glow behind a dark chat. Black glass is what a phone's display is when it is
         off, and it is what the reader sees edge-on. */
      if (o.screenMaterial) n.material = o.screenMaterial;
      else {
        n.material = n.material.clone();
        n.material.__ownedByClone = true;
        n.material.emissiveMap = null;
        if (n.material.emissive) n.material.emissive.setHex(0x000000);
        n.material.color.setHex(0x050506);
      }
      return;
    }
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    for (const m of mats) {
      if (!m || seen.has(m)) continue;
      seen.add(m);
      if (env === null) dress(m, tone);
      else light(m, env, aniso, o.polish !== false);
    }
  });

  return {
    root: pivot,
    screen: scr,
    /* what the page reports and the baker writes into handset.json */
    metrics: {
      mm: { w: size.x * k, h: size.y * k, d: size.z * k },
      scale: k,
      screenMesh: found ? found.mesh.name : null,
      materials: seen.size
    },
    dispose() {
      root.traverse((n) => {
        if (!n.isMesh) return;
        /* geometry and textures belong to the cached original; only the clone's own graph goes */
        if (n.material && n.material.__ownedByClone) n.material.dispose();
      });
      if (pivot.parent) pivot.parent.remove(pivot);
    }
  };
}

export default mountModel;
