"use client";

import { useEffect, useRef, useState } from "react";
import Doodle from "./Doodle";

const amenities = [
  { icon: "swimming-pool", name: "Swimming Pool", text: "for unhurried relaxation." },
  { icon: "park", name: "Open-Air Seating", text: "for relaxed moments." },
  { icon: "racquet", name: "Double Badminton Court", text: "for active leisure." },
  { icon: "elevator", name: "Personal Elevators", text: "for added privacy." },
  { icon: "flower-lotus", name: "Meditation Deck", text: "for moments of stillness." },
  { icon: "person-simple-run", name: "Jogging Track", text: "for invigorating mornings." },
  { icon: "barbell", name: "Gym", text: "for everyday fitness." },
  { icon: "tennis-ball", name: "Lawn Tennis / Pickle Ball", text: "for active play." },
];

const pad = (n: number) => String(n).padStart(2, "0");

const arrowClass =
  "flex size-12 max-md:size-10 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors cursor-pointer hover:bg-ink hover:text-beige hover:border-ink disabled:opacity-30 disabled:pointer-events-none";

export default function Amenities() {
  const rowRef = useRef<HTMLUListElement>(null);
  const [introOpen, setIntroOpen] = useState(false);
  // Last card fully in view (1-based), for the "03 / 08" counter.
  const [shown, setShown] = useState(1);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; scroll: number } | null>(null);

  // Keeps the counter and the arrows' disabled state in step with the row's
  // scroll position (arrows, swipe, trackpad and mouse drag all scroll it).
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => {
      const right = row.scrollLeft + row.clientWidth;
      const cards = Array.from(row.children) as HTMLElement[];
      const lastVisible = cards.filter((c) => c.offsetLeft + c.offsetWidth <= right + 2).length;
      setShown(Math.max(1, lastVisible));
      setAtStart(row.scrollLeft <= 2);
      setAtEnd(right >= row.scrollWidth - 2);
    };
    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // One card (plus the gap) per arrow click.
  const step = (direction: 1 | -1) => {
    const row = rowRef.current;
    const [first, second] = Array.from(row?.children ?? []) as HTMLElement[];
    if (!row || !first || !second) return;
    row.scrollBy({ left: direction * (second.offsetLeft - first.offsetLeft), behavior: "smooth" });
  };

  // Click-and-drag for mouse users (touch and trackpads scroll natively).
  // Snapping is switched off while dragging so it doesn't fight the pointer,
  // and back on at release, which settles the row on the nearest card.
  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, scroll: e.currentTarget.scrollLeft };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    if (!drag.current) return;
    e.currentTarget.scrollLeft = drag.current.scroll - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  // Rendered in two places (only one is ever displayed): the hidden copy is
  // display:none, so screen readers and the keyboard only meet one set.
  // From 768px up: "03 / 08  ← →". On phones the counter moves between the
  // arrows ("←  01 / 08  →") via flex order.
  const controls = (
    <div className="flex items-center gap-2">
      <p
        className="mr-[1vw] max-lg:mr-2 max-md:order-2 max-md:mx-4 text-sm uppercase tracking-[0.2em] tabular-nums text-ink/60"
        aria-live="polite"
      >
        <span className="text-ink">{pad(shown)}</span> / {pad(amenities.length)}
      </p>
      <button type="button" aria-label="Previous amenities" onClick={() => step(-1)} disabled={atStart} className={`${arrowClass} max-md:order-1`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button type="button" aria-label="Next amenities" onClick={() => step(1)} disabled={atEnd} className={`${arrowClass} max-md:order-3`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );

  return (
    <section id="amenities" className="@container bg-beige text-ink">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <div className="flex items-end justify-between gap-[4vw] max-lg:flex-col max-lg:items-start max-lg:gap-6">
          <div className="flex flex-col gap-[1.5vw] max-w-[45vw] max-lg:max-w-none max-lg:gap-5">
            <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none">AMENITIES</h2>
            {/* On phones the intro is clamped to three lines behind "Read more". */}
            <div>
              <p
                id="amenities-intro"
                className={`text-base max-md:text-[0.95rem] leading-relaxed text-ink/70 ${introOpen ? "" : "max-md:line-clamp-3"}`}
              >
                Designed for exclusivity and refined living, Bollineni Vienna by Bollineni Group offers curated amenities spanning luxury, wellness, recreation, and convenience. As a low-density gated community, it creates a vibrant lifestyle experience for those seeking premium apartments in Yelahanka and ultra luxury apartments in North Bengaluru.
              </p>
              <button
                type="button"
                onClick={() => setIntroOpen(!introOpen)}
                aria-expanded={introOpen}
                aria-controls="amenities-intro"
                className="hidden max-md:inline-block mt-2 text-sm underline underline-offset-4 cursor-pointer"
              >
                {introOpen ? "Read less" : "Read more"}
              </button>
            </div>
          </div>

          {/* Counter + arrows: beside the heading from 768px up, below the
              cards on phones (see the copy after the row). */}
          <div className="shrink-0 max-md:hidden">{controls}</div>
        </div>

        <div className="w-full pt-12 max-lg:pt-10 max-md:pt-8"></div>
      </div>

      {/* From 768px up the row runs to the right edge of the screen so the
          next card peeks in; its left padding (and scroll-padding, for
          snapping) matches the page gutter so the first card lines up with the
          heading. On phones each card snaps to the centre instead: the side
          padding is (100% - card width) / 2, so the first and last cards can
          centre too. Both are in cqw (the section's width, set up by
          @container) rather than vw, which would include the reserved
          scrollbar gutter and push the cards off-centre. */}
      <ul
        ref={rowRef}
        aria-label="Amenities"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`flex gap-[1.25vw] max-lg:gap-4 max-md:gap-3 overflow-x-auto [scrollbar-width:none] px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-[19cqw] max-sm:px-[11cqw] scroll-px-32 lg:max-xl:scroll-px-20 max-lg:scroll-px-20 max-md:scroll-px-0 select-none ${
          dragging ? "cursor-grabbing" : "snap-x snap-mandatory md:cursor-grab"
        }`}
      >
        {amenities.map((amenity) => (
          <li
            key={amenity.icon}
            className="snap-start max-md:snap-center shrink-0 w-[22vw] lg:max-xl:w-[26vw] max-lg:w-[38vw] max-md:w-[62cqw] max-sm:w-[78cqw] aspect-[3/4] rounded-2xl bg-khaki border border-ink/5 p-[2vw] max-lg:p-7 max-md:p-6 flex flex-col justify-between"
          >
            <Doodle name={amenity.icon} label={amenity.name} className="w-full flex-1 min-h-0 text-ink" />
            <div className="flex flex-col gap-[0.5vw] max-lg:gap-2">
              <h3 className="font-heading text-[2.25vw] lg:max-xl:text-3xl max-lg:text-3xl max-md:text-[1.75rem] font-medium leading-[1.1]">
                {amenity.name}
              </h3>
              <p className="text-base max-md:text-[0.95rem] text-ink/60">{amenity.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden max-md:flex justify-center pt-6">{controls}</div>

      <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
    </section>
  );
}
