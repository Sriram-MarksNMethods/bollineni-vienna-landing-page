"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { markLoaderDone } from "@/lib/loaderDone";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dismissedRef = useRef(false);

  // Keep the visitor pinned to the top and unable to scroll for as long as
  // the preloader is on screen.
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    lockScroll();

    return () => {
      unlockScroll();
    };
  }, []);

  useEffect(() => {
    const dismiss = () => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      unlockScroll();
      setVisible(false);
      markLoaderDone();
    };

    const timer = setTimeout(() => {
      const tl = gsap.timeline({ onComplete: dismiss });

      // logo fades out first
      tl.to(contentRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: "power1.out",
      });

      // then the whole screen retracts upward, like a curtain
      tl.to(
        rootRef.current,
        {
          yPercent: -100,
          duration: 0.6,
          ease: "power3.inOut",
        },
        "-=0.05"
      );
    }, 500);

    // Safety net: if the animation never fires or never completes for any
    // reason, don't leave the visitor stuck unable to scroll.
    const failsafe = setTimeout(dismiss, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(failsafe);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99] bg-white w-screen h-screen flex"
      ref={rootRef}
    >
      <div
        className="flex flex-col items-center gap-[0.5vw] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-md:gap-2"
        ref={contentRef}
      >
        {/* The logo file is the mark in the middle of a 1920 x 1080 canvas;
            this viewBox crops to the mark (same as the footer), so the height
            below is the logo's own height. */}
        <svg viewBox="654 163 611 755" className="h-[12vw] w-auto max-lg:h-40 max-md:h-36 max-sm:h-32" role="img" aria-label="Bollineni Vienna">
          <image href="/images/bollineni_vienna_gold.svg" x="0" y="0" width="1920" height="1080" />
        </svg>
      </div>
    </div>
  );
}
