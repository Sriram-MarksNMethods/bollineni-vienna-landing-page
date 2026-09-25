"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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

// Gallery indexes in strip order: the Master Bedroom (0) is third, in the
// middle of the screen, because it's the photo that lifts out and zooms.
const stripOrder = [7, 8, 0, 1, 2, 3, 4, 5, 6];

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
    // Offset so the third tile (the Master Bedroom, see stripOrder) sits at the
    // horizontal centre on every screen size.
    <div className={`res-strip absolute left-[-7vw] max-md:left-[calc(-50vw-1.5rem)] bottom-[8vh] flex gap-[1vw] max-lg:gap-3 -rotate-6 ${className}`}>
      {stripOrder.map((i) => {
        const item = gallery[i];
        return (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={`Open ${item.name}`}
          className={`relative shrink-0 w-[22vw] h-[14vw] max-md:w-[40vw] max-md:h-[28vw] overflow-hidden cursor-pointer ${i === 0 ? "res-strip-bedroom" : ""}`}
        >
          <Image src={item.src} alt={item.name} fill sizes="(max-width: 767px) 40vw, 22vw" className="object-cover" />
        </button>
        );
      })}
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

            const sectionEl = sectionRef.current as HTMLElement;
            const zoomEl = q(".res-zoom")[0] as HTMLElement;
            const tileEl = q(".res-intro .res-strip-bedroom")[0] as HTMLElement;

            // The full-screen zoom layer starts exactly on top of the bedroom
            // tile in the strip: same centre, same tilt, scaled down, and
            // clipped to the tile's proportions. Recomputed on every refresh.
            const tileStart = () => {
              const W = zoomEl.offsetWidth;
              const H = zoomEl.offsetHeight;
              const box = tileEl.getBoundingClientRect(); // rotated bounding box
              const home = sectionEl.getBoundingClientRect();
              const tileW = tileEl.offsetWidth;
              const tileH = tileEl.offsetHeight;
              const scale = Math.max(tileW / W, tileH / H);
              const insetX = ((1 - tileW / (W * scale)) / 2) * 100;
              const insetY = ((1 - tileH / (H * scale)) / 2) * 100;
              return {
                x: box.left + box.width / 2 - home.left - W / 2,
                y: box.top + box.height / 2 - home.top - H / 2,
                scale,
                clipPath: `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}%)`,
              };
            };

            gsap.set(tileEl, { autoAlpha: 0 });
            gsap.set(zoomEl, { autoAlpha: 1 });

            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: isMobile ? "+=400%" : "+=500%",
                  pin: true,
                  scrub: 0.5,
                  anticipatePin: 1,
                  invalidateOnRefresh: true,
                },
              })
              // 1–2: the bedroom photo lifts out of the strip, straightens and
              // fills the frame; the heading fades and the strip drifts behind it
              .fromTo(
                zoomEl,
                {
                  x: () => tileStart().x,
                  y: () => tileStart().y,
                  scale: () => tileStart().scale,
                  rotate: -6,
                  clipPath: () => tileStart().clipPath,
                },
                { x: 0, y: 0, scale: 1, rotate: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1.4 },
                0.2
              )
              .to(q(".res-intro .res-strip"), { xPercent: -8, duration: 1.4 }, 0.2)
              .to(q(".res-intro h2"), { autoAlpha: 0, y: -30, duration: 0.5 }, 0.3)
              .set(q(".res-intro"), { autoAlpha: 0 }, 1.6)
              // hand-off: the track's first panel is the same photo, full-bleed
              .set(q(".res-track"), { autoAlpha: 1 }, 1.6)
              .set(zoomEl, { autoAlpha: 0 }, 1.6)
              // 3: horizontal track
              .to(trackEl, { x: () => -(trackEl.scrollWidth - window.innerWidth), duration: 5 }, 1.6)
              // 4: closing statement wipes in from the right, strip returns
              .fromTo(q(".res-closing"), { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 6.6)
              .fromTo(q(".res-closing .res-strip"), { xPercent: 10 }, { xPercent: -5, duration: 1.5 }, 6.6)
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
      <div className="res-zoom pointer-events-none absolute inset-0 invisible motion-reduce:hidden">
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

      {/* Portalled to <body>: ScrollTrigger transforms the pinned section, which would
          otherwise trap this fixed overlay inside it and clip it. */}
      {lightboxIndex !== null &&
        createPortal(
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
          </div>,
          document.body
        )}
    </section>
  );
}
