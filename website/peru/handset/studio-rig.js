/* ──────────────────────────────────────────────────────────────────────────────────────────────
   peru/handset/studio-rig.js — THE BESPOKE STUDIO, KEPT FOR THE PROCEDURAL HANDSET ONLY

   This room was written for the handset `handset.js` builds in code, and for a while the loaded
   model was lit by it too. It is not what the page renders any more. The live handset and every
   baked frame are lit the way the craft reference lights its own: three's `RoomEnvironment`
   through `PMREMGenerator` at sigma 0.04, one hemisphere light and three directionals. That room
   costs one small scene and a single PMREM pass; this one hangs about seventy emissive panels and
   is then blurred at sigma 0.008, which is many more passes at full resolution — on the way to a
   first frame, on the main thread, it is seconds.

   So this module is dynamically imported, and ONLY by `createHandset({ lighting: 'studio' })`,
   which is `bake.html?rig=studio` and `demo.html`'s side-by-side. A reader on the page never
   fetches it, never parses it and never runs it.

   `THREE` is handed in rather than imported, so this file adds nothing to the module graph that
   `handset.js` has not already loaded.
   ────────────────────────────────────────────────────────────────────────────────────────────── */

/* ── the light ───────────────────────────────────────────────────────────────────────────────
   A STUDIO, built here, judged by looking. Metal has no colour of its own — it shows you the room
   it is standing in — so the room IS the lighting design, and every number below is a placement
   in that room rather than a shading trick.

   The geometry that makes this tractable: the camera sits on +Z and the handset turns about Y by
   θ. A mirror's reflected direction is fixed by that.

     · the LEFT rail's outward normal is (−cosθ, 0, sinθ), so it reflects azimuth 180° + 2θ —
       it sweeps the LEFT half of the room, from dead behind at rest to dead front at the quarter
       turn. A single long ribbon laid along that whole arc is a highlight that TRAVELS along the
       band for the entire turn instead of blinking on at one frame.
     · the flat front reflects azimuth 2θ — the RIGHT half, from front at rest round to behind.
       The two never overlap, so the band's ribbon can be fierce without ever whitening the glass,
       and the glass's own streaks can hang in the right half without touching the band.
     · a band normal that lies in the XY plane mirrors elevation: the TOP of the rail shows the
       room at +6°, the bottom at −6°. So a ribbon kept THIN in elevation and set a little above
       the horizon lights the upper part of the rail and lets the lower part fall away — the
       gradient a real strip light leaves down the side of a phone.

   Azimuth is measured from +Z (the camera) towards +X (screen right); elevation from the horizon.
   Gains are linear radiance, so the numbers are exposure stops, not colour. Everything is neutral
   white on purpose: a coloured cast on a near-black body reads as a mistake, not as warmth. */

/* az      el     wide  tall   gain   what it is.  Gains are linear radiance. */
const RIG = {
  shell: 0.030,   // the surround: near-black, so every direction that is not a light stays dark
  floor: 0.70,    // bounce off the table — the underside of the chamfer and the bottom rail
  sky: 0.95,      // a broad overhead soft box. At the front pose the only metal facing the camera
                  // is the rolled lip, and this is most of what lights it.

  /* the KEY: a large soft box, high and to the left, tipped forward. It is aimed at the ONE
     direction the top-left corner's rolled lip reflects at the resting pose — azimuth 315°,
     elevation 45° — because a corner is the only part of the perimeter that can carry a bright
     accent without also flooding a straight rail: the rails only ever see ±6° of elevation, and
     this sits far above that. */
  key: { az: 313, el: 40, w: 46, h: 40, gain: 6.4 },

  /* the STRIP: the long ribbon along the left arc — the crisp travelling highlight.
     THIN IN ELEVATION is the whole trick. The rail's length maps to barely ±6° of room, so a
     ribbon 13° tall lights the rail's length and lets the corners fall away; a tall one
     floods the entire rail and the body turns to silver. Hot, because the polished lip is only
     half a millimetre wide and has to come out white. */
  strip: { from: 166, to: 342, steps: 19, el: 1.8, h: 9.5, gain: 5.4 },

  /* the WASH: the same left arc again, much wider in elevation and a fraction of the gain. The
     ribbon above is the crisp line; this is the soft broad reflection underneath it, and it is
     what stops the band reading as a black outline on the frames where the ribbon is edge-on. */
  wash: { from: 150, to: 338, steps: 12, el: 0, h: 40, gain: 1.9 },

  /* the QUARTER-TURN ARC: the same left arc, carried from where the ribbon above stops round to
     dead front — the room the rail shows while the page HOLDS it edge-on, which is the one beat
     the whole scroll is built on. At a quarter turn the rail mirrors azimuth 360, and the ribbon
     stops at 342° (θ = 81°), so the last nine degrees of the turn had nothing to show: measured
     on the band, the silhouette's median was luminance 8 against a ground of 21 — a dark smear on
     a dark band. With this arc it is 135.

     WHY THIS MAY STAND IN THE FRONTAL CONE when nothing else does. The cone is kept empty so the
     resting pose's bezel stays black, and a bezel is a RIM: it only ever shows the room beyond
     ±6.8° of elevation, because everything inside that is the display. So this arc is capped at
     13.5° tall — ±6.75°, inside the display at every frame — and what it paints at rest lands
     where the demo's own iframe sits, which is punched out of the baked frame and covered by the
     live one. The rail, a strip standing at x ≈ 0, shows that same slice of room down its whole
     length. Measured at rest on paper, the frame's bright fraction is unchanged and the lip gains
     the chamfer highlight a polished edge has in a real room. */
  hold: { from: 343, to: 361, steps: 7, el: 0, h: 13.5, gain: 5.4 },

  /* the CORE: a hot filament laid down the middle of the ribbon, three degrees thin. The band is
     rough enough to average it away into the ribbon's gradient; the polished lip is not, so this
     is the one white line that runs the chamfer — the crisp highlight, and the only part of this
     rig that is allowed to clip. */
  core: { from: 166, to: 340, steps: 19, el: 2.2, h: 3.2, gain: 17.0 },

  /* the RIM, from behind: the band's edge light at the resting pose, which is the frame with the
     least metal pointed at the camera and the most to lose. It is deliberately the hottest thing
     in the room after the core, because the handset also has to turn over a near-black band on
     the page — and a graphite body on #1A1413 survives on its rim or it does not survive. */
  rim: { az: 178, el: 1, w: 30, h: 17, gain: 12.0 },

  /* the FILL: dim, broad, low and to the right. Its only job is that the shadow side of the body
     never reaches pure black. */
  fill: { az: 66, el: -12, w: 70, h: 40, gain: 0.55 },

  /* the GLASS STREAKS: narrow verticals parked in the right half, where only the front face and
     the bezel around it can see them. One of them crosses the glass for most of the turn. Faint
     on purpose — a mirror this flat turns a generous light into a white sheet. */
  streaks: [
    { az: 24, el: 1, w: 4.5, h: 30, gain: 1.6 },
    { az: 68, el: 1, w: 4.0, h: 30, gain: 1.4 },
    { az: 114, el: 1, w: 4.5, h: 30, gain: 1.2 }
  ],

  /* the EDGE lights: at the front pose the lip's rolled normals throw the view straight out
     sideways, where nothing else in the room is standing. Narrow and short, because anything
     tall here also sits in the rail's own window and floods it mid-turn. */
  edges: [
    { az: 272, el: 6, w: 8, h: 10, gain: 7.2 },   // upper-left run, the bright one
    { az: 88, el: -4, w: 8, h: 9, gain: 2.4 }     // lower-right, the counter-highlight
  ],

  /* the CORNER STREAK: the ONLY thing standing in the ±15° cone the flat front face mirrors at
     rest, and it is parked at the very lip of that cone and rolled over, so what lands on the
     glass is a thin diagonal clipping one corner. Everything else — wash, ribbon, core — now
     stops short of 342°, because a soft box anywhere in that cone paints the whole bezel an even
     mid-grey and the bezel stops being black, which is the one thing the resting frame cannot
     afford. */
  corner: { az: 8.5, el: 9.0, w: 3.6, h: 26, roll: 38, gain: 2.6 }
};

