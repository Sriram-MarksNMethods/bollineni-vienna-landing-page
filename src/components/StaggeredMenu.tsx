"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
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

// Sliding colour layers that run ahead of the panel (React Bits default colours).
const layerColors = ["#B497CF", "#5227FF"];

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
      // The panel goes inert when closed, which would drop focus to <body>.
      if (!next && panelRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
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
        className="pointer-events-auto absolute top-0 right-0 h-full w-[clamp(320px,38vw,520px)] max-lg:w-full bg-white flex flex-col overflow-y-auto pt-[6em] px-[2em] pb-[2em]"
      >
        <ul className="sm-list list-none m-0 p-0 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.link} className="relative overflow-hidden leading-none">
              <Link
                href={item.link}
                onClick={(e) => onItemClick(e, item.link)}
                className="sm-item relative inline-block pr-[1.6em] font-heading font-semibold uppercase leading-none tracking-[-0.02em] text-[3.25rem] max-md:text-[2.5rem] text-black transition-colors duration-150 hover:text-[#5227FF]"
              >
                <span className="sm-label inline-block origin-bottom will-change-transform">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8 flex flex-col gap-2">
          <div className="sm-contact text-[#5227FF]">CONTACT US</div>
          <a href="tel:+918722000148" className="sm-contact text-[#111] text-xl transition-colors duration-300 hover:text-[#5227FF]">+91 87220 00148</a>
          <a href="mailto:bscplre9@gmail.com" className="sm-contact text-[#111] text-xl transition-colors duration-300 hover:text-[#5227FF]">bscplre9@gmail.com</a>
          <a
            href="https://www.instagram.com/bollinenigroup/"
            target="_blank"
            rel="noopener noreferrer"
            className="sm-contact text-[#111] text-xl transition-colors duration-300 hover:text-[#5227FF]"
          >
            Instagram
          </a>
        </div>
      </aside>
    </div>
  );
}
