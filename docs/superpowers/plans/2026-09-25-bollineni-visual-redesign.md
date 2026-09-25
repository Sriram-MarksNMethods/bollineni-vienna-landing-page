# Bollineni Vienna Visual Redesign (Motion Pass) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared contact form, a React Bits staggered menu, a 3D "Enquire Now!" lanyard that opens a popup form, and two pinned GSAP scroll sequences (Hero, Residences) to the Bollineni Vienna landing page.

**Architecture:** Each piece is one focused client component in `src/components/`. A tiny module `src/lib/loaderDone.ts` lets components wait for the existing `LoadingScreen` to finish before starting animations or loading 3D code. `EnquiryLauncher` (client) owns the popup's open state and wires the Lanyard and the keyboard button to `EnquiryModal`. Scroll sequences use GSAP `ScrollTrigger` with `gsap.matchMedia()` so reduced-motion visitors get static layouts.

**Tech Stack:** Next.js 16.2 (App Router), React 19.2, TypeScript, Tailwind v4, GSAP 3.15 + `@gsap/react` (`useGSAP`), `ScrollTrigger` (ships in `gsap`), three.js + `@react-three/fiber` 9 + `@react-three/drei` 10 + `@react-three/rapier` 2 + `meshline` 3.

**Spec:** `docs/superpowers/specs/2026-09-25-bollineni-visual-redesign-design.md`

## Global Constraints

- Palette only: `ink #0c0c0c`, `khaki #efe9dd`, `beige #fbf8f1`, existing greys. No new accent color.
- Fonts only: Cormorant Garamond (`font-heading`), Plus Jakarta Sans (`font-body`).
- Copy: existing text only (Hero, `Villa.tsx` summary, gallery names, existing menu labels), except the Lanyard card faces and the popup heading "Enquire Now".
- Tailwind utilities in JSX; CSS in `globals.css` only for what Tailwind can't express. Plain readable components, no generic renderers.
- Every animation has a `prefers-reduced-motion: reduce` fallback.
- `/api/contact` must not change; the form's request payload must stay identical.
- Both scroll sequences are built from scratch (the Animmaster references are locked Pro components).
- Next.js 16 differs from older versions: before using any Next API, read the matching file in `node_modules/next/dist/docs/` (dynamic import: `01-app/02-guides/lazy-loading.md` — `ssr: false` only works inside a Client Component).
- Do NOT put Tailwind transform utilities (`translate-*`, `scale-*`, `rotate-*`) on elements GSAP animates: Tailwind v4 uses the separate CSS `translate`/`scale`/`rotate` properties, which stack with GSAP's `transform`.

## Testing approach

This repo has no test runner, and adding one for a marketing page is out of scope. Every task instead ends with a **verification checklist** of exact commands and browser checks with expected results:

