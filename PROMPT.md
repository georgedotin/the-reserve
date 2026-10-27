# THE RESERVE — Cinematic Scroll Website (improved brief)

> Revision of the original brief. Changes are summarised at the bottom.

## 1. Goal

A single, continuous, scroll-scrubbed film for **THE RESERVE**, a private lifestyle and access brand in Kerala built on three pillars: **Residences, Mobility, Experiences**. The visitor never sees "sections" — one fixed full-viewport stage plays a single camera journey that ends in a quiet enquiry moment.

Feeling: calm, deliberate, expensive. Architectural Digest × Aman × a restrained automotive campaign. Ink painting is the **signature transition language**, used only at scene thresholds — never as a filter on everything.

## 2. Topology (non-negotiable)

```
[ink-wash villa] → colour bloom → push-in → INK DISSOLVE →
[mist road] → mist clears, forward drive → INK RISES →
[helipad] → push → CLOUD LIFT (ground → aerial) →
[aerial Kerala to the sea] → wordmark → enquiry
```

- One fixed `<canvas>` stage behind everything; one scroll track (~900vh) drives a single 0→1 progress value.
- Scroll progress is the only clock for the story; time is used only for ambient mist drift.
- Copy blocks are transparent overlays tied to progress windows; they are hidden during transitions.

### Progress map

| Progress | Stage | Copy |
|---|---|---|
| 0.00–0.04 | Monochrome ink-wash villa, paper grain | THE RESERVE · scroll cue |
| 0.04–0.18 | Colour blooms outward through the ink, slow push | Space to slow down. |
| 0.18–0.28 | Push towards the roofline and pool | (held) |
| 0.28–0.38 | Villa breaks into ink; road condenses out of pigment | — |
| 0.38–0.58 | Mist clears around the SUV; forward drive | The journey is yours. |
| 0.58–0.68 | Ink rises from the valley floor; helipad appears | — |
| 0.68–0.80 | Golden light, slight push | Beyond the ordinary. |
| 0.80–0.90 | Clouds lift, camera pulls up to the aerial view | — |
| 0.90–1.00 | Aerial settle to the sea; final wordmark | THE RESERVE |

## 3. Scenes and assets

Four 16:9 stills (≥2400px, WebP, plus 1280px mobile variants), one shared style block, a safe central crop and empty upper-third sky for typography.

1. **Villa** — high aerial three-quarter; steep terracotta tiled roofs, teak, laterite, dark-green infinity pool, frangipani courtyard, palms, backwater, monsoon mist, first golden light. A private home, not a resort.
2. **Road** — dark forest-green full-size luxury SUV (*no badges or plate text*) on a wet winding road through Munnar tea estates, mist on the Ghats, ferns in foreground.
3. **Helipad** — charcoal-green private helicopter (no markings) on a laterite-edged pad on a ridge, valley of cloud beyond, volumetric golden light.
4. **Aerial** — Western Ghats rolling to an Arabian Sea horizon at golden hour, clouds below camera, tiny helicopter silhouette, open sky for the wordmark.

Optional upgrade: replace stills with 4–6s image-to-video clips (Seedance / similar) scrubbed by scroll, keeping the stills as posters and fallback.

## 4. Identity

- **Colour:** forest `#14231b`, deep `#0d1712`, ivory `#f3ede1`, paper `#e9e1d0`, charcoal `#161614`, brass `#b59a6a` (accents only, never gradients).
- **Type:** Cormorant Garamond (display, light weights, oversized, tight leading) + Manrope (UI, 11–13px uppercase labels at 0.32em tracking).
- **Rules:** no cards, no grids, no glassmorphism, no gold gradients, no stock imagery, no emoji.

## 5. Interface

- Top-left wordmark; right-aligned nav: Residences · Mobility · Experiences · Enquire. Nav links scroll to the start of each scene's range; `aria-current` follows progress. Mobile: a single "Menu" toggle opening a full-screen ivory sheet.
- Opening scroll cue (thin animated line + "Scroll"), fades after first movement.
- Three-part progress rail (bottom-left desktop / bottom centre mobile) labelled I · II · III.
- Enquiry finale (after the film): headline, sub-line, **Discover The Reserve** (returns to the start of the journey) and **Make an Enquiry** (opens an accessible dialog form: name, email, phone optional, interest, timing, message, consent). Posts to `/api/enquire` with server-side validation; success and error states.
- Footer: address, phone, email, Instagram, © year. **Real contact details must be supplied** — no `#` links.

## 6. Technical

- Next.js (App Router) + TypeScript + Tailwind; GSAP ScrollTrigger for scrubbed progress and copy timelines; Framer Motion for the menu and dialog.
- WebGL1 fragment shader: two textures, cover-fit with per-scene focal points, fbm-noise ink threshold with dark pigment fringe and specks, ink-wash stylisation (luminance + edge darkening + paper grain), procedural mist.
- Performance: DPR cap 1.5 (1.0 on mobile), render loop paused when the stage is off-screen or the tab is hidden, textures loaded progressively (scene 1 first), ≤ 2.5 MB total images on desktop.
- Fallbacks: `prefers-reduced-motion` or no WebGL → layered stills with gentle cross-fades, no camera movement; content fully readable without JS.
- Acceptance: scroll forwards and backwards with no flashes; nav jumps land on the right scene; works at 390×844, 768×1024 and 1440×900; enquiry submits and shows confirmation; Lighthouse performance ≥ 85 on desktop.

## What changed from the original brief

1. Removed the duplicated copy of the brief (it was pasted twice).
2. Added an explicit **progress map** so "one continuous journey" is testable rather than aspirational.
3. Chose a concrete, performant rendering approach (two-texture WebGL shader) instead of listing every option.
4. Locked hex values and font names so the identity is reproducible.
5. Turned "Range Rover" into a de-badged SUV in image prompts — generated trademarks on a commercial site are a legal risk unless you have Land Rover's permission or your own photography.
6. Specified the enquiry form fields, endpoint, and states, and flagged that real contact details are required to satisfy "no placeholder links".
7. Added measurable acceptance criteria (viewports, reverse scroll, Lighthouse).
