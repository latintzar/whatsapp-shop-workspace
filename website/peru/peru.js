/* Peru page motion: lazy phone demos, scroll journeys, reveals, and navigation. */
(function () {
  'use strict';

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var STILL = mqReduce.matches;
  var docEl = document.documentElement;
  docEl.classList.add('js');
  if (STILL) docEl.classList.add('still');

  /* THE FLIGHT IS A DESK'S. Below 900 the handset is most of the screen: flown, it either left
     the screen for three hundred pixels of scroll or crossed the next heading on its way to the
     row — rendered at 390 and looked at, both. On a phone the hero keeps its handset, the row
     has its own, and the page scrolls like a page. Decided once, at load. */
  var FLIES = !STILL && window.innerWidth >= 900;
  if (!STILL && !FLIES) docEl.classList.add('lit-pin');

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ONE rAF PUMP, IN TWO HALVES: EVERY READ, THEN EVERY WRITE. Each module used to read its own
     rectangle and write its own styles in one go, so the frame went read → write → read → write
     and the browser had to lay the page out again in the middle of it to answer the second read.
     Traced at 390 under a 4× throttle that was 133 forced layouts in four seconds of scrolling,
     all of them the nav's, and it is the most expensive thing the page's own code does.

     So a job is now `{ read, write }`: the pump runs all the reads (one layout, at most), then
     all the writes (no layout at all, because nothing reads after them). A plain function is
     still accepted and counts as a write. */
  var rafJobs = [];
  var rafPending = false;
  function pump(ms) {
    rafPending = false;
    var i;
    for (i = 0; i < rafJobs.length; i++) if (rafJobs[i].read) rafJobs[i].read(ms);
    for (i = 0; i < rafJobs.length; i++) if (rafJobs[i].write) rafJobs[i].write(ms);
  }
  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(pump);
  }
  /* THE FIRST RUN IS ONE RUN, NOT FOUR. Every module registers inside the same DOMContentLoaded
     task, and each one used to take its own first frame there and then — four separate reads,
     each of them making the browser lay out a page it was still building: 82 ms of layout inside
     the 104 ms task that evaluates this file, measured at 390. Queued on a microtask the whole
     set runs once, after the last module has registered and before the first paint, and the page
     is laid out once for all of them. */
  var initQueued = false;
  function everyFrame(fn) {
    var job = typeof fn === 'function' ? { read: null, write: fn } : fn;
    rafJobs.push(job);
    if (initQueued) return;
    initQueued = true;
    Promise.resolve().then(function () { initQueued = false; pump(0); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  /* Everything scroll-driven reads live rectangles, and those rectangles move when the web font
     lands and when the last image decodes. Without these three the flying phone holds the
     position it was given before Hanken Grotesk arrived. */
  addEventListener('load', onScroll);
  addEventListener('orientationchange', onScroll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onScroll);

  /* ══ HANDSET ══════════════════════════════════════════════════════════════════════════════
     EVERY PHONE ON THIS PAGE WEARS A RENDER, and it does so without this file. `front.webp` —
     a 3× bake of the handset, transparent background, the screen punched out — is an
     `<img class="ph-plate">` in peru.html on every figure, and phone.css reserves its box.
     Scripts off, image slow, image missing: the geometry is the same and nothing moves.

     The object in that render is the licensed iPhone (`handset/model/CREDITS.md`), baked from
     the same scene `handset/handset.js` renders live, so the two are one handset in two forms.

     What this module owns is the handset that TURNS. `turn-00…90.webp` are 91 poses of the same
     object in the same box, 0° to 90° inclusive, and `handset.json` carries the four corners the
     glass projects to in each of them. Given an angle it hands back the frame to paint and the
     matrix3d that lays the flat 390 × 844 document onto that frame's glass.

     The turn loads when the delivery phone approaches. Thirteen coarse poses cover the whole
     rotation, and a bounded window adds the original one-degree poses around its current angle.
     Two requests run at once; images outside the window are released. */

  var HANDSET = (function () {
    var BASE = '/peru/handset/';
    var TURN = null;
    var priming = false;
    var failures = 0;
    var coarse = {}, coarseOrder = [];
    var angle = null, center = null;
    var active = 0;
    var RADIUS = 8, MAX_LOADS = 2;

    /* Thirteen coarse poses cover the turn. Keep the original one-degree poses within eight
       degrees of the current angle: at most 28 images, plus two old requests finishing. */
    function wanted(i) {
      return !!coarse[i] || (center !== null && Math.abs(i - center) <= RADIUS);
    }

    function release(f) {
      if (!f.img && !f.ok) return;
      f.version++;
      f.ok = false;
      var im = f.img;
      f.img = null;
      /* A request keeps its slot until fetch/decode finishes. Its guarded callback then
         releases it, so rapid scrubbing cannot start a growing pile of decodes. */
      if (im && !f.request) {
        im.onload = im.onerror = null;
        im.removeAttribute('src');
      }
    }

    function grab(i) {
      var f = TURN[i];
      if (f.ok || f.request || f.errors >= 2 || !wanted(i)) return;
      var im = new Image();
      var version = f.version;
      var job = {};
      var settled = false;
      f.request = job;
      f.img = im;
      active++;
      im.decoding = 'async';
      try { im.fetchPriority = coarse[i] ? 'auto' : 'low'; } catch (e) {}

      function finish(ok) {
        if (settled) return;
        settled = true;
        im.onload = im.onerror = null;
        var current = f.request === job && f.version === version && f.img === im && wanted(i);
        if (f.request === job) f.request = null;
        active--;
        if (current && ok && im.naturalWidth) {
          f.ok = true;
          onScroll();
        } else {
          if (f.img === im) f.img = null;
          if (current && !ok) f.errors++;
          im.removeAttribute('src');
        }
        pump();
      }

      im.onload = function () {
        if (f.version !== version || f.img !== im || !wanted(i)) { finish(false); return; }
        if (!im.decode) { finish(true); return; }
        im.decode().then(function () { finish(true); }, function () { finish(!!im.naturalWidth); });
      };
      im.onerror = function () { finish(false); };
      im.src = f.src;
    }

    /* Rebuild the queue from the latest angle instead of retaining stale work. Fetch its
       exact pose first, then coarse fallback poses, then immediate neighbours. */
    function pump() {
      if (!TURN || active >= MAX_LOADS) return;
      var queue = [], seen = {};
      function add(i) {
        if (i < 0 || i >= TURN.length || seen[i]) return;
        seen[i] = true;
        var f = TURN[i];
        if (!f.ok && !f.request && f.errors < 2 && wanted(i)) queue.push(i);
      }
      if (center !== null) add(center);
      var bases = coarseOrder.slice();
      if (center !== null) bases.sort(function (a, b) { return Math.abs(a - center) - Math.abs(b - center); });
      for (var b = 0; b < bases.length; b++) add(bases[b]);
      if (center !== null) {
        for (var d = 1; d <= RADIUS; d++) { add(center - d); add(center + d); }
      }
      for (var q = 0; q < queue.length && active < MAX_LOADS; q++) grab(queue[q]);
    }

    function setWindow() {
      if (!TURN) return;
      center = angle === null ? null : Math.round(Math.abs(angle) / 90 * (TURN.length - 1));
      if (center !== null) center = Math.max(0, Math.min(TURN.length - 1, center));
      for (var i = 0; i < TURN.length; i++) if (!wanted(i)) release(TURN[i]);
      pump();
    }

    function prime() {
      if (priming || TURN || failures >= 3 || !window.fetch) return;
      priming = true;
      fetch(BASE + 'handset.json', { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error('Handset manifest unavailable');
          return r.json();
        })
        .then(function (m) {
          if (!m || !m.turn || !m.turn.frames || !m.turn.frames.length) {
            throw new Error('Invalid handset manifest');
          }
          var list = m.turn.frames, out = [], i;
          for (i = 0; i < list.length; i++) {
            out.push({
              rotY: list[i].rotY,
              quad: list[i].quad || null,
              src: BASE + list[i].file,
              img: null,
              ok: false,
              request: null,
              version: 0,
              errors: 0
            });
          }
          /* The page already owns the front plate; keep using that image. */
          if (m.front && m.front.file && out.length) {
            out[0].src = BASE + m.front.file;
            out[0].ok = true;
          }
          TURN = out;
          priming = false;
          coarseOrder = [0, out.length - 1];
          var step = out.length > 60 ? 8 : 4;
          for (i = step; i < out.length - 1; i += step) coarseOrder.push(i);
          for (i = 0; i < coarseOrder.length; i++) coarse[coarseOrder[i]] = true;
          setWindow();
        })
        .catch(function () {
          priming = false;
          failures++;
          if (failures < 3) setTimeout(prime, failures * 750);
        });
    }

    function track(degrees) {
      var next = degrees === null ? null : Math.round(Math.max(0, Math.min(90, Math.abs(degrees))));
      if (next === angle) return;
      angle = next;
      setWindow();
    }

    /* The returned pose carries its own glass coordinates, including while a finer image
       arrives, so the screen stays aligned with the actual frame being drawn. */
    function frameFor(deg) {
      if (!TURN) return null;
      var last = TURN.length - 1;
      var i = Math.round(Math.abs(deg) / 90 * last);
      if (i < 0) i = 0;
      if (i > last) i = last;
      if (TURN[i].ok) return TURN[i];
      for (var d = 1; d <= last; d++) {
        if (i - d >= 0 && TURN[i - d].ok) return TURN[i - d];
        if (i + d <= last && TURN[i + d].ok) return TURN[i + d];
      }
      return TURN[0];
    }

    /* THE GLASS ON A FLAT FRAME. Heckbert's square-to-quad, with the 390 × 844 source folded
       into the unit square first, written out as the column-major matrix3d the compositor
       wants. `quad` is in per-cent of the render box; W and H are that box in CSS pixels. */
    function matrixFor(quad, W, H) {
      if (!quad || !(W > 0) || !(H > 0)) return null;
      var x0 = quad[0][0] * W / 100, y0 = quad[0][1] * H / 100;
      var x1 = quad[1][0] * W / 100, y1 = quad[1][1] * H / 100;
      var x2 = quad[2][0] * W / 100, y2 = quad[2][1] * H / 100;
      var x3 = quad[3][0] * W / 100, y3 = quad[3][1] * H / 100;
      var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
      var dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
      var a, b, c, d, e, f, g, h;
      if (Math.abs(dx3) < 1e-8 && Math.abs(dy3) < 1e-8) {
        a = x1 - x0; b = x2 - x1; c = x0;
        d = y1 - y0; e = y2 - y1; f = y0; g = 0; h = 0;
      } else {
        var den = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(den) < 1e-9) return null;
        g = (dx3 * dy2 - dy3 * dx2) / den;
        h = (dx1 * dy3 - dy1 * dx3) / den;
        a = x1 - x0 + g * x1; b = x3 - x0 + h * x3; c = x0;
        d = y1 - y0 + g * y1; e = y3 - y0 + h * y3; f = y0;
      }
      return 'matrix3d(' +
        (a / 390).toFixed(7) + ',' + (d / 390).toFixed(7) + ',0,' + (g / 390).toFixed(9) + ',' +
        (b / 844).toFixed(7) + ',' + (e / 844).toFixed(7) + ',0,' + (h / 844).toFixed(9) + ',' +
        '0,0,1,0,' +
        c.toFixed(3) + ',' + f.toFixed(3) + ',0,1)';
    }

    return { prime: prime, track: track, frameFor: frameFor, matrixFor: matrixFor };
  })();

  /* ══ PHONES ═══════════════════════════════════════════════════════════════════════════════
     THE PROTOCOL (spec, «The phone»). Parent → demo, always `{type:'rocoto-demo', …}`:
         {cmd:'play'} {cmd:'pause'} {cmd:'restart'}
     Demo → parent, always `{type:'rocoto-demo', …}`:
         {state:'ready', duration?:<ms>}

     A phone attaches its iframe when it comes near the viewport, keeps the poster on top until
     the demo says `ready`, and then swaps in one step.

     ONE ROW IFRAME AT A TIME, beyond the travelling phone's (SPEC, «Weight»). Three WhatsApp
     demos running at once is three timelines, three compositors and three sets of running
     transitions on a phone that has one core to spare. A row phone attaches as it comes near,
     and the moment it does, every OTHER row phone that is off screen gives its document back.
     The poster returns under it, so a detached phone is never an empty rectangle.
  ═════════════════════════════════════════════════════════════════════════════════════════ */

  var PHONES = (function () {
    var all = [];

    function Phone(el) {
      this.el = el;
      this.mode = el.getAttribute('data-mode') || 'auto';
      /* the dock's own figure only plays where nothing flies into it */
      if (FLIES && el.classList.contains('ph-fallback')) this.mode = 'static';
      this.src = el.getAttribute('data-demo') || '';
      this.frame = el.querySelector('.ph-frame');
      this.screen = el.querySelector('.ph-screen');
      this.sheet = el.closest('.feature-sheet');
      this.keep = el.id === 'jphone';          /* the travelling phone is never detached */
      this.attached = false;
      this.attachmentVersion = 0;
      this.readyState = false;
      this.playing = false;
      this.visible = false;
      this.ratio = 0;            /* how much of this handset is on screen — the election's vote */
      this.arrived = false;
      this.started = false;      /* it has played once, so it has no rise left to wait for */
      this.duration = 0;
      this.pending = [];
    }

    /* THE POSTER COMES WITH THE PHONE, NOT WITH THE PAGE. `loading="lazy"` is a hint, and on a
       fast connection Chromium reads three screens ahead of the reader: two row posters, 147 KB,
       were arriving in the first ten responses of a page whose first screen shows neither of
       them — measured at 390. Held in `data-src` they arrive on the same trigger as the demo
       they stand in for, and a reader with no scripts gets the plain <img> in the <noscript>
       beside them. The hero's own poster keeps its `src`: it IS the first screen. */
    /* THE POSTER ARRIVES WELL AHEAD OF THE PHONE. It used to be set with the demo's mount, and the
       mount waits for a still page — so a reader who kept scrolling met a handset showing its
       poster's ALT TEXT and a broken-image mark (Peter, looking at it: «there's lag in the loading
       of these frames»). A 30–80 KB picture is asked for a screen and a half early, moving or not. */
    Phone.prototype.showPoster = function () {
      var fallback = this.sheet && !docEl.classList.contains('feature-sheets-ready') &&
        location.hash === '#' + this.sheet.id;
      if (this.sheet && !this.sheet.open && !fallback) return;
      var po = this.el.querySelector('.ph-poster[data-src]');
      if (po) {
        if (po.hasAttribute('data-srcset')) {
          po.setAttribute('srcset', po.getAttribute('data-srcset'));
          po.removeAttribute('data-srcset');
        }
        po.setAttribute('src', po.getAttribute('data-src'));
        po.removeAttribute('data-src');
      }
    };
    Phone.prototype.attach = function () {
      if (this.sheet && !this.sheet.open) return;
      this.showPoster();
      if (this.attached || !this.frame || !this.src || this.mode === 'static' || mqReduce.matches || this.el.hasAttribute('data-demo-still')) return;
      this.attached = true;
      this.attachmentVersion++;
      // Recycling a demo must not add child entries to the page's Back/Forward history.
      if (this.frame.hasAttribute('src')) this.frame.contentWindow.location.replace(this.src);
      else this.frame.setAttribute('src', this.src);
    };

    /* THE DOCUMENT GOES BACK. `about:blank` rather than removing the attribute, because an
       iframe with no src keeps the document it had — which is the timeline this is trying to
       stop. The poster comes back with `is-ready` and the phone is a still photograph again. */
    Phone.prototype.detach = function () {
      if (!this.attached || this.keep || !this.frame || this.el.getAttribute('data-demo-paused') === 'true') return;
      this.attached = false;
      this.attachmentVersion++;
      this.readyState = false;
      this.playing = false;
      this.pending = [];
      this.el.classList.remove('is-ready');
      this.frame.contentWindow.location.replace('about:blank');
    };

    Phone.prototype.send = function (msg) {
      if (!this.frame || !this.frame.contentWindow) return;
      if (!this.readyState) { this.pending.push(msg); return; }
      msg.type = 'rocoto-demo';
      try { this.frame.contentWindow.postMessage(msg, '*'); } catch (e) {}
    };

    Phone.prototype.markReady = function (data) {
      if (!this.attached || this.readyState) return;
      this.readyState = true;
      this.duration = (data && data.duration) || 0;
      /* TWO FRAMES, THEN CUT. `ready` means the demo has built its first state, which is one
         frame before the compositor has anything to show for it; swapping on the message itself
         left a blank sheet where the poster had been. Two rAFs later the iframe has certainly
         painted, so the poster can be hidden outright rather than faded — a fade is what put a
         bank list on top of a chat and washed the whole handset out. */
      var el = this.el, phone = this, version = this.attachmentVersion;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (phone.attached && phone.readyState && phone.attachmentVersion === version) el.classList.add('is-ready');
        });
      });
      var q = this.pending; this.pending = [];
      for (var i = 0; i < q.length; i++) this.send(q[i]);
      if (this.el.hasAttribute('data-demo-still')) {
        this.playing = false;
        this.send({ cmd: 'pause' });
        try {
          var demo = this.frame.contentWindow.WA && this.frame.contentWindow.WA.demo;
          if (demo) this.send({ cmd: 'seek', ms: demo.s.poster || 0 });
        } catch (e) {}
      }
      /* a demo that has just announced itself joins the election rather than starting on its
         own: on a phone the next row's handset is already on screen under this one */
      if (this.mode === 'auto') elect();
    };

    Phone.prototype.play = function () {
      if (this.playing || mqReduce.matches || this.el.getAttribute('data-demo-paused') === 'true' || this.el.hasAttribute('data-demo-still')) return;
      this.playing = true;
      this.send({ cmd: 'play' });
    };

    Phone.prototype.pause = function () {
      if (!this.playing) return;
      this.playing = false;
      this.send({ cmd: 'pause' });
    };

    Phone.prototype.setStill = function (still) {
      if (this.el.hasAttribute('data-demo-still') === still) return;
      this.el.toggleAttribute('data-demo-still', still);
      if (still) this.pause();
      elect();
    };

    Phone.prototype.restart = function () {
      if (!mqReduce.matches && this.el.getAttribute('data-demo-paused') !== 'true' && !this.el.hasAttribute('data-demo-still')) this.send({ cmd: 'restart' });
    };

    /* ── the scale. One ResizeObserver for every phone on the page. ────────────────────────
       `--ph-s` already has a correct CSS value (--ph-w / 424.669). This re-measures the screen
       as the browser actually painted it and writes the exact ratio back, which is what keeps
       the iframe's edge flush with the bezel after a sub-pixel layout. The iframe's own layout
       width stays 390 at every viewport: only this number changes. */
    var ro = null;
    function observeScale(p) {
      if (!p.screen || !('ResizeObserver' in window)) return;
      if (!ro) {
        ro = new ResizeObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            var w = entries[i].contentRect.width;
            var host = entries[i].target.closest('.ph');
            if (w > 0 && host) host.style.setProperty('--ph-s', (w / 390).toFixed(5));
          }
        });
      }
      ro.observe(p.screen);
    }

    /* ── THE ELECTION: THE HANDSET SHOWING MOST OF ITSELF IS THE ONE THAT RUNS ──────────────
       Called from every place the picture can change — an intersection, a demo announcing
       itself, the tab coming back, the late release of an arrival. A demo that has been away
       has run on in the dark and would come back mid-sentence, so it is sent home first and
       then played. The handset's own rise into its slot is 620 ms, and the demo under it starts
       when that is over. */
    var electT = 0, elected = null;
    function elect() {
      var win = null, i;
      var activeSheet = document.querySelector('.feature-sheet[open]');
      if (mqReduce.matches) {
        if (electT) { clearTimeout(electT); electT = 0; }
        elected = null;
        for (i = 0; i < all.length; i++) all[i].pause();
        return;
      }
      for (i = 0; i < all.length; i++) {
        var q = all[i];
        // A sheet's demonstration takes the same single playback slot as the landing phones.
        if (activeSheet ? q.sheet !== activeSheet : q.sheet) continue;
        if (q.mode !== 'auto' || q.el.getAttribute('data-demo-paused') === 'true' || q.el.hasAttribute('data-demo-still') || !q.visible || !(q.ratio >= 0.12)) continue;
        if (!win || q.ratio > win.ratio) win = q;
      }
      for (i = 0; i < all.length; i++) {
        if (all[i].mode !== 'auto' || all[i] === win) continue;
        all[i].pause();
      }
      // The live document arrives only where the phone's journey allows playback.
      if (win && !win.attached) { want(win); cap(win); }
      /* A COUNTDOWN THAT IS RESTARTED NEVER FINISHES. The observer fires several times while a
         handset slides into view, and re-arming the wait on each of them held the demo still for
         as long as the reader kept moving — measured at 390, nothing was playing anywhere on the
         page. The wait belongs to the WINNER, so while the winner is unchanged it runs out. */
      if (win === elected && (!win || win.playing || electT)) return;
      elected = win;
      if (electT) { clearTimeout(electT); electT = 0; }
      if (!win || !win.arrived || win.playing || document.hidden) return;

      function start() {
        electT = 0;
        if (elected !== win || !win.visible || document.hidden || mqReduce.matches) return;
        if (win.wasAway) { win.wasAway = false; win.restart(); }
        win.play();
      }
      /* the handset's own rise into its slot is 620 ms, and its demo starts when that is over;
         a handset the reader has already met is standing still and simply goes on */
      if (win.started || STILL) start();
      else { win.started = true; electT = setTimeout(start, 620); }
    }

    /* ── A DOCUMENT MOUNTS ON A PAGE THAT IS STANDING STILL ────────────────────────────────
       Mounting a demo is the heaviest single thing this page does: its script, its stylesheet,
       its font and its own first layout, one long task of 105 ms traced at 390 under a 4×
       throttle. Hung off `scroll` and off an observer margin, those tasks landed INSIDE the
       reader's swipes — one as the first screen moved, one at each row — which is the stutter
       Peter met on his own phone.

       So an attach asks instead of doing: while the page is moving the phone joins a queue, and
       a sixth of a second after the page stops, everything in the queue mounts at once. A touch
       announces itself with `pointerdown` before the page has moved, so a reader who means to
       scroll still gets the hero's demo in the gap before their finger does. Nothing is lost by
       waiting: the poster under every handset IS the conversation the demo opens on. */
    var moving = false, stillT = 0, queue = [];
    function onMove() {
      moving = true;
      if (stillT) clearTimeout(stillT);
      stillT = setTimeout(function () {
        stillT = 0;
        moving = false;
        var q = queue; queue = [];
        for (var i = 0; i < q.length; i++) q[i].attach();
      }, 170);
    }

    function want(p) {
      if (!moving) { p.attach(); return; }
      for (var i = 0; i < queue.length; i++) if (queue[i] === p) return;
      queue.push(p);
    }

    /* A POSTER THAT IS STILL BEING RENDERED IS NOT A BROKEN PAGE. The demos' posters are baked
       by another hand; while one of them is missing, the handset shows its own glass rather
       than a browser's broken-image mark and its alt text. */
    function guardPosters() {
      var imgs = document.querySelectorAll('.ph-poster, .ph-shot');
      for (var i = 0; i < imgs.length; i++) {
        (function (im) {
          im.addEventListener('error', function () { im.style.visibility = 'hidden'; });
          /* AN IMAGE THAT HAS NO SRC YET IS `complete` WITH A NATURAL WIDTH OF ZERO, which is
             the same signature as one that failed — and the row posters deliberately have no
             src until their phone comes near. Reading that as a failure hid row three's poster
             for the rest of the session, which is a blank handset under reduced motion, where
             no demo ever covers it. The check only applies to an image that has been asked for. */
          if (im.getAttribute('src') && im.complete && im.naturalWidth === 0) {
            im.style.visibility = 'hidden';
          }
        })(imgs[i]);
      }
    }

    function init() {
      /* first, so that on the first scroll event of a gesture the page already knows it is
         moving before any of the phones' own handlers run */
      addEventListener('scroll', onMove, { passive: true });
      var els = document.querySelectorAll('.ph');
      for (var i = 0; i < els.length; i++) {
        var p = new Phone(els[i]);
        els[i].__phone = p;
        all.push(p);
        observeScale(p);
        /* THE ARRIVAL IS ONLY ARMED IF SOMETHING CAN RELEASE IT. `ph-armed` hides the handset
           until `is-here` lands, and `is-here` comes from the IntersectionObserver below. The
           travelling phone is never armed: it is on screen from the first paint. */
        if (!p.keep && !STILL && 'IntersectionObserver' in window && els[i].getBoundingClientRect().top >= window.innerHeight) {
          els[i].classList.add('ph-armed');
        }
      }
      if (!all.length) return;
      guardPosters();

      if ('IntersectionObserver' in window) {
        /* TWO MARGINS, AND THE CAP HANGS OFF THE NEAR ONE. A single observer that attached on
           the way in and a cap keyed on VISIBILITY ate its own tail: a row phone mounted early,
           the row above it came into view, the cap detached the one that was not visible yet —
           and since it had never left the observer's margin, nothing fired again to bring it
           back. Row three was a blank handset, rendered at 1440 and looked at. The near margin
           is small enough that one row is inside it at a time, the far margin is what takes a
           document back, and the cap only ever detaches a phone that is outside BOTH. */
        var near = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            var ph = entries[i].target.__phone;
            ph.near = entries[i].isIntersecting;
            if (ph.near) { want(ph); cap(ph); }
          }
        }, { rootMargin: '15% 0px' });
        var early = new IntersectionObserver(function (entries, io) {
          for (var i = 0; i < entries.length; i++) {
            if (!entries[i].isIntersecting) continue;
            entries[i].target.__phone.showPoster();
            io.unobserve(entries[i].target);
          }
        }, { rootMargin: '150% 0px' });

        var far = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) continue;
            entries[i].target.__phone.detach();
          }
        }, { rootMargin: '90% 0px' });

        /* play / pause — a phone plays while a good part of it is on screen. A handset settles
           into its slot first (a short rise, the shadow landing) and only then does its demo
           start.

           AND EXACTLY ONE OF THEM PLAYS. Two handsets are on screen together at every row join
           on a phone, and each running WhatsApp demo is its own timeline, its own transitions
           and its own rAF inside its own document. Measured at 390 under a 4× throttle, standing
           still between the rows with three of them running cost 32.5 % of the core — and with
           every document handed back, 0.0 %: at rest this page's whole bill is the demos. So the
           one showing MOST of itself plays and the others hold their frame; a reader looks at
           one phone at a time, which is what the rows are for. */
        var seen = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            var el = entries[i].target;
            var ph = el.__phone;
            ph.ratio = entries[i].intersectionRatio;
            ph.visible = entries[i].isIntersecting;
            if (ph.visible && !ph.attached && ph.mode !== 'static' && !ph.keep) { want(ph); cap(ph); }
            if (ph.visible && !ph.arrived) {
              ph.arrived = true;
              el.classList.add('is-here');
            }
            if (!ph.visible) ph.wasAway = true;
          }
          elect();
        }, { threshold: [0, 0.12, 0.35, 0.6, 0.85] });


        for (var j = 0; j < all.length; j++) {
          seen.observe(all[j].el);
          if (all[j].mode === 'static' || all[j].keep) continue;
          near.observe(all[j].el);
          early.observe(all[j].el);
          far.observe(all[j].el);
        }
      } else {
        for (var k = 0; k < all.length; k++) all[k].attach();
      }

      drain();

      /* A HIDDEN TAB IS OFF SCREEN TOO. Timelines running behind another tab are battery spent
         on something nobody is looking at. */
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          for (var i = 0; i < all.length; i++) {
            if (all[i].mode !== 'auto') continue;
            all[i].wasAway = true;
            all[i].pause();
          }
        } else {
          elect();
        }
      });
      if (mqReduce.addEventListener) mqReduce.addEventListener('change', elect);
      document.addEventListener('rocoto-demo-control', elect);

      /* NOTHING STAYS HIDDEN. `ph-armed` holds a handset at opacity 0 until `is-here` lands, so
         every path that could miss the observer gets its release here anyway. */
      setTimeout(function () {
        for (var i = 0; i < all.length; i++) {
          if (all[i].el.classList.contains('ph-armed')) {
            all[i].arrived = true;
            all[i].el.classList.add('is-here');
          }
        }
        elect();
      }, 2600);
    }

    /* the cap: one row iframe mounted, beyond the travelling phone's */
    function cap(active) {
      for (var i = 0; i < all.length; i++) {
        var q = all[i];
        if (q === active || q.keep || q.mode === 'static') continue;
        if (q.attached && !q.visible && !q.near) q.detach();
      }
    }

    var early = [];
    addEventListener('message', function (ev) {
      var d = ev.data;
      if (!d || d.type !== 'rocoto-demo') return;
      var p = find(ev.source);
      if (!p) { early.push(ev); return; }
      if (d.state === 'ready') p.markReady(d);
    });

    function drain() {
      var q = early; early = [];
      for (var i = 0; i < q.length; i++) {
        var p = find(q[i].source);
        if (p && q[i].data.state === 'ready') p.markReady(q[i].data);
      }
    }

    function find(win) {
      for (var i = 0; i < all.length; i++) {
        if (all[i].frame && all[i].frame.contentWindow === win) return all[i];
      }
      return null;
    }

    function get(el) { return el && el.__phone; }

    return { init: init, get: get, all: function () { return all; } };
  })();

  ready(function () { PHONES.init(); });
  window.PeruPhones = PHONES;

  /* ══ NAV ══════════════════════════════════════════════════════════════════════════════════
     It tightens after the first scroll and changes tone while a dark band is under it. The test
     is geometric rather than an IntersectionObserver threshold, because what matters is whether
     the band covers the BAR's own strip — which is a rectangle, not a ratio of a section. */
  ready(function () {
    var bar = document.querySelector('.pnav');
    if (!bar) return;
    var darks = [].slice.call(document.querySelectorAll('[data-nav="dark"]'));
    /* THE BAR'S HEIGHT IS MEASURED WHEN IT CAN CHANGE, NOT WHEN IT IS READ. `bar.offsetHeight`
       read inside the frame made the browser lay the whole page out again, right after the class
       that frame had just written — 133 forced layouts in four seconds of scrolling, traced at
       390, and the most expensive thing the page's own code did. It can only change with the
       viewport, so it is taken at startup and on a resize. The bar tightens by ten pixels as the
       reader leaves the first screen, which moves this strip by five: the tone changes five
       pixels earlier or later than the pixel-perfect answer, and that is the whole cost. */
    var barH = bar.offsetHeight || 68;
    addEventListener('resize', function () { barH = bar.offsetHeight || barH; }, { passive: true });
    var tight = false, dark = false;
    everyFrame({
      read: function () {
        var on = false;
        for (var i = 0; i < darks.length; i++) {
          var r = darks[i].getBoundingClientRect();
          if (r.top <= barH * 0.55 && r.bottom >= barH * 0.55) { on = true; break; }
        }
        tight = (window.scrollY || 0) > 24;
        dark = on;
      },
      write: function () {
        bar.classList.toggle('is-tight', tight);
        bar.classList.toggle('on-dark', dark);
      }
    });
  });

  /* ══ LANGUAGE ═════════════════════════════════════════════════════════════════════════════
     The control in the bar is a <details>, so it opens, closes and is reachable from the
     keyboard with no script at all. Three things are worth a few lines on a page that already
     runs one:

       · a click anywhere else closes it, which is what a reader expects of a menu;
       · Escape closes it and puts the focus back on the control;
       · the place you are reading travels with you. A reader halfway down «What's coming» who
         switches language lands on the same section, because the current #hash is carried onto
         both links the moment the menu opens.

     The two addresses themselves are written into the HTML by tools/peru_i18n.py, one for each
     language; nothing here invents a path. */
  ready(function () {
    var box = document.querySelector('.plang');
    if (!box) return;
    var head = box.querySelector('summary');
    var links = [].slice.call(box.querySelectorAll('.plang-o'));

    function carry() {
      var hash = location.hash || '';
      for (var i = 0; i < links.length; i++) {
        var base = links[i].getAttribute('data-base');
        if (base === null) {
          base = links[i].getAttribute('href').split('#')[0];
          links[i].setAttribute('data-base', base);
        }
        links[i].setAttribute('href', base + hash);
      }
    }

    box.addEventListener('toggle', function () { if (box.open) carry(); });
    document.addEventListener('click', function (ev) {
      if (box.open && !box.contains(ev.target)) box.open = false;
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && box.open) { box.open = false; if (head) head.focus(); }
    });
  });

  /* ══ REVEAL ═══════════════════════════════════════════════════════════════════════════════
     A 12–16 px rise with opacity, once. The elements ship visible in CSS; this file marks them
     hidden the moment it runs, so a reader with the script off never meets an empty page. */
  ready(function () {
    var els = [].slice.call(document.querySelectorAll('[data-rise]'));
    if (!els.length) return;
    if (STILL || !('IntersectionObserver' in window)) return;

    docEl.classList.add('rise-armed');
    var viewport = window.innerHeight;
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top < viewport) el.classList.add('is-in');
      else el.classList.add('rise-pending');
    });
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var el = entries[i].target;
        var group = el.parentNode.querySelectorAll('[data-rise]');
        var idx = [].indexOf.call(group, el);
        el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (var i = 0; i < els.length; i++) io.observe(els[i]);
  });

  /* ══ LITBAND ══════════════════════════════════════════════════════════════════════════════
     The dark band's sentence lights letter by letter as it crosses the middle of the screen.

     ONE NUMBER FOR THE WHOLE SENTENCE. Each letter used to be handed its own `--lit` on every
     frame: seventy-six inline writes, seventy-six style invalidations and seventy-six colour
     transitions to keep alive, sixty times a second. Measured at 390 under a 4× throttle, one
     pass down the page was 29,450 custom-property writes of which 138 changed a value — the
     other 99.5 % told the browser something it already knew.

     Now the block carries ONE registered number, `--lit-p`, which is how far the light has
     travelled measured in letters; each letter carries its own index `--i`, written once at
     startup, and works out its own share in CSS: `clamp(0, --lit-p − --i, 1)`. The arithmetic is
     the same arithmetic, so every letter's colour on every frame is the colour it had before.
     The 160 ms softening that used to sit on each letter's `color` now sits on `--lit-p` itself,
     one transition for the sentence instead of seventy-six. */
  ready(function () {
    var band = document.querySelector('.pe-lit');
    if (!band) return;
    var letters = band.querySelectorAll('.lw');
    var block = band.querySelector('.pe-lit-t');
    if (!letters.length || !block) return;
    if (STILL) { band.classList.add('all-lit'); return; }

    var n = letters.length;
    for (var i = 0; i < n; i++) letters[i].style.setProperty('--i', i);
    block.style.setProperty('--lit-p', '0');

    /* WHERE THE LIGHT ENDS IS WHERE THE SENTENCE STOPS MOVING. The sentence is this beat's
       header and the beat is the handset's edge-on hold, so the last letter has to be white
       before the pin opens — a sentence that finishes lighting after the hold is over is one the
       reader never sees standing still. It used to be scrubbed on the band's whole travel: at
       1440 × 900 the last six letters went white between scroll 1300 and 1400, a quarter of a
       screen after the hold ended, with the band already half off the bottom. So the scrub now
       runs on the sticky block's approach to its OWN pinned position: 0 half a screen out, 1 as
       it pins, white for the whole pin, and it comes apart again on the way back up. */
    var stick = band.querySelector('.pe-lit-stick');
    var pinTop = 0, pinned = false, pinKnown = false;
    /* Read from the frame pump rather than here: `html.flight` is what makes this block sticky
       at all, and FLIGHT sets that class after this module has been built. A computed style is
       a forced style resolve, so it is taken once and again after a resize. */
    function measurePin() {
      var cs = stick ? getComputedStyle(stick) : null;
      pinned = !!cs && cs.position === 'sticky';
      pinTop = pinned ? parseFloat(cs.top) || 0 : 0;
      pinKnown = true;
    }
    addEventListener('resize', function () { pinKnown = false; }, { passive: true });

    var lastR = -1, lastP = -1, rect = null, srect = null, vh = 1;
    everyFrame({
      /* THE BAND'S RECTANGLE, ONCE, BEFORE ANYTHING IS WRITTEN */
      read: function () {
        if (!pinKnown) measurePin();
        rect = band.getBoundingClientRect();
        srect = stick ? stick.getBoundingClientRect() : rect;
        vh = window.innerHeight || 1;
      },
      write: function () {
        if (!rect) return;
        /* A SENTENCE TWO SCREENS AWAY IS NOT BEING READ. Past the viewport on either side the
           light is fully on or fully off and the last value written is already that value, so
           the frame ends here. */
        if (rect.bottom < -vh || rect.top > vh * 2) return;
        var p;
        if (pinned) {
          /* the block's own distance from the position it pins at, over the half screen it
             covers on the way in */
          p = clamp01(1 - (srect.top - pinTop) / Math.max(240, vh * 0.52));
        } else {
          /* WITHOUT A PIN the band's own travel is the scrub: 0 when its top reaches 78 % of
             the screen, 1 when its bottom passes 38 %. */
          var from = FLIES ? 0.78 : 0.60, to = FLIES ? 0.38 : 0.82;
          var span = Math.max(1, rect.height + vh * (from - to));
          p = clamp01((vh * from - rect.top) / span);
        }
        /* the block first: it resolves out of blur in the first sixth of the band's travel, and
           it takes itself apart again on the way back up — it is a scrub, not a one-shot */
        var rr = clamp01((p - 0.02) / 0.16);
        if (rr !== lastR) { lastR = rr; block.style.setProperty('--lit-r', rr.toFixed(3)); }
        /* quantised to a hundredth of a letter: finer than that and the same colour is written
           under a different name */
        var lp = Math.round(p * (n + 3) * 100) / 100;
        if (lp !== lastP) { lastP = lp; block.style.setProperty('--lit-p', lp); }
      }
    });
  });

  /* ══ ORDERS ═══════════════════════════════════════════════════════════════════════════════
     The desk-and-phone composition is scroll-led: `--pd` runs 0 → 1 as the band crosses the
     screen, the laptop rises into place and the handset slides in over its lower corner. It is
     a scrub, so scrolling back takes it apart in the same order; with the script off `--pd`
     stays at its initial 1 and the composition is simply there. */
  ready(function () {
    var pd = document.getElementById('pdstage');
    if (!pd || STILL) return;
    var last = -1, rect = null, vh = 1;
    everyFrame({
      read: function () {
        rect = pd.getBoundingClientRect();
        vh = window.innerHeight || 1;
      },
      write: function () {
        if (!rect) return;
        /* off both ends of the screen the composition is already landed or already waiting */
        if (rect.bottom < -vh || rect.top > vh * 2) return;
        var p = clamp01((vh * 0.94 - rect.top) / (vh * 0.62));
        if (Math.abs(p - last) < 0.004) return;
        last = p;
        pd.style.setProperty('--pd', p.toFixed(3));
      }
    });
  });

  /* ══ PHONE JOURNEYS ══════════════════════════════════════════════════════════════════════
     The buying phone travels face-on from the hero into its row. The final repayment phone turns
     beside the roadmap, after the three story rows. Both follow live layout rectangles in either scroll direction. */
  ready(function () {
    var heroSlot = document.getElementById('heroslot');
    var buySlot = document.getElementById('dock');
    var hero = document.getElementById('jphone');
    var repaymentSlot = document.getElementById('repayment-slot');
    var repayment = document.getElementById('repayment-phone');
    var timelineSlot = document.getElementById('roadmap-phone-slot');
    if (!heroSlot || !buySlot || !hero || !repaymentSlot || !repayment || !timelineSlot) return;

    var buyBody = buySlot.querySelector('.ph-body');
    var repaymentBody = repayment.querySelector('.ph-body');
    var repaymentScreen = repayment.querySelector('.ph-screen');
    var plate = repayment.querySelector('.ph-plate');
    if (!buyBody || !repaymentBody || !repaymentScreen || !plate) return;

    var repaymentSpace = document.createElement('div');
    repaymentSpace.className = 'journey-source-placeholder';
    repaymentSpace.setAttribute('aria-hidden', 'true');
    repaymentSlot.appendChild(repaymentSpace);

    var heroPlayer = PHONES.get(hero);
    var repaymentPlayer = PHONES.get(repayment);
    var enabled = false, primed = false, lastFrame = null, lastMatrix = '';
    var canvas = null, context = null;
    var fx = null, fv = 0, previousMs = 0, unsettled = false;
    var heroPose = window.__flightPose = {};
    var repaymentPose = window.__repaymentPose = {};
    var sample = null;

    function smooth(t) {
      t = clamp01(t);
      return t * t * t * (t * (t * 6 - 15) + 10);
    }
    function lerp(a, b, p) { return a + (b - a) * p; }
    function move(el, parent) {
      if (el.parentNode === parent) return;
      if (typeof parent.moveBefore === 'function') {
        try { parent.moveBefore(el, null); return; } catch (e) {}
      }
      parent.appendChild(el);
    }
    function resetTurn() {
      repayment.classList.remove('frame-turn', 'is-baked', 'is-edge', 'is-void', 'is-turned');
      repaymentScreen.style.transform = '';
      lastFrame = null;
      lastMatrix = '';
    }
    function enable() {
      var next = window.innerWidth >= 900 && !mqReduce.matches;
      if (next === enabled) return;
      enabled = next;
      fx = null;
      fv = 0;
      docEl.classList.toggle('flight', enabled);
      docEl.classList.toggle('phone-journeys', enabled);
      docEl.classList.toggle('lit-pin', !enabled && !mqReduce.matches);
      var fallback = buySlot.querySelector('.ph-fallback');
      var fallbackPhone = PHONES.get(fallback);
      if (fallbackPhone) {
        fallbackPhone.mode = enabled ? 'static' : 'auto';
        if (enabled) fallbackPhone.pause();
      }
      if (enabled) {
        // Moving once keeps the running iframe intact throughout both handoffs.
        move(hero, document.body);
        move(repayment, document.body);
        hero.classList.add('ph-flying', 'ph-journey');
        repayment.classList.add('ph-flying', 'ph-journey');
        repayment.classList.remove('ph-armed');
      } else {
        resetTurn();
        [hero, repayment].forEach(function (el) {
          el.classList.remove('ph-flying', 'ph-journey', 'is-gone');
          el.style.transform = '';
          el.style.removeProperty('--ph-w');
        });
        move(hero, heroSlot);
        move(repayment, repaymentSlot);
      }
      // The hero is a still until it reaches the buying row; mobile keeps that still in place.
      if (heroPlayer) heroPlayer.setStill(true);
      if (repaymentPlayer) repaymentPlayer.setStill(false);
      onScroll();
    }

    function follow(target, ms) {
      if (fx === null || !previousMs || ms - previousMs > 250) {
        fx = target; fv = 0; previousMs = ms; return target;
      }
      var dt = Math.max(0, (ms - previousMs) / 1000);
      previousMs = ms;
      var w = 1 / 0.085, d = fx - target, c = fv + w * d, e = Math.exp(-w * dt);
      fx = target + (d + c * dt) * e;
      fv = (fv - w * c * dt) * e;
      return fx;
    }

    function turn(degrees, width) {
      if (degrees < 0.35) { resetTurn(); return; }
      var frame = HANDSET.frameFor(degrees);
      if (!frame) return;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'ph-turn';
        canvas.width = 900;
        canvas.height = 1154;
        canvas.setAttribute('aria-hidden', 'true');
        plate.parentNode.insertBefore(canvas, plate.nextSibling);
        context = canvas.getContext('2d');
      }
      var source = frame.img || plate;
      if (!context || !source.naturalWidth) return;
      if (frame !== lastFrame) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        lastFrame = frame;
      }
      var stageWidth = width * 1.7205870;
      var matrix = HANDSET.matrixFor(frame.quad, stageWidth, stageWidth / 0.78);
      if (matrix && matrix !== lastMatrix) {
        lastMatrix = matrix;
        repaymentScreen.style.transform = matrix;
      }
      repayment.classList.add('frame-turn', 'is-baked', 'is-turned');
      repayment.classList.toggle('is-edge', Math.abs(frame.rotY) >= 80 || !matrix);
      repayment.classList.toggle('is-void', !matrix);
    }

    function position(el, pose, width, x, y, progress, rotation, berth, vh) {
      var widthValue = width.toFixed(2) + 'px';
      if (el.style.getPropertyValue('--ph-w') !== widthValue) el.style.setProperty('--ph-w', widthValue);
      el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      el.classList.toggle('is-gone', y > vh + 60 || y + width / 0.48641 < -60);
      pose.x = x; pose.y = y; pose.scale = 1;
      pose.u = progress; pose.v = progress; pose.m = rotation / 90;
      pose.rotY = rotation; pose.rotZ = 0; pose.berth = berth;
      pose.sy = sample.scroll; pose.lag = sample.scroll - sample.follow;
      pose.live = false; pose.settled = !unsettled;
    }

    enable();
    addEventListener('resize', enable, { passive: true });
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', enable);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { fx = null; onScroll(); }
    });

    everyFrame({
      read: function (ms) {
        if (!enabled) { sample = null; return; }
        var scroll = window.scrollY || 0;
        var followed = follow(scroll, ms);
        unsettled = Math.abs(scroll - followed) > 0.04 || Math.abs(fv) > 0.6;
        if (!unsettled) { followed = scroll; fx = scroll; fv = 0; }
        sample = {
          scroll: scroll, follow: followed, height: window.innerHeight || 1,
          hero: heroSlot.getBoundingClientRect(), buy: buyBody.getBoundingClientRect(),
          repayment: repaymentSpace.getBoundingClientRect(), timeline: timelineSlot.getBoundingClientRect()
        };
      },
      write: function () {
        if (!sample) return;
        var sy = sample.scroll, sf = sample.follow, vh = sample.height;
        var a = sample.hero, b = sample.buy, d = sample.repayment, t = sample.timeline;
        var phoneHeight = b.width / 0.48641;
        var restingY = Math.max(92, (vh - phoneHeight) * 0.5);
        var buyEnd = Math.max(1, b.top + sy - restingY);
        var progress = clamp01(sf / buyEnd);
        // The follower yields before the landing so the dock stays pixel-aligned on reversal.
        var followWeight = 1 - smooth((progress - 0.8) / 0.2);
        var heroScroll = lerp(sy, sf, followWeight);
        var p = clamp01(heroScroll / buyEnd);
        var drift = smooth(p / 0.48);
        var heroY = lerp(a.top + sy - heroScroll, restingY, drift);
        var heroX = lerp(a.left, b.left, drift);
        if (p >= 1) { heroX = b.left; heroY = b.top; }
        position(hero, heroPose, b.width, heroX, heroY, p, 0, p >= 1 ? 'dock' : 'air', vh);
        if (heroPlayer) heroPlayer.setStill(p < 1);

        var repaymentHeight = d.width / 0.48641;
        var timelineY = Math.max(92, (vh - repaymentHeight) * 0.5);
        var start = d.top + sy - timelineY;
        var end = Math.max(start + vh * 0.55, t.top + sy - timelineY);
        var rawProgress = clamp01((sf - start) / (end - start));
        var weight = smooth(rawProgress / 0.12) * (1 - smooth((rawProgress - 0.8) / 0.2));
        var repaymentScroll = lerp(sy, sf, weight);
        var q = clamp01((repaymentScroll - start) / (end - start));
        var easing = smooth(q);
        var repaymentX = lerp(d.left, t.left + (t.width - d.width) / 2, easing);
        var repaymentY = q <= 0 ? d.top : timelineY;
        if (q >= 1) repaymentY = Math.min(timelineY, t.bottom - repaymentHeight);
        var rotation = Math.round(90 * easing * 100) / 100;
        position(repayment, repaymentPose, d.width, repaymentX, repaymentY, q, rotation,
          q <= 0 ? 'repayment' : q >= 1 ? 'timeline' : 'air', vh);
        if (repaymentPlayer) repaymentPlayer.setStill(q > 0);

        if (!primed && d.top < vh * 2.5) {
          primed = true;
          HANDSET.prime();
        }
        HANDSET.track(q > 0 ? rotation : null);
        turn(rotation, d.width);
        if (unsettled && !document.hidden) onScroll();
      }
    });
  });

  /* ══ BANKS ════════════════════════════════════════════════════════════════════════════════
     The seven tiles are written in the HTML, in the founder's order, and that is the whole
     grid — there is nothing to fetch. All this does is let them rise in a stagger, and with the
     script off the grid is solid from the first paint. */
  ready(function () {
    var grid = document.getElementById('bankgrid');
    if (!grid || STILL || !('IntersectionObserver' in window)) return;
    var tiles = [].slice.call(grid.children);
    if (grid.getBoundingClientRect().top < window.innerHeight) return;
    grid.classList.add('bk-armed');
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var el = entries[i].target;
        el.style.transitionDelay = Math.min(tiles.indexOf(el), 10) * 44 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      }
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    for (var t = 0; t < tiles.length; t++) io.observe(tiles[t]);
  });

  /* Native roadmap sheets retain their URL, focus and the reader's place on the page. */
  ready(function () {
    var sheets = [].slice.call(document.querySelectorAll('.feature-sheet'));
    if (!sheets.length || typeof sheets[0].showModal !== 'function') return;
    docEl.classList.add('feature-sheets-ready');
    var current = null, opener = null, pointerOpen = false, closing = false;
    function target() {
      return sheets.find(function (sheet) { return '#' + sheet.id === location.hash; });
    }
    function finish() {
      if (!current) return;
      current.close();
      current.querySelectorAll('.ph').forEach(function (el) {
        var phone = PHONES.get(el);
        if (phone) { phone.pause(); phone.detach(); }
      });
      current = null;
      docEl.classList.remove('feature-open');
      document.dispatchEvent(new Event('rocoto-demo-control'));
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    }
    function sync() {
      closing = false;
      var next = target();
      if (next === current) return;
      finish();
      if (!next) return;
      opener = document.querySelector('[data-sheet-open][href="#' + next.id + '"]');
      current = next;
      docEl.classList.add('feature-open');
      current.showModal();
      current.scrollTop = 0;
      current.querySelectorAll('.ph').forEach(function (el) {
        var phone = PHONES.get(el);
        if (phone) phone.showPoster();
      });
      current.querySelector('h2').focus({ preventScroll: true });
      document.dispatchEvent(new Event('rocoto-demo-control'));
      if (pointerOpen && !mqReduce.matches) {
        var mobile = window.matchMedia('(max-width: 700px)').matches;
        current.animate([
          { opacity: 0, transform: mobile ? 'translateY(28px)' : 'translateX(28px)' },
          { opacity: 1, transform: 'translate(0)' }
        ], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      pointerOpen = false;
    }
    function close() {
      if (!current || closing) return;
      if (history.state && history.state.rocotoSheet) {
        closing = true;
        history.back();
      }
      else {
        history.replaceState(history.state, '', '#roadmap');
        finish();
      }
    }
    document.querySelectorAll('[data-sheet-open]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        pointerOpen = event.detail > 0;
        history.pushState({ rocotoSheet: true }, '', link.getAttribute('href'));
        sync();
      });
    });
    sheets.forEach(function (sheet) {
      sheet.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab') return;
        var stops = sheet.querySelectorAll('a[href], button:not([disabled])');
        var first = stops[0], last = stops[stops.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      });
      sheet.querySelectorAll('[data-sheet-close]').forEach(function (button) {
        button.addEventListener('click', close);
      });
      sheet.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
      var pressedBackdrop = false;
      sheet.addEventListener('pointerdown', function (event) { pressedBackdrop = event.target === sheet && outside(event); });
      sheet.addEventListener('click', function (event) {
        if (pressedBackdrop && event.target === sheet && outside(event)) close();
        pressedBackdrop = false;
      });
      function outside(event) {
        var r = sheet.getBoundingClientRect();
        return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
      }
    });
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener('load', function () {
      // Initial fragment navigation can focus the dialog after its heading was focused.
      if (current && document.activeElement === current) current.querySelector('h2').focus({ preventScroll: true });
    }, { once: true });
    if (target()) {
      document.getElementById('roadmap').scrollIntoView({ behavior: 'instant' });
      sync();
    }
  });

  /* ══ FAQ ══════════════════════════════════════════════════════════════════════════════════
     Real <details>: open and readable with the script off. Here the height is animated and the
     plus morphs into a minus. The summary keeps its own keyboard behaviour — Enter and Space
     raise a click, which is the event this intercepts. */
  ready(function () {
    var items = [].slice.call(document.querySelectorAll('.faq-i'));
    if (!items.length) return;

    items.forEach(function (d) {
      var sum = d.querySelector('summary');
      var body = d.querySelector('.faq-b');
      if (!sum || !body) return;
      var busy = false;

      function run(from, to, after) {
        /* THE DURATION FOLLOWS THE DISTANCE. One flat 340 ms makes a two-line answer feel slow
           and a long one feel snatched. */
        var d2 = STILL ? 1 : Math.max(280, Math.min(420, 250 + Math.abs(to - from) * 0.42));
        var a = body.animate([{ height: from + 'px' }, { height: to + 'px' }],
          { duration: d2, easing: 'cubic-bezier(.22,1,.36,1)' });
        a.onfinish = a.oncancel = function () {
          body.style.height = '';
          busy = false;
          if (after) after();
        };
      }

      sum.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (busy) return;
        busy = true;
        if (d.open) {
          var open = body.offsetHeight;
          body.style.height = open + 'px';
          run(open, 0, function () { d.open = false; });
        } else {
          d.open = true;                       /* the content has to be in flow to be measured */
          var h = body.scrollHeight;
          body.style.height = '0px';
          run(0, h, null);
        }
      });
    });
  });

})();
