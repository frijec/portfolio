# Kenneth Jensen — Portfolio

> **PRE-LAUNCH — this site is deliberately hidden from search.**
>
> Every page carries `<meta name="robots" content="noindex, nofollow">`
> and `robots.txt` blocks AI training crawlers. The site is publicly
> reachable on GitHub Pages, so treat "hidden" as "not in search
> results", not as private.
>
> **Launch checklist**
> 1. Remove the `noindex` meta line from all 11 pages (search for
>    `PRE-LAUNCH`). Until this is done the site can never rank.
> 2. Decide whether to keep the AI-crawler blocks in `robots.txt`.
> 3. **Four cases are hidden, not deleted.** Dribe, Norlys, ForDanmark
>    and Vild Mad still carry bracketed prompts, so their rows were
>    removed from `index.html` and `work.html` and the nav says
>    `Work [02]`. The files are untouched and still reachable by URL. To
>    restore one: finish it (`grep -n '\[' work/<case>.html`), add its
>    row back to both index pages, bump the nav count everywhere, and
>    re-point the Tagga pager from About to the next case.
> 4. **Golisto D.01–D.03 contain drafts.** Six paragraphs are Claude’s
>    candidates for what was rejected and what it cost, marked in the
>    page as “Draft — confirm or correct” and with `<!-- DRAFT` comments in
>    the source. Nothing there is Kenneth’s word until the todo-block
>    wrapper and the [Confirm…] notes are removed.
> 5. **Add the CV.** The contact page had a "CV · PDF · 2 pages ↓" row
>    that linked to nothing; it was removed rather than left as a dead
>    promise. Drop a PDF in `assets/` and restore the row as an `<a>`.
> 6. Bump `?v=` on the CSS and JS links so returning visitors get the
>    new assets.

A static, no-build, no-backend portfolio site. Plain HTML/CSS/JS, deployable straight to GitHub Pages.

## Audience decisions baked into the build

The site is tuned for one reader: a **hiring manager or design lead arriving
rushed from a link**, who decides in ten seconds and must leave knowing
Kenneth *owns the whole thing* — design through build and business. That
decision drives several things that would otherwise look arbitrary:

- The intro paragraph and the About page lead with ownership (co-founder /
  CPO of Golisto, sole builder of Tagga) in body-size type, not in 11px mono.
- The cipher effect is **exempted** from anything a rushed reader scans:
  the status line, work-row specs, case mastheads and the one-line strips.
  Add `data-no-cipher` to keep new credentials readable from the first frame.
- Every case opens with a `.oneline` strip — problem / what I did / where
  it is — for the reader who will never reach the outcome section.
- Social preview tags (`og:*`, `twitter:*`) on every page, with a 1200×630
  image, because the first impression happens in the link unfurl.
- Fonts are self-hosted (`assets/fonts/`, SIL OFL) so there is no
  third-party request and the footer's "no tracking" is literally true.
- `<header>`, `<main id="main">`, a skip link, and nav hit areas widened
  to 44px via a pseudo-element without moving anything visible.
- A branded `404.html` (absolute `/portfolio/` paths — it renders unstyled
  on a local root server, correctly on Pages) and an `@media print`
  block that strips every screen effect and prints images untreated.
- `prefers-reduced-motion` now also covers the grid draw-in, masthead
  entrance, counters, magnet and work-row peek.

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

### Spacing, rules, measure, numerals — use the classes, not inline styles

An audit found 567 inline `style=""` declarations using 26 distinct pixel
values against a ten-token spacing scale. They are now classes; **new markup
should not add inline spacing.** The vocabulary:

