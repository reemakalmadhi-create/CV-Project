# FITTED — AI virtual try-on (Next.js + React)

The same FITTED store as the Streamlit prototype, rebuilt with **Next.js 15 (App Router),
React 19, TypeScript and Tailwind v4 (shadcn structure)**, plus a full navigation and motion
layer: **Framer Motion + GSAP ScrollTrigger + Lenis smooth scrolling**.

The try-on model is **CatVTON** (pretrained, ICLR 2025), with its attention layers fine-tuned by
our team. It runs in the Python service (`tryon-service/`). Without `TRYON_API_URL` the site shows
*"Try-on model not connected"*. No result is ever faked.

## Run it

```bash
npm install
cp .env.example .env.local      # set SESSION_SECRET to any long random string
npm run dev                     # http://localhost:3000
```

Create an account on `/signup`. Data is saved in `./.data/` (JSON files).

Optional: the Python try-on service (`tryon-service/`, see its README):

```bash
cd tryon-service && pip install -r requirements.txt && uvicorn main:app --port 8000
# .env.local:  TRYON_API_URL=http://localhost:8000
```

## Pages

| Route | What's there |
|---|---|
| splash | Fitting-room curtain: FITTED writes in, then the curtain draws open. Once per visit; never flashes (decided before first paint) |
| `/login`, `/signup` | Centered card, show/hide password, remember me (30-day cookie), forgot-password dialog, live password rules |
| `/` Home | Compact "Welcome back, *name*", the **ClothingRailHero** right under it (click a piece → its product page), featured edit, how try-on works |
| `/closet` | Category pills (sliding active pill), colour chips, search, sort, animated grid re-flow, 3D-tilt cards (View / Try on / ♡) |
| `/product/[id]` | Drag-to-turn 3D stage (front/back, snaps), required size picker (shakes if missing), size guide, quantity, Try on, Add to bag, favourites, "You may also like" |
| `/my-closet` | **My closet**: upload your own garment photos (e.g. a hoodie saved from a shop site) with a name + category; rename, delete, Try on. Also **My poses**: save up to 12 photos of yourself |
| `/try-on` | Pick one or more saved poses + a garment (My closet or Shop tab) → the garment is generated on every chosen pose, one at a time, with progress and a results strip. |
| `/try-on` (old notes) | Drag & drop upload, photo checks (format, size, resolution, orientation, light, focus), prepared 768×1024 input, garment + category, Generate → Lottie loader → honest pending card; result viewer with before/after slider + download (enabled only for real results) |
| `/favorites` | View, try on, add to bag (uses your saved size), remove (animated) |
| `/bag` | Quantity steppers, remove, subtotal, free-delivery progress bar, total, prototype checkout dialog |
| `/profile` | Avatar, name/email, saved sizes, try-on history, orders, change password, sign out everywhere, delete account (animated tabs) |

## Navigation & motion

- **Page transitions:** `app/(shop)/template.tsx` fades, lifts and settles every page. The navbar sits in the layout, so it never re-animates. No `loading.tsx`, so the old page stays until the new one is ready (no loading flash). Product pages are prefetched from the rail.
- **Navbar:** a shared-layout underline (`layoutId`) glides to the active link. The bar hides when scrolling down and returns when scrolling up, the blur strengthens after scrolling, the bag and favourites counters pop on change, and the account menu and mobile menu are animated.
- **Smooth scrolling:** Lenis, driven by GSAP's ticker, so ScrollTrigger stays in sync. It's paused while dialogs are open.
- **Scroll reveals:** the `<Reveal>` component uses GSAP ScrollTrigger. Content is visible by default and only animated once JS runs.
- **Micro-interactions:** buttons lift and press, the black button gets a light sweep, outline buttons fill from the bottom, arrows nudge right, the heart pops, and quantities and totals tick.
- **Shared language:** one easing (`lib/motion.ts`) and one spring. `prefers-reduced-motion` turns motion off everywhere.

