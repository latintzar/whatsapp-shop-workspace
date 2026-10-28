# Motion (motion.dev), vendored

`motion.js` is the browser (UMD) build of **motion 13.4.0** — the open-source engine the craft
reference animates with — taken from the npm package `motion@13.4.0` (`dist/motion.js`).
Its licence is MIT and sits beside it in `LICENSE.md`.

We use it for its spring solver. `gen-springs.mjs` asks Motion for the exact curve of each spring we
measured on the reference and writes it into `peru/wa/wa.css` as a CSS `linear()` easing, between the
`springs (generated)` markers. The demos then carry no runtime dependency: the curve a visitor sees is
Motion's own, sampled ahead of time.

    node peru/wa/vendor/gen-springs.mjs        # rewrites the block in peru/wa/wa.css

Springs (stiffness / damping / mass 1), measured from the reference's live demos at 16 ms:

| Use | Spring | Motion's duration |
|---|---|---|
| the in-chat browser sheet, the chat push | 240 / 30 | 600 ms |
| the notification banner | 260 / 28 | 400 ms |
| a card or a page inside the sheet | 300 / 32 | 450 ms |