| Need | Classes |
| --- | --- |
| Spacing | `.mt-N .mb-N .pt-N .pb-N` for N = 0–11, mapped to `--sp-N` (4, 8, 12, 16, 24, 32, 40, 48, 56, 72, 96px). `--sp-11/12` are section-level air only. |
| Section rhythm | `.section > :where(.row)` defaults to `32px / 72px`. A row that continues into another opts out with `.pb-0` / `.pb-2`, and the next row brings its own `.pt-N`. The selector is wrapped in `:where()` on purpose: as `.section > .row` it out-ranked every utility and the opt-outs silently did nothing. On mobile, stacked cells get `row-gap: 24px`; rows made only of `.mono-s` labels stay at 8px. |
| Rules | `.rule-top / .rule-bottom` (ink), `.rule-soft-top / -bottom` (`--rule-soft`, flips in CRT), `.rule-dot-top / -bottom` (leader dotted) |
| Measure | `.m-prose` 60ch · `.m-lede` 36ch · `.m-short` 22ch — three widths, not ten |
| Numerals | `.t-num-s / -m / -l` — the three display-number sizes. Work-row, constraint, decision and outcome numerals all sit on these. |
| Item title | `.t-item` — the fixed 20px step used inside numbered rows |
| Numbered rows | `.numbered` (120px number column) and `.numbered-s` (48px); add `.last` on the final row. Collapse to one column under 760px. |
| Layout helpers | `.grid .flex .gap-N .between .row--end .row--baseline .stack .pretty .ink` |
| Repeated blocks | `.meta-row` (masthead meta), `.pager-body`, `.reg` (the ® mark, one size everywhere) |
| Heavy rule | `.rule-top-heavy` (4px ink) — once per page, above the masthead spec block. `work.html` has no spec block, so its first `.section` carries `.rule-heavy` instead. |
| Media frames | `.media--hero` (`.media--short` for the Golisto height), `.media--shot` (2880×2000 surface screenshot), `.media--portrait`, `.media--plate` (the Tagga share banner). Frames are `<figure>`; a single caption is a `<figcaption class="fig-caption">`, multi-corner tags stay `<div>`s. |
| Device plates | `.device` / `.device--android` — square 2px ink plates around a `.media`. No radius anywhere on the site except the app's own marker ring and the two LEDs. |
| Tagga specimens | `.chip` (+ `style="--c:#hex"`, the colour is data) / `.chip--edge`, `.cols-4`, `.t-code`, `.t-title`, `.no-caps`, `.marker-demo .tri.age-1/2/3`, `.marker-demo .ring` |
| Mailto, page fill | `.mailto-xl` (home), `.mailto-xl.mailto-xxl` (contact), `.wrap--fill` + `.grow` (contact page fills the viewport), `.px-margin`, `.end`, `.items-c` |

### Company links

Every structured company mention links out: the client marquee, the nav
context, the footer, the spec-block values, the About two-hats strip and the
record rows. External links carry `rel="noopener"` and open in the same tab,
matching the LinkedIn link. The marquee's second copy is `.marquee-fill`
(`aria-hidden`, `tabindex="-1"` on its links) so the loop adds no tab stops.
Prose mentions are left as text on purpose.

Two names have no destination: **:Dribe** (liquidated May 2024, `dribe.dk`
no longer resolves) and **AJU — Digital Agency** (no site). Verified Sept 2026:
Danske Spil `danskespil.dk` · DBU `dbu.dk` · ForDanmark `fordanmark.dk` ·
Norlys `norlys.dk` · Vild Mad `vildmad.dk` · Kahoot! `kahoot.com` · Native
Instruments `native-instruments.com` · Roskilde Festival `roskilde-festival.dk`
· Aula `aulainfo.dk` (the public site, not the login portal) · TDC Erhverv
`tdc.dk` · Tuborgfondet `tuborgfondet.dk` · KOMBIT `kombit.dk` · Consid
`consid.com/da/` · Golisto `golisto.com` · Tagga `tagga.io`.

### Telemetry markup

Spec blocks are definition lists: `<dl class="kv"><div class="kv-row"><dt>Label</dt><dd>Value</dd></div></dl>`.
The dotted leader and its accent hover fill are the row's `::before`/`::after`,
both placed in the middle grid track, so nothing sits between `dt` and `dd`.
Years are `<time datetime>`, the outcome counters are `<data value>`, and all
mono metadata is set with `tabular-nums`.

Every masthead carries a document reference, `Ref KJ-26/<page> · Rev NN`.
The page codes are IDX, WRK, ABT, CNT, 404, C01 (Golisto), C02 (Tagga). The
revision is filled by `main.js` from the `?v=` on its own script tag, so
bumping the cache-buster bumps the printed revision; the static text in the
HTML is only a no-JS fallback and should be kept in step.

**Craft pass (Sept 2026).** Twelve-rule review, all recommendations applied:
buttons carry **no glow** — bloom stays on static display type as atmosphere,
never on a control at hover; every spacing value in the stylesheet itself is
now a `--sp` token (the inline sweep had left the component internals);
`.t-m` is 16px and `.mono-s` is 12px/.08em, collapsing two near-duplicate
type steps; the two CRT-only `box-shadow`s on `.media` and `.todo-block` are
gone so borders alone carry elevation; `.work-row`, `.pager` and `.nav a`
have pressed states; the media reveal is 400/500ms instead of 760/1200. The
infinite loops (marquee, status pulse, grain, flicker, write-head blink) are
kept deliberately and all guarded under `prefers-reduced-motion`.

