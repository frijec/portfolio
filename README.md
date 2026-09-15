# Kenneth Jensen — Portfolio

> **PRE-LAUNCH — this site is deliberately hidden from search.**
>
> Every page carries `<meta name="robots" content="noindex, nofollow">`
> and `robots.txt` blocks AI training crawlers. The site is publicly
> reachable on GitHub Pages, so treat "hidden" as "not in search
> results", not as private.
>
> **Launch checklist**
> 1. Remove the `noindex` meta line from all 10 pages (search for
>    `PRE-LAUNCH`). Until this is done the site can never rank.
> 2. Decide whether to keep the AI-crawler blocks in `robots.txt`.
> 3. Finish or unpublish the unfinished cases — five of six still
>    carry bracketed placeholder prompts (`grep -rn '\[' work/`).
> 4. Bump `?v=` on the CSS and JS links so returning visitors get the
>    new assets.

A static, no-build, no-backend portfolio site. Plain HTML/CSS/JS, deployable straight to GitHub Pages.

## Structure

```
index.html          Home
about.html           About
contact.html         Contact
work.html            Work index (all six cases)
work/tagga.html      Full case study — Tagga
work/*.html          Lighter case pages (masthead + status, in progress)
assets/css/style.css Design tokens, grid utilities, components
assets/js/main.js    Micro-interactions (see below)
```

## Design system

Tokens (colour, type scale, spacing, grid) live as CSS custom properties at the
top of `assets/css/style.css`, matching the source design's `tokens.json`
schema: bone ground `#F2F0EA`, ink `#111`, orange accent `#E16B2C`, Archivo +
IBM Plex Mono.

Layout uses a hand-rolled grid utility system instead of a framework:
- `.row` — 12-column grid container (48px margin / 24px gutter desktop;
  collapses to a 4-column, full-width-stacked layout under 760px).
- `.c1`–`.c12` — `grid-column-end: span N`.
- `.s1`–`.s11` — `grid-column-start: N`.
- Combine them, e.g. `class="c7 s4"` starts at column 4 and spans 7.

## Screen treatment (grain, scanlines, glow)

Three fixed overlays sit above the page: a tiled film-grain mask, a
combined scanline + vignette layer, and an occasional flicker. Every
knob lives in one place — the CRT block at the top of `style.css`:

| Token | Does |
| --- | --- |
| `--grain-opacity` | strength of the film grain |
| `--scanline-opacity` | horizontal scanline ruling |
| `--vignette-opacity` | corner falloff |
| `--glow` | phosphor bloom radius |
| `--glow-accent` / `--glow-ink` | bloom colour |
| `--plate-url` | the duotone placeholder image |

### One accent, used deliberately

There is a single accent, `--accent` `#E16B2C`. No darker text tier, no
hover tier, no second hue anywhere in the chrome — a neo-industrial
system gets its range from weight, rule, and ground, not from a palette.

The accent marks four things, and nothing else:

| Role | Where |
| --- | --- |
| **Where you are** | focus ring, active nav item, scroll progress |
| **What to do** | the CTA — a filled accent block, one per page |
| **What the case proved** | outcome numerals, case numbers, section labels |
| **What responds** | work-row hover, marker demos, selection |

One token has to exist alongside it: **`--on-accent`**, the colour of
anything sitting *on* the accent block. It cannot be `--ink`, because
`--ink` inverts with the theme and both accent shades are light oranges
— light-on-orange measures 2.0:1. So `--on-accent` is dark in both
themes: `#111111` (5.7:1) on bone, `#0C0D10` (7.8:1) in CRT.

**The known cost.** `#E16B2C` measures **2.91:1 on bone**. Accent *text*
therefore fails AA at the 11–12px mono sizes it is used on, and the
40–96px numerals sit just under the 3:1 large-text line. This is a
deliberate trade for a single-colour system. If you want strict AA, the
options are a darker orange (`#A8481B` clears 5.1:1 but is visibly a
different colour) or reserving the accent for blocks, rules and fills
and setting accent *text* in ink.

Two implementation notes worth keeping:

- The grain tile **must repeat at 1:1**. Stretching a small canvas across
  the viewport smears it into blobs instead of grain.
- Glow is applied to display type, accent and rules — **not** to body
  copy. Glow on running text costs more legibility than it buys.

Set `--glow: 0` to remove the bloom entirely; the layout is unaffected.

### Seeing the design under the treatment

The screen treatment is the point of the site, and it is also a scrim over
the work. Two ways through it, both on `.media--photo`:

- **Fidelity lens** — hover reveals a circle of the untreated image. It is a
  fixed element at z-index 9999, not a child of `.media`: the grain and
  scanline layers are fixed at 9997/9998 and `.media` sets
  `isolation:isolate`, so nothing inside it can paint above them. JS keeps
  the lens box matched to the media's rect, which makes `cover` resolve to
  the same crop as `object-fit:cover` on the img. Mouse only; radius is
  `--lens-r`.

  It is keyed off `.media-photo`, not off any one page's container, so
  **every picture added through that pattern gets a lens with no extra
  wiring** — one lens, ring and button per image, each tracking its own
  frame. The `.inspect` state is shared: overlays stay stripped while any
  image is showing untreated.
