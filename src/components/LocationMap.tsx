"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useVilla } from "./Villa";

// Same point as the Google Maps embed this section used to show.
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=13.09948759127624,77.61092311772155";

// Hand-drawn area map on a 1000 x 800 canvas. A simplified sketch, not to
// scale, but every place sits in its real direction from the project:
// Yelahanka ~1.5 km west, Bellary Road running north just west of the site
// and bending north-east to the airport (~15 km NNE), Hebbal ~7 km south
// with the Outer Ring Road running east-west through it. Landmarks, from
// their real coordinates: Air Force Station Yelahanka ~4 km north beside
// Bellary Road, Phoenix Mall of Asia ~3 km south just west of Bellary Road,
// Manyata Tech Park ~6 km south just north of the Outer Ring Road. Yelahanka
// Junction is placed on the railway beside Yelahanka (approximate).
const W = 1000;
const H = 800;

const roads = {
  bellary: "M470 800 C480 650 500 560 500 470 C500 360 520 280 600 220 C680 160 760 130 830 112",
  orr: "M20 742 C200 702 330 762 472 752 C620 742 800 702 980 722",
  // short lane from Bellary Road to the site
  lane: "M500 472 C520 470 540 474 558 476",
};

// Railway through Yelahanka, west of Bellary Road: two rails plus sleepers.
const railway = "M318 800 C312 700 300 600 300 480 C300 360 312 200 330 0";

// Real lakes, drawn unlabelled: Hebbal Lake just north of the Hebbal
// junction by Bellary Road, Jakkur Lake east of Bellary Road between Hebbal
// and the site, Yelahanka Lake west of the road just south of Yelahanka.
const lakes = [
  "M360 668 C354 648 374 636 400 640 C422 644 436 638 442 652 C448 668 432 686 404 688 C378 690 364 684 360 668 Z M376 656 q8 -5 16 0 t16 0 t16 0 M384 672 q8 -5 16 0 t16 0",
  "M548 590 C538 562 566 546 598 552 C626 556 648 548 654 568 C660 590 640 612 606 614 C574 616 556 610 548 590 Z M568 572 q9 -6 18 0 t18 0 t18 0 t18 0 M576 592 q9 -6 18 0 t18 0 t18 0",
  "M356 540 C348 516 372 500 404 506 C430 510 446 504 450 522 C454 544 432 560 400 560 C372 560 360 556 356 540 Z M372 522 q8 -5 16 0 t16 0 t16 0 t16 0 M382 540 q8 -5 16 0 t16 0 t16 0",
];

// Tree: a cloud-shaped canopy on a trunk, anchored at its base (x, y).
const tree = (x: number, y: number) =>
  `M${x - 9} ${y - 18} C${x - 21} ${y - 20} ${x - 23} ${y - 36} ${x - 11} ${y - 40} C${x - 9} ${y - 52} ${x + 7} ${y - 52} ${x + 7} ${y - 40} C${x + 19} ${y - 38} ${x + 17} ${y - 20} ${x + 5} ${y - 18} M${x - 2} ${y - 18} L${x - 2} ${y}`;