Buttons come in two sizes only: `.arrow-link` (primary, 12px, `12px 24px`
padding) and the utility trio `.inspect-btn .theme-toggle .marquee-pause`
(11px, `8px 12px`, `--rule-grid` border, accent on hover/pressed). All four
have a pressed state. Uppercase mono tracks at `.08em` from 12px up and
`.12em` below.

Spec blocks (`.kv`) are container-queried: under 260px of their own width
they stack label over value and drop the leader, so they survive a
three-column cell without wrapping into ragged right-aligned lines.

What is still inline, on purpose: the Tagga device mocks and swatch grid
(they document Tagga's own colours), aspect ratios and media heights, and
the two giant mailto links. Everything else that was inline is now a class.

Layout uses a hand-rolled grid utility system instead of a framework:
- `.row` — 12-column grid container (48px margin / 24px gutter desktop;
  collapses to a 4-column, full-width-stacked layout under 760px).
- `.c1`–`.c12` — `grid-column-end: span N`.
- `.s1`–`.s12` — `grid-column-start: N`.
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
- **Show untreated** — a real button in a `.media-tools` row, which is what
  keyboard and touch get. It drops the image treatment *and* sets `.inspect`
  on `:root`, zeroing grain, scanlines and vignette, so it reaches the same
  fidelity the lens does. Pressing it again restores everything.

  The row sits **below the frame, not on the image**, and this is not
  cosmetic: the lens is centred on the pointer, so any control inside the
  image is covered by the lens at the exact moment you reach for it. It
  stayed hit-testable (the lens is `pointer-events:none`) but invisible,
  which is worse than being disabled. It is built in JS rather than markup,
  because it does nothing without JS and should not be offered then.

The cursor sits at z-index 10000 so the crosshair stays above the lens.

### Image tags

The four corner tags on a photo report the file the visitor actually
received, not authored copy. The browser picks a srcset variant by viewport
and DPR, so the numbers change with the device:

| Tag | Source |
| --- | --- |
| filename | `img.currentSrc` |
| resolution | the srcset `w` descriptor + `data-aspect` on `.media-photo` |
| transfer | `PerformanceResourceTiming.encodedBodySize` |
| treatment | live, flips to "untreated" with the toggle |

The bottom-left tag also carries provenance, which is authored, not derived.
The hero is a real in-action photograph rather than a mockup, and that is a
credential worth stating — file stats alone throw it away.

Two traps, both hit while building this:

- **`naturalWidth` is not the file's resolution.** It reports the *decode*,
  which the browser may downscale — it read 1024 for a 2800px file. The
  srcset `w` descriptor is the intrinsic width by definition, so read it
  from there.
- **Derive height from `data-aspect` (the source dimensions), not from the
  img's `width`/`height`.** Those are already rounded for one variant, and
  deriving from them compounds the rounding — 1562 against a real 1563.

Markup carries plausible fallbacks, so a tag never renders blank or `0 × 0`
if the timing entry is unavailable.

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

### Motion: every state change bridges

An animation-opportunities sweep found that the site's own rule — colour,
opacity and transform changes bridge over `--dur-fast`/`--dur-med` — had
three exceptions where a state simply snapped. All fixed, using the existing
tokens only:

- **Show untreated lifts** instead of popping: the veil, halftone, page grain
  and scanlines transition `opacity var(--dur-med) var(--ease-hard)`, and the
  greyscale `filter` runs the same duration (the one non-transform/opacity
  transition on the site, kept because the lift reads better with it). `.crt`
  is a gradient, so it gets its own `opacity` to animate rather than trying to
  animate gradient stops. Reduced motion shortens these to `--dur-fast`,
  not zero.
- **CRT off mirrors CRT on**: the picture collapses to a scanline over
  `--dur-med` (faster than the 520ms power-on — closing is quicker than
  opening), then the theme swaps. `powerOff()` races `animationend` against
  a 400ms timeout, because a background tab pauses CSS animations and the
  event may never fire — without the fallback the page sits collapsed at
  opacity 0.
- **The giant mailto** was the one colour hover without a transition; it now
  uses the same `color var(--dur-fast) var(--ease-hard)` as every other,
  gated on `(hover:hover) and (pointer:fine)`.
- **Numbered rows join the reveal**, staggered 40ms per row within their own
  group via `--i` set in `main.js` (classes are added in JS so the page reads
  fully without it).

Deliberately not animated, and why: focus rings and the skip link (keyboard-
initiated — never), the lens position and ring (a precision instrument;
smoothing reads as lag), the clock and scroll-progress bar (data the visitor
reads), the marquee pause (must be instant), and the 404 page (already has
the site's entrance; more is decoration).

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
