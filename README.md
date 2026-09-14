# Kenneth Jensen — Portfolio

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
schema: bone ground `#F2F0EA`, ink `#111`, cobalt accent `#2340D9`, Archivo +
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

Two implementation notes worth keeping:

- The grain tile **must repeat at 1:1**. Stretching a small canvas across
  the viewport smears it into blobs instead of grain.
- Glow is applied to display type, accent and rules — **not** to body
  copy. Glow on running text costs more legibility than it buys.

Set `--glow: 0` to remove the bloom entirely; the layout is unaffected.

### CRT mode

A toggle in the nav swaps to a dark phosphor theme (ground and ink swap
per the Foundations token spec; the cobalt accent is lifted because
`#2340D9` measures 2.5:1 on ink and fails). The choice persists in
`localStorage` and is applied by a small inline script in each `<head>`
so there's no flash on load. Delete that script, the `.theme-toggle`
block in `main.js`, and the `[data-theme="crt"]` token block to remove.

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

Five of the six work-index cases (`golisto`, `dribe`, `norlys`, `fordanmark`)
are masthead-only stubs pending full write-ups; only Tagga is fully built out
end-to-end as the template reference. Vild Mad carries its real "outcome
without numbers" copy from the design brief.
