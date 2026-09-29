"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import StatsStrip from "./StatsStrip";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const facts = [
  { value: "12+ ", label: "Years" },
  { value: "10 Million Sft.", label: "Developed" },
  { value: "5K+", label: "Happy Families" },
  { value: "5 Million Sft.", label: "Under Development" },
];

export default function AboutBuilder() {
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const [open, setOpen] = useState(false);

  // The quote reveals line by line (each line slides up out of a mask) the
  // first time it scrolls into view. autoSplit re-splits it when the width or
  // the font changes, so the lines always match what's on screen.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      SplitText.create(quoteRef.current, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 100,
            opacity: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: quoteRef.current, start: "top 80%", once: true },
          }),
      });
    });
    return () => mm.revert();
  });

  return (
    <section id="builder" className="bg-beige text-ink">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <h2 className="font-body text-sm uppercase tracking-[0.2em] text-ink/60">About BSCPL</h2>

        <div className="w-full pt-8 max-md:pt-6"></div>

        <blockquote ref={quoteRef} className="font-heading text-[3.75vw] lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl leading-[1.15] max-w-[70vw] max-lg:max-w-none">
          &ldquo;We don&rsquo;t build homes; we build them to endure, with engineering at their foundation and trust at their core.&rdquo;
        </blockquote>

        <div className="w-full pt-12 max-lg:pt-10 max-md:pt-8"></div>

        <div className="max-w-[46rem]">
          <p
            id="builder-copy"
            className={`text-base max-md:text-[0.95rem] leading-relaxed text-ink/70 ${open ? "" : "line-clamp-4"}`}
          >
            BSCPL developers bring decades of infrastructure and engineering expertise to residential development across Bengaluru, Hyderabad, and Chennai, creating durable, thoughtfully planned homes rooted in quality, transparency, and timely execution. From RERA-compliant processes and clear communication to communities shaped by greenery, open spaces, and premium amenities, every project is designed for comfort and lasting value. Strategically chosen locations further enhance connectivity, lifestyle, and investment potential. With a legacy of quality construction and refined design, BSCPL developers continues to create homes that inspire confidence, from bespoke residences Bengaluru homebuyers can trust to flats for sale in Kogilu, premium apartments in Yelahanka, and ultra-luxury apartments in North Bengaluru.
          </p>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="builder-copy"
            className="mt-3 text-sm underline underline-offset-4 cursor-pointer"
          >
            {open ? "Read less" : "Read more"}
          </button>
        </div>

        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        <StatsStrip stats={facts} size="compact" valueClassName="text-[#d9ad2b]" />

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
