# Bollineni Vienna — Visual Redesign (Motion Pass)

**Date:** 2026-09-25
**Status:** Approved in chat, awaiting written-spec review

## Goal

The landing page looks old and too simple. Make it feel modern and interactive
by adding four pieces of motion, while keeping the existing content, section
order (except as noted), API, and ink/khaki/beige palette.

## Constraints

- Palette stays: `ink #0c0c0c`, `khaki #efe9dd`, `beige #fbf8f1`, greys. No new accent color.
- Fonts stay: Cormorant Garamond (headings), Plus Jakarta Sans (body).
- Copy: only existing text is used (Hero, `Villa.tsx` summary, gallery names). No new marketing copy
  except the Lanyard card faces and the popup heading ("Enquire Now").
- Tailwind utilities in JSX; plain, readable components (no generic renderers).
- Motion code uses GSAP (already installed) + `gsap/ScrollTrigger` (ships with `gsap`).
- Every animated piece respects `prefers-reduced-motion` with a static fallback.
- The Animmaster Lib references are locked Pro components; both scroll sequences are built from
  scratch from the screen recordings, not copied.
- Next.js 16.2: read `node_modules/next/dist/docs/` for any API used (dynamic import, `next/image`) before writing code.

## Build order

1. `ContactForm` (shared form)
2. Staggered Menu + Navbar cleanup
3. Lanyard + Enquiry popup
4. Hero curtain-wipe sequence
5. Residences scroll story

---

## 1. `ContactForm` component

**Files:** new `src/components/ContactForm.tsx`; `src/components/BookingForm.tsx` slimmed.

- `ContactForm` (client) owns everything currently inside the `<form>` in `BookingForm.tsx`:
  field state (name, phone + dial code, email, purpose, message), `POST /api/contact`,
  `router.push("/thank-you")` on success, the error box, and the existing field markup/classes
  and phone-input CSS hooks (`.contact-phone-input`, `.contact-phone-dialcode`, `.contact-phone-divider`).
- One prop: `idPrefix: string`. All element `id`s become `${idPrefix}-<Name>` (e.g. `book-Phone`,
  `enquire-Phone`) so both forms can be in the DOM at once without duplicate ids. `name` attributes unchanged.
- The form does not set its own width; the parent does.
- `BookingForm.tsx` keeps only the `#book` section, "Contact Us" heading/text, and the width wrapper,
  rendering `<ContactForm idPrefix="book" />`. `page.tsx` keeps its `dynamic()` import of `BookingForm`.
- Purpose dropdown starts empty ("Purpose of Enquiry") in both places.
- `/api/contact` is unchanged; the request payload must be byte-identical to today's.

**Verify:** submit from `#book` → payload unchanged, redirect to `/thank-you`; no duplicate ids; `next build` + lint pass.

## 2. Staggered Menu (top-right floating toggle)

**Files:** new `src/components/StaggeredMenu.tsx`; `src/components/Navbar.tsx` edited; `page.tsx` renders the menu.

- Adapted from React Bits `StaggeredMenu` (code supplied by the user): same GSAP open timeline
  (pre-layers slide in, then panel, then items rise from `yPercent:140, rotate:10` with stagger),
  same close tween, plus-icon rotation, and Menu/Close text roll.
- Drop the component's own header logo; only the toggle button and panel remain.
- Move the inline `<style>` block into Tailwind classes; keep CSS only for what Tailwind can't
  express (counter numbering via `::after`, `--sm-num-opacity`).
- **Toggle:** `position: fixed`, top-right, always visible; beige pill with ink text.
- **Panel items (numbered 01–09):** About `#about`, Residences `#residences`, Floor Plans `#floor-plans`,
  Amenities `#amenities`, Why Invest `#invest`, Builder `#builder`, FAQ `#faq`, Location `#location`,
  Book `#book`. Clicking a link closes the menu, then scrolls to the section.
- **Panel footer** (replaces "Socials"): phone `tel:+918722000148`, email `mailto:bscplre9@gmail.com`, Instagram (existing link from `Footer.tsx`).
- **Colors:** pre-layers khaki then ink; panel beige; items ink; hover fades to grey.
- **Behavior:** scroll locked while open via existing `lockScroll`/`unlockScroll` (`src/lib/scrollLock`);
  Escape and click-away close; full-width panel below 1024px; reduced motion → panel appears instantly.
- **Navbar:** remove `MENU`, `BOOK NOW`, and the old `.nav-menu_component` overlay (and its now-unused CSS).
  Keep the centered logo, which scrolls away with the page.

**Verify:** open/close, every link lands on its section, Escape, click-away, scroll lock.

## 3. Lanyard "Enquire Now!" card + Enquiry popup

**Files:** new `src/components/Lanyard.tsx`, new `src/components/EnquiryModal.tsx`,
`public/lanyard/card.glb`, `public/lanyard/lanyard.png`, `public/lanyard/card-front.png`, `public/lanyard/card-back.png`.