- **Show untreated** — a real button, which is what keyboard and touch get.
  It drops the image treatment *and* sets `.inspect` on `:root`, zeroing
  grain, scanlines and vignette, so it reaches the same fidelity the lens
  does. Pressing it again restores everything.

The cursor sits at z-index 10000 so the crosshair stays above the lens.

### Photography

`.media` shows a generated turbulence plate by default. Add `.media--photo`
and a `.media-photo` wrapper holding a real `<picture>` and the photo takes
over, layered *above* the plate — so a missing or still-loading file falls
back to the placeholder rather than an empty box, and `main.js` removes the
wrapper outright on a 404.

Photos are treated to sit in the system, not on top of it: greyscale, a
`--ground-bone` veil at 10% pulling them toward the paper, and the same 5px
halftone screen the plate uses. CRT mode darkens onto the phosphor ground
instead of inverting — an inverted photograph is just a negative.

Captions and crop marks invert over a photo (`--on-photo`). The default
bone halo was tuned for the light plate and disappears on a dark image.

Full-resolution sources live in `assets/img/_source/`, which is gitignored —
a public repo would otherwise serve the originals at full weight to anyone
who guessed the path. Keep the source there locally; only the derivatives
are committed. To regenerate after dropping a new source:

```bash
python3 -c "
from PIL import Image
s=Image.open('assets/img/_source/tagga-hero.png').convert('RGB'); W,H=s.size
for w in (1400,2000,2800):
    im=s.resize((w,round(H*w/W)), Image.LANCZOS)
    im.save(f'assets/img/tagga-hero-{w}.webp','WEBP',quality=82,method=6)
    if w==2000: im.save('assets/img/tagga-hero-2000.jpg','JPEG',quality=84,optimize=True,progressive=True)
"
```

### CRT mode

A toggle in the nav swaps to a dark phosphor theme (ground and ink swap
per the Foundations token spec; the accent lifts to `#F08A45`, which
measures 7.8:1 on that ground). The choice persists in
`localStorage` and is applied by a small inline script in each `<head>`
so there's no flash on load. Delete that script, the `.theme-toggle`
block in `main.js`, and the `[data-theme="crt"]` token block to remove.

### Terminal write-in

Text resolves as each element enters the viewport, once. Two different
treatments, for a reason:

- **Mono metadata** gets a cipher decode. Monospace means the string
  width never changes while it resolves, so nothing reflows.
- **Display type** (`.t-display-xl`, `.t-display-m`, `.pager-name`)
  reveals character by character instead. Scrambling proportional type
  at 200px makes the masthead visibly wobble, and a reveal never shows
  a character that isn't the real one.
- **Body copy is excluded.** A paragraph that is still resolving can't
  be read, and that prose is the substance of the case studies.

Headlines get an `aria-label` with the clean string, since the
per-character spans would otherwise be read letter by letter. Nothing
runs under `prefers-reduced-motion`. To remove, delete the `terminal()`
block in `main.js`.

Note: Foundations F.10 lists label scramble as **Cut** ("shows
characters that aren't true"). This implementation keeps the display
type honest and limits the scramble to mono metadata, but it is a
deliberate override of that line — worth knowing if you revisit it.

## Micro-interactions (assets/js/main.js)

- Procedural film-grain canvas overlay (`mix-blend-mode: overlay`, kept
  deliberately subtle — legibility over texture).
- Custom crosshair cursor with a live telemetry readout (real cursor
  position + scroll %, not decorative fiction).
- Scroll progress bar, IntersectionObserver-based reveal-on-scroll,
  mono counters that tick to their true value once visible.
- Magnetic hover on nav links and CTAs, marquee client band, live
  Copenhagen clock, an animated code-entry demo on the Tagga case.
- Cross-document View Transitions (`@view-transition { navigation: auto }`)
  for a quick hard-cut fade between pages, native support only — no-op
  elsewhere.

All motion respects `prefers-reduced-motion`.

## Local preview

Any static file server works, e.g.:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings → Pages, set the source to the `main` branch, root
   folder (no build step required).
3. The site will be live at `https://<username>.github.io/<repo>/`.

## Content status

Only **Tagga** is written end-to-end; it is the template the other cases
follow. The remaining five — Golisto, Vild Mad, Dribe, Norlys, For Danmark —
have the full structure in place but most prose is still a bracketed prompt
describing what belongs there. Nothing in those brackets is invented: they are
questions to answer, not draft copy.

Find what is left:

```bash
grep -rn '\[' work/ --include='*.html'
```
