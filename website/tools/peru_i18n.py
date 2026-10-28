#!/usr/bin/env python3
"""The Peru site in two languages: English is the source, Spanish is generated.

Peter, 20 September 2026: «please make it in spanish as a snapshot of this finalised version and
put the english one under .com/en and put a language dropdown in the navbar by the CTA».

So the five English files stay where they are and are served under `/en`; the Spanish pages are
WRITTEN from them, here, and nobody hand-edits one. The words themselves live outside both:
`peru/i18n/en/*.json` is what a translator reads, `peru/i18n/es/*.json` is what they write back,
keyed by the exact English string.

    python3 tools/peru_i18n.py extract            # rewrite peru/i18n/en/*.json from the sources
    python3 tools/peru_i18n.py build              # write peru/es/*.html  (every twin required)
    python3 tools/peru_i18n.py build --allow-missing
    python3 tools/peru_i18n.py check              # the gate: exit 1 on anything below
    python3 tools/peru_i18n.py check --verbose

`check` is red when a unit has no twin, when a twin's key matches no unit any more, when a file in
peru/es/ differs from what `build` would write this minute, or when a translated unit's ENGLISH
text is still standing in the Spanish page. It is also red when a unit fails to round-trip: every
unit is re-rendered from its own extracted form and compared with the source it came from, so a
mistake in this file is caught here rather than on the page.

WHAT A UNIT IS
  · the innerHTML of a LEAF BLOCK — an element whose element children are all inline
    (a em strong span svg br b i small) — with its whitespace normalised;
  · a translatable attribute: alt, title, aria-label, placeholder;
  · the <title>, and the <meta> contents that are prose;
  · a string inside JSON-LD.
An <svg> inside a unit is elided to a placeholder ({i1}, {i2}…) and put back by `build`, so a
translator never meets a path's `d` attribute. A subtree marked `translate="no"` is skipped whole —
that is how the language control itself stays out of the word list.

TWO UNITS ARE NOT MARKUP AT ALL, because their markup is generated:
  · `.pe-lit-t`, the sentence that lights letter by letter, is carried as its plain sentence with
    a `{wa}` where the WhatsApp glyph goes. `lit_markup()` builds the visual letters and one
    accessible sentence from it, and the round-trip proves it byte for byte against the source.
  · `.pe-h1`, whose words are spans so they can rise, is carried as its plain sentence with `{br}`
    where the line breaks. `words_markup()` builds it, and it round-trips the same way.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]

# ── the five pages ────────────────────────────────────────────────────────────────────────────
@dataclass(frozen=True)
class Page:
    key: str            # which peru/i18n/<lang>/<key>.json holds its words
    source: str         # the English file, which is the source of truth
    out: str            # the Spanish file this writes
    en_path: str        # where the English page is served
    es_path: str        # where the Spanish page is served


PAGES = [
    Page("main", "peru.html", "peru/es/index.html", "/en", "/"),
    Page("selling", "peru/sales.html", "peru/es/selling.html", "/en/selling", "/selling"),
    Page("legal", "peru/privacy.html", "peru/es/privacy.html", "/en/privacy", "/privacy"),
    Page("legal", "peru/terms.html", "peru/es/terms.html", "/en/terms", "/terms"),
    Page("legal", "peru/cookies.html", "peru/es/cookies.html", "/en/cookies", "/cookies"),
]
FILES = ["main", "selling", "legal"]
ORIGIN = "https://soyrocoto.com"

# ── the grammar of a unit ─────────────────────────────────────────────────────────────────────
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param",
        "source", "track", "wbr"}
INLINE = {"a", "em", "strong", "span", "svg", "br", "b", "i", "small"}
OPAQUE = {"svg", "style"}                      # walked past entirely, attributes and all
ATTRS = ("alt", "title", "aria-label", "placeholder")
META_KEYS = {"description", "og:title", "og:description", "og:image:alt",
             "twitter:title", "twitter:description", "twitter:image:alt"}
BRANDS = {"rocoto", "yape", "plin", "whatsapp", "sunat", "sbs", "bcp", "bbva", "interbank",
          "scotiabank", "banbif", "banco pichincha", "mibanco", "meta", "leo casa ltd",
          "español", "english", "es", "en"}


def norm(text: str) -> str:
    """One space between things, nothing at the ends."""
    return re.sub(r"\s+", " ", text).strip()


def is_prose(text: str) -> bool:
    """A unit carries words a translator can act on."""
    bare = norm(text)
    if not bare:
        return False
    if bare.startswith(("http://", "https://", "mailto:", "/")):
        return False
    if "@" in bare and " " not in bare:
        return False
    stripped = re.sub(r"<[^>]*>", "", bare)
    plain = stripped.replace("{i", " ").replace("}", " ")
    letters = re.sub(r"[^A-Za-zÀ-ÿ]+", " ", plain)
    if not letters.strip():
        return False                                     # a figure, a date, a phone number
    for brand in sorted(BRANDS, key=len, reverse=True):
        letters = re.sub(re.escape(brand), " ", letters, flags=re.I)
    return bool(letters.strip())                         # brand-only says nothing to translate


# ── a tree with byte offsets, so a rewrite touches only what it means to ──────────────────────
@dataclass
class Node:
    tag: str | None
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)
    start: int = 0
    inner_start: int = 0
    inner_end: int = 0
    end: int = 0

    def kids(self) -> list:
        return [c for c in self.children if c.tag]

    def cls(self) -> list[str]:
        return (self.attrs.get("class") or "").split()


class Tree(HTMLParser):
    def __init__(self, src: str):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0] + [m.end() for m in re.finditer("\n", src)]
        self.root = Node("#root")
        self.stack = [self.root]
        self.feed(src)
        self.close()
        while len(self.stack) > 1:                       # an unclosed tag ends where the file does
            node = self.stack.pop()
            node.inner_end = node.end = len(src)

    def off(self) -> int:
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self.off()
        raw = self.get_starttag_text() or ""
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs},
                    start=start, inner_start=start + len(raw))
        self.stack[-1].children.append(node)
        if tag in VOID:
            node.inner_end = node.end = node.inner_start
        else:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        start = self.off()
        raw = self.get_starttag_text() or ""
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs},
                    start=start, inner_start=start + len(raw),
                    inner_end=start + len(raw), end=start + len(raw))
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        here = self.off()
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                while len(self.stack) - 1 > i:           # whatever stayed open closes here
                    inner = self.stack.pop()
                    inner.inner_end = inner.end = here
                node = self.stack.pop()
                node.inner_end = here
                node.end = self.src.index(">", here) + 1
                return

    def handle_data(self, data):
        start = self.off()
        self.stack[-1].children.append(Node(None, start=start, end=start + len(data)))


def find(node: Node, tag: str) -> Node | None:
    for child in node.kids():
        if child.tag == tag:
            return child
        deep = find(child, tag)
        if deep:
            return deep
    return None


# ── the two generated shapes ──────────────────────────────────────────────────────────────────
WA_GLYPH = ('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            '<path d="M12.04 2.5a9.4 9.4 0 0 0-8.1 14.13L2.5 21.5l4.98-1.4A9.4 9.4 0 1 0 12.04 2.5Z"'
            ' fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
            '<path d="M8.9 7.6c.2-.05.42-.04.6.02.2.07.33.28.44.5l.62 1.3c.1.22.06.48-.1.66l-.4.46a.44.44 0 0 0-.07.5'
            ' 6.3 6.3 0 0 0 2.98 2.72.44.44 0 0 0 .5-.12l.44-.52c.17-.2.45-.26.69-.15l1.35.62c.24.11.4.35.4.62'
            ' 0 .93-.75 1.69-1.68 1.7a7.9 7.9 0 0 1-6.9-6.95A1.7 1.7 0 0 1 8.9 7.6Z" fill="currentColor"/></svg>')

MARK = "\x00"          # stands in for «{wa} » while the sentence is split on spaces


def _letters(word: str) -> str:
    return "".join(f'<span class="lw" aria-hidden="true">{c}</span>' for c in word)


def lit_markup(plain: str) -> str:
    """The whole <p class="pe-lit-t"> from its plain sentence, `{wa}` marking the glyph's word.

    One span per letter is what the band lights; the glyph and its word travel together inside
    `.pe-mk-wa`, so the mark never falls to the next line on its own. A visually hidden text
    span carries the full sentence; its animated duplicate is hidden from screen readers.
    """
    spoken = plain.replace("{wa} ", "")
    body = []
    for word in plain.replace("{wa} ", MARK).split(" "):
        if word.startswith(MARK):
            body.append(f'<span class="pe-mk pe-mk-wa">{WA_GLYPH}'
                        f'<span class="pe-mkw">{_letters(word[1:])}</span></span>')
        else:
            body.append(_letters(word))
    return (f'<p class="pe-lit-t" data-lit><span class="pe-vh">{spoken}</span>'
            '<span aria-hidden="true">' + " ".join(body) + "</span></p>")


def words_markup(plain: str) -> str:
    """The H1's innerHTML from its plain sentence, `{br}` marking the line break."""
    out = []
    for i, part in enumerate(plain.split("{br}")):
        if i:
            out.append('<br class="h1-br">')
        lead = part[: len(part) - len(part.lstrip(" "))]
        tail = part[len(part.rstrip(" ")):]
        out.append(lead + " ".join(f'<span class="w">{w}</span>' for w in part.split()) + tail)
    return "".join(out)


