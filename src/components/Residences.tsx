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

// All 9 gallery photos, one after another, each revealed on top of the last.
// After the opening photo the reveals repeat wipe → zoom → card:
// "wipe" = a thin vertical line grows in the centre, then widens to full screen,
// "zoom" = the whole photo appears small in the centre and grows to full
//          screen while the photo behind zooms in past the camera,
// "card" = pops in as a wide card, then grows to full screen.
// The first photo is the opening frame, with the section title and summary.
const scenes = [
  { image: 0, reveal: "base" },
  { image: 1, reveal: "wipe" },
  { image: 2, reveal: "zoom" },
  { image: 3, reveal: "card" },
  { image: 4, reveal: "wipe" },
  { image: 5, reveal: "zoom" },
  { image: 6, reveal: "card" },
  { image: 7, reveal: "wipe" },
  { image: 8, reveal: "zoom" },
] as const;

// Start (hidden) and middle (small) clip-paths for the wipe and card reveals.
// Every value spells out all four insets: the browser shortens computed
// inset() values, and tweening between strings with different numbers of
// values goes lopsided. (The zoom reveal scales the layer instead.)
const clips = {
  wipe: ["inset(50% 49.8% 50% 49.8%)", "inset(12% 49.8% 12% 49.8%)"],
  card: ["inset(50% 50% 50% 50%)", "inset(32% 26% 32% 26%)"],
} as const;
const FULL = "inset(0% 0% 0% 0%)";

// Initial clip-paths as CSS, so nothing flashes before GSAP runs. They match
// clips[reveal][0] above; zoom layers start hidden and are shown by GSAP.
const startClass = {
  base: "",
  wipe: "motion-safe:[clip-path:inset(50%_49.8%_50%_49.8%)]",
  zoom: "motion-safe:invisible",
  card: "motion-safe:[clip-path:inset(50%_50%_50%_50%)]",
} as const;

// Full-screen layer; with reduced motion the layers just stack.
const layer = "absolute inset-0 motion-reduce:relative motion-reduce:h-[100svh] overflow-hidden";

const caption = (index: number, item: GalleryImage) =>
  `${String(index + 1).padStart(2, "0")} ${item.name}`;

export default function Residences() {
  const villa = useVilla();
  const { gallery } = villa;

  const sectionRef = useRef<HTMLElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showPrev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
  const showNext = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.length));

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

            const tl = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top top",
                end: isMobile ? "+=600%" : "+=800%",
                pin: true,
                scrub: 0.5,
                anticipatePin: 1,
              },
            });

            // Opening frame: the title and summary fade away first; the photo
            // reveals only start once the text is gone.
            // fromTo, not to: a plain .to() would take the title's current
            // opacity as its start, so if this timeline is ever rebuilt while
            // the title is faded (e.g. resizing across a breakpoint), it would
            // fade from 0 to 0 and never come back.
            tl.fromTo(q(".res-title"), { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.6 }, 0.1);

            let t = 0.9;
            scenes.forEach((scene, i) => {
              if (scene.reveal === "base") return;
              const el = q(`.res-scene-${i}`);
              const img = q(`.res-scene-${i} .res-img`);
              // The photo currently on screen, which keeps moving towards the
              // camera while the next one arrives.
              const behind = q(`.res-scene-${i - 1} .res-img`);

              if (scene.reveal === "zoom") {
                // The whole photo appears small in the centre and grows to
                // full screen; the photo behind zooms in with it, like
                // flying through one picture into the next.
                tl.set(el, { autoAlpha: 1 }, t)
                  .fromTo(el, { scale: 0.12 }, { scale: 1, duration: 1.5, ease: "power2.in" }, t)
                  .fromTo(behind, { scale: 1 }, { scale: 2.5, duration: 1.5, ease: "power2.in" }, t);
                t += 1.7;
                return;
              }

              const [hidden, small] = clips[scene.reveal];
              const popTime = scene.reveal === "wipe" ? 0.4 : 0.5;

              // Pops in at its small size, then grows to full screen, while
              // the photo behind pushes in a little.
              tl.fromTo(el, { clipPath: hidden }, { clipPath: small, duration: popTime }, t)
                .fromTo(el, { clipPath: small }, { clipPath: FULL, duration: 1.1 }, t + popTime)
                .fromTo(img, { scale: scene.reveal === "wipe" ? 1.15 : 1.4 }, { scale: 1, duration: popTime + 1.1 }, t)
                .fromTo(behind, { scale: 1 }, { scale: 1.25, duration: popTime + 1.1 }, t);
              t += popTime + 1.3;
            });

            // Short hold on the last photo before the pin releases.
            tl.to({}, { duration: 0.5 });
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
      id="residences"
      ref={sectionRef}
      className="relative h-[100svh] overflow-hidden bg-ink motion-reduce:h-auto"
    >
      {scenes.map((scene, i) => {
        const item = gallery[scene.image];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(scene.image)}
            aria-label={`Open ${item.name}`}
            className={`res-scene-${i} ${layer} block w-full cursor-pointer text-left ${startClass[scene.reveal]}`}
          >
            <Image
              src={item.src}
              alt={item.name}
              fill
              sizes="100vw"
              className="res-img object-cover"
            />
            {scene.reveal === "base" && (
              <div className="res-title absolute inset-0 flex flex-col justify-end gap-[1.5vw] max-lg:gap-5 bg-[linear-gradient(#0000_30%,#0c0c0cd9)] px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5 pb-[8vw] max-lg:pb-24 max-md:pb-20">
                <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none text-white">RESIDENCE</h2>
                <p className="max-w-[55vw] max-lg:max-w-[38rem] max-md:max-w-none text-xl max-lg:text-lg max-md:text-base text-white/90">
                  {villa.summary}
                </p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-[1.5vw] max-lg:p-4 text-white bg-[linear-gradient(#0000,#0c0c0cbf)]">
              {caption(scene.image, item)}
            </div>
          </button>
        );
      })}


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