const ENV_R = 22;        // where the panels hang; angular sizes below are converted against it

export function studioEnvironment(THREE, gain0) {
  const G = gain0 || 1;
  const env = new THREE.Scene();
  const rad = (d) => d * Math.PI / 180;
  const span = (deg) => 2 * ENV_R * Math.tan(rad(deg) / 2);

  const emit = (gain) => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffffff).multiplyScalar(gain * G), side: THREE.DoubleSide
  });

  /* the surround — a box seen from the inside, dark enough that the lights do all the drawing */
  const shell = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffffff).multiplyScalar(RIG.shell * G), side: THREE.BackSide
  }));
  shell.scale.set(72, 72, 72);
  env.add(shell);

  /* a panel hung at an azimuth and an elevation, sized in degrees of arc */
  const panel = (az, el, wDeg, hDeg, gain, roll) => {
    const a = rad(az), e = rad(el);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(span(wDeg), span(hDeg)), emit(gain));
    m.position.set(
      ENV_R * Math.cos(e) * Math.sin(a), ENV_R * Math.sin(e), ENV_R * Math.cos(e) * Math.cos(a)
    );
    m.lookAt(0, 0, 0);
    if (roll) m.rotateZ(rad(roll));   // a plane's local Z is its normal, so this tilts the streak
    env.add(m);
    return m;
  };

  /* table and sky: flat planes, because `lookAt` is degenerate straight overhead */
  const table = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), emit(RIG.floor));
  table.rotation.x = -Math.PI / 2;
  table.position.y = -16;
  env.add(table);

  const sky = new THREE.Mesh(new THREE.PlaneGeometry(76, 76), emit(RIG.sky));
  sky.rotation.x = Math.PI / 2;
  sky.position.y = 24;
  env.add(sky);

  panel(RIG.key.az, RIG.key.el, RIG.key.w, RIG.key.h, RIG.key.gain);
  panel(RIG.rim.az, RIG.rim.el, RIG.rim.w, RIG.rim.h, RIG.rim.gain);
  panel(RIG.fill.az, RIG.fill.el, RIG.fill.w, RIG.fill.h, RIG.fill.gain);
  for (const s of RIG.streaks) panel(s.az, s.el, s.w, s.h, s.gain);
  for (const e of RIG.edges) panel(e.az, e.el, e.w, e.h, e.gain);
  panel(RIG.corner.az, RIG.corner.el, RIG.corner.w, RIG.corner.h, RIG.corner.gain, RIG.corner.roll);

  /* the ribbon: overlapping tiles, so the arc is continuous and the highlight never stutters
     between two frames of the turn */
  for (const S of [RIG.wash, RIG.strip, RIG.core, RIG.hold]) {
    const step = (S.to - S.from) / (S.steps - 1);
    for (let i = 0; i < S.steps; i++) panel(S.from + step * i, S.el, step * 1.9, S.h, S.gain);
  }
  return env;
}

export default studioEnvironment;