# ── reading one page ──────────────────────────────────────────────────────────────────────────
SVG_TAG = re.compile(r"<svg\b", re.I)


@dataclass
class Unit:
    en: str
    kind: str                 # html | attr | meta | jsonld
    where: str
    start: int                # the slice of the source this replaces
    end: int
    codec: str = "html"       # html | lit | words | text
    icons: list = field(default_factory=list)
    quote: bool = False       # an attribute value, so the twin is escaped before it goes in


def restore(text: str, icons: list[str]) -> str:
    for i, svg in enumerate(icons, 1):
        text = text.replace("{i%d}" % i, svg)
    return text


def marks(text: str) -> set[str]:
    return set(re.findall(r"\{i\d+\}", text))


def unit_html(src: str, node: Node) -> tuple[str, list[str]]:
    """A leaf block's innerHTML: decoration out to {i1}, {i2}…, whitespace normalised.

    Decoration is an <svg> or any element that carries `aria-hidden="true"` and holds no words.
    It is the page's plumbing, it has to come back byte for byte, and a translator should never
    have to look at a path's `d` attribute to keep a sentence intact.
    """
    icons: list[str] = []
    out: list[str] = []
    at = node.inner_start

    def visit(here: Node) -> None:
        nonlocal at
        for child in here.children:
            if not child.tag:
                continue
            raw = src[child.start:child.end]
            words = re.sub(r"<[^>]*>", "", raw).strip()
            if child.tag == "svg" or (child.attrs.get("aria-hidden") == "true" and not words):
                out.append(src[at:child.start])
                icons.append(raw)
                out.append("{i%d}" % len(icons))
                at = child.end
            else:
                visit(child)

    visit(node)
    out.append(src[at:node.inner_end])
    return norm("".join(out)), icons


