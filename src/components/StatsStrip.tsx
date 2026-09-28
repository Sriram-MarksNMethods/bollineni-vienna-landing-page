"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Dividers between the four stats: a vertical line left of every stat except
// the first on desktop; on the 2 x 2 grid below 992px, a line left of the
// right-hand column and a line above the bottom row.
const cellBorders = [
  "",
  "border-l border-ink/20",
  "border-l border-ink/20 max-lg:border-l-0 max-lg:border-t",
  "border-l border-ink/20 max-lg:border-t",
];

// Counts every number inside a value up from 0, keeping the rest of the
// text ("G+", " & ") as it is: "2.65" → 0.00…2.65, "G+18" → G+0…G+18.
const countTo = (value: string, progress: number) =>
  value.replace(/\d+(\.\d+)?/g, (n) => {
    const decimals = n.split(".")[1]?.length ?? 0;
    return (parseFloat(n) * progress).toFixed(decimals);
  });

// Figure sizes: "large" for short values ("2.65", "G+18"); "compact" for
// values with words in them ("10 Million Sft.") so they stay on one line on
// desktop and two at most on phones.
const valueSizes = {
  large: "text-[5vw] max-lg:text-6xl max-md:text-5xl",
  compact: "text-[2.6vw] max-lg:text-4xl max-md:text-[1.75rem]",
};

export default function StatsStrip({
  stats,
  size = "large",
  valueClassName = "",
}: {
  stats: { value: string; label: string }[];
  size?: keyof typeof valueSizes;
  // Extra classes for the figures, e.g. a colour (the About section's gold).
  valueClassName?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const numbers = gsap.utils.toArray<HTMLElement>(".stat-value", rootRef.current);
        const counter = { progress: 0 };
        const render = () => {
          numbers.forEach((el, i) => {
            el.textContent = countTo(stats[i].value, counter.progress);
          });
        };
        render();
        gsap.to(counter, {
          progress: 1,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: render,
          scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
        });
        // Leave the real values in place if this is reverted (e.g. the
        // visitor switches on reduced motion).
        return () => {
          numbers.forEach((el, i) => {
            el.textContent = stats[i].value;
          });
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="grid grid-cols-4 max-lg:grid-cols-2">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`flex flex-col items-center justify-center gap-[0.75vw] px-[1vw] py-[1vw] max-lg:gap-3 max-lg:px-4 max-lg:py-8 ${cellBorders[index]}`}
        >
          <div className={`stat-value font-heading ${valueSizes[size]} font-medium leading-none lining-nums tabular-nums text-center ${valueClassName}`}>
            {stat.value}
          </div>
          <div className="text-sm max-md:text-[0.7rem] uppercase tracking-[0.2em] text-ink/60 text-center">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
