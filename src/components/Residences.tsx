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

// All 9 gallery photos, one after another, each revealed on top of the last:
// "wipe" = a thin vertical slice that widens to full screen,
// "zoom" = pops in small in the centre, then grows to full screen,
// "card" = a card that grows to full screen carrying one summary sentence.
// The first photo is the opening frame with the section title.
const scenes = [
  { image: 0, reveal: "base" },
  { image: 1, reveal: "wipe" },
  { image: 2, reveal: "zoom" },
  { image: 3, reveal: "zoom" },
  { image: 4, reveal: "card", sentence: 0 },
  { image: 5, reveal: "wipe" },
  { image: 6, reveal: "zoom" },
  { image: 7, reveal: "card", sentence: 1 },
  { image: 8, reveal: "zoom" },
] as const;

// Start (hidden) and middle (small) clip-paths per reveal. Every value spells
// out all four insets: the browser shortens computed inset() values, and
// tweening between strings with different numbers of values goes lopsided.
const clips = {
  wipe: ["inset(50% 49.9% 50% 49.9%)", "inset(12% 49.9% 12% 49.9%)"],
  zoom: ["inset(50% 50% 50% 50%)", "inset(38% 38% 38% 38%)"],
  card: ["inset(50% 50% 50% 50%)", "inset(32% 26% 32% 26%)"],
} as const;
const FULL = "inset(0% 0% 0% 0%)";

// Initial clip-paths as CSS, so nothing flashes before GSAP runs. They match
// clips[reveal][0] above.
const startClass = {
  base: "",
  wipe: "motion-safe:[clip-path:inset(50%_49.9%_50%_49.9%)]",
  zoom: "motion-safe:[clip-path:inset(50%_50%_50%_50%)]",
  card: "motion-safe:[clip-path:inset(50%_50%_50%_50%)]",
} as const;

// Full-screen layer; with reduced motion the layers just stack.
const layer = "absolute inset-0 motion-reduce:relative motion-reduce:h-[100svh] overflow-hidden";

const caption = (index: number, item: GalleryImage) =>
  `${String(index + 1).padStart(2, "0")} ${item.name}`;

export default function Residences() {
  const villa = useVilla();
  const { gallery } = villa;
  // The summary is three sentences: two go on the cards, the last closes the story.
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
                end: isMobile ? "+=700%" : "+=900%",
                pin: true,
                scrub: 0.5,
                anticipatePin: 1,
              },
            });

            // Opening frame: the title lifts away as the first reveal starts.
            tl.to(q(".res-title"), { opacity: 0, y: -40, duration: 0.5 }, 0.2);

            let t = 0.6;
            scenes.forEach((scene, i) => {
              if (scene.reveal === "base") return;
              const el = q(`.res-scene-${i}`);
              const img = q(`.res-scene-${i} .res-img`);
              const [hidden, small] = clips[scene.reveal];
              const popTime = scene.reveal === "wipe" ? 0.4 : scene.reveal === "card" ? 0.5 : 0.3;

              tl.fromTo(el, { clipPath: hidden }, { clipPath: small, duration: popTime }, t)
                .fromTo(el, { clipPath: small }, { clipPath: FULL, duration: 1.1 }, t + popTime)
                .fromTo(img, { scale: scene.reveal === "wipe" ? 1.15 : 1.4 }, { scale: 1, duration: popTime + 1.1 }, t);
              if (scene.reveal === "card") {
                tl.fromTo(q(`.res-scene-${i} .res-text`), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, t + 0.6);
              }
              t += popTime + 1.1 + (scene.reveal === "card" ? 0.5 : 0.2);
            });

            // Closing: khaki opens from the centre with the last sentence.
            tl.fromTo(q(".res-closing"), { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: FULL, duration: 1 }, t)
              .fromTo(q(".res-closing p"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, t + 0.6)
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
              <div className="res-title absolute inset-0 flex items-center justify-center bg-black/35">
                <h2 className="text-7xl max-lg:text-6xl max-md:text-4xl font-medium leading-none text-white">RESIDENCE</h2>
              </div>
            )}
            {scene.reveal === "card" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-5">
                <p className="res-text max-w-[52vw] max-lg:max-w-[44rem] max-md:max-w-[85vw] text-center font-heading uppercase text-white text-4xl max-lg:text-3xl max-md:text-2xl leading-tight">
                  {sentences[scene.sentence]}
                </p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-[1.5vw] max-lg:p-4 text-white bg-[linear-gradient(#0000,#0c0c0cbf)]">
              {caption(scene.image, item)}
            </div>
          </button>
        );
      })}

      {/* Closing statement */}
      <div className={`res-closing ${layer} bg-khaki flex items-center justify-center motion-safe:[clip-path:inset(0%_50%_0%_50%)]`}>
        <p className="max-w-[50vw] max-lg:max-w-[40rem] max-md:max-w-[85vw] px-5 text-center font-heading uppercase text-ink text-5xl max-lg:text-4xl max-md:text-2xl leading-tight">
          {closing}
        </p>
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
