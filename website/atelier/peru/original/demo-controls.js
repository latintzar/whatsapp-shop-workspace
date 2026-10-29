/* Reader controls live beside the demo, outside its illustrative interface. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var es = document.documentElement.lang.indexOf('es') === 0;
  var pauseIcon = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7 5v10M13 5v10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var playIcon = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m7 4 9 6-9 6Z" fill="currentColor"/></svg>';

  function init() {
    var demos = [];
    document.querySelectorAll('.ph[data-demo]').forEach(function (phone) {
      var caption = phone.querySelector('.ph-note');
      var frame = phone.querySelector('.ph-frame');
      if (!caption || !frame) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ph-demo-toggle';
      caption.appendChild(button);
      var demo = { phone: phone, caption: caption, frame: frame, button: button, visible: false };
      var lastCaptionOpacity = null;
      demos.push(demo);

      function paused() { return phone.getAttribute('data-demo-paused') === 'true'; }
      function send(command, ms) {
        var src = frame.getAttribute('src');
        if (!src || src === 'about:blank' || !frame.contentWindow) return;
        frame.contentWindow.postMessage({ type: 'rocoto-demo', cmd: command, ms: ms }, location.origin);
      }
      function player() {
        try { return frame.contentWindow.WA && frame.contentWindow.WA.demo; }
        catch (error) { return null; }
      }
      function captionState(force) {
        if (!force && caption.style.opacity === lastCaptionOpacity) return;
        lastCaptionOpacity = caption.style.opacity;
        var still = caption.style.opacity === '0' || getComputedStyle(caption).display === 'none';
        var changed = still !== phone.hasAttribute('data-demo-still');
        phone.toggleAttribute('data-demo-still', still);
        button.tabIndex = still ? -1 : 0;
        button.style.visibility = still ? 'hidden' : '';
        if (changed) phone.dispatchEvent(new CustomEvent('rocoto-demo-control', { bubbles: true }));
      }
      function sync(ready) {
        var held = paused();
        var label = es
          ? (held ? 'Reproducir demostración' : 'Pausar demostración')
          : (held ? 'Play demo' : 'Pause demo');
        button.setAttribute('aria-label', label);
        button.title = label;
        button.innerHTML = held ? playIcon : pauseIcon;
        button.hidden = reduce.matches || !!(phone.__phone && phone.__phone.mode === 'static');
        captionState(true);
        if (ready) {
          var current = player();
          if (phone.hasAttribute('data-demo-still') && current) send('seek', current.s.poster || 0);
        }
        if (phone.__phone) {
          if (held || reduce.matches || phone.hasAttribute('data-demo-still')) phone.__phone.pause();
          return;
        }
        send(held || reduce.matches || !demo.visible || document.hidden ? 'pause' : 'play');
      }
      demo.sync = sync;
      button.addEventListener('click', function () {
        if (paused() && phone.__phone) phone.__phone.wasAway = false;
        phone.setAttribute('data-demo-paused', String(!paused()));
        phone.dispatchEvent(new CustomEvent('rocoto-demo-control', { bubbles: true }));
        sync();
      });
      new MutationObserver(function () { captionState(false); }).observe(caption, { attributes: true, attributeFilter: ['style'] });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          demo.visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.12;
          sync();
        }, { threshold: [0, 0.12] }).observe(phone);
      } else { demo.visible = true; }
      sync();
    });
    function syncAll() { demos.forEach(function (demo) { demo.sync(); }); }
    addEventListener('message', function (event) {
      if (event.origin !== location.origin || !event.data || event.data.type !== 'rocoto-demo' || event.data.state !== 'ready') return;
      demos.forEach(function (demo) { if (demo.frame.contentWindow === event.source) demo.sync(true); });
    });
    if (reduce.addEventListener) reduce.addEventListener('change', syncAll);
    document.addEventListener('visibilitychange', syncAll);
    addEventListener('resize', function () { requestAnimationFrame(syncAll); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
