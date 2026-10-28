# peru/fonts — Hanken Grotesk, self-hosted

`hanken-grotesk-latin-400-600.woff2` · `hanken-grotesk-latinext-400-600.woff2`

Hanken Grotesk, by Alfredo Marco Pradil. Licensed under the **SIL Open Font License, Version 1.1**
(<https://openfontlicense.org>), which permits use, study, modification and redistribution,
including embedding in and serving from a website, and requires that the font itself is never sold
on its own and that any modified version is released under the same licence and under a different
name. These files are unmodified subsets.

They are the Latin (`U+0000–00FF` …) and Latin-Extended subsets of the variable face, weight axis
400–600, taken from the files Google Fonts serves for
`https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400..600` (v12) and copied here so
`/peru` opens no third-party connection and the headline's font is in flight with the stylesheets.
The `unicode-range` declarations in `peru/peru.css` are Google's own, so the browser fetches only
the subset a glyph on the page actually needs — English pulls the Latin file alone, 34 KB.

To refresh: request that CSS with a current browser's user agent, take the two `src` URLs and
`unicode-range` lines, and replace both the files and the declarations in `peru/peru.css`.
