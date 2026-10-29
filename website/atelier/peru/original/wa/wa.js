/* Rocoto · WhatsApp drawn as WhatsApp — components + timeline player.
   A demo declares a scene; seek(ms) renders the state AT that time, forwards and backwards,
   so the page can scrub it with the scroll. Motion is CSS keyed off state classes.
   Owner: the WhatsApp builder. Used by /peru/original/demos/*.html. */
(function (global) {
  'use strict';

  var PARAMS = new URLSearchParams(location.search);
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* THE LANGUAGE. English is what Peter reviews in; Spanish is what ships. Both live side by side:
     the app's own chrome here, each demo's script in its own `en` / `es` table. `?lang=es` asks for
     Spanish, anything else paints English. */
  var LANG = PARAMS.get('lang') === 'es' ? 'es' : 'en';
  var UI = {
    en: {
      placeholder: 'Message', done: 'Done', cancel: '‹ Slide to cancel', now: 'now',
      online: 'online', typing: 'typing…', recording: 'recording audio…',
      chats: 'Chats', search: 'Search', sentBy: 'Sent by Rocoto',
      tabs: ['Updates', 'Calls', 'Communities', 'Chats', 'Settings'],
      e2e: 'Messages and calls are end-to-end encrypted. Only the people in this chat can read and listen to them.',
      /* the four ordinary places a photograph goes, and the actions under them */
      share: { near: 'Nearby', chat: 'Chat', mail: 'Mail', notes: 'Notes',
        photo: 'Photo', copy: 'Copy Photo', album: 'Add to Album', save: 'Save to Files', print: 'Print' },
      modes: ['VIDEO', 'PHOTO', 'PORTRAIT']
    },
    es: {
      placeholder: 'Mensaje', done: 'Listo', cancel: '‹ Desliza para cancelar', now: 'ahora',
      online: 'en línea', typing: 'escribiendo…', recording: 'grabando audio…',
      chats: 'Chats', search: 'Buscar', sentBy: 'Enviado por Rocoto',
      tabs: ['Novedades', 'Llamadas', 'Comunidades', 'Chats', 'Configuración'],
      e2e: 'Los mensajes y las llamadas están cifrados de extremo a extremo. Solo las personas en este chat pueden leerlos y escucharlos.',
      share: { near: 'Cerca', chat: 'Chat', mail: 'Correo', notes: 'Notas',
        photo: 'Foto', copy: 'Copiar foto', album: 'Agregar a álbum', save: 'Guardar en Archivos', print: 'Imprimir' },
      modes: ['VIDEO', 'FOTO', 'RETRATO']
    }
  };
  var T = UI[LANG];
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function last(list, t) { var r = null; (list || []).forEach(function (e) { if (t >= e.at) r = e; }); return r; }

  /* ---------------------------------------------------------------- glyphs
     Every glyph is drawn for this kit. */

  var G = {
    chevron: '<svg viewBox="0 0 13 24" fill="none" aria-hidden="true"><path d="M11 2 2 12l9 10" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    video: '<svg width="25" height="17" viewBox="0 0 25 17" fill="none" aria-hidden="true"><rect x="1" y="1.6" width="15.6" height="14" rx="4.4" stroke="currentColor" stroke-width="1.9"/><path d="M18.6 6.6 23.1 3.5c.5-.3 1.1 0 1.1.6v8.9c0 .6-.6.9-1.1.6l-4.5-3.1V6.6z" fill="currentColor"/></svg>',

    call: '<svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true"><path d="M4.6 2.3 6.5 1.6c.7-.3 1.5.1 1.8.8l1.1 2.7c.2.6.1 1.3-.4 1.7L7.7 7.9c.9 2 2.4 3.5 4.4 4.4l1.1-1.3c.4-.5 1.1-.6 1.7-.4l2.7 1.1c.7.3 1.1 1.1.8 1.8l-.7 1.9c-.3.7-.9 1.2-1.7 1.2C8.3 16.6 4.4 12.7 3.4 4c0-.8.5-1.4 1.2-1.7z" fill="currentColor"/></svg>',

    plus: '<svg viewBox="0 0 25 25" fill="none" aria-hidden="true"><path d="M12.5 4.6v15.8M4.6 12.5h15.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',

    sticker: '<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M2.6 6.1A3.5 3.5 0 0 1 6.1 2.6h9.8a3.5 3.5 0 0 1 3.5 3.5v6L12.1 19.4H6.1a3.5 3.5 0 0 1-3.5-3.5V6.1z" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 12.1h-4.1a3.2 3.2 0 0 0-3.2 3.2v4.1" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',

    camera: '<svg viewBox="0 0 25 25" fill="none" aria-hidden="true"><path d="M2.6 8.5c0-1.2 1-2.2 2.2-2.2h2.4l1.2-2a1 1 0 0 1 .9-.5h6.4a1 1 0 0 1 .9.5l1.2 2h2.4c1.2 0 2.2 1 2.2 2.2v9.2c0 1.2-1 2.2-2.2 2.2H4.8a2.2 2.2 0 0 1-2.2-2.2V8.5z" stroke="currentColor" stroke-width="1.6"/><circle cx="12.5" cy="12.9" r="4" stroke="currentColor" stroke-width="1.6"/></svg>',

    mic: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8.8" y="2.6" width="6.4" height="11.4" rx="3.2" fill="currentColor"/><path d="M5.8 11.4v.8a6.2 6.2 0 0 0 12.4 0v-.8M12 18.4v2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',

    micFill: '<svg viewBox="0 0 16 19" fill="none" aria-hidden="true"><rect x="5.1" y="1" width="5.8" height="10" rx="2.9" fill="currentColor"/><path d="M2.6 8.9v.6a5.4 5.4 0 0 0 10.8 0v-.6M8 14.9v3.1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',

    /* iOS sends with a paper plane, not an arrow — both panels of the real device capture agree */
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.1 20.6 21.4 12 3.1 3.4l.1 6.8L16 12 3.2 13.8z" fill="currentColor"/></svg>',

    play: '<svg viewBox="0 0 15 17" fill="none" aria-hidden="true"><path d="M1.6 1.4c0-.6.6-.9 1.1-.6l11 6.8c.4.3.4.9 0 1.2l-11 6.8c-.5.3-1.1 0-1.1-.6V1.4z" fill="currentColor"/></svg>',

    pause: '<svg viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.8" y="1" width="4.2" height="15" rx="1.3" fill="currentColor"/><rect x="9" y="1" width="4.2" height="15" rx="1.3" fill="currentColor"/></svg>',

    torch: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8.6 3.2h6.8l-.7 4.1a2 2 0 0 1-.6 1.1l-1 1a1.6 1.6 0 0 0-.5 1.1v9.3a.8.8 0 0 1-1.6 0v-9.3c0-.4-.2-.8-.5-1.1l-1-1a2 2 0 0 1-.6-1.1l-.7-4.1z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.2 6.6h7.6" stroke="currentColor" stroke-width="1.7"/></svg>',

    lock: '<svg viewBox="0 0 10 13" fill="none" aria-hidden="true"><rect x="1" y="5.3" width="8" height="6.9" rx="2" fill="currentColor"/><path d="M2.9 5.3V3.7a2.1 2.1 0 0 1 4.2 0v1.6" stroke="currentColor" stroke-width="1.2"/></svg>',

    reload: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M17 10a7 7 0 1 1-2.3-5.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M17.4 2v4.2h-4.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    ext: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2"/><path d="M10 14 15.5 8.5M11.5 8.5h4v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    reply: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.2 5.4 3.6 11l5.6 5.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.4 11h8.4a6.4 6.4 0 0 1 6.4 6.4v1.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    search: '<svg viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="6.4" cy="6.4" r="4.7" stroke="currentColor" stroke-width="1.6"/><path d="m10.1 10.1 3.2 3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',

    trash: '<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3.6 5.6h14.8M8.8 5.6V3.9c0-.7.6-1.3 1.3-1.3h1.8c.7 0 1.3.6 1.3 1.3v1.7M5.6 5.6l.9 12c0 .9.8 1.6 1.7 1.6h5.6c.9 0 1.6-.7 1.7-1.6l.9-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',

    chevronR: '<svg viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="m1.5 1.4 5.6 6.1-5.6 6.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    verified: '<svg viewBox="0 0 15 15" aria-hidden="true"><circle cx="7.5" cy="7.5" r="7.5" fill="#25D366"/><path d="m4 7.7 2.4 2.4 4.7-4.9" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    tickOne: '<svg viewBox="0 0 16 11" fill="none" aria-hidden="true"><path d="M4.4 6.5 6.8 9.1 13.3 1.9" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" stroke-miterlimit="10"/></svg>',
    tickTwo: '<svg viewBox="0 0 16 11" fill="none" aria-hidden="true"><path d="M.9 6.5 3.3 9.1 9.8 1.9" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" stroke-miterlimit="10"/><path d="M6.4 6.5 8.8 9.1 15.3 1.9" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" stroke-miterlimit="10"/></svg>',
    tickClock: '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="4.9" stroke="currentColor" stroke-width="1.1"/><path d="M6 3.3V6l2 1.3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',

    check: '<svg viewBox="0 0 66 66" fill="none" aria-hidden="true"><circle cx="33" cy="33" r="30" stroke="#1FA855" stroke-width="3.2"/><path d="m20 34.4 9.4 9.4L46.6 24" stroke="#1FA855" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    spin: '<svg class="wa-spin" viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="19" stroke="#E7E0D7" stroke-width="3.4"/><path d="M22 3a19 19 0 0 1 19 19" stroke="#1A1413" stroke-width="3.4" stroke-linecap="round"/></svg>',

    image: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2.4"/><circle cx="16" cy="19" r="3.4" stroke="currentColor" stroke-width="2.4"/><path d="m8 34 10-9 8 7 6-5 8 7" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',

    signal: '<svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><rect y="8" width="3.2" height="4" rx="1" fill="currentColor"/><rect x="4.9" y="5.6" width="3.2" height="6.4" rx="1" fill="currentColor"/><rect x="9.8" y="3.2" width="3.2" height="8.8" rx="1" fill="currentColor"/><rect x="14.7" y=".8" width="3.2" height="11.2" rx="1" fill="currentColor" opacity=".32"/></svg>',

    wifi: '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M1 4.4a10.3 10.3 0 0 1 14 0" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M3.6 7.2a6.6 6.6 0 0 1 8.8 0" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M6.2 9.9a2.9 2.9 0 0 1 3.6 0" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',

    battery: '<svg width="28" height="13" viewBox="0 0 28 13" fill="none" aria-hidden="true"><rect x=".6" y=".6" width="24" height="11.8" rx="3.6" stroke="currentColor" stroke-opacity=".36" stroke-width="1.1"/><rect x="2.2" y="2.2" width="17.6" height="8.6" rx="2.3" fill="currentColor"/><path d="M26.2 4.4v4.2c.9-.3 1.4-1 1.4-2.1s-.5-1.8-1.4-2.1z" fill="currentColor" fill-opacity=".36"/></svg>',

    tabStatus: '<svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><circle cx="13" cy="13" r="10.4" stroke="currentColor" stroke-width="1.8" stroke-dasharray="5.2 3.1" stroke-linecap="round"/><circle cx="13" cy="13" r="3.4" fill="currentColor"/></svg>',
    tabCalls: '<svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M5.6 3.2 7.9 2.4c.8-.3 1.8.1 2.1 1l1.4 3.3c.3.7.1 1.6-.5 2.1l-1.4 1.3c1.1 2.4 2.9 4.2 5.3 5.3l1.3-1.5c.5-.6 1.3-.8 2.1-.5l3.3 1.4c.9.4 1.3 1.3 1 2.2l-.8 2.3c-.3.9-1.1 1.5-2.1 1.5-10.4-1-15.1-5.7-16.3-16.2 0-.9.6-1.8 1.4-2.1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    tabComm: '<svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><circle cx="9.6" cy="8.2" r="3.9" stroke="currentColor" stroke-width="1.8"/><path d="M2.6 21v-1.6c0-3.3 3.1-5.9 7-5.9s7 2.6 7 5.9V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18.2 6.1a3.4 3.4 0 0 1 0 6.6M19.6 14.2c2.3.7 3.8 2.5 3.8 4.7V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    tabChats: '<svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M3.2 12.2c0-4.9 4.4-8.8 9.8-8.8s9.8 3.9 9.8 8.8-4.4 8.8-9.8 8.8c-1.5 0-3-.3-4.3-.9l-4.9 1.7 1.5-4.3a8.3 8.3 0 0 1-2.1-5.3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    tabCog: '<svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><circle cx="13" cy="13" r="3.4" stroke="currentColor" stroke-width="1.8"/><path d="M13 2.6a2 2 0 0 1 2 1.7l.2 1.4c.6.2 1.1.4 1.6.8l1.3-.6a2 2 0 0 1 2.5.8l.8 1.4a2 2 0 0 1-.5 2.5l-1.1.9c0 .3.1.6.1.9s0 .6-.1.9l1.1.9a2 2 0 0 1 .5 2.5l-.8 1.4a2 2 0 0 1-2.5.8l-1.3-.6c-.5.3-1 .6-1.6.8l-.2 1.4a2 2 0 0 1-2 1.7h-1.6a2 2 0 0 1-2-1.7l-.2-1.4c-.6-.2-1.1-.4-1.6-.8l-1.3.6a2 2 0 0 1-2.5-.8l-.8-1.4a2 2 0 0 1 .5-2.5l1.1-.9c0-.3-.1-.6-.1-.9s0-.6.1-.9l-1.1-.9a2 2 0 0 1-.5-2.5l.8-1.4a2 2 0 0 1 2.5-.8l1.3.6c.5-.3 1-.6 1.6-.8l.2-1.4a2 2 0 0 1 2-1.7H13z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',

    /* the messenger's own mark, drawn for this kit: a bubble with a handset, white on green */
    wa: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M16 6.6c-5.2 0-9.4 4.2-9.4 9.4 0 1.7.4 3.3 1.2 4.7L6.5 25.5l5-1.3c1.3.7 2.9 1.1 4.5 1.1 5.2 0 9.4-4.2 9.4-9.4S21.2 6.6 16 6.6z" fill="#fff"/><path d="M12.8 11.4c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.6 0 1.5 1.1 3 1.3 3.2.2.2 2.2 3.4 5.3 4.7 2.6 1 3.2.8 3.8.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.2-.7.1l-.7.9c-.1.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2.1z" fill="#25D366"/></svg>',

    waMark: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 4.4C9.6 4.4 4.4 9.6 4.4 16c0 2.1.6 4.1 1.6 5.8L4.2 27.8l6.2-1.6c1.7 1 3.6 1.5 5.6 1.5 6.4 0 11.6-5.2 11.6-11.6S22.4 4.4 16 4.4z" fill="#fff"/><path d="M12.3 10.2c-.2-.5-.4-.5-.7-.5h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.6c.2.2 2.4 3.8 5.9 5.2 2.9 1.2 3.5.9 4.2.9.6-.1 2-.8 2.3-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.7-.4l-2.3-1.1c-.3-.1-.6-.2-.8.2l-.8 1c-.2.2-.4.3-.8.1-.3-.2-1.5-.5-2.8-1.7-1-.9-1.7-2-1.9-2.4-.2-.3 0-.5.2-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-.9-2.5z" fill="#25D366"/></svg>',

    person: '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="wa-pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D2D8"/><stop offset="1" stop-color="#AFBAC2"/></linearGradient></defs><rect width="48" height="48" fill="url(#wa-pg)"/><circle cx="24" cy="18.2" r="8.3" fill="#F2F5F7"/><path d="M24 29.2c-8.7 0-15.7 5.5-15.7 12.2V48h31.4v-6.6c0-6.7-7-12.2-15.7-12.2z" fill="#F2F5F7"/></svg>',

    /* the disc with a tick: INK, because colour is not a status system in this product */
    paymentCheck: '<svg class="rp-success-mark" viewBox="0 0 96 96" fill="none" aria-hidden="true"><circle cx="48" cy="48" r="43" stroke="currentColor" stroke-width="2.5"/><path class="rp-success-stroke" pathLength="1" d="m28 48 13 13 27-28" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    okDisc: '<svg viewBox="0 0 21 21" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="10.5" fill="#1A1413"/><path d="m5.8 10.9 3.2 3.2 6.2-6.6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    /* ---- the camera app: the flash, the control caret, the live ring, the flip ---- */
    bolt: '<svg viewBox="0 0 15 21" aria-hidden="true"><path d="M9.5 1 2.2 12.1h4.3L5.5 20l7.3-11.1H8.5L9.5 1z" fill="currentColor"/></svg>',
    caret: '<svg viewBox="0 0 17 9" fill="none" aria-hidden="true"><path d="M1.4 1.5 8.5 7.5l7.1-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    live: '<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="9.1" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.3 2.3"/><circle cx="11" cy="11" r="4.3" stroke="currentColor" stroke-width="1.5"/></svg>',
    flip: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.8 10.4A7.6 7.6 0 0 1 18 6.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M19.2 13.6A7.6 7.6 0 0 1 6 17.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m15.2 6.1 3.2.7-.6 3.2M8.8 17.9l-3.2-.7.6-3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    /* ---- the share sheet: the share mark itself, the close, and the actions ---- */
    shareIos: '<svg viewBox="0 0 22 26" fill="none" aria-hidden="true"><path d="M11 2v14.4M6.6 6.3 11 1.8l4.4 4.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.4 9.9H3.6a1.8 1.8 0 0 0-1.8 1.8v10.6a1.8 1.8 0 0 0 1.8 1.8h14.8a1.8 1.8 0 0 0 1.8-1.8V11.7a1.8 1.8 0 0 0-1.8-1.8h-2.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 1.5 10.5 10.5M10.5 1.5 1.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    copy: '<svg viewBox="0 0 21 21" fill="none" aria-hidden="true"><rect x="7.2" y="7.2" width="12" height="12" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M14.4 4.6a2.8 2.8 0 0 0-2.8-2.8H4.6a2.8 2.8 0 0 0-2.8 2.8v7a2.8 2.8 0 0 0 2.8 2.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    folder: '<svg viewBox="0 0 21 21" fill="none" aria-hidden="true"><path d="M1.8 5.4c0-1.1.9-2 2-2h3.7l2 2.4h7.7c1.1 0 2 .9 2 2v7.8c0 1.1-.9 2-2 2H3.8c-1.1 0-2-.9-2-2V5.4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    printer: '<svg viewBox="0 0 21 21" fill="none" aria-hidden="true"><path d="M5.8 8V2.6h9.4V8" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><rect x="1.8" y="8" width="17.4" height="7.6" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M5.8 12.4h9.4v6H5.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" fill="#fff"/></svg>',

    /* Four ordinary places a photograph goes, drawn as shapes: nobody else's mark is drawn here. */
    tileNear: '<svg viewBox="0 0 34 34" fill="none" aria-hidden="true"><path d="M8.4 20.6a12 12 0 0 1 17.2 0M12 24.6a7 7 0 0 1 10 0" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="17" cy="9.6" r="2.8" fill="#fff"/></svg>',
    tileChat: '<svg viewBox="0 0 34 34" fill="none" aria-hidden="true"><path d="M4.6 16.2c0-6 5.5-10.8 12.4-10.8S29.4 10.2 29.4 16.2 23.9 27 17 27c-1.9 0-3.8-.4-5.4-1.1l-6.2 2.1 1.9-5.3a9.9 9.9 0 0 1-2.7-6.5z" fill="#fff"/></svg>',
    tileMail: '<svg viewBox="0 0 34 34" fill="none" aria-hidden="true"><rect x="4" y="8" width="26" height="18" rx="3.4" fill="#fff"/><path d="m5.6 10.6 10.2 7.6c.7.5 1.7.5 2.4 0l10.2-7.6" stroke="#2E8AF6" stroke-width="2" stroke-linecap="round"/></svg>',
    tileNotes: '<svg viewBox="0 0 34 34" fill="none" aria-hidden="true"><rect x="6" y="5" width="22" height="24" rx="3" fill="#fff"/><path d="M10.4 12.4h13.2M10.4 17h13.2M10.4 21.6h8.4" stroke="#9A7B10" stroke-width="1.9" stroke-linecap="round"/></svg>',

    /* the app's own back, the mark the prototype's phone detail wears */
    arrowLeft: '<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M9.6 3.8 2.4 11l7.2 7.2M2.8 11h16.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* one hand-listed waveform, so every render is the same recording */
  var WAVE = [4, 6, 9, 13, 17, 12, 8, 11, 16, 20, 15, 10, 7, 12, 18, 21, 16, 11, 8, 13, 19, 14, 9, 6, 10, 15, 11, 7, 5, 4];

  /* ------------------------------------------------------------------- QR
     A code a phone can actually read, drawn by this kit: byte mode, error correction level M, the
     smallest version that holds the text (1 to 3 — every code we draw is a short rocoto address,
     and those versions carry one block each, so there is no interleaving to do). Placement, mask
     and format bits follow ISO/IEC 18004. Nobody else's code is ever drawn here.
     Drawn as ONE path of squares, with the four-module quiet zone inside the box. */

  var QR_URL = 'https://soyrocoto.com/peru';
  var QR_DATA = { 1: 16, 2: 28, 3: 44 };   /* data codewords, level M, one block */
  var QR_EC = { 1: 10, 2: 16, 3: 26 };     /* error-correction codewords beside them */
  var QR_ALIGN = { 1: 0, 2: 18, 3: 22 };   /* the centre of the one alignment square */

  var QEXP = new Array(512), QLOG = new Array(256);
  (function () {
    for (var i = 0, x = 1; i < 255; i++) { QEXP[i] = x; QLOG[x] = i; x <<= 1; if (x & 256) x ^= 285; }
    for (i = 255; i < 512; i++) QEXP[i] = QEXP[i - 255];
  })();
  function gmul(a, b) { return (a && b) ? QEXP[QLOG[a] + QLOG[b]] : 0; }

  function qrMask(k, r, c) {
    switch (k) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return (r * c) % 2 + (r * c) % 3 === 0;
      case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0;
      default: return ((r * c) % 3 + (r + c) % 2) % 2 === 0;
    }
  }

  /* the four rules of the standard, so the code we ship is the one it would choose */
  function qrPenalty(m, n) {
    var p = 0, r, c, k, run, dark = 0;
    for (r = 0; r < n; r++) {
      for (c = 0, run = 1; c < n; c++) {
        if (c && m[r][c] === m[r][c - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
        else run = 1;
        if (m[r][c]) dark++;
      }
    }
    for (c = 0; c < n; c++) {
      for (r = 0, run = 1; r < n; r++) {
        if (r && m[r][c] === m[r - 1][c]) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
        else run = 1;
      }
    }
    for (r = 0; r < n - 1; r++) for (c = 0; c < n - 1; c++) {
      k = m[r][c] + m[r][c + 1] + m[r + 1][c] + m[r + 1][c + 1];
      if (k === 0 || k === 4) p += 3;
    }
    var pat = [1, 0, 1, 1, 1, 0, 1];
    function hit(get, i) {
      for (var q = 0; q < 7; q++) if (get(i + q) !== pat[q]) return false;
      var before = true, after = true, q2;
      for (q2 = 1; q2 <= 4; q2++) { if (get(i - q2) !== 0) { before = false; break; } }
      for (q2 = 7; q2 < 11; q2++) { if (get(i + q2) !== 0) { after = false; break; } }
      return before || after;
    }
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
      /* eslint-disable no-loop-func */
      (function (rr, cc) {
        if (hit(function (i) { return (i < 0 || i >= n) ? 0 : m[rr][i]; }, cc)) p += 40;
        if (hit(function (i) { return (i < 0 || i >= n) ? 0 : m[i][cc]; }, rr)) p += 40;
      })(r, c);
    }
    p += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
    return p;
  }

  /* text -> the module matrix */
  function qrModules(text) {
    var bytes = [], i, j, c;
    for (i = 0; i < text.length; i++) {
      c = text.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    var ver = 1;
    while (ver < 3 && bytes.length + 2 > QR_DATA[ver]) ver++;

    var bits = [];
    function put(v, w) { for (var k = w - 1; k >= 0; k--) bits.push((v >> k) & 1); }
    put(4, 4); put(bytes.length, 8);
    for (i = 0; i < bytes.length; i++) put(bytes[i], 8);
    var cap = QR_DATA[ver] * 8;
    for (i = 0; i < 4 && bits.length < cap; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var data = [];
    for (i = 0; i < bits.length; i += 8) {
      for (j = 0, c = 0; j < 8; j++) c = (c << 1) | bits[i + j];
      data.push(c);
    }
    /* the standard's own pad pair, alternating from the first one */
    for (i = 0; data.length < QR_DATA[ver]; i++) data.push(i % 2 ? 0x11 : 0xEC);

    var ecLen = QR_EC[ver];
    var gen = [1];
    for (i = 0; i < ecLen; i++) {
      var ng = [];
      for (j = 0; j <= gen.length; j++) ng.push(0);
      for (j = 0; j < gen.length; j++) {
        ng[j] ^= gen[j];
        ng[j + 1] ^= gmul(gen[j], QEXP[i]);
      }
      gen = ng;
    }
    var rem = data.slice();
    for (i = 0; i < ecLen; i++) rem.push(0);
    for (i = 0; i < data.length; i++) {
      var f = rem[i];
      if (!f) continue;
      for (j = 1; j < gen.length; j++) rem[i + j] ^= gmul(gen[j], f);
    }
    var all = data.concat(rem.slice(data.length));

    var n = ver * 4 + 17, m = [], rsv = [], r;
    for (r = 0; r < n; r++) { m.push([]); rsv.push([]); for (c = 0; c < n; c++) { m[r].push(0); rsv[r].push(0); } }
    function fix(rr, cc, v) { if (rr >= 0 && cc >= 0 && rr < n && cc < n) { m[rr][cc] = v; rsv[rr][cc] = 1; } }

    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(function (p) {
      for (var y = -1; y < 8; y++) for (var x = -1; x < 8; x++) {
        var on = (y >= 0 && y <= 6 && (x === 0 || x === 6)) ||
                 (x >= 0 && x <= 6 && (y === 0 || y === 6)) ||
                 (y >= 2 && y <= 4 && x >= 2 && x <= 4);
        fix(p[0] + y, p[1] + x, on ? 1 : 0);
      }
    });
    for (i = 8; i < n - 8; i++) { fix(6, i, i % 2 === 0 ? 1 : 0); fix(i, 6, i % 2 === 0 ? 1 : 0); }
    var a = QR_ALIGN[ver];
    if (a) for (r = -2; r <= 2; r++) for (c = -2; c <= 2; c++)
      fix(a + r, a + c, (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) ? 1 : 0);
    for (i = 0; i < 9; i++) { if (!rsv[8][i]) fix(8, i, 0); if (!rsv[i][8]) fix(i, 8, 0); }
    for (i = 0; i < 8; i++) { fix(8, n - 1 - i, 0); fix(n - 1 - i, 8, 0); }
    fix(n - 8, 8, 1);

    var bitI = 7, byteI = 0, inc = -1;
    r = n - 1;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (;;) {
        for (c = 0; c < 2; c++) {
          if (rsv[r][col - c]) continue;
          var dark = byteI < all.length ? ((all[byteI] >>> bitI) & 1) : 0;
          m[r][col - c] = dark;
          bitI--;
          if (bitI === -1) { byteI++; bitI = 7; }
        }
        r += inc;
        if (r < 0 || r >= n) { r -= inc; inc = -inc; break; }
      }
    }

    var best = null, bestP = Infinity;
    for (var k = 0; k < 8; k++) {
      var t = [];
      for (r = 0; r < n; r++) {
        t.push([]);
        for (c = 0; c < n; c++) t[r].push(rsv[r][c] ? m[r][c] : (qrMask(k, r, c) ? m[r][c] ^ 1 : m[r][c]));
      }
      /* the format bits belong to the code it is scored on */
      var d = (0 << 3) | k, v = d << 10, sh;
      for (sh = 4; sh >= 0; sh--) if (v & (1 << (sh + 10))) v ^= 0x537 << sh;
      var fmt = (((d << 10) | v) ^ 0x5412);
      for (i = 0; i < 15; i++) {
        var b = (fmt >> i) & 1;
        if (i < 6) t[i][8] = b; else if (i < 8) t[i + 1][8] = b; else t[n - 15 + i][8] = b;
        if (i < 8) t[8][n - i - 1] = b; else if (i < 9) t[8][15 - i - 1 + 1] = b; else t[8][15 - i - 1] = b;
      }
      t[n - 8][8] = 1;
      var pen = qrPenalty(t, n);
      if (pen < bestP) { bestP = pen; best = t; }
    }
    return best;
  }

  /* the code, drawn: one path, a four-module quiet zone, no gaps between modules */
  function qrSvg(text) {
    var m = qrModules(text || QR_URL), n = m.length, q = 4, s = n + q * 2, d = [], r, c;
    for (r = 0; r < n; r++) for (c = 0; c < n; c++)
      if (m[r][c]) d.push('M' + (c + q) + ' ' + (r + q) + 'h1v1h-1z');
    return '<svg viewBox="0 0 ' + s + ' ' + s + '" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect width="' + s + '" height="' + s + '" fill="#fff"/>' +
      '<path d="' + d.join('') + '" fill="#111B21"/></svg>';
  }

  function avatarHTML(a, cls) {
    a = a || { kind: 'person' };
    if (a.kind === 'img') {
      return '<span class="wa-av ' + (cls || '') + '" style="background:' + (a.bg || '#fff') + ';padding:' + (a.pad || 0) + 'px">' +
        '<img src="' + a.src + '" alt="" style="object-fit:' + (a.fit || 'contain') + '">' + '</span>';
    }
    return '<span class="wa-av ' + (cls || '') + '">' + G.person + '</span>';
  }

  /* A message is typed by a thumb, so the characters do NOT arrive at one rate: every keypress
     carries its own jitter, a space costs a little, a comma more and a full stop most. The plan is
     drawn once from a fixed seed — the same demo types the same way every time — and then scaled to
     the window the scene asked for, so `seek` stays a pure function of the clock. */
  function typePlan(text, from, to) {
    var seed = 20260919, i, c, d, t = 0, out = [];
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      d = 0.58 + 0.84 * rnd();
      /* an emoji is two units: it arrives whole, or it paints as a broken glyph */
      if (c.charCodeAt(0) >= 0xD800 && c.charCodeAt(0) <= 0xDBFF) {
        t += d; out.push(t); out.push(t); i++; continue;
      }
      if (c === ' ') d += 0.34;
      if (',;:'.indexOf(c) >= 0) d += 1.9;
      if ('.!?'.indexOf(c) >= 0) d += 3.2;
      if (i && c !== c.toLowerCase() && c === c.toUpperCase()) d += 0.7;   /* a capital costs a shift */
      if (i && i % 23 === 0) d += 1.5;                                     /* a glance at the screen */
      out.push(t += d);
    }
    var k = (to - from) / (t || 1);
    for (i = 0; i < out.length; i++) out[i] *= k;
    return out;
  }

  /* The in-chat browser's own slide, in milliseconds: the same number as `--wa-sp-sheet-t` in
     wa.css, which the sheet's transform is transitioned over. The player needs it to know when
     the sheet is travelling and when it is parked. */
  /* The in-chat browser travels a third slower than it did (SPEC 17b, «its rise, its loading bar
     and its page changes run about a third slower»): 600 → 800 ms, and `--wa-sp-sheet-slow-t` in
     wa.css carries the same number for the transform. The banner's own drop keeps 600. */
  var SHEET_MS = 800;

  /* ------------------------------------------------------------ the parts */

  function statusHTML(scene) {
    return '<span class="wa-clock">' + esc(scene.clock || '18:41') + '</span>' +
      '<span class="wa-sysicons">' + G.signal + G.wifi + G.battery + '</span>';
  }

  function headerHTML(scene) {
    var c = scene.chat || {};
    return '<span class="wa-back">' + G.chevron + (c.unread ? '<span class="wa-unread">' + esc(c.unread) + '</span>' : '') + '</span>' +
      avatarHTML(c.avatar) +
      '<span class="wa-idty"><span class="wa-name"><span class="nm">' + esc(c.title || '') + '</span>' +
      (c.verified ? '<span class="wa-verif">' + G.verified + '</span>' : '') + '</span>' +
      '<span class="wa-pres"></span></span>' +
      '<span class="wa-acts">' + G.video + G.call + '</span>';
  }

  function metaHTML(item, below) {
    return '<span class="wa-meta' + (below ? ' below' : '') + '">' +
      '<span class="wa-time">' + esc(item.time || '') + '</span>' +
      (item.dir === 'out' ? '<span class="wa-tick"></span>' : '') + '</span>';
  }

  function ctaHTML(list) {
    return list.map(function (b, i) {
      return '<div class="wa-cta-b" data-cta="' + i + '">' + (b.kind === 'reply' ? G.reply : G.ext) +
        '<span>' + esc(b.label) + '</span></div>';
    }).join('');
  }

  function voiceHTML(item) {
    var bars = WAVE.map(function (h) { return '<i class="wa-bar" style="height:' + h + 'px"></i>'; }).join('');
    return '<span class="wa-voice">' +
      '<span class="wa-vav">' + avatarHTML(item.avatar) + '<span class="wa-mic">' + G.micFill + '</span></span>' +
      '<span class="wa-vmain">' +
      '<span class="wa-vtop"><span class="wa-play">' + G.play + '</span>' +
      '<span class="wa-wave">' + bars + '<i class="wa-head-dot"></i></span></span>' +
      '<span class="wa-vbot"><span class="wa-vdur">' + esc(item.dur || '0:00') + '</span>' + metaHTML(item) + '</span>' +
      '</span></span>';
  }

  /* ── WHATSAPP'S LINK PREVIEW ─────────────────────────────────────────────────────────────
     The card the app draws above a URL: the page's own picture on top, its title under it, then
     the host — and the URL itself as the message's text below, which the item carries.

     `p.card` PUTS ROCOTO'S CONFIRMATION WHERE THE PICTURE GOES (SPEC 17c, Peter verbatim:
     «would actually be a link with the social graph image preview being that confirmation tick
     that the funds were sent. a nifty way to use previews as real data»). It is the same drawing
     the kit sends as a message — `cardHTML` — laid out in an open-graph frame, so the preview
     carries the real thing rather than a photograph of it, and it stays crisp at every width a
     handset is drawn at. */
  function previewHTML(p) {
    var im = p.card
      ? '<span class="im og">' + cardHTML(p.card, true) + '</span>'
      : (p.thumb ? '<span class="im"><img src="' + p.thumb + '" alt=""></span>' : '');
    return '<span class="wa-prev">' + im +
      '<span class="bd"><span class="t">' + esc(p.title) + '</span>' +
      (p.desc ? '<span class="d">' + esc(p.desc) + '</span>' : '') +
      '<span class="u">' + esc(p.host) + '</span></span></span>';
  }

  /* ── THE FIGURE LOCKUP, as `rocoto/figure` builds it ────────────────────────────────────
     The unit shares the number's own line, and the fraction is 0.65 of the figure's size with
     zero leading, so the cents are the number's tail rather than a second number. `S/ 386.00`
     goes in, one object comes out. It lives in the kit because two surfaces set figures — the
     confirmation card below, and the Rocoto app's own screens in `demos/pages.js`. */
  function figure(amount) {
    var m = /^\s*([^\d-]*)([\d.,]+?)([.,]\d+)?\s*$/.exec(String(amount));
    if (!m) return '<span class="rp-fig"><span class="val">' + esc(amount) + '</span></span>';
    return '<span class="rp-fig">' + (m[1].trim() ? '<span class="cur">' + esc(m[1].trim()) + '</span>' : '') +
      '<span class="val">' + m[2] + (m[3] ? '<span class="fr">' + m[3] + '</span>' : '') + '</span></span>';
  }

  /* ── ROCOTO'S CONFIRMATION CARD (SPEC 17b) ──────────────────────────────────────────────
     «a photo gets send saying "funds sent to SUPPLIER" showing the confirmation that the
     supplier got paid» — the shop's own message, the way a Monzo link is the friend's own
     message. ONE object, used by both phones: the supplier sees it arrive, the shop sees it
     leave. It is drawn in HTML inside a WhatsApp image bubble rather than shipped as a picture,
     so it is crisp at every scale the page draws a handset at, and it is Rocoto's own surface —
     paper #FAF7F3, ink #1A1413, the face mark, the figure with its unit on the number's line.
     Judged at the size the page draws a row: 276 px of handset, so 170 px of card.

     TWO SHAPES, ONE DRAWING (SPEC 17c). The confirmation now travels as a LINK: it is the image
     of the preview WhatsApp draws above the URL, so the same elements are laid out in an
     open-graph frame — `wide` — with the tick standing beside the lead, the figure under it and
     the supplier's name under that. The narrow card is the same nodes in a column. */
  function cardHTML(c, wide) {
    return '<span class="wa-card' + (wide ? ' wide' : '') + (c.tick ? ' tick' : '') + '">' +
      '<span class="wc-h"><img src="/peru/original-brand/face-open.svg" alt="" width="17" height="17">' +
      '<span>Rocoto</span></span>' +
      '<span class="wc-ok">' + G.paymentCheck + '</span>' +
      '<span class="wc-l">' + esc(c.lead) + '</span>' +
      '<span class="wc-f">' + figure(c.amount) + '</span>' +
      '<span class="wc-w">' + esc(c.payee) + '</span>' +
      '<span class="wc-r">' + esc(c.when) + (c.ref ? ' · ' + esc(c.ref) : '') + '</span>' +
      '</span>';
  }

  /* WHO SENT IT, WHERE THE OWNER DID NOT. On the selling phone Rocoto answers a customer for the
     shop, so that message leaves the shop's own side of the thread wearing the kit's Rocoto mark —
     the same one its system chip carries — and nothing else about the bubble changes. */
  function byHTML(who) {
    if (who !== 'rocoto') return '';
    return '<span class="wa-by"><img class="wa-rocoto" src="/peru/original-brand/face-open.svg" alt="" ' +
      'width="13" height="13"><span>' + T.sentBy + '</span></span>';
  }

  function buildRow(item, i) {
    var mid = item.kind === 'date' || item.kind === 'e2e' || item.kind === 'chip';
    var row = el('div', 'wa-row ' + (mid ? 'mid' : (item.dir === 'out' ? 'out' : 'in')) +
      (item.first ? ' first' : '') + (item.fromTyping ? ' from-typing' : '') +
      (item.kind === 'typing' ? ' typing' : ''));
    var inner = '';

    if (item.kind === 'date') {
      inner = '<span class="wa-chip date">' + esc(item.text) + '</span>';
    } else if (item.kind === 'e2e') {
      inner = '<span class="wa-chip e2e">' + G.lock + '<span>' + esc(item.text ||
        T.e2e) + '</span></span>';
    } else if (item.kind === 'chip') {
      inner = '<span class="wa-chip">' +
        (item.icon === 'rocoto' ? '<img class="wa-rocoto" src="/peru/original-brand/face-open.svg" alt="" width="15" height="15">' : '') +
        '<span>' + esc(item.text) + '</span></span>';
    } else {
      /* the tail is not written here: which bubble of a run wears it changes as the thread grows,
         so the player writes `.tail` on the row itself, every frame */
      var cls = 'wa-b';
      var body = '';
      if (item.kind === 'voice') {
        cls += ' voice';
        body = voiceHTML(item);
      } else if (item.kind === 'photo') {
        cls += ' media';
        body = '<span class="wa-photo"><img src="' + item.src + '" alt="" width="230" height="288">' +
          '<span class="wa-ph-mark">' + G.image + '</span></span>' + metaHTML(item, true);
      } else if (item.kind === 'card') {
        /* an image message, and what is inside it is drawn rather than decoded */
        cls += ' media card';
        body = cardHTML(item.card) + metaHTML(item, true);
      } else if (item.kind === 'typing') {
        cls += ' typing';
        body = '<span class="wa-typing"><i></i><i></i><i></i></span>';
      } else if (item.kind === 'qr') {
        body = (item.text ? '<span class="wa-txt" style="display:block;padding-bottom:7px">' + esc(item.text) + '</span>' : '') +
          '<span class="wa-qrcard"><span class="wa-qrbox">' + qrSvg() + '</span></span>' +
          '<span class="wa-qrfoot"><span class="wa-qrcap">' + esc(item.cap || '') + '</span>' + metaHTML(item) + '</span>';
        if (!item.cta) cls += ' qr';
      } else {
        /* A LINK MESSAGE IS ITS PREVIEW AND ITS URL (SPEC 17c): the card the app drew for the
           page, and under it the address itself, in the app's own link blue. `link: true` means
           the message IS the address; a string is an address on its own line under the words. */
        var txt = esc(item.text);
        if (typeof item.link === 'string') txt += '<br><span class="lk">' + esc(item.link) + '</span>';
        body = byHTML(item.by) +
          (item.preview ? previewHTML(item.preview) : '') +
          '<span class="wa-txt' + (item.link === true ? ' lk' : '') + '">' + txt + metaHTML(item) + '</span>';
      }
      if (item.cta) {
        cls += ' has-cta';
        body = '<div class="wa-txtwrap">' + body + '</div>' + ctaHTML(item.cta);
      }
      inner = '<div class="' + cls + '">' + body + '</div>';
    }

    row.innerHTML = '<div class="wa-grow"><div class="wa-fade">' + inner + '</div></div>';
    row.dataset.i = i;
    return row;
  }

  /* the wave that runs while a voice note is being recorded */
  function liveWaveHTML() {
    var bars = [], i, h;
    for (i = 0; i < 96; i++) {
      h = 3 + Math.round(9 * (1 + Math.sin(i * 0.7)) * (0.55 + 0.45 * Math.sin(i * 0.23 + 1.1)));
      bars.push('<i style="height:' + Math.max(3, Math.min(20, h)) + 'px"></i>');
    }
    return bars.join('');
  }

  function composerHTML(scene) {
    var ph = (scene.composer && scene.composer.placeholder) || T.placeholder;
    return '<div class="wa-comp">' +
      '<span class="wa-plus">' + G.plus + '</span>' +
      '<span class="wa-field"><span class="wa-ftext ph">' + esc(ph) + '</span><span class="wa-sticker">' + G.sticker + '</span></span>' +
      '<span class="wa-cam">' + G.camera + '</span>' +
      '<span class="wa-slot">' +
      '<span class="wa-round wa-mic-b">' + G.mic + '</span>' +
      '<span class="wa-round wa-sendb">' + G.send + '</span>' +
      '</span>' +
      '</div>' +
      /* the recording strip is 100 nodes of live waveform: it is built for a demo that records,
         and for no other */
      (scene.recording ? '<div class="wa-rec"><span class="dot">' + G.mic + '</span><span class="tm">0:00</span>' +
        '<span class="sl">' + esc(T.cancel) + '</span>' +
        '<span class="lw"><span class="lwi">' + liveWaveHTML() + '</span></span>' +
        '<span class="tr">' + G.trash + '</span></div>' : '') +
      '<div class="wa-home"><i></i></div>';
  }

  function sheetHTML(scene) {
    /* No status bar of its own: the phone paints one, for the whole screen, and this sheet slides
       up underneath it (see `.wa-sheet` in wa.css). */
    var s = scene.sheet;
    return '<div class="wa-sheet-top">' +
      '<div class="wa-sheet-bar">' +
      '<span class="wa-sheet-done">' + esc(T.done) + '</span>' +
      '<span class="wa-sheet-mid"><span class="wa-sheet-t">' + esc(s.title || '') + '</span>' +
      '<span class="wa-sheet-h">' + G.lock + '<span>' + esc(s.host || '') + '</span></span></span>' +
      '<span class="wa-sheet-rl">' + G.reload + '</span>' +
      '<span class="wa-prog"></span>' +
      '</div></div>' +
      '<div class="wa-sheet-doc">' + (s.pages || []).map(function (p, i) {
        return '<div class="wa-pg ' + (p.cls || '') + '" data-pg="' + i + '">' + p.html + '</div>';
      }).join('') + '</div>';
  }

  /* ─────────────────────────── THE CAMERA, THE SHARE SHEET AND THE ROCOTO APP ──────────────
     On delivery the invoice is a piece of PAPER, so the phone leaves WhatsApp: the camera takes
     the screen, the picture is shared, and Rocoto — an app, never a contact — opens on what it
     read. Three surfaces, drawn as iOS draws them, each one a state of the clock. */

  /* The camera, portrait, photo mode: the control row, the 3:4 frame the phone photographs in,
     the zoom chips with 1× standing, the mode strip, and the shutter between the well and the
     flip. Over it all, the picture as the well opens it: the day it was taken, and the toolbar
     every photo carries — share at the left edge, the bin at the right. */
  function cameraHTML(scene) {
    var c = scene.camera;
    var zoom = ['.5', '1×', '2', '5'].map(function (z, i) {
      return '<span class="z' + (i === 1 ? ' on' : '') + '">' + z + '</span>';
    }).join('');
    var modes = T.modes.map(function (m, i) {
      return '<span' + (i === 1 ? ' class="on"' : '') + '>' + m + '</span>';
    }).join('');
    return '<div class="ca-top"><span class="bolt">' + G.bolt + '</span>' +
      '<span class="caret">' + G.caret + '</span><span class="live">' + G.live + '</span></div>' +
      '<div class="ca-view"><img src="' + c.src + '" alt="" width="390" height="520">' +
      '<span class="ca-box"></span><span class="ca-flash"></span></div>' +
      '<div class="ca-zoom">' + zoom + '</div>' +
      '<div class="ca-modes">' + modes + '</div>' +
      '<div class="ca-bar"><span class="ca-well"><img src="' + c.src + '" alt=""></span>' +
      '<span class="ca-shut"><i></i></span>' +
      '<span class="ca-flip">' + G.flip + '</span></div>' +
      '<div class="wa-home"><i></i></div>' +
      '<div class="ca-review">' +
      '<div class="ca-rtop">' + esc(c.stamp || '') + '</div>' +
      '<div class="ca-rimg"><img src="' + c.src + '" alt=""></div>' +
      '<div class="ca-rbar"><span class="g ca-share">' + G.shareIos + '</span>' +
      '<span class="g">' + G.trash + '</span></div>' +
      '<div class="wa-home"><i></i></div>' +
      '</div>';
  }

  /* The share sheet: what is being shared at its head, the row of places it can go, then the
     actions. Rocoto stands in that row wearing its own icon; the four beside it are ordinary
     places drawn as shapes, because nobody else's mark is drawn in this kit. */
  function shareHTML(scene) {
    var sh = scene.share, S = T.share;
    var apps = [
      { bg: '#2B7BEF', glyph: 'tileNear', label: S.near },
      { bg: '#4CD964', glyph: 'tileChat', label: S.chat },
      { bg: '#2E8AF6', glyph: 'tileMail', label: S.mail },
      { rocoto: true, label: 'Rocoto' },
      { bg: '#FDD835', glyph: 'tileNotes', label: S.notes }
    ].map(function (a) {
      var ic = a.rocoto
        ? '<span class="ic rocoto" data-app="rocoto"><img src="/peru/original-brand/face-open.svg" alt="" width="40" height="40"></span>'
        : '<span class="ic" style="background:' + a.bg + '">' + G[a.glyph] + '</span>';
      return '<span class="sh-app"' + (a.rocoto ? ' data-app="rocoto"' : '') + '>' + ic +
        '<span class="lb">' + esc(a.label) + '</span></span>';
    }).join('');
    var acts = [[S.copy, 'copy'], [S.album, 'image'], [S.save, 'folder'], [S.print, 'printer']].map(function (a) {
      return '<div class="sh-act"><span>' + esc(a[0]) + '</span>' + G[a[1]] + '</div>';
    }).join('');
    return '<div class="sh-scrim"></div><div class="sh-card">' +
      '<div class="sh-grab"></div>' +
      '<div class="sh-item"><span class="th"><img src="' + sh.src + '" alt=""></span>' +
      '<span class="tx"><span class="t">' + esc(sh.name || '') + '</span>' +
      '<span class="s">' + esc(S.photo + (sh.when ? ' · ' + sh.when : '')) + '</span></span>' +
      '<span class="x">' + G.close + '</span></div>' +
      '<div class="sh-apps">' + apps + '</div>' +
      '<div class="sh-acts">' + acts + '</div>' +
      '</div>';
  }

  /* The Rocoto app: pages that cross-fade on the clock, exactly as the browser's do. What is on
     them is the product's own screen — see `WA_PAGES.purchase` in demos/pages.js. */
  function appHTML(scene) {
    /* the home indicator is the app's own, drawn once, over whichever page is on — every
       other full-screen surface in the kit (composer, camera, lock, tabs) carries one, and an
       app with none reads as a page rather than the iOS surface it is */
    return (scene.app.pages || []).map(function (p, i) {
      return '<div class="rp ' + (p.cls || '') + '" data-rp="' + i + '">' + p.html + '</div>';
    }).join('') + '<div class="wa-home"><i></i></div>';
  }

  function tabsHTML() {
    var tabs = [
      ['tabStatus', T.tabs[0]], ['tabCalls', T.tabs[1]], ['tabComm', T.tabs[2]],
      ['tabChats', T.tabs[3]], ['tabCog', T.tabs[4]]
    ];
    return '<div class="wa-tabs">' + tabs.map(function (tb, i) {
      return '<span class="wa-tab' + (i === 3 ? ' on' : '') + '">' + G[tb[0]] +
        '<span class="lb">' + tb[1] + '</span></span>';
    }).join('') + '</div><div class="wa-home"><i></i></div>';
  }

  function listHTML(scene) {
    var L = scene.chat.list;
    return '<div class="lh"><div class="t">' + esc(T.chats) + '</div>' +
      '<div class="srch">' + G.search + '<span>' + esc(T.search) + '</span></div></div>' +
      '<div class="wa-lrows">' + L.rows.map(function (r, i) {
        return '<div class="wa-lrow" data-r="' + i + '">' + avatarHTML(r.avatar) +
          '<span class="c"><span class="r1"><span class="nm">' + esc(r.name) + '</span><span class="tm">' + esc(r.time) + '</span></span>' +
          '<span class="r2"><span class="pv">' + esc(r.preview) + '</span>' +
          '<span class="bd"' + (r.badge ? '' : ' style="display:none"') + '>' + esc(r.badge || '') +
          '</span></span></span></div><div class="sep"></div>';
      }).join('') + '</div>' + tabsHTML();
  }

  /* THE LOCK SCREEN. Our own wallpaper, the clock, the date, the two buttons — and whatever
     arrives on it. A phone that is asleep is where a customer's message actually finds you. */
  function lockHTML(scene) {
    var k = scene.lock;
    return '<img class="lk-wall" src="' + k.wall + '" alt="" width="390" height="844">' +
      '<span class="lk-scrim"></span>' +
      '<div class="wa-lock-status">' + statusHTML(scene) + '</div>' +
      '<div class="lk-top"><span class="lk-pad">' + G.lock + '</span>' +
      '<span class="lk-date">' + esc(k.date) + '</span>' +
      '<span class="lk-time">' + esc(k.time || scene.clock || '') + '</span></div>' +
      '<div class="lk-foot"><span class="lk-b">' + G.torch + '</span>' +
      '<span class="lk-b">' + G.camera + '</span></div>' +
      '<div class="wa-home"><i></i></div>';
  }

  /* ------------------------------------------------------------ the demo */

  /* THE TICKS, measured on the reference's live demos at 16 ms (payment: confirm 100, tick1 160,
     tick2 280, read 400): one tick 60 ms after the bubble leaves, two at 180. A scene says WHEN it
     is read; the rest is the phone's own cadence. */
  function timeTicks(items) {
    (items || []).forEach(function (it) {
      if (!it.ticks || it.ticks.length < 2) return;
      var base = it.at || 0;
      it.ticks.forEach(function (tk) {
        if (tk.state === 'pending') tk.at = base;
        else if (tk.state === 'sent') tk.at = base + 60;
        else if (tk.state === 'dd') tk.at = base + 180;
      });
    });
  }

  /* WHERE A RUN STARTS. `first` is the run's SPACING — the wider gap above the first message of a
     stretch from one side. The TAIL is a separate thing and belongs to the run's LAST message, so
     it is written per frame by `seek` (see `runTails`), because which message is last changes
     every time one arrives. */
  function tails(items, prevDir) {
    (items || []).forEach(function (it) {
      if (it.kind === 'date' || it.kind === 'e2e' || it.kind === 'chip') { prevDir = null; return; }
      if (it.kind === 'typing') { it.first = true; return; }
      it.first = it.dir !== prevDir;
      prevDir = it.dir;
    });
    return prevDir;
  }

  function isMid(it) { return it.kind === 'date' || it.kind === 'e2e' || it.kind === 'chip'; }

  /* WHO TYPES.
     The phone's owner is never shown typing: their messages — and the ones Rocoto sends for them —
     simply send. Everything that ARRIVES is announced first, the way the app announces it: the
     three dots in the thread and «typing…» under the name, for about as long as that message
     would take to write. A voice note is announced by «recording audio…» instead, because nobody
     types a voice note. Both are woven in here rather than written into each demo, so the rule
     holds for every exchange of every cycle, for ever. */
  var TYPE_MIN = 900, TYPE_MAX = 2200, TYPE_GAP = 240;

  function typingMs(text) {
    return clamp(700 + 32 * String(text || '').length, TYPE_MIN, TYPE_MAX);
  }

  /* `items` is a whole stretch of the thread with absolute times. Returns the stretch with the
     indicator rows woven in, and pushes the presence this weave implies onto `pres`. */
  function weaveTyping(items, pres) {
    var out = [], prev = -1e9;
    (items || []).forEach(function (it) {
      var lands = it.at || 0, dur;
      var speaks = it.dir === 'in' && lands > 0 && it.typing !== false;
      if (speaks && it.kind === 'voice') {
        dur = clamp((it.secs || 5) * 380, 1100, 2400);
        dur = Math.min(dur, lands - prev - TYPE_GAP);
        if (dur >= 500 && pres) {
          pres.push({ at: lands - dur, text: T.recording, w: lands }, { at: lands, text: T.online, w: lands });
        }
      } else if (speaks && (it.kind == null || it.kind === 'text' || it.kind === 'photo' ||
                            it.kind === 'card' || it.kind === 'qr')) {
        /* a scene may set the length itself, for a message that lands while the browser covers
           the thread and the indicator would be writing behind it */
        dur = Math.min(typeof it.typing === 'number' ? it.typing : typingMs(it.text), lands - prev - TYPE_GAP);
        if (dur >= 460) {
          out.push({ at: lands - dur, until: lands, dir: 'in', kind: 'typing' });
          /* the message takes the indicator's place in one frame, so it opens opaque */
          it.fromTyping = true;
          if (pres) pres.push({ at: lands - dur, text: T.typing, w: lands }, { at: lands, text: T.online, w: lands });
        }
      }
      out.push(it);
      prev = it.until != null ? Math.max(lands, it.until) : lands;
    });
    return out;
  }

  /* A presence list is read with `last()`, so it is kept in the clock's own order — and the weave
     outranks the scene: an «online» a demo wrote for the moment its chat opens never lands inside
     the stretch where the other side is writing. */
  function orderPresence(list) {
    var win = [];
    (list || []).forEach(function (e) { if (e.w && e.at < e.w) win.push([e.at, e.w]); });
    return (list || []).filter(function (e) {
      if (e.w) return true;
      for (var i = 0; i < win.length; i++) if (e.at > win[i][0] && e.at < win[i][1]) return false;
      return true;
    }).sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
  }

  function Demo(scene) {
    this.s = scene;
    this.t = 0;
    this.playing = false;
    this.raf = 0;
    this.holdUntil = 0;
    this.holdLeft = 0;
    this.chapter = -1;
    this.mode = 'auto';
    this.cycle = 0;
    this.cycleLast = scene.duration;
    this.relabels = [];
    this.build();
    /* what a restart goes back to: the thread as it was mounted */
    this.seed = {
      items: scene.items ? scene.items.slice() : [],
      rows: this.rows.slice(), bans: this.bans.slice(), nextI: this.nextI,
      presence: scene.chat && scene.chat.presence ? scene.chat.presence.slice() : null,
      clockAt: scene.clockAt ? scene.clockAt.slice() : null,
      taps: scene.taps ? scene.taps.slice() : null,
      picks: scene.picks ? scene.picks.slice() : null,
      composer: scene.composer && scene.composer.type,
      recording: scene.recording, sheet: scene.sheet, duration: scene.duration,
      camera: scene.camera, share: scene.share, app: scene.app,
      head: this.chatEl ? this.chatEl.querySelector('.wa-head').innerHTML : null,
      chat: scene.chat,
      lockAt: scene.lockAt ? scene.lockAt.slice() : null,
      veil: scene.veil ? scene.veil.slice() : null,
      flash: scene.flash ? scene.flash.slice() : null,
      lkNow: this.lkNow ? { date: this.lkNow.date, time: this.lkNow.time } : null,
      todayChip: this.todayChip, todayText: this.todayChip ? this.todayChip.textContent : null
    };
  }

  Demo.prototype.build = function () {
    var scene = this.s, self = this;
    var root = el('div', 'wa');
    this.root = root;
    if (scene.island === false) root.classList.add('wa-no-island');
    /* a phone that leaves WhatsApp for another app carries the switch's own motion */
    if (scene.camera || scene.app) root.classList.add('wa-switch');
    root.appendChild(el('div', 'wa-status', statusHTML(scene)));
    root.insertAdjacentHTML('beforeend', '<span class="wa-island"></span>');

    var app = el('div', 'wa-app');
    var chat = el('div', 'wa-chat');
    chat.appendChild(el('header', 'wa-head', headerHTML(scene)));
    var body = el('div', 'wa-body');
    var feed = el('div', 'wa-feed');
    body.appendChild(feed);
    chat.appendChild(body);
    chat.appendChild(el('div', 'wa-foot', composerHTML(scene)));
    app.appendChild(chat);

    /* the indicator is woven in before anything is built, so the thread the player holds is the
       thread as it will be seen: every arrival announced, nothing announced for the owner */
    var pres0 = (scene.chat && scene.chat.presence) ? scene.chat.presence.slice() : null;
    scene.items = weaveTyping(scene.items, pres0);
    if (scene.chat && pres0) scene.chat.presence = orderPresence(pres0);
    timeTicks(scene.items);
    tails(scene.items, null);

    this.nextI = 0;
    this.rows = (scene.items || []).map(function (it) {
      var row = buildRow(it, self.nextI++);
      feed.appendChild(row);
      return row;
    });

    /* The chip that says today, held by its node rather than by its word, so the day can turn
       over on it later in whatever language the page is painting. */
    this.todayChip = null;
    for (var di = (scene.items || []).length - 1; di >= 0; di--) {
      if (scene.items[di].kind !== 'date') continue;
      this.todayChip = this.rows[di].querySelector('.wa-chip');
      break;
    }

    if (scene.chat && scene.chat.list) {
      this.list = el('div', 'wa-list', listHTML(scene));
      app.appendChild(this.list);
      /* a row of the list can take the message that is arriving, the way iOS moves it the moment
         the banner lands */
      this.lrows = [].slice.call(this.list.querySelectorAll('.wa-lrow'));
      this.lseed = (scene.chat.list.rows || []).map(function (r) {
        return { preview: r.preview, time: r.time, badge: r.badge || '' };
      });
    }
    root.appendChild(app);
    if (scene.lock) {
      this.lock = el('div', 'wa-lock', lockHTML(scene));
      root.appendChild(this.lock);
      this.lkDate = this.lock.querySelector('.lk-date');
      this.lkTime = this.lock.querySelector('.lk-time');
      this.lkNow = { date: scene.lock.date || '', time: scene.lock.time || scene.clock || '' };
      /* the lock is a STATE of the clock, not a one-way door: a phone locks again, and again */
      if (!scene.lockAt) scene.lockAt = [{ at: 0, up: true }, { at: scene.lock.until || 0, up: false }];
    }
    /* the in-chat browser covers the whole screen, status bar included */
    if (scene.sheet) { this.sheet = el('div', 'wa-sheet', sheetHTML(scene)); root.appendChild(this.sheet); }

    /* and so do the three surfaces that are not WhatsApp at all: the camera, the share sheet
       it rises into, and Rocoto's own app. They stand in this order because that is the order
       they cover each other in — the sheet over the camera, the app arriving under the sheet
       as it falls. */
    if (scene.camera) { this.cam = el('div', 'wa-camera', cameraHTML(scene)); root.appendChild(this.cam); }
    if (scene.app) { this.rapp = el('div', 'wa-rapp', appHTML(scene)); root.appendChild(this.rapp); }
    if (scene.share) { this.shr = el('div', 'wa-share', shareHTML(scene)); root.appendChild(this.shr); }

    /* the notification banners. iOS draws a message from a person as that person's picture with
       the messenger's mark badged on it, so that is what a banner carries here. */
    var list = scene.banners || (scene.banner ? [scene.banner] : []);
    this.bans = list.map(function (b) { return self.addBanner(b); });

    this.dot = el('div', 'wa-dot');
    root.appendChild(this.dot);

    /* THE SCREEN ITSELF. A phone that goes to sleep darkens and lights again; the veil is that
       screen, and its opacity is read straight off the clock, so a scrub answers for it too. */
    if (scene.veil) { this.veil = el('div', 'wa-veil'); root.appendChild(this.veil); }

    /* THE SHUTTER'S FLASH. The camera used to own it, because the camera used to be iOS's. An
       app with a camera of its own needs the same white beat, so it is a state of the clock at
       the root of the phone: `flash: [{ at, dur }]`, and a scrub answers for it. */
    if (scene.flash) { this.flashEl = el('div', 'wa-flash'); root.appendChild(this.flashEl); }

    if (scene.composer && scene.composer.type) {
      var ty = scene.composer.type;
      ty.plan = typePlan(ty.text, ty.from, ty.to);
    }

    this.root = root;
    this.feed = feed;
    this.chatEl = chat;
    this.pres = root.querySelector('.wa-pres');
    this.ftext = root.querySelector('.wa-ftext');
    this.recTm = root.querySelector('.wa-rec .tm');
    this.liveWave = root.querySelector('.wa-rec .lwi');
    this.pages = this.sheet ? [].slice.call(this.sheet.querySelectorAll('.wa-pg')) : [];
    this.pgHtml = (scene.sheet && scene.sheet.pages || []).map(function (pg) { return pg.html; });
    this.prog = this.sheet ? this.sheet.querySelector('.wa-prog') : null;
    this.flash = this.cam ? this.cam.querySelector('.ca-flash') : null;
    this.rpages = this.rapp ? [].slice.call(this.rapp.querySelectorAll('.rp')) : [];
    this.rpHtml = (scene.app && scene.app.pages || []).map(function (pg) { return pg.html; });

    /* A tap may name its row by KEY rather than by index, the way an episode's taps do, so a
       thread that grows a row — an indicator woven in before a message — never sends a touch to
       the wrong bubble. */
    var keyed = {};
    (scene.items || []).forEach(function (it, i) { if (it.key) keyed[it.key] = self.rows[i]; });
    function resolveTap(t) {
      if (t.key && keyed[t.key]) {
        var pre = '.wa-row[data-i="' + keyed[t.key].dataset.i + '"]';
        t.sel = t.find ? pre + ' ' + t.find : pre;
        if (t.press === true) t.press = t.sel;
      }
      return t;
    }
    scene.taps = (scene.taps || []).map(resolveTap);
    scene.picks = (scene.picks || []).map(resolveTap);

    hookImages(root);
  };

  /* a picture that has yet to land shows a neutral block, and swaps itself in when it does;
     bank logos and marks fall svg -> webp -> png -> the name */
  function hookImages(scope) {
    [].slice.call(scope.querySelectorAll('.wa-photo img')).forEach(function (img) {
      var mark = function () { img.parentNode.classList.add('is-missing'); };
      img.addEventListener('error', mark);
      if (img.complete && img.naturalWidth === 0) mark();
    });
    [].slice.call(scope.querySelectorAll('.wa-bank img, .wa-mark img')).forEach(function (img) {
      var step = function () {
        var src = img.getAttribute('src');
        if (/\.svg$/.test(src)) img.setAttribute('src', src.replace(/\.svg$/, '.webp'));
        else if (/\.webp$/.test(src)) img.setAttribute('src', src.replace(/\.webp$/, '.png'));
        else img.parentNode.classList.add('is-missing');
      };
      img.addEventListener('error', step);
      if (img.complete && img.naturalWidth === 0) step();
    });
  }

  /* The parent keeps its complete poster until every image can be painted. Bank and payment
     marks may use the text fallback installed by hookImages; a missing invoice cannot. */
  function imageReady(img) {
    return new Promise(function (resolve) {
      var source = img.getAttribute('src');
      var done = false;
      function fallback() {
        var tile = img.closest('.wa-bank, .wa-mark');
        var label = tile && tile.querySelector('.fb');
        return !!(tile && tile.classList.contains('is-missing') && label && label.textContent.trim());
      }
      function finish(ok) {
        if (done) return;
        done = true;
        img.removeEventListener('load', loaded);
        img.removeEventListener('error', failed);
        resolve(ok);
      }
      function loaded() {
        if (!img.naturalWidth) { finish(fallback()); return; }
        if (!img.decode) { finish(true); return; }
        img.decode().then(function () { finish(true); }, function () { finish(fallback()); });
      }
      function failed() {
        /* hookImages runs first and may already have requested its next format. */
        var next = img.getAttribute('src');
        if (next !== source) { source = next; return; }
        finish(fallback());
      }
      img.addEventListener('load', loaded);
      img.addEventListener('error', failed);
      if (fallback()) finish(true);
      else if (img.complete) loaded();
    });
  }

  Demo.prototype.addBanner = function (b) {
    var ic = b.icon || {};
    var inner = ic.src
      ? '<img src="' + ic.src + '" alt=""' + (ic.pad ? ' style="padding:' + ic.pad + 'px;object-fit:contain"' : '') + '>'
      : (ic.glyph ? G[ic.glyph] : G.person);
    var node = el('div', 'wa-banner' + (ic.round ? ' round' : '') + (b.pos === 'lock' ? ' lock' : ''),
      '<span class="ic' + (ic.brand === 'rocoto' ? ' rocoto' : '') + '" style="background:' + (ic.bg || '#C01B2C') + '">' + inner +
      (b.badge === false ? '' : '<span class="bdg">' + G.wa + '</span>') + '</span>' +
      '<span class="bd"><span class="tp"><span class="t">' + esc(b.title) + '</span>' +
      '<span class="w">' + esc(b.when || T.now) + '</span></span>' +
      '<span class="b">' + esc(b.body) + '</span></span>');
    (this.root || this.rootEl).appendChild(node);
    return { el: node, d: b };
  };

  /* ------------------------------------------------------------- the cycle
     A row demo never resets. On reaching the last beat of cycle k the player APPENDS cycle k+1's
     beats to the same thread — new rows land in the future, so nothing on the screen is touched
     and there is no seam of any kind. Rows that have scrolled far above the screen are then
     dropped, so the DOM stays the size of one conversation.
     The rest between two exchanges is the reference's own measured restart delay: last beat + 4000. */

  function shiftItem(it, off) {
    var c = {}, k;
    for (k in it) if (Object.prototype.hasOwnProperty.call(it, k)) c[k] = it[k];
    c.at = (it.at || 0) + off;
    if (it.until != null) c.until = it.until + off;
    if (it.play) c.play = { from: it.play.from + off, to: it.play.to + off };
    if (it.ticks) c.ticks = it.ticks.map(function (t) { return { at: (t.at || 0) + off, state: t.state }; });
    return c;
  }
  function shiftList(list, off) {
    return (list || []).map(function (o) {
      var c = {}, k;
      for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) c[k] = o[k];
      c.at = (o.at || 0) + off;
      if (o.until != null) c.until = o.until + off;
      return c;
    });
  }
  /* keep everything from `cut` onward, plus the one entry that was standing at `cut` */
  function prunePast(list, cut) {
    if (!list || !list.length) return list;
    var i = 0;
    while (i < list.length && list[i].at < cut) i++;
    return list.slice(Math.max(0, i - 1));
  }

  /* A page whose markup has not changed is LEFT ALONE. The bank list is the same seven rows on
     every exchange: rebuilding it would throw away seven decoded logos, their nodes and their
     handlers on every cycle, for ever, and that rubbish is what a cheap phone pays for. */
  Demo.prototype.setSheet = function (sh) {
    var s = this.s, self = this;
    s.sheet = sh;
    if (!this.sheet) return;
    this.q = {};
    this.sheet.querySelector('.wa-sheet-t').textContent = sh.title || '';
    this.sheet.querySelector('.wa-sheet-h span').textContent = sh.host || '';
    var doc = this.sheet.querySelector('.wa-sheet-doc');
    var was = this.pgHtml || [], pages = sh.pages || [];
    if (this.pages.length !== pages.length) {
      doc.innerHTML = pages.map(function (pg, i) {
        return '<div class="wa-pg ' + (pg.cls || '') + '" data-pg="' + i + '">' + pg.html + '</div>';
      }).join('');
      this.pages = [].slice.call(doc.querySelectorAll('.wa-pg'));
      hookImages(doc);
    } else {
      pages.forEach(function (pg, i) {
        if (was[i] === pg.html) return;
        var node = self.pages[i];
        node.className = 'wa-pg ' + (pg.cls || '');
        node.innerHTML = pg.html;
        hookImages(node);
      });
    }
    this.pgHtml = pages.map(function (pg) { return pg.html; });
  };

  /* a surface's own moments, moved onto the next exchange's clock */
  function shiftTimes(o, off, keys) {
    var c = {}, k;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) c[k] = o[k];
    keys.forEach(function (key) { if (c[key] != null) c[key] = c[key] + off; });
    return c;
  }

  /* THE CAMERA AND THE SHARE SHEET ON THE NEXT DELIVERY. The same picture, the same chrome: what
     changes is the clock and the stamp under it, so the nodes stand and their words are written.
     Rebuilding them every cycle would throw away a decoded photograph, for ever. */
  Demo.prototype.setCamera = function (c) {
    var was = this.s.camera || {};
    this.s.camera = c;
    if (!this.cam) return;
    this.q = {};
    if (c.src && c.src !== was.src) {
      [].slice.call(this.cam.querySelectorAll('img')).forEach(function (im) { im.setAttribute('src', c.src); });
    }
    var st = this.cam.querySelector('.ca-rtop');
    if (st && st.textContent !== (c.stamp || '')) st.textContent = c.stamp || '';
  };

  Demo.prototype.setShare = function (sh) {
    var was = this.s.share || {};
    this.s.share = sh;
    if (!this.shr) return;
    this.q = {};
    var im = this.shr.querySelector('.sh-item .th img');
    if (im && sh.src && sh.src !== was.src) im.setAttribute('src', sh.src);
    var nm = this.shr.querySelector('.sh-item .t');
    if (nm && nm.textContent !== (sh.name || '')) nm.textContent = sh.name || '';
    var sub = this.shr.querySelector('.sh-item .s');
    var want = T.share.photo + (sh.when ? ' · ' + sh.when : '');
    if (sub && sub.textContent !== want) sub.textContent = want;
  };

  /* THE APP'S PAGES, on the same rule as the browser's: a page whose markup has not changed is
     left alone, so the purchase that repeats week after week keeps its nodes. */
  Demo.prototype.setApp = function (a) {
    var self = this;
    this.s.app = a;
    if (!this.rapp) return;
    this.q = {};
    var was = this.rpHtml || [], pages = a.pages || [];
    if (this.rpages.length !== pages.length) {
      this.rapp.innerHTML = pages.map(function (pg, i) {
        return '<div class="rp ' + (pg.cls || '') + '" data-rp="' + i + '">' + pg.html + '</div>';
      }).join('');
      this.rpages = [].slice.call(this.rapp.querySelectorAll('.rp'));
      hookImages(this.rapp);
    } else {
      pages.forEach(function (pg, i) {
        if (was[i] === pg.html) return;
        var node = self.rpages[i];
        node.className = 'rp ' + (pg.cls || '');
        node.innerHTML = pg.html;
        hookImages(node);
      });
    }
    this.rpHtml = pages.map(function (pg) { return pg.html; });
  };

  /* ANOTHER CUSTOMER'S CHAT. The thread is swapped whole — the header, the picture, the history —
     while the screen is dark, so the phone that lights up again is simply on a different chat, the
     way it is when the next notification wakes you. */
  Demo.prototype.swapThread = function (th, off) {
    var s = this.s, self = this;
    this.q = {};
    this.root.classList.add('is-noanim');
    this.swapped = true;
    this.rows.forEach(function (r) { if (r.parentNode) r.parentNode.removeChild(r); });
    this.rows = []; this.hs = []; s.items = [];
    this.todayChip = null;                   /* the chip that said today went with the old thread */
    s.chat = th.chat || s.chat;
    var head = this.chatEl.querySelector('.wa-head');
    head.innerHTML = headerHTML({ chat: s.chat });
    this.pres = head.querySelector('.wa-pres');
    /* the history is already old when the screen lights: it lands a second before the swap, so
       nothing grows, nothing eases and the column is standing still */
    var hist = (th.history || []).map(function (it) { return shiftItem(it, off - 1200); });
    timeTicks(hist); tails(hist, null);
    hist.forEach(function (it) {
      var row = buildRow(it, self.nextI++);
      self.feed.appendChild(row);
      s.items.push(it); self.rows.push(row);
    });
    hookImages(this.feed);
    var root = this.root;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.remove('is-noanim'); });
    });
  };

  Demo.prototype.rebase = function () {
    var s = this.s, cy = s.cycle, self = this;
    if (!cy || typeof cy.next !== 'function') return false;
    var ep = cy.next(this.cycle + 1);
    if (!ep) return false;
    this.cycle++;
    var off = this.cycleLast + (cy.rest == null ? 4000 : cy.rest);

    if (ep.thread) this.swapThread(ep.thread, off);

    /* the lock screen's own day and hour, turned over behind the dark screen */
    if (ep.lock && this.lock) {
      ['date', 'time'].forEach(function (k) {
        if (ep.lock[k] == null) return;
        var node = k === 'date' ? self.lkDate : self.lkTime;
        self.relabels = self.relabels.filter(function (r) { return r.node !== node; });
        self.relabels.push({ at: off, node: node, was: self.lkNow[k], now: ep.lock[k] });
        self.lkNow[k] = ep.lock[k];
      });
    }

    /* The day turns WITH the new chip, never before it: until the next exchange lands, today is
       still today. The chip that says so was held at build time, so this reads the same in every
       language, and it is spent once — every day after this one arrives already named. The rename
       is a state of the clock like any other, so a scrub answers for it. */
    if (ep.date && cy.was && !ep.thread && this.todayChip) {
      this.relabels.push({ at: off, node: this.todayChip, was: this.todayChip.textContent, now: cy.was });
      this.todayChip = null;
    }

    var fresh = (ep.date ? [{ at: 0, kind: 'date', text: ep.date }] : []).concat(ep.items || []);
    fresh = fresh.map(function (it) { return shiftItem(it, off); });
    var pres = shiftList(ep.presence, off);
    fresh = weaveTyping(fresh, pres);
    timeTicks(fresh);
    tails(fresh, null);

    var base = s.items.length;
    this.q = {};
    fresh.forEach(function (it) {
      var row = buildRow(it, self.nextI++);
      self.feed.appendChild(row);
      s.items.push(it);
      self.rows.push(row);
    });
    this.measure();

    /* a tap may name a row of this episode by its key rather than a selector */
    var keyed = {};
    fresh.forEach(function (it, i) { if (it.key) keyed[it.key] = self.rows[base + i]; });
    function resolve(t) {
      var c = {}, k;
      for (k in t) if (Object.prototype.hasOwnProperty.call(t, k)) c[k] = t[k];
      c.at = (t.at || 0) + off;
      if (t.key && keyed[t.key]) {
        var pre = '.wa-row[data-i="' + keyed[t.key].dataset.i + '"]';
        c.sel = t.find ? pre + ' ' + t.find : pre;
        if (t.press) c.press = c.sel;
      }
      return c;
    }
    s.taps = prunePast(s.taps || [], this.cycleLast).concat((ep.taps || []).map(resolve));
    s.picks = prunePast(s.picks || [], this.cycleLast).concat((ep.picks || []).map(resolve));
    if (s.chat) s.chat.presence = orderPresence(prunePast(s.chat.presence || [], this.cycleLast).concat(pres));
    s.clockAt = prunePast(s.clockAt || [], this.cycleLast).concat(shiftList(ep.clockAt, off));
    if (s.lockAt) s.lockAt = prunePast(s.lockAt, this.cycleLast).concat(shiftList(ep.lockAt, off));
    if (s.veil) s.veil = prunePast(s.veil, this.cycleLast).concat(shiftList(ep.veil, off));
    if (s.flash) s.flash = prunePast(s.flash, this.cycleLast).concat(shiftList(ep.flash, off));

    if (ep.composer && ep.composer.type) {
      var ty = ep.composer.type;
      s.composer = s.composer || {};
      s.composer.type = { from: ty.from + off, to: ty.to + off, sendAt: (ty.sendAt == null ? ty.to : ty.sendAt) + off, text: ty.text };
      s.composer.type.plan = typePlan(ty.text, s.composer.type.from, s.composer.type.to);
    } else if (s.composer) { s.composer.type = null; }
    s.recording = ep.recording ? { from: ep.recording.from + off, to: ep.recording.to + off, lock: ep.recording.lock } : null;
    /* a surface that never comes down says so with a null, and a null must survive the shift */
    function later(v) { return v == null ? null : v + off; }
    if (ep.sheet) this.setSheet({ at: ep.sheet.at + off, down: later(ep.sheet.down), title: ep.sheet.title, host: ep.sheet.host, pages: shiftList(ep.sheet.pages, off) });
    if (ep.camera) this.setCamera(shiftTimes(ep.camera, off, ['at', 'shot', 'review', 'down']));
    if (ep.share) this.setShare(shiftTimes(ep.share, off, ['at', 'down']));
    if (ep.app) this.setApp({ at: ep.app.at + off, down: later(ep.app.down), pages: shiftList(ep.app.pages, off) });

    /* banners: the new ones are added, the spent ones taken out of the DOM */
    this.bans = this.bans.filter(function (b) {
      if ((b.d.until || b.d.at) >= self.cycleLast - 1) return true;
      if (b.el.parentNode) b.el.parentNode.removeChild(b.el);
      return false;
    }).concat(shiftList(ep.banners, off).map(function (b) { return self.addBanner(b); }));

    this.cycleLast = off + ep.last;
    s.duration = this.cycleLast;
    this.prune();
    return true;
  };

  /* what has scrolled far above the screen is dropped: the column is bottom-anchored, so a row
     whose bottom sits above the body has no pixel on the screen and none in its future either. */
  Demo.prototype.prune = function () {
    var s = this.s, keep = 1700, total = 0, i, cut = 0;
    for (i = this.hs.length - 1; i >= 0; i--) {
      total += this.hs[i] || 0;
      if (total > keep) { cut = i; break; }
    }
    if (cut <= 0) return;
    for (i = 0; i < cut; i++) if (this.rows[i].parentNode) this.rows[i].parentNode.removeChild(this.rows[i]);
    this.rows = this.rows.slice(cut);
    this.hs = this.hs.slice(cut);
    s.items = s.items.slice(cut);
  };

  /* every row opens by growing to its own measured height */
  Demo.prototype.measure = function () {
    this.root.classList.add('is-measuring');
    var hs = this.rows.map(function (row) { return row.querySelector('.wa-fade').offsetHeight; });
    this.root.classList.remove('is-measuring');
    this.rows.forEach(function (row, i) { row.style.setProperty('--h', hs[i] + 'px'); });
    this.hs = hs;
  };

  /* A scene names its targets by selector, and `seek` runs sixty times a second: the node is
     looked up once and held until the thread that carries it is rebuilt. */
  Demo.prototype.node = function (sel) {
    var c = this.q || (this.q = {});
    var n = c[sel];
    if (n && n.isConnected) return n;
    n = this.root.querySelector(sel);
    c[sel] = n;
    return n;
  };

  /* ------------------------------------------------------------ rendering */

  Demo.prototype.seek = function (ms) {
    var s = this.s, self = this, t = this.t = clamp(ms, 0, s.duration);

    if (s.clockAt) {
      var ck = last(s.clockAt, t);
      if (ck && this.clockTxt !== ck.text) {
        this.clockTxt = ck.text;
        [].slice.call(this.root.querySelectorAll('.wa-clock')).forEach(function (n) { n.textContent = ck.text; });
      }
    }

    if (this.pres) {
      var p = last(s.chat && s.chat.presence, t);
      var txt = p ? p.text : '';
      if (this.pres.textContent !== txt) this.pres.textContent = txt;
    }

    /* the lock screen is up or it has lifted; the chat behind it is standing there either way */
    if (this.lock) {
      var lw = last(s.lockAt, t);
      this.lock.classList.toggle('gone', !(lw && lw.up));
    }

    /* the screen darkening and lighting again: ramp by ramp, each one from wherever the one
       before it left the screen */
    if (this.veil) {
      var vv = 0, vi, vr, vd;
      for (vi = 0; vi < s.veil.length; vi++) {
        vr = s.veil[vi];
        if (t <= vr.at) break;
        vd = vr.dur || 320;
        if (t >= vr.at + vd) { vv = vr.to; continue; }
        vv = vv + (vr.to - vv) * ((t - vr.at) / vd);
        break;
      }
      vv = Math.round(vv * 1000) / 1000;
      if (this.veilV !== vv) { this.veil.style.opacity = vv; this.veilV = vv; }
    }

    if (this.flashEl) {
      var fv = 0, fi, fr, fd;
      for (fi = 0; fi < s.flash.length; fi++) {
        fr = s.flash[fi]; fd = fr.dur || 260;
        if (t >= fr.at && t < fr.at + fd) { fv = Math.round((1 - (t - fr.at) / fd) * 100) / 100; break; }
      }
      if (this.flashFV !== fv) { this.flashEl.style.opacity = fv; this.flashFV = fv; }
    }

    if (this.list && s.chat.list.updates) {
      s.chat.list.updates.forEach(function (u) {
        var row = self.lrows[u.row];
        if (!row) return;
        var on = t >= u.at, seed = self.lseed[u.row];
        if (row.dataset.up === String(on)) return;
        row.dataset.up = String(on);
        row.querySelector('.pv').textContent = on && u.preview != null ? u.preview : seed.preview;
        row.querySelector('.tm').textContent = on && u.time != null ? u.time : seed.time;
        var bd = row.querySelector('.bd'), want = on && u.badge != null ? u.badge : seed.badge;
        if (bd) { bd.textContent = want; bd.style.display = want ? '' : 'none'; }
        row.classList.toggle('fresh', on);
      });
    }

    if (this.list) {
      var open = t >= (s.chat.list.until || 0);
      this.list.classList.toggle('gone', open);
      this.chatEl.classList.toggle('pushed', !open);
      this.root.classList.toggle('list-up', !open);
    }

    (s.items || []).forEach(function (it, i) {
      var row = self.rows[i], on = t >= it.at && (it.until == null || t < it.until);
      row.classList.toggle('on', on);

      var tk = row.querySelector('.wa-tick');
      if (tk) {
        var st = last(it.ticks, t), state = st ? st.state : 'pending';
        if (tk.dataset.st !== state) {
          tk.innerHTML = state === 'sent' ? G.tickOne : state === 'pending' ? G.tickClock : G.tickTwo;
          tk.dataset.st = state;
        }
        tk.classList.toggle('blue', state === 'read');
        tk.classList.toggle('clock', state === 'pending');
      }

      if (it.kind === 'voice') {
        var v = row.querySelector('.wa-voice');
        var pl = it.play || { from: 1e9, to: 1e9 };
        var pr = clamp((t - pl.from) / Math.max(1, pl.to - pl.from), 0, 1);
        var bars = row.querySelectorAll('.wa-bar');
        var k = Math.round(pr * bars.length);
        for (var j = 0; j < bars.length; j++) bars[j].classList.toggle('done', j < k);
        var dot = row.querySelector('.wa-head-dot');
        /* CSS places the head off this number, inset by its own width at both ends, so it parks
           ON the last bar rather than stepping out of the waveform and onto the avatar */
        if (dot) { var dl = pr.toFixed(4); if (dot.__p !== dl) { dot.style.setProperty('--p', dl); dot.__p = dl; } }
        v.classList.toggle('heard', t >= pl.to);
        var secs = it.secs || 6;
        var shown = (pr > 0 && pr < 1) ? Math.max(1, Math.round(pr * secs)) : secs;
        var d = row.querySelector('.wa-vdur');
        var lbl = '0:' + (shown < 10 ? '0' : '') + shown;
        if (d.textContent !== lbl) d.textContent = lbl;
        var pb = row.querySelector('.wa-play'), playing = pr > 0 && pr < 1;
        if (pb.dataset.p !== String(playing)) { pb.innerHTML = playing ? G.pause : G.play; pb.dataset.p = String(playing); }
      }
    });

    /* THE TAIL, frame by frame. On iOS the beak hangs off the LAST message of a run, so a bubble
       wears it only while nothing newer from its own side stands under it — which is what makes
       the tail walk down the thread as an exchange arrives, and what gives the three dots a tail
       while they are the newest thing on the screen. */
    var nextDir = null;
    for (var ti = (s.items || []).length - 1; ti >= 0; ti--) {
      var tit = s.items[ti], trow = this.rows[ti];
      if (!trow || !trow.classList.contains('on')) continue;
      if (isMid(tit)) { nextDir = null; continue; }
      trow.classList.toggle('tail', nextDir !== tit.dir);
      nextDir = tit.dir;
    }

    /* the message types itself: the characters shown are a function of the clock, read off the
       plan, so a scrub backwards unwrites them in the same order */
    if (s.composer && s.composer.type) {
      var ty = s.composer.type;
      var sent = ty.sendAt != null ? t >= ty.sendAt : t >= ty.to;
      var n = 0;
      if (t >= ty.from && !sent) {
        var el3 = t - ty.from, lo = 0, hi = ty.plan.length;
        while (lo < hi) { var mid = (lo + hi) >> 1; if (ty.plan[mid] <= el3) lo = mid + 1; else hi = mid; }
        n = lo;
      }
      var has = n > 0;
      this.root.classList.toggle('has-text', has);
      var caret = has && (t < ty.to || Math.floor((t - ty.to) / 530) % 2 === 0);
      var key = n + (caret ? 'c' : '');
      if (this.ftext.dataset.k !== key) {
        this.ftext.innerHTML = has
          ? esc(ty.text.slice(0, n)) + (caret ? '<span class="wa-caret"></span>' : '')
          : esc(s.composer.placeholder || T.placeholder);
        this.ftext.classList.toggle('ph', !has);
        this.ftext.dataset.k = key;
      }
    }

    if (s.recording) {
      var r = s.recording, rec = t >= r.from && t < r.to;
      this.root.classList.toggle('is-rec', rec);
      if (this.recTm) {
        var e = rec ? Math.floor((t - r.from) / 1000) : 0;
        var lb = '0:' + (e < 10 ? '0' : '') + e;
        if (this.recTm.textContent !== lb) this.recTm.textContent = lb;
      }
      var locked = rec && t >= r.from + (r.lock == null ? 900 : r.lock);
      this.root.classList.toggle('is-locked', !!locked);
      if (this.liveWave) {
        var el2 = rec ? (t - r.from) / 1000 : 0;
        this.liveWave.style.transform = 'translateX(' + (-el2 * 13 * 5.4) + 'px)';
      }
    }

    if (this.sheet) {
      var sh = s.sheet;
      var up = t >= sh.at && (sh.down == null || t < sh.down);
      this.sheet.classList.toggle('up', up);
      /* A SHEET ARRIVES WITH ITS PAGE PAINTED. While the sheet is travelling — up or down — its
         page is held to whatever the clock says it is, with the cross-fade switched off, so the
         card that slides into view is whole and the one that slides away leaves whole. The fade
         belongs to a page CHANGE inside a sheet that is already parked. */
      this.sheet.classList.toggle('sliding',
        (t >= sh.at && t < sh.at + SHEET_MS) ||
        (sh.down != null && t >= sh.down && t < sh.down + SHEET_MS));
      var lp = clamp((t - sh.at - 140) / 960, 0, 1);
      if (this.prog) {
        var pw = (lp * 100).toFixed(2) + '%', po = (up && lp < 1) ? '1' : '0';
        if (this.prog.style.width !== pw) this.prog.style.width = pw;
        if (this.prog.style.opacity !== po) this.prog.style.opacity = po;
      }
      var cur = -1;
      (sh.pages || []).forEach(function (pg, i) { if (t >= pg.at) cur = i; });
      this.pages.forEach(function (pg, i) { pg.classList.toggle('on', i === cur); });
    }

    /* THE THREE SURFACES THAT ARE NOT WHATSAPP. Each one is up or it is down, read off the clock;
       the camera carries two states inside it — the shutter has gone, the picture is being looked
       at — and the flash is an opacity the clock writes, so a scrub answers for it too. */
    var camUp = false, appUp = false;
    if (this.cam) {
      var cm = s.camera;
      camUp = t >= cm.at && (cm.down == null || t < cm.down);
      this.cam.classList.toggle('up', camUp);
      this.cam.classList.toggle('shot', cm.shot != null && t >= cm.shot);
      this.cam.classList.toggle('review', cm.review != null && t >= cm.review);
      if (this.flash) {
        var fl = 0;
        if (cm.shot != null && t >= cm.shot && t < cm.shot + 260) fl = Math.round((1 - (t - cm.shot) / 260) * 100) / 100;
        if (this.flashV !== fl) { this.flash.style.opacity = fl; this.flashV = fl; }
      }
    }
    if (this.shr) {
      var sr = s.share;
      this.shr.classList.toggle('up', t >= sr.at && (sr.down == null || t < sr.down));
    }
    if (this.rapp) {
      var ap = s.app;
      appUp = t >= ap.at && (ap.down == null || t < ap.down);
      this.rapp.classList.toggle('up', appUp);
      var rcur = -1;
      (ap.pages || []).forEach(function (pg, i) { if (t >= pg.at) rcur = i; });
      var under = rcur >= 0 ? ap.pages[rcur].under : null;
      this.rpages.forEach(function (pg, i) {
        pg.classList.toggle('on', i === rcur || i === under);
        pg.classList.toggle('arrived', i <= rcur);
        if (pg.classList.contains('confirmed')) {
          // The check belongs to the demo clock, including seeks and reverse playback.
          var age = t - ap.pages[i].at;
          var mark = clamp(age / 280, 0, 1);
          var stroke = clamp((age - 140) / 420, 0, 1);
          pg.style.setProperty('--rp-mark-progress', (1 - Math.pow(1 - mark, 3)).toFixed(3));
          pg.style.setProperty('--rp-check-progress', (1 - Math.pow(1 - stroke, 3)).toFixed(3));
        }
      });
    }
    if (this.cam || this.rapp) {
      /* the system bar belongs to whatever holds the screen, and the app you left stands back */
      this.root.classList.toggle('cam-up', camUp && !appUp);
      this.root.classList.toggle('behind', camUp || appUp);
    }

    if (this.relabels.length) this.relabels.forEach(function (r) {
      var want = t >= r.at ? r.now : r.was;
      if (r.node.textContent !== want) r.node.textContent = want;
    });

    if (this.bans) this.bans.forEach(function (b) {
      b.el.classList.toggle('on', t >= b.d.at && t < (b.d.until || s.duration));
    });

    /* THE THREAD IS PINNED TO THE COMPOSER. The newest row's box opens on the composer's edge
       and the column above it rises by exactly what the box gains, so the foot of that row —
       its last line, its clock and its ticks — stands clear in every frame and there is nothing
       for a camera to catch up with. The feed carries no transform at all, which is also one
       style write per frame that the phone no longer does. */

    /* the touch dot, and whatever it presses */
    var D = 420, act = null;
    (s.taps || []).forEach(function (tp) { if (t >= tp.at && t < tp.at + D) act = tp; });
    /* A finger lets go the instant the screen changes under it. When a surface begins to rise —
       or to fall — a dot that is still running belongs to the surface that is leaving, and
       drawing it on the one arriving put a grey disc on the middle of Yape's own screen. Every
       surface that can take the screen states its moments here: the browser, the camera and the
       picture inside it, the share sheet and the app. */
    if (act) {
      var chg = [];
      if (s.sheet) chg.push(s.sheet.at, s.sheet.down);
      if (s.camera) chg.push(s.camera.at, s.camera.review, s.camera.down);
      if (s.share) chg.push(s.share.at, s.share.down);
      if (s.app) chg.push(s.app.at, s.app.down);
      for (var gi = 0; gi < chg.length; gi++) {
        if (chg[gi] != null && act.at < chg[gi] && t >= chg[gi]) { act = null; break; }
      }
    }
    this.dot.classList.toggle('on', !!act);
    if (act) {
      var x = act.x || 0, y = act.y || 0;
      if (act.sel) {
        var target = this.node(act.sel);
        if (target) {
          var rr = this.root.getBoundingClientRect(), er = target.getBoundingClientRect();
          x = er.left - rr.left + er.width / 2;
          y = er.top - rr.top + er.height / 2;
        }
      }
      var dx = x + 'px', dy = y + 'px';
      var op = (t < act.at + 190 ? 1 : clamp(1 - (t - act.at - 190) / (D - 190), 0, 1)).toFixed(3);
      if (this.dot.style.left !== dx) this.dot.style.left = dx;
      if (this.dot.style.top !== dy) this.dot.style.top = dy;
      if (this.dot.style.opacity !== op) this.dot.style.opacity = op;
      this.dotOff = false;
    } else if (!this.dotOff) {
      this.dotOff = true;
      this.dot.style.opacity = 0;
      this.dot.style.left = '';
      this.dot.style.top = '';
    }
    (s.taps || []).forEach(function (tp) {
      if (!tp.press) return;
      var n2 = self.node(tp.press);
      if (n2) n2.classList.toggle('pressed', t >= tp.at && t < tp.at + 330);
    });
    (s.picks || []).forEach(function (pk) {
      var n3 = self.node(pk.sel);
      if (n3) n3.classList.toggle('sel', t >= pk.at);
    });

    if (s.chapters && s.chapters.length) {
      var ch = 0;
      s.chapters.forEach(function (c, i) { if (t >= c) ch = i; });
      if (ch !== this.chapter) {
        this.chapter = ch;
        post({ type: 'rocoto-demo', state: 'chapter', id: s.id, index: ch });
      }
    }
  };

  /* -------------------------------------------------------------- control */

  Demo.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    if (this.root.classList.contains('is-paused')) {
      this.root.classList.remove('is-paused');
      if (this.root.getAnimations) this.root.getAnimations({ subtree: true }).forEach(function (a) {
        try { if (a.playState === 'paused') a.play(); } catch (e) { }
      });
    }
    this.root.classList.remove('is-noanim');
    var self = this, prev = performance.now();
    if (this.holdLeft) { this.holdUntil = prev + this.holdLeft; this.holdLeft = 0; }
    cancelAnimationFrame(this.raf);
    var step = function (now) {
      if (!self.playing) return;
      var dt = Math.min(64, now - prev); prev = now;
      if (self.fading) {
        /* the cross-fade back to the start is running */
      } else if (self.holdUntil) {
        if (now >= self.holdUntil) {
          self.holdUntil = 0;
          self.fading = true;
          self.root.classList.add('is-fading');
          setTimeout(function () {
            self.root.classList.add('is-noanim');
            self.seek(0);
            requestAnimationFrame(function () {
              self.root.classList.remove('is-noanim');
              self.root.classList.remove('is-fading');
              self.fading = false;
            });
          }, 210);
        }
      } else if (self.stopAt && self.t + dt >= self.stopAt) {
        self.seek(self.stopAt);
        self.stopAt = 0;
        self.playing = false;
        return;
      } else {
        var t = self.t + dt;
        if (t >= self.s.duration) {
          /* the thread simply carries on: the next exchange is appended ahead of the clock, so
             nothing on the screen is touched and the loop has no seam. */
          if (self.mode === 'auto' && self.s.cycle && self.rebase()) {
            /* the clock walks on into the rest between the two exchanges */
          } else if (self.mode === 'auto') {
            t = self.s.duration; self.holdUntil = now + 4000;
          } else { t = self.s.duration; self.playing = false; }
        }
        self.seek(t);
      }
      self.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  };

  /* Stop the clock only. A scroll-driven parent seeks on every frame and wants its transitions to
     keep carrying the motion, so scrubbing uses this rather than `pause`. */
  Demo.prototype.stop = function () {
    if (this.holdUntil) { this.holdLeft = Math.max(0, this.holdUntil - performance.now()); this.holdUntil = 0; }
    this.playing = false;
    cancelAnimationFrame(this.raf);
  };

  /* Pause stops the clock AND everything the browser is running on its own — the typing dots, the
     recording pulse and the spinner are CSS keyframes, and a bubble may be half-grown — so a paused
     phone is a still photograph, and `play` starts all of it again from where it stood. */
  Demo.prototype.pause = function () {
    if (this.fading) {                       /* land the cross-fade rather than freeze mid-way */
      this.fading = false;
      this.root.classList.remove('is-fading');
      this.seek(0);
    }
    this.stop();
    this.root.classList.add('is-paused');
    if (this.root.getAnimations) this.root.getAnimations({ subtree: true }).forEach(function (a) {
      try { if (a.playState === 'running') a.pause(); } catch (e) { }
    });
  };

  /* back to the thread as it was mounted, with every appended exchange taken out again */
  Demo.prototype.resetToSeed = function () {
    var s = this.s, sd = this.seed, self = this;
    if (this.cycle === 0) return;
    this.rows.forEach(function (r) { if (sd.rows.indexOf(r) < 0 && r.parentNode) r.parentNode.removeChild(r); });
    sd.rows.forEach(function (r, i) { if (r.parentNode !== self.feed) self.feed.insertBefore(r, self.feed.children[i] || null); });
    this.bans.forEach(function (b) { if (sd.bans.indexOf(b) < 0 && b.el.parentNode) b.el.parentNode.removeChild(b.el); });
    sd.bans.forEach(function (b) { if (!b.el.parentNode) self.root.appendChild(b.el); });
    s.items = sd.items.slice();
    this.rows = sd.rows.slice();
    this.bans = sd.bans.slice();
    this.nextI = sd.nextI;
    if (s.chat && sd.presence) s.chat.presence = sd.presence.slice();
    if (sd.clockAt) s.clockAt = sd.clockAt.slice();
    if (sd.taps) s.taps = sd.taps.slice();
    if (sd.picks) s.picks = sd.picks.slice();
    if (s.composer) s.composer.type = sd.composer;
    if (sd.lockAt) s.lockAt = sd.lockAt.slice();
    if (sd.veil) s.veil = sd.veil.slice();
    if (sd.flash) s.flash = sd.flash.slice();
    /* a thread that was swapped is put back: the header, the picture and the lock screen's day */
    if (this.swapped) {
      this.swapped = false;
      s.chat = sd.chat;
      var head = this.chatEl.querySelector('.wa-head');
      head.innerHTML = sd.head;
      this.pres = head.querySelector('.wa-pres');
      if (this.lock && sd.lkNow) {
        this.lkNow = { date: sd.lkNow.date, time: sd.lkNow.time };
        if (this.lkDate) this.lkDate.textContent = sd.lkNow.date;
        if (this.lkTime) this.lkTime.textContent = sd.lkNow.time;
      }
    }
    s.recording = sd.recording;
    if (sd.sheet) this.setSheet(sd.sheet);
    if (sd.camera) this.setCamera(sd.camera);
    if (sd.share) this.setShare(sd.share);
    if (sd.app) this.setApp(sd.app);
    s.duration = sd.duration;
    this.cycle = 0;
    this.cycleLast = sd.duration;
    this.relabels = [];
    /* today is today again */
    this.todayChip = sd.todayChip;
    if (sd.todayChip && sd.todayText != null) sd.todayChip.textContent = sd.todayText;
    this.measure();
  };

  Demo.prototype.restart = function () {
    this.holdUntil = 0; this.holdLeft = 0; this.fading = false; this.stopAt = 0;
    this.root.classList.remove('is-fading');
    this.resetToSeed();
    this.seek(0); this.play();
  };
  Demo.prototype.freeze = function () { this.pause(); this.root.classList.add('is-noanim'); };

  function post(msg) {
    try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*'); } catch (e) { }
  }

  /* ---------------------------------------------------------------- mount */

  function mount(scene) {
    document.documentElement.lang = LANG === 'es' ? 'es-PE' : 'en';
    var demo = new Demo(scene);
    demo.root.classList.add('is-noanim');
    document.body.appendChild(demo.root);
    global.WA.demo = demo;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* A scroll-driven demo owns its first beat: it plays it once on its own clock, so the phone is
       never caught on a dead frame while it waits at the foot of the hero. The page's progress is
       then mapped onto what is LEFT, and the demo reports that shorter length as its own — so the
       page's own arithmetic (t = p x duration) lands on the same frame this one does. */
    var intro = scene.intro || 0;
    var span = Math.max(1, scene.duration - intro);
    var poster = PARAMS.has('poster');
    var tp = PARAMS.get('t');
    var auto = PARAMS.has('auto') || (window.parent === window && !poster && tp == null);
    demo.mode = PARAMS.get('mode') || 'auto';

    var settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      demo.root.classList.add('is-noanim');
      demo.measure();
      if (poster || reduce) {
        demo.seek(scene.poster || 0);
      } else if (tp != null) {
        demo.seek(parseFloat(tp));
      } else {
        demo.seek(0);
        requestAnimationFrame(function () {
          demo.root.classList.remove('is-noanim');
          if (auto) demo.play();
          else if (intro) { demo.introRunning = true; demo.stopAt = intro; demo.play(); }
        });
      }
      post({
        type: 'rocoto-demo', state: 'ready', id: scene.id, duration: span,
        chapters: (scene.chapters || []).map(function (c) { return Math.max(0, c - intro); })
      });
      document.documentElement.setAttribute('data-ready', '1');
    }

    var waits = [];
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
    /* The manifest is a 17 KB list of 35 entities, and a demo that already names its seven tiles
       has nothing to ask it for. It is fetched only when a tile came in without a name. */
    var unnamed = [].slice.call(demo.root.querySelectorAll('.wa-bank')).some(function (tile) {
      var fb = tile.querySelector('.fb');
      return !fb || !fb.textContent;
    });
    var manifest = Promise.resolve();
    if (unnamed && window.fetch) {
      manifest = fetch('/peru/original/banks/manifest.json').then(function (r) { return r.json(); })
        .then(function (list) {
          global.WA.manifest = list;
          var by = {};
          list.forEach(function (e) { by[e.slug] = e; });
          [].slice.call(demo.root.querySelectorAll('.wa-bank')).forEach(function (tile) {
            var e = by[tile.dataset.bank];
            if (!e) { tile.classList.add('is-missing'); return; }
            if (e.needs_dark_tile) tile.classList.add('dark');
            var img = tile.querySelector('img');
            img.setAttribute('alt', e.short || e.name);
            tile.querySelector('.fb').textContent = e.short || e.name;
            img.setAttribute('src', '/peru/original/banks/' + e.file);
          });
        }).catch(function () { });
    }
    waits.push(manifest.then(function () {
      var images = [].slice.call(demo.root.querySelectorAll('img'));
      /* CSS requests this shared image too; decoding the same URL adds no second download. */
      var wallpaper = new Image();
      wallpaper.src = '/peru/original/wa/wallpaper.webp';
      images.push(wallpaper);
      return Promise.all(images.map(imageReady)).then(function (ready) {
        return ready.every(function (ok) { return ok; });
      });
    }));
    Promise.all(waits).then(function (ready) {
      if (ready.some(function (ok) { return ok === false; })) { demo.pause(); return; }
      settle();
    }, function () { demo.pause(); });

    /* a demo the reader cannot see burns nothing: the clock and the animations stop together */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { demo.wasPlaying = demo.playing; demo.pause(); }
      else if (demo.wasPlaying) { demo.wasPlaying = false; demo.play(); }
    });

    window.addEventListener('message', function (e) {
      var d = e.data;
      if (!d || d.type !== 'rocoto-demo' || !d.cmd) return;
      if (e.origin !== 'null' && e.origin !== location.origin) return;
      if (d.cmd === 'play') demo.play();
      else if (d.cmd === 'pause') demo.pause();
      else if (d.cmd === 'restart') demo.restart();
      else if (d.cmd === 'progress') {
        var ms = intro + clamp(d.p, 0, 1) * span;
        /* the opening beat outranks a page that has yet to be scrolled */
        if (demo.introRunning && ms <= intro + 2) return;
        demo.introRunning = false;
        demo.stopAt = 0;
        demo.stop();
        demo.seek(ms);
      }
      else if (d.cmd === 'seek') { demo.stop(); demo.seek(d.ms); }
    });

    return demo;
  }

  global.WA = {
    mount: mount,
    lang: LANG,
    ui: T,
    /* a demo hands over both languages and gets the one this page is painting */
    pick: function (tbl) { return tbl[LANG] || tbl.en; },
    glyphs: G,
    qr: qrSvg,
    /* the one figure lockup, so every surface sets an amount the way the product does */
    figure: figure,
    banks: function (list) {
      return '<div class="wa-banks">' + list.map(function (b) {
        if (!b.slug) return '<div class="wa-bank other"><span class="fb">' + esc(b.label) + '</span></div>';
        return '<div class="wa-bank" data-bank="' + b.slug + '">' +
          '<img src="/peru/original/banks/' + b.slug + '.svg" alt="' + esc(b.name) + '">' +
          '<span class="fb">' + esc(b.name) + '</span></div>';
      }).join('') + '</div>';
    },
    /* the same seven, drawn as a list: the mark, the name, and where the row takes you */
    bankRows: function (list) {
      var ok = G.okDisc.replace('<svg ', '<svg class="ok" ');
      return '<div class="wa-blist">' + list.map(function (b) {
        return '<div class="wa-brow" data-bank="' + b.slug + '">' +
          '<span class="wa-bank" data-bank="' + b.slug + '"><img src="/peru/original/banks/' + b.slug + '.svg" alt="">' +
          '<span class="fb">' + esc(b.name) + '</span></span>' +
          '<span class="nm">' + esc(b.name) + '</span>' +
          '<span class="ch">' + G.chevronR + '</span>' + ok + '</div>';
      }).join('') + '</div>';
    },
    manifest: null
  };
})(window);
