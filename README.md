# The Reserve — website

A scroll-driven, single-page film for The Reserve (Kerala): three scenes (Residences, Mobility, Experiences) joined by WebGL ink and cloud transitions, ending in an enquiry section.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP ScrollTrigger and Framer Motion.

## Requirements

- **Node.js 20.9 or newer** (tested on Node 24)
- A host that can run Node: the page itself is static, but the enquiry form posts to a small server endpoint (`/api/enquire`).

## Run it locally

```bash
npm ci
npm run dev
```

Then open http://localhost:3000.

## Deploy

### Option A — Vercel (simplest)

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel, choose **Add New → Project** and import the repository. The framework is detected automatically; no build settings need changing.
3. Add the environment variable `NEXT_PUBLIC_SITE_URL` with the live address, e.g. `https://thereserve.in`.
4. Deploy, then attach the custom domain under **Settings → Domains**.

Netlify, Render, Railway and similar Node platforms work the same way: build command `npm run build`, start command `npm start`.

### Option B — any Node server or VPS

```bash
npm ci
NEXT_PUBLIC_SITE_URL=https://your-domain.com npm run build
PORT=3000 npm start
```

Run `npm start` under a process manager (pm2, systemd or Docker) behind a reverse proxy such as Nginx or Caddy for HTTPS.

## Before going live

These are first-draft values that must be replaced with the brand's real details:

| What | Where |
|---|---|
| Phone, email, address, Instagram handle and URL | `src/content/site.ts` → `site.contact` |
| Enquiry delivery: submissions are validated but currently only **logged on the server**, not emailed | `src/app/api/enquire/route.ts` → `deliver()`: connect an email service (Resend, Postmark, SendGrid…) or a CRM |
| Copyright year | `src/content/site.ts` → `copyrightYear` |

Also worth knowing:

- The SUV image (`public/scenes/road-*.webp`) is AI-generated and shows a "RANGE ROVER" bonnet wordmark. Using Land Rover's trademark on a commercial site needs their permission. Otherwise, replace or retouch the image.
- All four scene images are AI-generated (SenseNova U1.5). Swap in commissioned photography by replacing the files in `public/scenes/` with the same names and 16:9 proportions (2400px and 1280px widths).

## Where things live

| Path | Purpose |
|---|---|
| `src/content/site.ts` | All copy, contact details and image alt text |
| `src/lib/timeline.ts` | The scroll timeline: camera, ink, mist and transition timing per scene |
| `src/lib/inkShader.ts` | The WebGL shader (ink wash, ink and cloud transitions, mist, grain) |
| `src/components/InkStage.tsx` | The full-screen canvas, with a still-image fallback for reduced motion and no-WebGL |
| `src/components/Experience.tsx` | Scroll track, copy overlays, progress rail, navigation |
| `src/components/Finale.tsx`, `EnquiryDialog.tsx` | Closing section, footer and enquiry form |
| `public/scenes/` | Scene images (WebP, desktop and mobile sizes) |
| `PROMPT.md` | The design brief the site was built from |

## Accessibility and fallbacks

- `prefers-reduced-motion`: no WebGL or camera motion; scenes cross-fade as still images.
- No WebGL, or a lost GPU context: the same still-image fallback.
- No JavaScript: a plain editorial version of the three scenes and an enquiry email link.