def heading_of(trail: list[str]) -> str:
    parts = [t for t in trail if t]
    return " · ".join(dict.fromkeys(parts[:1] + parts[-2:])) or "page"


def read_page(page: Page) -> tuple[str, list[Unit]]:
    return read_file(SITE / page.source, Path(page.source).name)


def read_file(path: Path, name: str) -> tuple[str, list[Unit]]:
    """Every unit in one HTML file. `read_page` reads an English source with it; `check` reads the
    GENERATED Spanish page with the same eyes, which is how it can tell that a sentence really was
    replaced — a substring sweep over the file cannot, because it also finds the word inside an
    HTML comment or inside a class name (`class="ssoon"` contains «soon»)."""
    src = path.read_text(encoding="utf-8")
    tree = Tree(src)
    units: list[Unit] = []
    html_el = find(tree.root, "html")
    head = find(html_el, "head") if html_el else None
    body = find(html_el, "body") if html_el else None

    # ── the head: the title, the prose metas, the JSON-LD ────────────────────────────────────
    if head:
        for node in head.kids():
            if node.tag == "title":
                text = norm(src[node.inner_start:node.inner_end])
                units.append(Unit(text, "meta", "<title>", node.inner_start, node.inner_end,
                                  codec="text"))
            elif node.tag == "meta":
                key = node.attrs.get("name") or node.attrs.get("property") or ""
                if key in META_KEYS and node.attrs.get("content"):
                    at = src.index('content="', node.start) + len('content="')
                    end = src.index('"', at)
                    units.append(Unit(unescape_attr(src[at:end]), "meta", f'<meta {key}>',
                                      at, end, codec="text", quote=True))
            elif node.tag == "script" and "ld+json" in (node.attrs.get("type") or ""):
                units += jsonld_units(src, node)

    # ── the body ─────────────────────────────────────────────────────────────────────────────
    if body:
        scan(src, body, units, [name])
    units.sort(key=lambda u: u.start)
    return src, units