- `npx tsc --noEmit` → no output, exit 0
- `npm run lint` → no errors
- `npm run build` → "Compiled successfully", exit 0
- Browser checks on the dev server (`npm run dev -- -p 3001`, http://localhost:3001) using claude-in-chrome. Known quirks here: `resize_window` does NOT change `innerWidth` (mobile is verified by code review of breakpoint classes only — never claim visual mobile verification); the loading screen can freeze in a background tab (use one focused tab); scroll with real mouse-wheel `scroll` actions, not `window.scrollTo`, when checking pinned sections.

## Review Focus

1. **Both forms in the DOM at once** (popup opened while `#book` is rendered) → no duplicate element ids; each form submits its own values. Checked in Task 3.
2. **Menu link clicked while scroll is locked** → menu closes, lock releases, page lands on the section (not back at the old scroll position). Checked in Task 2.
3. **Clicking page content under the Lanyard strap area** (e.g. the Navbar logo link, text on the left) → the click reaches the page, not the canvas. Checked in Task 4.
4. **Scrolling backwards through a pinned section, and fast scroll through both** → scenes rewind cleanly; Residences starts only after Hero's pin space ends (no overlap/jump). Checked in Tasks 5–7.
5. **Reduced motion on** → no pinning, all scene content readable as a static stack; menu and popup appear instantly. Checked in Task 7.

---

### Task 1: Extract `ContactForm` from `BookingForm`

**Files:**
- Create: `src/components/ContactForm.tsx`
- Modify: `src/components/BookingForm.tsx` (whole file)

**Interfaces:**
- Produces: `export default function ContactForm({ idPrefix }: { idPrefix: string })` — a client component rendering the full form + error box. Element ids are `${idPrefix}-contact-form`, `${idPrefix}-Full-Name`, `${idPrefix}-Phone`, `${idPrefix}-Email`, `${idPrefix}-Purpose`, `${idPrefix}-Message`. It sets no width of its own.

- [ ] **Step 1: Record today's payload (baseline)**

Start the dev server (`npm run dev -- -p 3001`), open http://localhost:3001/#book, and run this in the page (claude-in-chrome `javascript_tool`) to capture the request without sending email:

```js
window.__captured = null;
const realFetch = window.fetch;
window.fetch = async (url, opts) => {
  if (String(url).includes("/api/contact")) {
    window.__captured = opts.body;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  return realFetch(url, opts);
};
"patched";
```

Fill the form: Full Name `Test User`, Phone `9876543210`, Email `test@example.com`, Purpose `Site Visit`, Message `hello`; click Submit. The app navigates to `/thank-you` with a client-side `router.push`, so `window` is kept — then run `window.__captured`.
Expected baseline: `{"name":"Test User","phone":"+919876543210","email":"test@example.com","purpose":"site-visit","message":"hello"}`. Save it for Step 4.

- [ ] **Step 2: Create `src/components/ContactForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Button from "./Button";

const inputClass =
  "block w-full bg-beige border border-[#ccc] rounded-[0.75vw] max-lg:rounded-lg min-h-[3.5vw] max-lg:min-h-12 max-md:min-h-11 mb-[0.5vw] max-lg:mb-3 py-[1vw] px-[1.25vw] max-lg:py-2 max-lg:px-4 text-[#333] text-sm placeholder:text-[#999] focus:border-[#3898ec] focus:outline-none";

const purposeOptions = [
  { value: "general-enquiry", label: "General Enquiry" },
  { value: "download-brochure", label: "Download Brochure" },
  { value: "site-visit", label: "Site Visit" },
];

type Status = "idle" | "submitting" | "error";

// Used twice on the home page (Contact section + Enquire Now popup), so every
// element id is prefixed to keep ids unique when both are in the DOM.
export default function ContactForm({ idPrefix }: { idPrefix: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("91");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: `+${dialCode}${phone}`, email, purpose, message }),
      });

      if (!res.ok) throw new Error("Submission failed");

      router.push("/thank-you");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <form
        id={`${idPrefix}-contact-form`}
        onSubmit={handleSubmit}
        className="flex flex-col overflow-hidden gap-[1.5vw] max-lg:gap-5 max-md:gap-4"
      >
        <div className="grid grid-cols-2 gap-[1.5vw] max-lg:gap-x-6 max-lg:gap-y-3 max-md:gap-y-2">
          <div className="col-span-2">
            <input
              className={inputClass}
              maxLength={256}
              name="Full-Name"
              placeholder="Full Name"
              type="text"
              id={`${idPrefix}-Full-Name`}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="max-md:col-span-2">
            <div className="contact-phone-input relative">
              <PhoneInput
                country={"in"}
                value={phone}
                onChange={(value, data) => {
                  setPhone(value);
                  setDialCode((data as CountryData).dialCode);
                }}
                onMount={(value, data) => {
                  setDialCode((data as CountryData).dialCode);
                }}
                enableSearch
                disableCountryCode
                disableCountryGuess
                inputProps={{
                  name: "Phone",
                  id: `${idPrefix}-Phone`,
                  required: true,
                }}
                containerClass="w-full"
                specialLabel=""
                placeholder="Phone Number"
              />
              <span className="contact-phone-dialcode">+{dialCode}</span>
              <span className="contact-phone-divider" aria-hidden="true" />
            </div>
          </div>
          <div className="max-md:col-span-2">
            <input
              className={inputClass}
              maxLength={256}
              name="Email"
              placeholder="Email"
              type="email"
              id={`${idPrefix}-Email`}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <select
              id={`${idPrefix}-Purpose`}
              name="Purpose"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={`${inputClass} appearance-none bg-[url('/images/icons/caret-down-select.svg')] bg-no-repeat bg-[position:95%] bg-[length:1.25vw_1.25vw] max-lg:bg-[length:1.25rem_1.25rem]`}
            >
              <option value="" disabled>
                Purpose of Enquiry
              </option>
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <textarea
              className={`${inputClass} min-h-[8vw] max-lg:min-h-32 resize-none`}
              maxLength={2000}
              name="Message"
              placeholder="Message"
              id={`${idPrefix}-Message`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <div className="grid grid-cols-1 w-full">
            <Button
              type="submit"
              variant="form-submit"
              text={status === "submitting" ? "Submitting..." : "Submit"}
              disabled={status === "submitting"}
            />
          </div>
        </div>
      </form>
      {status === "error" && (
        <div className="bg-[#f8e4e4] text-[#3b0b0b] mt-[1vw] max-lg:mt-4 p-3 text-center">
          <div>Oops! Something went wrong while submitting the form.</div>
        </div>
      )}
    </>
  );
}
```

(The Webflow leftovers `data-name` and `name="wf-form-Book-Form"` are dropped; nothing in `src/` references them.)

- [ ] **Step 3: Replace `src/components/BookingForm.tsx` with the section wrapper**

```tsx
import ContactForm from "./ContactForm";

export default function BookingForm() {
  return (
    <section id="book" className="bg-khaki relative">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
        <div className="flex flex-col items-center gap-[0.75vw] max-lg:gap-2">
          <h2 className="text-6xl max-lg:text-5xl max-md:text-3xl font-medium leading-none">Contact Us</h2>
          <p className="text-center w-[30vw] max-lg:w-[30rem] max-sm:w-[75vw]">
            Fill out the form below.
          </p>
        </div>
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        <div className="flex justify-center">
          <div className="w-1/2 mb-0 max-lg:w-[95%]">
            <ContactForm idPrefix="book" />
          </div>
        </div>
        <div className="w-full pt-28 max-lg:pt-24 max-md:pt-16"></div>
      </div>
    </section>
  );
}
```

`src/app/page.tsx` keeps `const BookingForm = dynamic(() => import("@/components/BookingForm"));` unchanged.

- [ ] **Step 4: Verify**

- `npx tsc --noEmit` → exit 0. `npm run lint` → no errors.
- Browser: repeat Step 1's patch + fill + `requestSubmit()`; `window.__captured` must equal the saved baseline string exactly.
- Browser: `document.getElementById("book-Phone") !== null && document.getElementById("Phone") === null` → `true`.
- Browser (unpatched fetch): submitting still shows the error box when SMTP is not configured, or redirects to `/thank-you` when it is — same as before.
- Phone input still looks the same (flag → +91 → chevron → divider → number): screenshot `#book`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ContactForm.tsx src/components/BookingForm.tsx
git commit -m "refactor: extract reusable ContactForm from BookingForm"
```

---

### Task 2: Staggered Menu + Navbar cleanup

**Files:**
- Create: `src/components/StaggeredMenu.tsx`
- Modify: `src/components/Navbar.tsx` (whole file)
- Modify: `src/app/globals.css` — delete the `/* Mobile nav menu */` block (`.nav-menu_component`, `.nav-menu_component.is-open`, `.nav-menu`, `.nav-menu_component.is-open .nav-menu`, currently lines ~83–129); add the numbering rules below.

**Interfaces:**
- Consumes: `lockScroll()` / `unlockScroll()` from `@/lib/scrollLock` (ref-counted, safe to nest).
- Produces: `export default function StaggeredMenu()` (no props). `Navbar` renders it, so both `/` and `/privacy-policy` get the menu. `Navbar` gains a prop in Task 5 — not here.

- [ ] **Step 1: Create `src/components/StaggeredMenu.tsx`**

Adapted from React Bits `StaggeredMenu`: same open timeline (layers slide in 0.07s apart, panel follows, labels rise from `yPercent: 140, rotate: 10` with 0.1s stagger, numbers and contact block fade in), same close tween, plus-icon rotation, and Menu/Close text roll. Logo header, props, and inline `<style>` removed.

```tsx
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

// Adapted from React Bits "Staggered Menu" (reactbits.dev/components/staggered-menu).
const items = [
  { label: "About", link: "/#about" },
  { label: "Residences", link: "/#residences" },
  { label: "Floor Plans", link: "/#floor-plans" },
  { label: "Amenities", link: "/#amenities" },
  { label: "Why Invest", link: "/#invest" },
  { label: "About BSCPL", link: "/#builder" },
  { label: "FAQs", link: "/#faq" },
  { label: "Location", link: "/#location" },
  { label: "Contact Us", link: "/#book" },
];

// Sliding colour layers that run ahead of the panel.
const layerColors = ["var(--color-khaki)", "var(--color-ink)"];

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function StaggeredMenu() {
  const [open, setOpen] = useState(false);
  const [textLines, setTextLines] = useState(["Menu", "Close"]);

  const panelRef = useRef<HTMLElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const plusHRef = useRef<HTMLSpanElement>(null);
  const plusVRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);

  const getLayers = () =>
    Array.from(layersRef.current?.querySelectorAll<HTMLElement>(".sm-layer") ?? []);

  // Park the panel and layers off-screen to the right. They render with
  // visibility:hidden so nothing flashes before this runs.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.set([panel, ...getLayers()], { xPercent: 100, visibility: "visible" });
    gsap.set(plusVRef.current, { rotate: 90 });
  }, []);

  const resetPanelContents = (panel: HTMLElement) => {
    gsap.set(panel.querySelectorAll(".sm-label"), { yPercent: 140, rotate: 10 });
    gsap.set(panel.querySelectorAll(".sm-item"), { "--sm-num-opacity": 0 });
    gsap.set(panel.querySelectorAll(".sm-contact"), { y: 25, opacity: 0 });
  };

  const playOpen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const layers = getLayers();
    resetPanelContents(panel);

    const tl = gsap.timeline({ paused: true });
    layers.forEach((el, i) => {
      tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.07);
    });
    const panelAt = (layers.length - 1) * 0.07 + 0.08;
    tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.65, ease: "power4.out" }, panelAt);

    const itemsAt = panelAt + 0.65 * 0.15;
    tl.to(
      panel.querySelectorAll(".sm-label"),
      { yPercent: 0, rotate: 0, duration: 1, ease: "power4.out", stagger: 0.1 },
      itemsAt
    );
    tl.to(
      panel.querySelectorAll(".sm-item"),
      { "--sm-num-opacity": 1, duration: 0.6, ease: "power2.out", stagger: 0.08 },
      itemsAt + 0.1
    );
    tl.to(
      panel.querySelectorAll(".sm-contact"),
      { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.08 },
      panelAt + 0.65 * 0.4
    );

    openTlRef.current = tl;
    if (prefersReducedMotion()) tl.progress(1);
    else tl.play(0);
  }, []);

  const playClose = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...getLayers(), panel], {
      xPercent: 100,
      duration: prefersReducedMotion() ? 0 : 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => resetPanelContents(panel),
    });
  }, []);

  const animateIcon = (opening: boolean) => {
    const reduce = prefersReducedMotion();
    gsap.to(plusHRef.current, { rotate: opening ? 45 : 0, duration: reduce ? 0 : 0.5, ease: "power4.out" });
    gsap.to(plusVRef.current, { rotate: opening ? -45 : 90, duration: reduce ? 0 : 0.5, ease: "power4.out" });
  };

  // Rolls the label through Menu/Close a few times before landing on the target.
  const animateText = (opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    const target = opening ? "Close" : "Menu";
    const seq = [opening ? "Menu" : "Close", "Close", "Menu", "Close", "Menu"];
    if (seq[seq.length - 1] !== target) seq.push(target);
    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });
    gsap.to(inner, {
      yPercent: -((seq.length - 1) / seq.length) * 100,
      duration: prefersReducedMotion() ? 0 : 0.5 + seq.length * 0.07,
      ease: "power4.out",
    });
  };

  const setMenu = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) playOpen();
      else playClose();
      animateIcon(next);
      animateText(next);
    },
    [playOpen, playClose]
  );

  // Scroll lock while open.
  useEffect(() => {
    if (!open) return;
    lockScroll();
    return () => unlockScroll();
  }, [open]);

  // Escape and click-away close the menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !toggleRef.current?.contains(t)) setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, setMenu]);

  // Close first (which releases the scroll lock and restores the old
  // position), then scroll to the section. On other pages (privacy policy)
  // the section isn't here, so fall through to a normal navigation.
  const onItemClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    const hash = link.slice(link.indexOf("#"));
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      history.replaceState(null, "", hash);
    });
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50" data-open={open || undefined}>
      <div
        ref={layersRef}
        className="absolute top-0 right-0 bottom-0 w-[clamp(320px,38vw,520px)] max-lg:w-full"
        aria-hidden="true"
      >
        {layerColors.map((color) => (
          <div
            key={color}
            className="sm-layer absolute inset-0"
            style={{ background: color, visibility: "hidden" }}
          />
        ))}
      </div>

      <button
        ref={toggleRef}
        type="button"
        onClick={() => setMenu(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="staggered-menu-panel"
        className="pointer-events-auto absolute top-[1.5vw] right-[3vw] max-lg:top-5 max-lg:right-6 max-sm:top-4 max-sm:right-4 z-10 inline-flex items-center gap-2 rounded-full bg-beige text-ink font-medium leading-none px-5 py-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4"
      >
        <span className="relative inline-block h-[1em] overflow-hidden" aria-hidden="true">
          <span ref={textInnerRef} className="flex flex-col leading-none">
            {textLines.map((line, i) => (
              <span key={i} className="block h-[1em] leading-none">
                {line}
              </span>
            ))}
          </span>
        </span>
        <span className="relative inline-flex w-3.5 h-3.5 shrink-0 items-center justify-center" aria-hidden="true">
          <span ref={plusHRef} className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-current rounded-sm" />
          <span ref={plusVRef} className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-current rounded-sm" />
        </span>
      </button>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        aria-hidden={!open}
        inert={!open}
        style={{ visibility: "hidden" }}
        className="pointer-events-auto absolute top-0 right-0 h-full w-[clamp(320px,38vw,520px)] max-lg:w-full bg-beige flex flex-col overflow-y-auto pt-[6em] px-[2em] pb-[2em]"
      >
        <ul className="sm-list list-none m-0 p-0 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.link} className="relative overflow-hidden leading-none">
              <a
                href={item.link}
                onClick={(e) => onItemClick(e, item.link)}
                className="sm-item relative inline-block pr-[1.6em] font-heading font-semibold uppercase leading-none tracking-[-0.02em] text-[3.25rem] max-md:text-[2.5rem] text-ink transition-colors duration-150 hover:text-neutral-light"
              >
                <span className="sm-label inline-block origin-bottom will-change-transform">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8 flex flex-col gap-2">
          <div className="sm-contact text-neutral-light">CONTACT US</div>
          <a href="tel:+918722000148" className="sm-contact text-ink text-xl">+91 87220 00148</a>
          <a href="mailto:bscplre9@gmail.com" className="sm-contact text-ink text-xl">bscplre9@gmail.com</a>
          <a
            href="https://www.instagram.com/bollinenigroup/"
            target="_blank"
            rel="noopener noreferrer"
            className="sm-contact text-ink text-xl"
          >
            Instagram
          </a>
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Add numbering CSS to `src/app/globals.css`** (replacing the deleted `/* Mobile nav menu */` block)

```css
/* Staggered menu: 01–09 numbers next to each link. Tailwind can't express
   counters, and GSAP fades them in via --sm-num-opacity. */
.sm-list {
  counter-reset: smItem;
}
.sm-item::after {
  counter-increment: smItem;
  content: counter(smItem, decimal-leading-zero);
  position: absolute;
  top: 0.15em;
  right: 0;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--color-neutral-light);
  opacity: var(--sm-num-opacity, 0);
  pointer-events: none;
}
```

- [ ] **Step 3: Replace `src/components/Navbar.tsx`**

```tsx
import Image from "next/image";
import StaggeredMenu from "./StaggeredMenu";

export default function Navbar() {
  return (
    <>
      <nav className="z-10 absolute inset-x-0 top-0">
        <div className="px-[3vw] max-lg:px-10 max-md:px-6 max-sm:px-4">
          <div className="py-[1.25vw] max-lg:py-4 flex justify-center">
            <a href="/" aria-current="page" className="inline-block max-w-full">
              <div className="relative h-[6.5vw] aspect-[1920/1080] max-lg:h-24 max-md:h-20 max-sm:h-16">
                <Image
                  src="/images/bollineni_vienna.svg"
                  alt="Bollineni Vienna"
                  title="Bollineni Vienna"
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              </div>
            </a>
          </div>
        </div>
      </nav>
      <StaggeredMenu />
    </>
  );
}
```

- [ ] **Step 4: Verify**

- `grep -rn "nav-menu" src` → no matches. `npx tsc --noEmit` → exit 0. `npm run lint` → no errors.
- Browser on `/`: pill "Menu +" top-right; click → khaki then ink layers slide in, beige panel follows, labels rise in stagger with 01–09, button rolls to "Close" with an ×.
- Click "Floor Plans" → menu closes and the page scrolls to `#floor-plans`; `document.body.style.position` → `""` (lock released). Repeat for "Contact Us" → lands on `#book`.
- Open, press Escape → closes. Open, click the dimmed page area on the left → closes.
- While open, try wheel-scrolling → page doesn't move.
- `/privacy-policy`: menu opens; clicking "About" navigates to `/#about`.
- Code review: panel uses `max-lg:w-full` (full width ≤1023px).

- [ ] **Step 5: Commit**

```bash
git add src/components/StaggeredMenu.tsx src/components/Navbar.tsx src/app/globals.css
git commit -m "feat: replace navbar menu with GSAP staggered menu"
```

---

### Task 3: Loader signal, Enquiry popup, keyboard trigger

**Files:**
- Create: `src/lib/loaderDone.ts`
- Modify: `src/components/LoadingScreen.tsx` (call `markLoaderDone()` in `dismiss`)
- Create: `src/components/EnquiryModal.tsx`
- Create: `src/components/EnquiryLauncher.tsx`
- Modify: `src/app/page.tsx` (render `<EnquiryLauncher />` after `<Navbar />`)

**Interfaces:**
- Consumes: `ContactForm({ idPrefix })` from Task 1; `lockScroll`/`unlockScroll`.
- Produces:
  - `markLoaderDone(): void`, `onLoaderDone(cb: () => void): () => void` (calls `cb` immediately if already done; returns an unsubscribe).
  - `EnquiryModal({ open, onClose }: { open: boolean; onClose: () => void })`.
  - `EnquiryLauncher()` — owns `open` state; Task 4 adds the Lanyard inside it with prop `onOpen: () => void`.

- [ ] **Step 1: Create `src/lib/loaderDone.ts`**

```ts
// Lets components wait for the preloader (LoadingScreen) to finish before
// starting scroll animations or pulling in heavy code like the 3D lanyard.
let done = false;
const listeners = new Set<() => void>();

export function markLoaderDone() {
  if (done) return;
  done = true;
  listeners.forEach((cb) => cb());
  listeners.clear();
}

export function onLoaderDone(cb: () => void): () => void {
  if (done) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
```

- [ ] **Step 2: Call it from `LoadingScreen.tsx`**

Add `import { markLoaderDone } from "@/lib/loaderDone";` and change `dismiss`:

```tsx
    const dismiss = () => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      unlockScroll();
      setVisible(false);
      markLoaderDone();
    };
```

- [ ] **Step 3: Create `src/components/EnquiryModal.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

// The form (and its phone-input library) only downloads the first time the
// popup opens.
const ContactForm = dynamic(() => import("./ContactForm"));

export default function EnquiryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the form mounted after the first open so typed values survive closing.
  const [everOpened, setEverOpened] = useState(false);
  if (open && !everOpened) setEverOpened(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    lockScroll();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }
      );
    }
    return () => {
      dialog.close();
      unlockScroll();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="enquire-heading"
      // Escape: keep React state as the source of truth.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Clicks on the backdrop land on the <dialog> itself, not the panel.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto p-0 bg-transparent backdrop:bg-ink/70 max-w-none"
    >
      <div
        ref={panelRef}
        className="relative bg-beige text-ink w-[min(92vw,40rem)] max-h-[90vh] overflow-y-auto rounded-[1vw] max-lg:rounded-2xl p-[2.5vw] max-lg:p-8 max-sm:p-5"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-ink"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <h2 id="enquire-heading" className="text-5xl max-md:text-3xl font-medium leading-none mb-[1.5vw] max-lg:mb-6">
          Enquire Now
        </h2>
        {everOpened && <ContactForm idPrefix="enquire" />}
      </div>
    </dialog>
  );
}
```

Note: Tailwind v4's preflight sets `margin: 0` on every element, which removes `<dialog>`'s default centering — `m-auto` restores it.

- [ ] **Step 4: Create `src/components/EnquiryLauncher.tsx`**

```tsx
"use client";

import { useState } from "react";
import EnquiryModal from "./EnquiryModal";

export default function EnquiryLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* The 3D card can't take keyboard focus, so keyboard and screen-reader
          users get this button in the same corner. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[45] focus:rounded-full focus:bg-ink focus:text-white focus:px-5 focus:py-3"
      >
        Enquire now
      </button>
      <EnquiryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

- [ ] **Step 5: Render it in `src/app/page.tsx`**

Add `import EnquiryLauncher from "@/components/EnquiryLauncher";` and place `<EnquiryLauncher />` directly after `<Navbar />`.

- [ ] **Step 6: Verify**

- `npx tsc --noEmit`, `npm run lint` → clean.
- Browser: after the loader, press Tab from the top of the page → "Enquire now" pill appears top-left; Enter → popup opens centered on an ink backdrop, "Enquire Now" heading, form visible.
- Escape closes; reopen → values typed earlier are still there; click the backdrop → closes; X → closes. After each close, `document.body.style.position` → `""`.
- Review Focus #1: with the popup open, run `[...document.querySelectorAll("[id]")].map(e => e.id).filter((id, i, a) => a.indexOf(id) !== i)` → `[]` (scroll to `#book` first so both forms are mounted). Fill only the popup form, run the Task 1 fetch patch, submit from the popup → `window.__captured` contains the popup's values.

- [ ] **Step 7: Commit**

```bash
git add src/lib/loaderDone.ts src/components/LoadingScreen.tsx src/components/EnquiryModal.tsx src/components/EnquiryLauncher.tsx src/app/page.tsx
git commit -m "feat: add Enquire Now popup with shared contact form"
```

---

### Task 4: 3D Lanyard "Enquire Now!" card

**Files:**
- Modify: `package.json`, `package-lock.json` (new dependencies)
- Create: `public/lanyard/card.glb`, `public/lanyard/lanyard.png`
- Create: `src/components/Lanyard.tsx`
- Modify: `src/components/EnquiryLauncher.tsx` (mount the Lanyard after the loader)

**Interfaces:**
- Consumes: `onLoaderDone` (Task 3); `EnquiryLauncher`'s `setOpen`.
- Produces: `export default function Lanyard({ onOpen }: { onOpen: () => void })`.

**Deviation from spec, same visual result:** the spec says the card faces are "static PNGs generated once". Rendering Cormorant into a PNG at build time needs the font installed for the image tool, so instead the faces are drawn at runtime on a 2D canvas with the page's already-loaded `next/font` Cormorant, then handed to the component's `frontImage`/`backImage`. No extra files, no build step.

- [ ] **Step 1: Install dependencies**

```bash
npm install three@^0.186 @react-three/fiber@^9.8 @react-three/drei@^10.7 @react-three/rapier@^2.2 meshline@^3.3
npm install -D @types/three
```

Expected: installs without peer-dependency errors (fiber 9.8 declares `react >=19 <19.4`; this repo has 19.2.4).

- [ ] **Step 2: Download the React Bits card model and strap texture**

```bash
mkdir -p public/lanyard
curl -fsSL -o public/lanyard/card.glb https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/assets/lanyard/card.glb
curl -fsSL -o public/lanyard/lanyard.png https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/assets/lanyard/lanyard.png
ls -la public/lanyard
```

Expected: both files present and non-empty.

- [ ] **Step 3: Create `src/components/Lanyard.tsx`**

```tsx
/* eslint-disable react/no-unknown-property */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, type ThreeElement, type ThreeEvent } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";

// Adapted from React Bits "Lanyard" (reactbits.dev/components/lanyard).
extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

const CARD_GLB = "/lanyard/card.glb";
const STRAP_PNG = "/lanyard/lanyard.png";

// The card model's front face is UV-mapped to the LEFT half of its texture
// atlas and the back face to the RIGHT half (measured from card.glb).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

// Pulling the card this far below where the drag started (world units) and
// letting go opens the popup.
const PULL_TO_OPEN = 1.5;
// Pointer movement under this many pixels between down and up counts as a click.
const CLICK_SLOP_PX = 6;

// Draws the card faces with the site's own Cormorant/Jakarta fonts.
async function drawCardFaces(): Promise<{ front: string; back: string }> {
  const root = getComputedStyle(document.documentElement);
  const heading = root.getPropertyValue("--font-cormorant").trim() || "serif";
  const body = root.getPropertyValue("--font-jakarta").trim() || "sans-serif";
  await Promise.all([
    document.fonts.load(`600 120px ${heading}`),
    document.fonts.load(`400 30px ${body}`),
  ]);

  const logo = new Image();
  logo.src = "/images/bollineni_vienna.svg";
  await logo.decode();

  const W = 640;
  const H = 900;
  const make = (paint: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    paint(ctx);
    return canvas.toDataURL("image/png");
  };

  const front = make((ctx) => {
    ctx.fillStyle = "#fbf8f1";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(logo, 20, 60, 600, 338);
    ctx.fillStyle = "#0c0c0c";
    ctx.font = `600 120px ${heading}`;
    ctx.fillText("ENQUIRE", W / 2, 520);
    ctx.fillText("NOW!", W / 2, 640);
    ctx.font = `400 30px ${body}`;
    ctx.fillStyle = "#555555";
    ctx.fillText("Pull or tap to open", W / 2, 790);
  });

  const back = make((ctx) => {
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fbf8f1";
    ctx.font = `600 84px ${heading}`;
    ctx.fillText("Book a", W / 2, 360);
    ctx.fillText("site visit", W / 2, 450);
    ctx.font = `400 40px ${body}`;
    ctx.fillText("+91 87220 00148", W / 2, 580);
  });

  return { front, back };
}

export default function Lanyard({ onOpen }: { onOpen: () => void }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [faces, setFaces] = useState<{ front: string; back: string } | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    drawCardFaces().then((f) => {
      if (!cancelled) setFaces(f);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!faces) return null;

  return (
    // The canvas ignores the mouse; R3F listens on <body> instead, so only
    // the card mesh itself is interactive and the page underneath stays clickable.
    <div className="pointer-events-none fixed top-0 left-0 z-40 h-screen w-[32vw] max-lg:w-[45vw] max-md:w-[70vw]">
      <Canvas
        eventSource={document.body}
        eventPrefix="client"
        style={{ pointerEvents: "none" }}
        camera={{ position: [0, 0, 30], fov: 20 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={[0, -40, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band isMobile={isMobile} frontImage={faces.front} backImage={faces.back} onOpen={onOpen} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

type LerpedBody = RapierRigidBody & { lerped?: THREE.Vector3 };

function Band({
  isMobile,
  frontImage,
  backImage,
  onOpen,
}: {
  isMobile: boolean;
  frontImage: string;
  backImage: string;
  onOpen: () => void;
}) {
  const maxSpeed = 50;
  const minSpeed = 0;
  const band = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>, InstanceType<typeof MeshLineMaterial>>>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<LerpedBody>(null!);
  const j2 = useRef<LerpedBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const pressRef = useRef<{ x: number; y: number; cardY: number } | null>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: RigidBodyProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  const getLerped = (body: LerpedBody) => {
    if (!body.lerped) body.lerped = new THREE.Vector3().copy(body.translation());
    return body.lerped;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { nodes, materials } = useGLTF(CARD_GLB) as any;
  const texture = useTexture(STRAP_PNG);
  const frontTex = useTexture(frontImage);
  const backTex = useTexture(backImage);

  // Composite the two faces into the card's texture atlas (front = left half,
  // back = right half), cover-fitted.
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    const baseImg = baseMap.image as HTMLImageElement;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return baseMap;
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (img: HTMLImageElement, rect: typeof FRONT_UV_RECT) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const scale = Math.max(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.drawImage(img, rx + (rw - dw) / 2, ry + (rh - dh) / 2, dw, dh);
      ctx.restore();
    };
    drawFitted(frontTex.image as HTMLImageElement, FRONT_UV_RECT);
    drawFitted(backTex.image as HTMLImageElement, BACK_UV_RECT);

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontTex, backTex, materials.base.map]);

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  // While the card is held: no page scrolling on touch, no text selection.
  useEffect(() => {
    if (!dragged) return;
    const block = (e: TouchEvent) => e.preventDefault();
    window.addEventListener("touchmove", block, { passive: false });
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("touchmove", block);
      document.body.style.userSelect = "";
    };
  }, [dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(0.1, Math.min(1, lerped.distanceTo(ref.current.translation())));
        lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(getLerped(j2.current));
      curve.points[2].copy(getLerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pressRef.current = { x: e.clientX, y: e.clientY, cardY: card.current.translation().y };
    drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    drag(false);
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;
    const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y);
    const pulledDown = press.cardY - card.current.translation().y > PULL_TO_OPEN;
    // Tap/click, or pulled down far enough. Releasing makes the card dynamic
    // again, so it springs back on its own.
    if (moved < CLICK_SLOP_PX || pulledDown) onOpen();
  };

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? "kinematicPosition" : "dynamic"}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={onPointerUp}
            onPointerDown={onPointerDown}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(CARD_GLB);
```

If `tsc` rejects `e.clientX` on `ThreeEvent<PointerEvent>`, use `e.nativeEvent.clientX` / `e.nativeEvent.clientY` instead.

- [ ] **Step 4: Mount it from `EnquiryLauncher.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { onLoaderDone } from "@/lib/loaderDone";
import EnquiryModal from "./EnquiryModal";

// three.js + physics (~1 MB) stay out of the first-load bundle and are only
// fetched once the preloader has finished.
const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

export default function EnquiryLauncher() {
  const [open, setOpen] = useState(false);
  const [showLanyard, setShowLanyard] = useState(false);

  useEffect(() => onLoaderDone(() => setShowLanyard(true)), []);

  return (
    <>
      {showLanyard && <Lanyard onOpen={() => setOpen(true)} />}
      {/* The 3D card can't take keyboard focus, so keyboard and screen-reader
          users get this button in the same corner. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[45] focus:rounded-full focus:bg-ink focus:text-white focus:px-5 focus:py-3"
      >
        Enquire now
      </button>
      <EnquiryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

- [ ] **Step 5: Verify**

- `npx tsc --noEmit`, `npm run lint` → clean.
- Browser on `/`: after the loader, a card on a white strap drops in and swings in the top-left. Front shows the logo + "ENQUIRE NOW!" + "Pull or tap to open"; drag it to see the back (ink, "Book a site visit", phone).
- Click the card without moving → popup opens. Close it. Drag the card down well below its resting point and release → popup opens and the card swings back up. Drag it sideways a little and release → popup does NOT open.
- Review Focus #3: click the Navbar logo link and any text in the top-left third of the page that's not under the card → the click reaches the page (logo navigates to `/`).
- Scroll the whole page → the card stays fixed top-left on every section, and the menu panel (z-50) covers it when open.
- Code review for phones: `max-md:w-[70vw]` container, `touchmove` blocked only while `dragged`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json public/lanyard src/components/Lanyard.tsx src/components/EnquiryLauncher.tsx
git commit -m "feat: add 3D Enquire Now lanyard that opens the enquiry popup"
```

---

### Task 5: Hero curtain-wipe / zoom-through sequence

**Files:**
- Modify: `src/components/Hero.tsx` (whole file)
- Modify: `src/components/Navbar.tsx` (add `tone` prop)
- Modify: `src/app/page.tsx` (`<Navbar tone="light" />`)

**Interfaces:**
- Consumes: `onLoaderDone` (Task 3).
- Produces: `Navbar({ tone = "dark" }: { tone?: "dark" | "light" })` — `"light"` renders the logo white so it reads over the full-bleed pool photo; `/privacy-policy` keeps the default.

- [ ] **Step 1: Add the `tone` prop to `Navbar.tsx`**

Change the signature and the logo `Image` className:

```tsx
export default function Navbar({ tone = "dark" }: { tone?: "dark" | "light" }) {
```

```tsx
                  className={`object-contain ${tone === "light" ? "brightness-0 invert" : ""}`}
```

In `src/app/page.tsx`, change `<Navbar />` to `<Navbar tone="light" />`.

- [ ] **Step 2: Replace `src/components/Hero.tsx`**

Initial clip-paths are set in CSS (`motion-safe:[clip-path:...]`) so nothing flashes before GSAP runs; they must match each `fromTo`'s "from" value. Under reduced motion those classes don't apply and the layers stack as normal full-height blocks.

```tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { onLoaderDone } from "@/lib/loaderDone";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Each scene is a full-screen layer stacked on the one before. With motion
// allowed, the section pins and the layers are revealed by animating their
// clip-path as the visitor scrolls. With reduced motion they just stack.
const layer = "absolute inset-0 motion-reduce:relative motion-reduce:h-[100svh] overflow-hidden";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const unsubscribe = onLoaderDone(() => {
        mm.add(
          { isMobile: "(max-width: 767px)", motionOK: "(prefers-reduced-motion: no-preference)" },
          (ctx) => {
            const { isMobile, motionOK } = ctx.conditions as { isMobile: boolean; motionOK: boolean };
            if (!motionOK) return;
            const q = gsap.utils.selector(sectionRef);
            const full = "inset(0% 0% 0% 0%)";

            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: isMobile ? "+=300%" : "+=400%",
                  pin: true,
                  scrub: 1,
                  anticipatePin: 1,
                },
              })
              // 1 → 2: pool photo settles, title lifts away, ink line opens
              .to(q(".hero-pool-img"), { scale: 1.08, duration: 1 }, 0)
              .to(q(".hero-pool-text"), { opacity: 0, y: -40, duration: 0.5 }, 0.3)
              .fromTo(q(".hero-ink"), { clipPath: "inset(50% 49.9% 50% 49.9%)" }, { clipPath: "inset(12% 49.9% 12% 49.9%)", duration: 0.4 }, 0.5)
              .to(q(".hero-ink"), { clipPath: full, duration: 1 }, 0.9)
              // 3: zoom through living room, then aerial view
              .fromTo(q(".hero-living"), { clipPath: "inset(38% 38% 38% 38%)" }, { clipPath: full, duration: 1.2 }, 2)
              .fromTo(q(".hero-living-img"), { scale: 1.4 }, { scale: 1, duration: 1.2 }, 2)
              .fromTo(q(".hero-aerial"), { clipPath: "inset(40% 40% 40% 40%)" }, { clipPath: full, duration: 1.2 }, 3.3)
              .fromTo(q(".hero-aerial-img"), { scale: 1.4 }, { scale: 1, duration: 1.2 }, 3.3)
              // 4: ink card grows to full screen with the hero line
              .fromTo(q(".hero-card"), { clipPath: "inset(32% 26% 32% 26%)" }, { clipPath: full, duration: 1.2 }, 4.6)
              .fromTo(q(".hero-card-text"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 4.8)
              // 5: khaki opens from the centre with the closing statement
              .fromTo(q(".hero-khaki"), { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: full, duration: 1 }, 6.2)
              .fromTo(q(".hero-khaki-text"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 6.8)
              // short hold before the pin releases into About
              .to({}, { duration: 0.5 });
          }
        );
      });
      return () => {
        unsubscribe();
        mm.revert();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative h-[100svh] overflow-hidden bg-ink motion-reduce:h-auto"
    >
      {/* 1. Pool photo + title */}
      <div className={layer}>
        <Image
          src="/images/gallery/gallery-04.jpg"
          alt="Swimming pool at Bollineni Vienna surrounded by landscaped greens."
          title="Swimming pool at Bollineni Vienna surrounded by landscaped greens."
          fill
          preload
          loading="eager"
          sizes="100vw"
          className="hero-pool-img object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="hero-pool-text absolute inset-0 flex flex-col items-center justify-center gap-[1vw] max-lg:gap-3 px-5 text-center text-white">
          <h1 className="text-7xl max-lg:text-6xl max-md:text-4xl">BOLLINENI VIENNA</h1>
          <p className="text-lg max-md:text-sm">Luxury 4 & 5 BHK Apartments in Kogilu, North Bangalore</p>
        </div>
      </div>

      {/* 2. Ink wipe */}
      <div className={`hero-ink ${layer} bg-ink motion-safe:[clip-path:inset(50%_49.9%_50%_49.9%)] motion-reduce:hidden`} />

      {/* 3a. Living room */}
      <div className={`hero-living ${layer} motion-safe:[clip-path:inset(38%_38%_38%_38%)]`}>
        <Image
          src="/images/about.jpg"
          alt="Living room at Bollineni Vienna."
          fill
          sizes="100vw"
          className="hero-living-img object-cover"
        />
      </div>

      {/* 3b. Aerial view */}
      <div className={`hero-aerial ${layer} motion-safe:[clip-path:inset(40%_40%_40%_40%)]`}>
        <Image
          src="/images/gallery/gallery-09.jpg"
          alt="Aerial view of the sports facilities at Bollineni Vienna."
          fill
          sizes="100vw"
          className="hero-aerial-img object-cover"
        />
      </div>

      {/* 4. Ink card */}
      <div className={`hero-card ${layer} bg-ink flex items-center justify-center motion-safe:[clip-path:inset(32%_26%_32%_26%)]`}>
        <p className="hero-card-text max-w-[52vw] max-lg:max-w-[44rem] max-md:max-w-[85vw] px-5 text-center font-heading uppercase text-white text-4xl max-lg:text-3xl max-md:text-2xl leading-tight">
          Expansive 4 & 5 BHK residences, lush greens, and curated amenities come together in a refined address where sophistication meets serenity.
        </p>
      </div>

      {/* 5. Khaki closing statement */}
      <div className={`hero-khaki ${layer} bg-khaki flex items-center justify-center motion-safe:[clip-path:inset(0%_50%_0%_50%)]`}>
        <p className="hero-khaki-text max-w-[50vw] max-lg:max-w-[40rem] max-md:max-w-[85vw] px-5 text-center font-heading uppercase text-ink text-6xl max-lg:text-5xl max-md:text-3xl leading-none">
          Contemporary luxury living in North Bengaluru
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

- `npx tsc --noEmit`, `npm run lint` → clean.
- Browser: first screen is the pool photo with a white logo, white "BOLLINENI VIENNA" and subtitle; no flash of the khaki or ink layers during/after the loader.
- Wheel-scroll slowly: title lifts away → thin ink line grows then widens to full ink → living room grows out of the center → aerial view grows out of it → ink card grows to full screen with the hero line → khaki opens from center with "Contemporary luxury living in North Bengaluru" → pin releases and About scrolls in.
- Review Focus #4: scroll back up through the whole pin → every scene rewinds in reverse; no jump when the pin starts or ends.
- DevTools Network: `gallery-04.jpg` (as `/_next/image?...`) requested at page load with high priority.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.tsx src/components/Navbar.tsx src/app/page.tsx
git commit -m "feat: rebuild hero as pinned curtain-wipe scroll sequence"
```

---

### Task 6: Residences tilted-strip / zoom / horizontal-scroll story

**Files:**
- Modify: `src/components/Residences.tsx` (whole file; the lightbox JSX is kept verbatim)

**Interfaces:**
- Consumes: `useVilla()` → `{ gallery: { id: string; name: string; src: string }[]; summary: string }` from `./Villa`; `onLoaderDone`.
- Produces: nothing new.

Gallery indexes used (from `Villa.tsx`): 0 Master Bedroom, 1 Dining Room, 2 Sunset Balcony, 3 Swimming Pool, 4 The Canopy Court, 5 Badminton Court, 6 Children's Play Area, 7 The Social Sanctuary, 8 Sports Facilities.

- [ ] **Step 1: Replace `src/components/Residences.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useVilla, GalleryImage } from "./Villa";
import { onLoaderDone } from "@/lib/loaderDone";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Horizontal track, left to right. "photo" = full-screen image with caption;
// "text" = one sentence of the summary beside a smaller portrait photo.
const track = [
  { kind: "photo", image: 0 },
  { kind: "text", sentence: 0, image: 1 },
  { kind: "photo", image: 2 },
  { kind: "photo", image: 4 },
  { kind: "text", sentence: 1, image: 7 },
  { kind: "photo", image: 5 },
  { kind: "photo", image: 6 },
] as const;

const caption = (index: number, item: GalleryImage) =>
  `${String(index + 1).padStart(2, "0")} ${item.name}`;

function Strip({
  gallery,
  onOpen,
  className = "",
}: {
  gallery: GalleryImage[];
  onOpen: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={`res-strip absolute left-[-10vw] bottom-[8vh] flex gap-[1vw] max-lg:gap-3 -rotate-6 ${className}`}>
      {gallery.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={`Open ${item.name}`}
          className="relative shrink-0 w-[22vw] h-[14vw] max-md:w-[40vw] max-md:h-[28vw] overflow-hidden cursor-pointer"
        >
          <Image src={item.src} alt={item.name} fill sizes="(max-width: 767px) 40vw, 22vw" className="object-cover" />
        </button>
      ))}
    </div>
  );
}

export default function Residences() {
  const villa = useVilla();
  const { gallery } = villa;
  // The summary is three sentences: two go on the track, the last closes the story.
  const sentences = villa.summary.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [villa.summary];
  const closing = sentences[sentences.length - 1];

  const sectionRef = useRef<HTMLElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showPrev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
  const showNext = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.length));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      const unsubscribe = onLoaderDone(() => {
        mm.add(
          { isMobile: "(max-width: 767px)", motionOK: "(prefers-reduced-motion: no-preference)" },
          (ctx) => {
            const { isMobile, motionOK } = ctx.conditions as { isMobile: boolean; motionOK: boolean };
            if (!motionOK) return;
            const q = gsap.utils.selector(sectionRef);
            const trackEl = q(".res-track")[0] as HTMLElement;

            gsap.set(q(".res-zoom"), { autoAlpha: 1, scale: 0.3, rotate: -6, yPercent: 25 });

            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: isMobile ? "+=400%" : "+=500%",
                  pin: true,
                  scrub: 1,
                  anticipatePin: 1,
                  invalidateOnRefresh: true,
                },
              })
              // 1: strip drifts sideways
              .to(q(".res-intro .res-strip"), { xPercent: -15, duration: 1 }, 0)
              // 2: Master Bedroom straightens and fills the frame
              .to(q(".res-zoom"), { scale: 1, rotate: 0, yPercent: 0, duration: 1.2 }, 0.6)
              .to(q(".res-intro"), { autoAlpha: 0, duration: 0.3 }, 1.5)
              // hand-off: the track's first panel is the same photo, full-bleed
              .set(q(".res-track"), { autoAlpha: 1 }, 1.8)
              .set(q(".res-zoom"), { autoAlpha: 0 }, 1.8)
              // 3: horizontal track
              .to(trackEl, { x: () => -(trackEl.scrollWidth - window.innerWidth), duration: 5 }, 1.8)
              // 4: closing statement wipes in from the right, strip returns
              .fromTo(q(".res-closing"), { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 6.8)
              .fromTo(q(".res-closing .res-strip"), { xPercent: 10 }, { xPercent: -5, duration: 1.5 }, 6.8)
              .to({}, { duration: 0.4 });
          }
        );
      });
      return () => {
        unsubscribe();
        window.removeEventListener("load", refresh);
        mm.revert();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="residences"
      ref={sectionRef}
      className="relative h-[100svh] overflow-hidden bg-beige motion-reduce:h-auto"
    >
      {/* 1. Intro: heading + tilted strip */}
      <div className="res-intro absolute inset-0 motion-reduce:relative motion-reduce:h-[100svh]">
        <div className="pt-[12vh] flex justify-center">
          <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none">RESIDENCE</h2>
        </div>
        <Strip gallery={gallery} onOpen={setLightboxIndex} />
      </div>

      {/* 2. Zoom layer (hidden until GSAP runs; unused with reduced motion) */}
      <div className="res-zoom absolute inset-0 invisible motion-reduce:hidden">
        <Image src={gallery[0].src} alt={gallery[0].name} fill sizes="100vw" className="object-cover" />
      </div>

      {/* 3. Horizontal track */}
      <div className="res-track absolute top-0 left-0 h-full flex motion-safe:invisible motion-reduce:relative motion-reduce:flex-col motion-reduce:h-auto">
        {track.map((panel, i) => {
          if (panel.kind === "photo") {
            const item = gallery[panel.image];
            return (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(panel.image)}
                aria-label={`Open ${item.name}`}
                className="relative shrink-0 w-screen h-[100svh] overflow-hidden cursor-pointer"
              >
                <Image src={item.src} alt={item.name} fill sizes="100vw" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-[1.5vw] max-lg:p-4 text-left text-white bg-[linear-gradient(#0000,#0c0c0cbf)]">
                  {caption(panel.image, item)}
                </div>
              </button>
            );
          }
          const item = gallery[panel.image];
          return (
            <div
              key={i}
              className="shrink-0 w-screen h-[100svh] bg-ink text-white flex items-center justify-center gap-[5vw] px-[8vw] max-md:flex-col max-md:gap-8 max-md:px-6"
            >
              <p className="max-w-[34vw] max-md:max-w-none text-2xl max-lg:text-xl max-md:text-lg leading-snug">
                {sentences[panel.sentence]}
              </p>
              <button
                type="button"
                onClick={() => setLightboxIndex(panel.image)}
                aria-label={`Open ${item.name}`}
                className="relative shrink-0 w-[22vw] h-[30vw] max-md:w-[60vw] max-md:h-[80vw] overflow-hidden cursor-pointer"
              >
                <Image src={item.src} alt={item.name} fill sizes="(max-width: 767px) 60vw, 22vw" className="object-cover" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Closing statement + strip */}
      <div className="res-closing absolute inset-0 bg-beige motion-safe:[clip-path:inset(0%_0%_0%_100%)] motion-reduce:relative motion-reduce:h-[100svh]">
        <div className="h-[70%] flex items-center justify-center px-5">
          <p className="max-w-[50vw] max-lg:max-w-[40rem] max-md:max-w-[85vw] text-center text-3xl max-lg:text-2xl max-md:text-xl leading-snug">
            {closing}
          </p>
        </div>
        <Strip gallery={gallery} onOpen={setLightboxIndex} />
      </div>

      {lightboxIndex !== null && (
        /* ↓ existing lightbox JSX from the current Residences.tsx, unchanged */
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-[4vw] max-lg:p-8"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-[2vw] right-[2vw] max-lg:top-6 max-lg:right-6 text-white cursor-pointer"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
          <button
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-[2vw] max-lg:left-4 text-white cursor-pointer"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-[2vw] max-lg:right-4 text-white cursor-pointer"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <img
            src={gallery[lightboxIndex].src}
            alt={gallery[lightboxIndex].name}
            title={gallery[lightboxIndex].name}
            className="max-h-[80vh] max-w-[85vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="text-white text-2xl max-lg:text-xl max-md:text-base mt-[1.5vw] max-lg:mt-6">
            {String(lightboxIndex + 1).padStart(2, "0")} — {gallery[lightboxIndex].name}
          </div>
        </div>
      )}
    </section>
  );
}
```

Notes for the implementer:
- `-rotate-6` on `.res-strip` is safe: GSAP only animates the strip's `xPercent` (transform), and Tailwind's `rotate` property composes with it the same way on every frame. Do not animate `rotate` on the strip.
- `.res-zoom` has no Tailwind transform utilities; GSAP owns its transform.
- If `GalleryImage` isn't exported from `Villa.tsx` under that name, check the existing import in the current file: `import { useVilla, GalleryImage as GalleryImageType } from "./Villa";` — it is exported.

- [ ] **Step 2: Verify**

- `npx tsc --noEmit`, `npm run lint` → clean.
- Browser: scroll into Residences → "RESIDENCE" on beige with a tilted photo strip; strip drifts left → Master Bedroom straightens and fills the frame → track slides left through: Master Bedroom (caption "01 Master Bedroom"), ink panel with the first summary sentence + Dining Room portrait, Sunset Balcony, The Canopy Court, ink panel with the second sentence + The Social Sanctuary portrait, Badminton Court, Children's Play Area → closing wipes in from the right with "Set within a premium address, they redefine contemporary luxury living in North Bengaluru." and the strip along the bottom → pin releases into Floor Plans.
- The bedroom hand-off (zoom layer → track panel 1) shows no visible jump.
- Click a track photo, a portrait, and a strip tile → lightbox opens on that image; prev/next/close work.
- Scroll backwards through the whole section → rewinds cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/components/Residences.tsx
git commit -m "feat: rebuild residences as pinned horizontal scroll story"
```

---

### Task 7: Whole-page verification

**Files:** none expected; fix-ups only if a check fails (commit them with a message naming the failed check).

- [ ] **Step 1: Production build + bundle check**

```bash
npm run build
PORT=3002 npm run start &
sleep 5
for c in $(curl -s http://localhost:3002/ | grep -o '/_next/static/chunks/[^"]*\.js' | sort -u); do
  curl -s "http://localhost:3002$c" | grep -q "MeshLineGeometry\|RAPIER" && echo "3D CODE IN FIRST LOAD: $c"
done; echo "bundle check done"
kill %1
```

Expected: build "Compiled successfully"; only "bundle check done" is printed (no 3D code in the first-load chunks).

- [ ] **Step 2: Both pins together (Review Focus #4)**

In the dev server, fast mouse-wheel scroll from top to bottom and back: Hero pin fully completes and About scrolls normally before Residences pins; no overlap, no blank screens, no jumps. Use the menu to jump to "Floor Plans" and "Residences" → both land at the section start.

- [ ] **Step 3: Reduced motion (Review Focus #5)**

Emulate `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media feature). Reload. Expected: Hero is a vertical stack (pool + title, living room, aerial, ink card text, khaki statement) with no pinning; Residences is heading + strip, the track panels stacked vertically, then the closing; menu opens/closes instantly; popup appears without the scale animation.

- [ ] **Step 4: Responsive code review**

Mobile can't be checked visually here (see Testing approach). Review the `max-lg:`/`max-md:` classes added in Tasks 2–6 and list them for the user to check on their phone: menu panel full width, lanyard container `70vw`, Hero/Residences pins shorter (`+=300%` / `+=400%`), Residences text panels stack vertically.

- [ ] **Step 5: Commit any fix-ups, then report**

Report results to the user honestly, including anything not verified (mobile visuals).