- **Dependencies:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `meshline`.
  Pick versions compatible with React 19.2 before installing.
- Adapted from React Bits `Lanyard` (code supplied by the user). `card.glb` and `lanyard.png` from the React Bits repo.
- **Card faces** (static PNGs generated once, composited via the component's `frontImage`/`backImage`):
  - Front: Bollineni Vienna logo + "ENQUIRE NOW!" in Cormorant, ink on beige.
  - Back: phone number + "Book a site visit".
- **Placement:** fixed, top-left, visible on every section and on all screen sizes, including phones (3D on mobile at the component's reduced settings).
- **Clicks pass through:** the canvas has `pointer-events: none`; R3F receives events from `document.body`
  (`eventSource`), so only the card mesh is interactive and page content under the strap stays clickable.
  A touch that starts on the card drags it and does not scroll the page; touches elsewhere scroll normally.
- **Opening the popup:** (a) dragging the card down past a threshold and releasing, (b) a plain click/tap
  on the card, (c) a visually hidden, keyboard-focusable "Enquire now" button at the same spot. The card springs back after opening.
- **Loading:** `dynamic(..., { ssr: false })`, mounted after `LoadingScreen` finishes, so 3D code is not in the first-load bundle.
- **`EnquiryModal`:** native `<dialog>` (Escape + focus trap built in); ink backdrop, beige panel, "Enquire Now"
  heading, `<ContactForm idPrefix="enquire" />` loaded on first open. Close via X, Escape, backdrop click.
  Scroll locked while open. GSAP fade + scale entrance (instant under reduced motion).

**Verify:** each of the three triggers opens the popup; popup submit reaches `/thank-you`; page behind the strap is clickable;
first-load JS does not include three/r3f.

## 4. Hero — curtain-wipe / zoom-through sequence

**File:** `src/components/Hero.tsx` rewritten (replaces the current scroll-listener width expansion).

- Pinned ScrollTrigger section with `scrub`; ~400vh of scroll on desktop, ~300vh on phones. Scrolling back rewinds.
- **Scenes:**
  1. Pool photo (`/images/gallery/gallery-04.jpg`) full-bleed; `<h1>` "BOLLINENI VIENNA" + "Luxury 4 & 5 BHK Apartments in Kogilu, North Bangalore". Visible without scrolling.
  2. Ink vertical line in the center widens to cover the frame.
  3. Living-room photo (`/images/about.jpg`) appears small inside the ink and scales to full-bleed; inside it the top-view photo (`/images/gallery/gallery-09.jpg`) appears and scales to full-bleed.
  4. Ink card grows to full screen with: "Expansive 4 & 5 BHK residences, lush greens, and curated amenities come together in a refined address where sophistication meets serenity."
  5. Khaki bar opens from the center to reveal "Contemporary luxury living in North Bengaluru" on khaki; pin releases into About.
- First photo keeps `preload`/`loading="eager"`; others lazy via `next/image`.
- Timeline is created after `LoadingScreen` finishes.
- Reduced motion: no pin; scenes render as a static stack of full-width frames.

**Verify:** scroll forward/back with no jump at pin start/end; first photo eager; reduced-motion fallback renders.

## 5. Residences — tilted strip / zoom / horizontal scroll story

**File:** `src/components/Residences.tsx` rewritten. Data from `useVilla()` (9 `gallery` images + `summary`).

- Pinned ScrollTrigger section with `scrub`; ~500vh on desktop, shorter on phones.
- `summary` is split into its three sentences; each is used once below.
- **Scenes:**
  1. "RESIDENCE" heading on beige; tilted strip of the 9 photos drifting sideways along the bottom.
  2. The Bedroom photo straightens (rotate → 0) and scales to full-bleed.
  3. Horizontal track (pinned, translates left): full-bleed photos alternating with ink text panels
     (one summary sentence + a smaller portrait photo). Photos keep their "NN Name" captions.
  4. Closing: third summary sentence centered on beige; tilted strip returns along the bottom.
- Clicking a photo opens the existing lightbox (prev/next retained).
- Phones: same sequence, portrait-cropped frames, shorter pin.
- Reduced motion: no pin; static vertical list of photos and text.
- `ScrollTrigger.refresh()` after images load so pin lengths are correct.

**Verify:** forward/back scrolling, track ends cleanly on closing scene, lightbox opens from the track, Hero and Residences pins don't interfere.

---

## Out of scope

- Other sections (About, Floor Plans, Amenities, Why Invest, Builder, FAQ, Location, Footer) — no visual changes beyond what the menu/Navbar changes require.
- Palette/typography changes.
- `/api/contact` changes.

## Known testing limitation

Browser automation here can't actually resize the viewport (`resize_window` doesn't change `innerWidth`).
Mobile behavior is checked by code review of breakpoints plus the user's own device, not claimed as visually verified.