// Landmark sketches, drawn after the roads.
const sketches = [
  ...lakes,
  // Yelahanka: a small cluster of houses
  "M340 452 L340 430 L352 420 L364 430 L364 452 M372 452 L372 424 L386 412 L400 424 L400 452 M408 452 L408 434 L418 426 L428 434 L428 452 M332 452 L436 452",
  // airport: plane and runway
  "M852 88 L902 64 C908 61 912 66 907 70 L858 94 Z M880 76 L870 60 L877 58 L893 72 M874 83 L881 98 L888 96 L888 80",
  "M800 142 L920 110 M806 156 L926 124",
  // tree clusters
  "M700 580 C686 578 684 558 698 554 C700 540 720 540 720 554 C734 556 732 578 718 580 M709 580 L709 598",
  "M240 300 C226 298 224 278 238 274 C240 260 260 260 260 274 C274 276 272 298 258 300 M249 300 L249 318",
  "M790 430 C778 428 776 412 788 408 C790 396 806 396 806 408 C818 410 816 428 804 430 M797 430 L797 446",
  "M180 560 C168 558 166 542 178 538 C180 526 196 526 196 538 C208 540 206 558 194 560 M187 560 L187 576",
  // Air Force Station Yelahanka: runway and a small jet
  "M560 318 L668 298 M562 332 L670 312",
  "M596 292 L630 276 C634 274 637 277 634 280 L600 296 Z M614 285 L607 274 L612 272 L623 282 M610 290 L615 300 L620 299 L620 288",
  // Phoenix Mall of Asia: shopfront with an awning
  "M404 626 L404 596 L456 596 L456 626 M398 596 L462 596 L456 584 L404 584 Z M420 626 L420 610 L440 610 L440 626 M396 626 L464 626",
  // Manyata Tech Park: office blocks
  "M604 722 L604 668 L636 668 L636 722 M644 722 L644 650 L684 650 L684 722 M598 722 L690 722",
  "M612 682 L628 682 M612 696 L628 696 M612 710 L628 710 M652 664 L676 664 M652 678 L676 678 M652 692 L676 692 M652 706 L676 706",
  // Yelahanka Junction: station building on the railway
  "M284 432 L284 412 L300 400 L316 412 L316 432 Z M278 432 L322 432 M296 432 L296 420 L304 420 L304 432",
  // more greenery around the site and in the open areas
  `${tree(712, 470)} ${tree(736, 482)}`,
  `${tree(880, 540)} ${tree(904, 552)} ${tree(870, 574)}`,
  `${tree(180, 250)} ${tree(204, 262)}`,
  `${tree(770, 620)} ${tree(794, 630)}`,
  `${tree(930, 340)}`,
  `${tree(120, 680)} ${tree(146, 690)}`,
  // north arrow
  "M80 120 L80 60 M66 78 L80 60 L94 78",
];

// Labels as HTML over the drawing, so they stay readable at any width.
// x / y are on the 1000 x 800 canvas.
const labels: { text: string; x: number; y: number; wrap?: string }[] = [
  { text: "Yelahanka", x: 384, y: 478 },
  { text: "Bellary Road", x: 452, y: 318, wrap: "max-w-[6em]" },
  // Long names wrap onto two lines so they fit narrow screens.
  { text: "Kempegowda International Airport", x: 850, y: 196, wrap: "max-w-[12em]" },
  { text: "Air Force Station Yelahanka", x: 770, y: 300, wrap: "max-w-[10em]" },
  { text: "Yelahanka Junction", x: 214, y: 420, wrap: "max-w-[8em]" },
  { text: "Phoenix Mall of Asia", x: 318, y: 606, wrap: "max-w-[8em]" },
  { text: "Manyata Tech Park", x: 780, y: 690, wrap: "max-w-[8em]" },
  { text: "Hebbal", x: 412, y: 722 },
  { text: "Outer Ring Road", x: 800, y: 760 },
];

const PIN = { x: 580, y: 476 };

function AreaMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const filterId = `area-map-rough-${useId().replace(/:/g, "")}`;

  // Draws in once, when the map is well into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -20% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // pathLength="1" + stroke-dashoffset draw-in (keyframes: doodle-draw in
  // globals.css). Reduced motion skips straight to the finished map.
  const draw = (delay: number, duration = 1.2) => ({
    className: "motion-reduce:[animation:none]! motion-reduce:[stroke-dashoffset:0]!",
    pathLength: 1,
    style: {
      strokeDasharray: 1,
      strokeDashoffset: 1,
      animation: drawn ? `doodle-draw ${duration}s ease-out ${delay}s both` : "none",
    },
  });
  // Delay as an inline style: Tailwind only generates classes it can see
  // written out in full, so a class built from `delay` would do nothing.
  const fadeIn = (delay: number) => ({
    className: `transition-opacity duration-700 motion-reduce:opacity-100 ${drawn ? "opacity-100" : "opacity-0"}`,
    style: { transitionDelay: `${delay}ms` },
  });

  return (
    <div ref={ref} className="relative w-full aspect-[5/4] max-md:w-[640px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full text-ink" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Roads: a wide ink stroke with a narrower beige stroke on top reads
              as a double-lined road; the dashed centre line fades in after. */}
          {[roads.orr, roads.bellary].map((d, i) => (
            <g key={d}>
              <path d={d} stroke="currentColor" strokeWidth={16} {...draw(i * 0.4)} />
              <path d={d} stroke="var(--color-beige)" strokeWidth={11} {...draw(i * 0.4)} />
              <path d={d} stroke="currentColor" strokeWidth={1.5} strokeDasharray="10 12" {...fadeIn(1400 + i * 400)} />
            </g>
          ))}
          <g {...fadeIn(1000)}>
            <path d={railway} stroke="currentColor" strokeWidth={12} strokeDasharray="2 12" strokeLinecap="butt" />
            <path d={railway} stroke="currentColor" strokeWidth={1.5} />
          </g>
          <path d={roads.lane} stroke="currentColor" strokeWidth={2.5} {...draw(1.2, 0.5)} />
          {sketches.map((d, i) => (
            <path key={i} d={d} stroke="currentColor" strokeWidth={2.5} {...draw(1.4 + i * 0.07, 0.8)} />
          ))}
        </g>
      </svg>

      {labels.map((label) => (
        <span
          key={label.text}
          className={`absolute -translate-x-1/2 -translate-y-1/2 bg-beige px-1.5 text-[0.8rem] max-md:text-[0.6rem] uppercase tracking-[0.18em] text-ink/75 ${
            label.wrap ? `w-max ${label.wrap} text-center leading-snug` : "whitespace-nowrap"
          } ${fadeIn(2000).className}`}
          style={{ left: `${(label.x / W) * 100}%`, top: `${(label.y / H) * 100}%`, ...fadeIn(2000).style }}
        >
          {label.text}
        </span>
      ))}

      {/* The project pin drops in last. */}
      <div
        className={`absolute -translate-x-1/2 flex flex-col items-center transition duration-700 ease-out [transition-delay:2600ms] motion-reduce:opacity-100 motion-reduce:-translate-y-full ${
          drawn ? "opacity-100 -translate-y-full" : "opacity-0 -translate-y-[160%]"
        }`}
        style={{ left: `${(PIN.x / W) * 100}%`, top: `${(PIN.y / H) * 100}%` }}
      >
        <span className="mb-1.5 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[0.8rem] max-md:text-[0.6rem] uppercase tracking-[0.18em] text-beige">
          Bollineni Vienna
        </span>
        <svg viewBox="0 0 24 32" className="w-[2.25vw] max-lg:w-7 max-md:w-5 text-ink" aria-hidden="true">
          <path d="M12 31 C8 24 2 18 2 11 a10 10 0 0 1 20 0 C22 18 16 24 12 31 Z" fill="currentColor" />
          <circle cx="12" cy="11" r="4" fill="var(--color-beige)" />
        </svg>
      </div>
    </div>
  );
}

export default function LocationMap() {
  const villa = useVilla();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Below 768px the map is drawn at a readable 640px wide in a sideways-
  // swipeable row (too many labels to fit a phone width); start it centred on
  // the project pin.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (PIN.x / W) * el.scrollWidth - el.clientWidth / 2;
  }, []);

  return (
    <section id="location" className="bg-beige text-ink">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <div className="grid grid-cols-[1fr_2fr] gap-[4vw] items-center max-lg:grid-cols-1 max-lg:gap-8">
          <div className="flex flex-col items-start gap-[1.25vw] max-lg:gap-4">
            <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none">LOCATION</h2>
            <p className="text-base max-md:text-[0.95rem] text-ink/70">{villa.location.name}</p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-[0.75vw] max-lg:mt-2 inline-flex items-center gap-2 rounded-full bg-ink px-[1.5vw] py-[0.75vw] max-lg:px-6 max-lg:py-3 text-base max-lg:text-sm font-medium text-beige transition-colors hover:bg-ink/85"
            >
              View on Google Maps
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div
            ref={scrollerRef}
            className="max-md:overflow-x-auto max-md:-mx-10 max-md:px-10 max-sm:-mx-5 max-sm:px-5 max-md:[scrollbar-width:none]"
          >
            <AreaMap />
          </div>
        </div>

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
