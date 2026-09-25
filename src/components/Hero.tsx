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
            // Every clip-path tween is a fromTo with all four inset values spelled
            // out: the browser shortens computed values (e.g. "inset(32% 26%)"),
            // and tweening from a 2-value string to a 4-value one pairs the
            // numbers wrongly, so shapes grew lopsided from the corners.
            const full = "inset(0% 0% 0% 0%)";

            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: isMobile ? "+=300%" : "+=400%",
                  pin: true,
                  scrub: 0.5,
                  anticipatePin: 1,
                },
              })
              // 1 → 2: pool photo settles, title lifts away, a thin slice of the balcony photo opens
              .to(q(".hero-pool-img"), { scale: 1.08, duration: 1 }, 0)
              .to(q(".hero-pool-text"), { opacity: 0, y: -40, duration: 0.5 }, 0.3)
              .fromTo(q(".hero-ink"), { clipPath: "inset(50% 49.9% 50% 49.9%)" }, { clipPath: "inset(12% 49.9% 12% 49.9%)", duration: 0.4 }, 0.5)
              .fromTo(q(".hero-ink"), { clipPath: "inset(12% 49.9% 12% 49.9%)" }, { clipPath: full, duration: 1 }, 0.9)
              // 3: zoom through living room, then aerial view
              // (each photo pops in small, then grows to full screen)
              .fromTo(q(".hero-living"), { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(38% 38% 38% 38%)", duration: 0.3 }, 1.9)
              .fromTo(q(".hero-living"), { clipPath: "inset(38% 38% 38% 38%)" }, { clipPath: full, duration: 1.1 }, 2.2)
              .fromTo(q(".hero-living-img"), { scale: 1.4 }, { scale: 1, duration: 1.4 }, 1.9)
              .fromTo(q(".hero-aerial"), { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(40% 40% 40% 40%)", duration: 0.3 }, 3.3)
              .fromTo(q(".hero-aerial"), { clipPath: "inset(40% 40% 40% 40%)" }, { clipPath: full, duration: 1.1 }, 3.6)
              .fromTo(q(".hero-aerial-img"), { scale: 1.4 }, { scale: 1, duration: 1.4 }, 3.3)
              // 4: a photo card pops up over the aerial view, then grows to full screen with the hero line
              .fromTo(q(".hero-card"), { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(32% 26% 32% 26%)", duration: 0.5 }, 4.5)
              .fromTo(q(".hero-card"), { clipPath: "inset(32% 26% 32% 26%)" }, { clipPath: full, duration: 1 }, 5)
              .fromTo(q(".hero-card-text"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 5.1)
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

      {/* 2. Wipe onto the balcony photo */}
      <div className={`hero-ink ${layer} bg-ink motion-safe:[clip-path:inset(50%_49.9%_50%_49.9%)]`}>
        <Image
          src="/images/gallery/gallery-03.jpg"
          alt="Sunset view from a balcony at Bollineni Vienna."
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* 3a. Living room */}
      <div className={`hero-living ${layer} motion-safe:[clip-path:inset(50%_50%_50%_50%)]`}>
        <Image
          src="/images/about.jpg"
          alt="Living room at Bollineni Vienna."
          fill
          sizes="100vw"
          className="hero-living-img object-cover"
        />
      </div>

      {/* 3b. Aerial view */}
      <div className={`hero-aerial ${layer} motion-safe:[clip-path:inset(50%_50%_50%_50%)]`}>
        <Image
          src="/images/gallery/gallery-09.jpg"
          alt="Aerial view of the sports facilities at Bollineni Vienna."
          fill
          sizes="100vw"
          className="hero-aerial-img object-cover"
        />
      </div>

      {/* 4. Photo card with the hero line */}
      <div className={`hero-card ${layer} bg-ink flex items-center justify-center motion-safe:[clip-path:inset(50%_50%_50%_50%)]`}>
        <Image
          src="/images/gallery/gallery-05.jpg"
          alt="The Canopy Court at Bollineni Vienna."
          fill
          sizes="100vw"
          className="object-cover"
        />
        {/* Darkens the photo so the white text reads */}
        <div className="absolute inset-0 bg-black/55" />
        <p className="hero-card-text relative max-w-[52vw] max-lg:max-w-[44rem] max-md:max-w-[85vw] px-5 text-center font-heading uppercase text-white text-4xl max-lg:text-3xl max-md:text-2xl leading-tight">
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