def unescape_attr(value: str) -> str:
    return value.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')


def escape_attr(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def jsonld_units(src: str, node: Node) -> list[Unit]:
    raw = src[node.inner_start:node.inner_end]
    out: list[Unit] = []
    for m in re.finditer(r'"(name|description|headline|alternateName)"\s*:\s*"((?:[^"\\]|\\.)*)"', raw):
        text = m.group(2)
        if is_prose(text):
            out.append(Unit(text, "jsonld", f'JSON-LD {m.group(1)}',
                            node.inner_start + m.start(2), node.inner_start + m.end(2),
                            codec="text"))
    return out


def inline_safe(node: Node) -> bool:
    """An element a unit may swallow whole: inline, and inline all the way down.

    The test is on the whole subtree, not on one generation. `<div class="pe-wrap">` holds one
    `<a class="sbox">`, which is inline — but that anchor holds a picture and a block of headings,
    so the wrap is NOT a leaf block and the scan goes on down to the sentences inside it.
    """
    if node.tag == "svg":
        return True                                   # decoration; `unit_html` elides it
    return node.tag in INLINE and all(inline_safe(k) for k in node.kids())


def scan(src: str, node: Node, units: list[Unit], trail: list[str]) -> None:
    if node.tag in OPAQUE or node.attrs.get("translate") == "no":
        return
    if node.tag == "script":
        return

    # every translatable attribute on this element, wherever the element sits
    for attr in ATTRS:
        value = node.attrs.get(attr)
        if not value or not is_prose(value):
            continue
        if attr == "aria-label" and "pe-lit-t" in node.cls():
            continue                                   # derived from the lit sentence, never typed
        at = src.index(f'{attr}="', node.start) + len(attr) + 2
        end = src.index('"', at)
        units.append(Unit(unescape_attr(src[at:end]), "attr",
                          f'{heading_of(trail)} · <{node.tag}> @{attr}', at, end,
                          codec="text", quote=True))

    kids = node.kids()
    here = list(trail)
    if node.attrs.get("id"):
        here.append("#" + node.attrs["id"])

    if not kids or all(inline_safe(k) for k in kids):
        inner = src[node.inner_start:node.inner_end]
        if inner.strip():
            clean, icons = unit_html(src, node)
            if "pe-lit-t" in node.cls():
                plain = lit_plain(src[node.start:node.end])
                units.append(Unit(plain, "html", f'{heading_of(trail)} · the lit sentence',
                                  node.start, node.end, codec="lit"))
                return
            if "pe-h1" in node.cls() and '<span class="w">' in inner:
                units.append(Unit(words_plain(inner), "html",
                                  f'{heading_of(trail)} · the H1',
                                  node.inner_start, node.inner_end, codec="words"))
                return
            if is_prose(clean):
                units.append(Unit(clean, "html",
                                  f'{heading_of(trail)} · <{node.tag}'
                                  + (f'.{node.cls()[0]}' if node.cls() else "") + ">",
                                  node.inner_start, node.inner_end, codec="html", icons=icons))
            return
    # the heading a sentence sits under is the hint that tells a translator where they are, so
    # it travels down the siblings that follow it
    heading = ""
    for kid in kids:
        if kid.tag in ("h1", "h2", "h3", "h4"):
            heading = norm(re.sub(r"<[^>]*>", "", src[kid.inner_start:kid.inner_end]))[:52]
        scan(src, kid, units, here + ([heading] if heading else []))


LETTER = r'<span class="lw" aria-hidden="true">.</span>'
MARK_EL = re.compile(r'<span class="pe-mk pe-mk-wa"><svg\b.*?</svg><span class="pe-mkw">'
                     r'((?:' + LETTER + r')+)</span></span>', re.S)


def lit_plain(element: str) -> str:
    """The lit band's element back to its plain sentence, `{wa}` where the glyph is."""
    inner = element[element.index(">") + 1: element.rindex("</p>")]
    visual = re.fullmatch(r'<span class="pe-vh">.*?</span><span aria-hidden="true">(.*)</span>',
                          inner, re.S)
    if visual:
        inner = visual.group(1)
    inner = MARK_EL.sub(lambda m: "{wa} " + m.group(1), inner)
    inner = re.sub(r'<span class="lw" aria-hidden="true">(.)</span>', r"\1", inner)
    return inner


def words_plain(inner: str) -> str:
    out = inner.replace('<br class="h1-br">', "{br}")
    return re.sub(r'<span class="w">(.*?)</span>', r"\1", out)


def render(unit: Unit, text: str) -> str:
    """One unit's replacement, in the shape the page wants it."""
    if unit.codec == "lit":
        return lit_markup(text)
    if unit.codec == "words":
        return words_markup(text)
    if unit.quote:
        return escape_attr(text)
    return restore(text, unit.icons)


# ── extract ───────────────────────────────────────────────────────────────────────────────────
def extract() -> int:
    by_file: dict[str, list[dict]] = {key: [] for key in FILES}
    seen: dict[str, set] = {key: set() for key in FILES}
    for page in PAGES:
        _, units = read_page(page)
        for unit in units:
            if unit.en in seen[page.key]:
                continue
            seen[page.key].add(unit.en)
            by_file[page.key].append({"en": unit.en, "kind": unit.kind, "where": unit.where})
    out = SITE / "peru" / "i18n" / "en"
    out.mkdir(parents=True, exist_ok=True)
    for key in FILES:
        path = out / f"{key}.json"
        path.write_text(json.dumps(by_file[key], indent=2, ensure_ascii=False) + "\n",
                        encoding="utf-8")
        print(f"  {path.relative_to(SITE)}  {len(by_file[key])} units")
    return 0


def twins(key: str) -> dict:
    path = SITE / "peru" / "i18n" / "es" / f"{key}.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


# ── build ─────────────────────────────────────────────────────────────────────────────────────
GENERATED = ("<!-- GENERATED — edit the English source or peru/i18n/es/*.json, then run "
             "tools/peru_i18n.py build. -->")


def es_path_of(path: str) -> str:
    """An address in the English world, in the Spanish one."""
    if path == "/en":
        return "/"
    if path.startswith("/en/"):
        return path[3:]
    if path.startswith("/en#") or path.startswith("/en?"):
        return "/" + path[3:]
    return path


LINK_ATTR = re.compile(r'\b(href|action)="(/en(?:[/#?][^"]*)?)"')
DEMO_LANG = re.compile(r'(data-demo="[^"]*?)lang=en')
POSTER = re.compile(r'(/peru/demos/posters/)([a-z0-9-]+)(\.webp)')
# THE APP SPEAKS SPANISH UNLESS IT IS TOLD OTHERWISE (Peter, 20 September: «english only if they
# clicked from the english page»). The English sources open the app with `?lang=en`; the Spanish
# pages open it plain.
APP_LANG = re.compile(r'(https://demo\.soyrocoto\.com/bodega-pay-later/)\?lang=en')
WAITLIST_JOIN_EN = ('https://wa.me/19789589459?text='
                    'I%E2%80%99d%20like%20to%20join%20the%20Rocoto%20waitlist.')
WAITLIST_JOIN_ES = ('https://wa.me/19789589459?text='
                    'Quiero%20unirme%20a%20la%20lista%20de%20espera%20de%20Rocoto.')


def spanish(page: Page, allow_missing: bool) -> tuple[str, list[str]]:
    src, units = read_page(page)
    table = twins(page.key)
    missing: list[str] = []
    out, at = [], 0
    for unit in units:
        twin = table.get(unit.en)
        if twin is None:
            missing.append(unit.en)
            if not allow_missing:
                continue
            twin = unit.en
        out.append(src[at:unit.start])
        out.append(render(unit, twin))
        at = unit.end
    out.append(src[at:])
    text = "".join(out)

    # ── the page's own language ──────────────────────────────────────────────────────────────
    text = re.sub(r'<html lang="[^"]*">', '<html lang="es-PE">', text, count=1)
    text = re.sub(r'<meta property="og:locale" content="[^"]*">',
                  '<meta property="og:locale" content="es_PE">', text, count=1)
    text = re.sub(r'<link rel="canonical" href="[^"]*">',
                  f'<link rel="canonical" href="{ORIGIN}{page.es_path}">', text, count=1)
    text = re.sub(r'<meta property="og:url" content="[^"]*">',
                  f'<meta property="og:url" content="{ORIGIN}{page.es_path}">', text, count=1)

    # ── every address, from the English world to the Spanish one ─────────────────────────────
    text = LINK_ATTR.sub(lambda m: f'{m.group(1)}="{es_path_of(m.group(2))}"', text)

    # ── the demos, the posters and the share picture in Spanish where Spanish exists ─────────
    text = DEMO_LANG.sub(r"\1lang=es", text)
    text = APP_LANG.sub(r"\1", text)
    text = text.replace(WAITLIST_JOIN_EN, WAITLIST_JOIN_ES)
    def localized_poster(match):
        stem = match.group(2)
        sized = re.fullmatch(r"(.+)-(\d+)", stem)
        localized = f"{sized[1]}-es-{sized[2]}" if sized else f"{stem}-es"
        if not (SITE / f"peru/demos/posters/{localized}.webp").exists():
            return match.group(0)
        return f"{match.group(1)}{localized}{match.group(3)}"
    text = POSTER.sub(localized_poster, text)
    if (SITE / "peru" / "og-peru-es.jpg").exists():
        text = text.replace("/peru/og-peru.jpg", "/peru/og-peru-es.jpg")

    # ── the language control, rebuilt for this page in Spanish ───────────────────────────────
    #    It is written LAST, after every address has been moved, because its own English address
    #    is the one link on the page that must stay in the English world.
    text = CONTROL.sub(lambda _: lang_control("es", page.es_path, page.en_path), text)

    doctype = text.index(">") + 1
    text = text[:doctype] + "\n" + GENERATED + text[doctype:]
    return text, missing


CHEVRON = ('<svg class="plang-v" viewBox="0 0 16 16" aria-hidden="true" focusable="false">'
           '<path d="m4 6.5 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7"'
           ' stroke-linecap="round" stroke-linejoin="round"/></svg>')
CONTROL = re.compile(r'<span class="plang-w".*?<!--/plang-->', re.S)


def lang_control(lang: str, es_href: str, en_href: str) -> str:
    """The language control, in one line, for whichever language the page is in.

    ONE function writes it for both languages, so the English source and the Spanish page can
    never drift apart: `check` re-renders the English one and compares it with the file.

    It carries TWO doors and the stylesheet shows one of them. Above 360 px it is a dropdown: the
    language this page is in, and a card with both. Below 360 px the bar has four objects in
    320 px and the pill no longer has the room, so what stands there is the other language's
    two letters, linking straight to the same page in it — the last of the moves the brief allows
    on a phone. The wrapper is `display: contents`, so the bar's own layout never sees it.
    """
    rows = [("es", "es-PE", es_href, "Español"), ("en", "en", en_href, "English")]
    out = []
    for code, hreflang, href, name in rows:
        on = " is-on" if code == lang else ""
        current = ' aria-current="true"' if code == lang else ""
        out.append(f'<a class="plang-o{on}" href="{href}" hreflang="{hreflang}" '
                   f'lang="{code}"{current}>{name}</a>')
    other = rows[1] if lang == "es" else rows[0]
    label = "Idioma — Español" if lang == "es" else "Language — English"
    return ('<span class="plang-w" translate="no">'
            '<details class="plang">'
            f'<summary class="plang-s" aria-label="{label}">'
            f'<span class="plang-now">{lang.upper()}</span>{CHEVRON}</summary>'
            f'<div class="plang-m">{"".join(out)}</div></details>'
            f'<a class="plang-mini" href="{other[2]}" hreflang="{other[1]}" lang="{other[0]}"'
            f' aria-label="{other[3]}">{other[0].upper()}</a>'
            '</span><!--/plang-->')


def build(allow_missing: bool) -> int:
    short = 0
    for page in PAGES:
        text, missing = spanish(page, allow_missing)
        out = SITE / page.out
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        note = f"  ({len(missing)} units still English)" if missing else ""
        print(f"  {page.out}  {len(text) // 1024} KB{note}")
        short += len(missing)
    # A page whose twin is missing keeps its English sentence either way — the two modes write the
    # same bytes. What `--allow-missing` buys is permission for that, so the plain verb has to say
    # no out loud instead of exiting 0 on a page that is still half English.
    if short and not allow_missing:
        print(f"-- {short} units have no Spanish twin: run `check` to see them, "
              f"or `build --allow-missing` to write the pages anyway --")
        return 1
    return 0


# ── check ─────────────────────────────────────────────────────────────────────────────────────
def check(verbose: bool) -> int:
    failures: list[str] = []
    notes: list[str] = []
    used: dict[str, set] = {key: set() for key in FILES}
    counts = {"units": 0, "missing": 0, "same": 0}

    for page in PAGES:
        src, units = read_page(page)
        table = twins(page.key)

        # 1 · every unit round-trips: re-render the ENGLISH and it is the source again
        for unit in units:
            counts["units"] += 1
            again = render(unit, unit.en)
            was = src[unit.start:unit.end]
            if unit.codec in ("lit", "words"):
                if again != was:
                    failures.append(f"{page.source}: the {unit.codec} markup does not round-trip\n"
                                    f"      was:  {was[:110]}\n      again:{again[:110]}")
            elif unit.quote:
                if unescape_attr(again) != unescape_attr(was):
                    failures.append(f"{page.source}: attribute does not round-trip: {unit.en[:60]}")
            elif norm(again) != norm(was):
                failures.append(f"{page.source}: unit does not round-trip: {unit.en[:60]}")

            twin = table.get(unit.en)
            if twin is None:
                counts["missing"] += 1
                failures.append(f"{page.key}.json: no Spanish twin · {unit.where} · «{unit.en[:70]}»")
            else:
                used[page.key].add(unit.en)
                if twin == unit.en:
                    counts["same"] += 1
                if marks(twin) != marks(unit.en):
                    failures.append(f"{page.key}.json: the twin drops a placeholder "
                                    f"{sorted(marks(unit.en) - marks(twin))} · «{unit.en[:60]}»")

        # the control is written by one function, so the English source has to match it
        want = lang_control("en", page.es_path, page.en_path)
        found = CONTROL.search(src)
        if not found:
            failures.append(f"{page.source}: no language control in the nav")
        elif found.group(0) != want:
            failures.append(f"{page.source}: the language control is not what lang_control() writes")

        # 2 · the file on disk is what build would write this minute
        text, _ = spanish(page, allow_missing=True)
        out = SITE / page.out
        if not out.exists():
            failures.append(f"{page.out}: missing — run `tools/peru_i18n.py build`")
        elif out.read_text(encoding="utf-8") != text:
            failures.append(f"{page.out}: stale — run `tools/peru_i18n.py build`")

        # 3 · a translated unit's English is gone from the Spanish page. The generated page is READ
        #     BACK with the same extractor, so what is compared is copy against copy: the units the
        #     Spanish page actually has. A raw substring sweep over the file was the wrong
        #     instrument — it finds the English inside an HTML comment the source keeps on purpose,
        #     and inside a class name (`class="ssoon"` holds «soon»), and it would have to be
        #     silenced in both places to go green, which is a gate arguing with the page.
        english = {unit.en for unit in units if table.get(unit.en) not in (None, unit.en)}
        if out.exists():
            _, back = read_file(out, Path(page.out).name)
            for unit in back:
                if unit.en in english:
                    failures.append(f"{page.out}: the English still stands · "
                                    f"{unit.where} · «{unit.en[:70]}»")

    # 4 · a twin nobody asks for any more
    for key in FILES:
        stale = [k for k in twins(key) if k not in used[key]]
        for k in stale:
            failures.append(f"{key}.json: stale key, no unit matches it · «{k[:70]}»")

    print(f"check · {counts['units']} units on {len(PAGES)} pages · "
          f"{counts['missing']} without a Spanish twin · {counts['same']} the same in both")
    for note in notes:
        print("  " + note)
    if failures:
        shown = failures if verbose else failures[:25]
        print(f"-- {len(failures)} FAILURES --")
        for f in shown:
            print("  " + f)
        if len(shown) < len(failures):
            print(f"   … {len(failures) - len(shown)} more (run with --verbose)")
        return 1
    print("-- no failures --")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("verb", choices=["extract", "build", "check"])
    ap.add_argument("--allow-missing", action="store_true",
                    help="build: keep the English where a Spanish twin is still to come")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    if args.verb == "extract":
        return extract()
    if args.verb == "build":
        return build(args.allow_missing)
    return check(args.verbose)


if __name__ == "__main__":
    sys.exit(main())