## Structure

```
app/
  layout.tsx            fonts, splash, toasts, smooth scroll
  (auth)/login, signup  centered auth (redirects to / when signed in)
  (shop)/layout.tsx     server auth check + UserProvider + navbar + footer
  (shop)/template.tsx   page transitions
  (shop)/page.tsx, closet, product/[id], try-on, favorites, bag, profile
  api/                  auth, me, password, sessions, favorites, cart, orders, tryon
components/
  ui/product-rail-gallery.tsx   ClothingRailHero (original + onSelect prop)
  ui/button.tsx, ui/dialog.tsx
  navbar, splash, reveal, smooth-scroll, toast, user-context, product-card,
  closet-view, product-detail, tryon/*, favorites-view, bag-view, profile-view, auth-form
lib/  catalog, db (JSON store), auth (PBKDF2 + signed cookie), shop, image-checks, gsap, motion
data/catalog.json       10 pieces, prices in SAR
tryon-service/          Python FastAPI + model/idm_vton (placeholders)
middleware.ts           redirects signed-out visitors to /login
```

## Deploy to Vercel

1. Push to GitHub → import the repo in Vercel (framework: Next.js).
2. Environment variables: `SESSION_SECRET` (required), optionally `TRYON_API_URL`.
3. Deploy.

**Know before demoing:** Vercel's disk is temporary. Accounts are saved to `/tmp` and reset
on redeploys or cold starts. For real use, swap `lib/db.ts` (one file) for a database such as
Supabase, Postgres or Vercel KV. Vercel also has no GPU, so run `tryon-service/` on a GPU
machine and point `TRYON_API_URL` at it.

## Checks

`npm run typecheck` runs TypeScript. Type errors don't block `npm run build` in this
prototype (`next.config.ts`). Run the typecheck after `npm install` and fix anything it reports.

## Password reset

The dialog is wired but sends no email. To enable it, add an email provider, issue a
one-time token (like the session token in `lib/auth.ts`), and add a set-new-password page.

## Theme, Arabic & About page

- **Light beige theme** — the brand image recoloured to cream, beige and pale yellow (`public/brand/aura-beige.jpg`; cream `#fbf8f1`, ink `#1f1a14`, caramel `#b8894e`). The same image is the splash and, blurred, the fixed site background (`components/backdrop.tsx`). Product photos sit on light `.showroom` panels so dark garments stay readable.
- **Splash** — `components/splash.tsx`: the aura image fades in, the FITTED wordmark appears letter by letter, then zooms through into the site. Shown once per browser session; skipped with reduced motion.
- **Arabic / RTL** — switch with the EN | العربية button (navbar, mobile menu, login). Strings live in `lib/i18n.ts`, product translations in `data/catalog.json` (`ar`), the choice in the `fitted_lang` cookie.
- **Images** — `next/image` (AVIF/WebP, responsive sizes, priority for the first row).
- **About the model** — public page at `/about` for students. Model details are in `lib/model-info.ts`; change the name there and every page updates.

## Try-on service contract

`POST /api/tryon` (browser → Next.js): multipart `poseId` (or `person` file), `garmentId` (own garment) or
`productId` (shop), `category`. Next.js forwards to `${TRYON_API_URL}/tryon` as multipart:

| field | value |
|---|---|
| `person` | file — the saved pose (JPEG, 768×1024) |
| `garment` | file — the own garment photo (JPEG, ≤1024 px) or the shop product photo fetched server-side (may be WEBP) |
| `category` | `upper_body` · `lower_body` · `dresses` |
| `description` | garment name / product description |
| `garment_id` | `own:<id>` or the product id |

Reply: `{"status":"ok","image_base64":"…"}` · `{"status":"pending",…}` · `{"status":"error","message":…}`.
Timeout 240 s (the model runs on a Mac, about a minute per image). Poses, own garments and results are
stored per user (`.data/tryon/` or Redis) and served only to their owner by `/api/media/[file]`.
