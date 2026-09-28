"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Plan {
  label: string;
  src: string;
}

interface Tower {
  id: string;
  label: string;
  plans: Plan[];
}

const towers: Tower[] = [
  {
    id: "tower-a",
    label: "Tower A · 5 BHK",
    plans: [
      { label: "Typical Floor Plan", src: "/images/floor-plans/tower-a/typical-plan.jpg" },
      { label: "First Floor", src: "/images/floor-plans/tower-a/first-floor-plan.jpg" },
      { label: "Unit 1", src: "/images/floor-plans/tower-a/unit-1.jpg" },
      { label: "Unit 2", src: "/images/floor-plans/tower-a/unit-2.jpg" },
      { label: "Unit 1 · First Floor", src: "/images/floor-plans/tower-a/unit-1-first-floor.jpg" },
    ],
  },
  {
    id: "tower-b",
    label: "Tower B · 4 BHK",
    plans: [
      { label: "Typical Floor Plan", src: "/images/floor-plans/tower-b/typical-plan.jpg" },
      { label: "First Floor", src: "/images/floor-plans/tower-b/first-floor-plan.jpg" },
      { label: "Unit 1", src: "/images/floor-plans/tower-b/unit-1.jpg" },
      { label: "Unit 2", src: "/images/floor-plans/tower-b/unit-2.jpg" },
      { label: "Unit 3", src: "/images/floor-plans/tower-b/unit-3.jpg" },
      { label: "Unit 3 · First Floor", src: "/images/floor-plans/tower-b/unit-3-first-floor.jpg" },
    ],
  },
];

// Every plan in both towers, so the frame can crossfade between any two.
const allPlans = towers.flatMap((tower) => tower.plans);

const openEnquiry = () => window.dispatchEvent(new Event("open-enquiry"));

// How long each plan stays up before the viewer moves on by itself.
const AUTOPLAY_MS = 4500;

export default function FloorPlans() {
  const [towerId, setTowerId] = useState(towers[0].id);
  const [planIndex, setPlanIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tower = towers.find((t) => t.id === towerId) ?? towers[0];
  const plan = tower.plans[planIndex] ?? tower.plans[0];

  const selectTower = (id: string) => {
    setTowerId(id);
    setPlanIndex(0);
  };

  // Next plan in this tower; after the last one, the first plan of the next tower.
  const advance = () => {
    if (planIndex < tower.plans.length - 1) {
      setPlanIndex(planIndex + 1);
      return;
    }
    const nextTower = towers[(towers.indexOf(tower) + 1) % towers.length];
    selectTower(nextTower.id);
  };

  // Only run the autoplay while the section is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Below 992px the plan names are a sideways-scrolling chip row: keep the
  // active chip in view as the plans change. scrollTo on the row itself
  // (not scrollIntoView) so the page's vertical scroll is never touched.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.children[planIndex] as HTMLElement | undefined;
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2, behavior: "smooth" });
  }, [planIndex, towerId]);

  const paused = !inView || hovered;

  return (
    <section ref={sectionRef} id="floor-plans" className="bg-teal text-white">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <div className="flex items-end justify-between gap-[4vw] max-lg:flex-col max-lg:items-start max-lg:gap-6">
          <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none whitespace-nowrap">
            FLOOR PLANS
          </h2>
          {/* On phones the intro is clamped to three lines behind "Read more",
              so the plans show up without a long scroll. */}
          <div className="max-w-[40vw] max-lg:max-w-none">
            <p
              id="floor-plans-intro"
              className={`text-base max-md:text-[0.95rem] leading-relaxed text-white/70 ${introOpen ? "" : "max-md:line-clamp-3"}`}
            >
              The floor plans at Bollineni Vienna are designed to balance spaciousness, privacy, natural light, and effortless flow. From expansive 4 BHK & 5 BHK apartments in Bengaluru to refined bespoke residences Bengaluru, every layout reflects thoughtful planning and contemporary luxury. Explore well-crafted homes at one of the most distinguished luxury apartments in Kogilu, designed for elevated everyday living.
            </p>
            <button
              type="button"
              onClick={() => setIntroOpen(!introOpen)}
              aria-expanded={introOpen}
              aria-controls="floor-plans-intro"
              className="hidden max-md:inline-block mt-2 text-sm text-white underline underline-offset-4 cursor-pointer"
            >
              {introOpen ? "Read less" : "Read more"}
            </button>
          </div>
        </div>

        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>

        <div className="flex gap-[0.75vw] max-lg:gap-3 max-md:gap-2 flex-wrap">
          {towers.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTower(t.id)}
              aria-pressed={t.id === tower.id}
              className={`px-[1.5vw] py-[0.6vw] lg:max-xl:px-5 lg:max-xl:py-2.5 max-lg:px-5 max-lg:py-2.5 max-md:px-4 max-md:py-2 rounded-full border text-base max-lg:text-sm max-md:text-xs transition-colors cursor-pointer ${
                t.id === tower.id
                  ? "border-white bg-white text-ink"
                  : "border-white/30 text-white/70 hover:text-white hover:border-white/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="w-full pt-10 max-lg:pt-8 max-md:pt-6"></div>

        {/* Mouse hover pauses the autoplay; touch taps don't (a tap fires
            pointerenter but never a matching pointerleave). */}
        <div
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
          className="grid grid-cols-[3fr_7fr] gap-[3vw] items-center max-lg:grid-cols-1 max-lg:gap-6"
        >
          {/* Plan names: a list on desktop, a swipeable chip row below 992px. */}
          <ul ref={listRef} className="relative flex flex-col gap-[1.25vw] max-lg:flex-row max-lg:gap-2 max-lg:overflow-x-auto max-lg:-mx-20 max-lg:px-20 max-md:-mx-10 max-md:px-10 max-sm:-mx-5 max-sm:px-5 max-lg:[scrollbar-width:none]">
            {tower.plans.map((p, index) => {
              const active = index === planIndex;
              return (
                <li key={p.src} className="max-lg:shrink-0">
                  <button
                    type="button"
                    onClick={() => setPlanIndex(index)}
                    aria-pressed={active}
                    className={`group flex items-baseline text-left cursor-pointer transition-colors max-lg:rounded-full max-lg:border max-lg:px-4 max-lg:py-2 max-lg:whitespace-nowrap ${
                      active
                        ? "text-white max-lg:border-white"
                        : "text-white/40 hover:text-white/80 max-lg:border-white/20"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-px self-center bg-white transition-all duration-300 max-lg:hidden ${active ? "w-[2vw] mr-[1vw]" : "w-0 mr-0"}`}
                    />
                    <span className="font-heading text-[2vw] lg:max-xl:text-3xl max-lg:text-sm max-lg:font-body leading-tight">
                      {p.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="relative w-full aspect-[16/9] max-md:aspect-[4/3] overflow-hidden bg-white/5">
            {allPlans.map((p) => (
              <Image
                key={p.src}
                src={p.src}
                alt=""
                fill
                sizes="(max-width: 991px) 100vw, 60vw"
                className={`object-cover blur-md scale-105 select-none pointer-events-none transition-opacity duration-500 ${
                  p.src === plan.src ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-ink/40" />
            {/* Autoplay timer: the bar fills over AUTOPLAY_MS and the viewer
                moves to the next plan when its animation ends. Pausing just
                freezes the animation, so the bar and the timing never drift
                apart. Hidden (so never ends) for reduced-motion visitors. */}
            <span
              key={plan.src}
              aria-hidden="true"
              onAnimationEnd={advance}
              className="absolute left-0 bottom-0 h-[3px] w-full origin-left bg-white motion-reduce:hidden"
              style={{
                animation: `floor-plan-progress ${AUTOPLAY_MS}ms linear forwards`,
                animationPlayState: paused ? "paused" : "running",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.25vw] max-lg:gap-4 px-6 text-center">
              <p className="text-sm max-md:text-xs uppercase tracking-[0.2em] text-white/80" aria-live="polite">
                {tower.label.split(" · ")[0]} · {plan.label}
              </p>
              <button
                type="button"
                onClick={openEnquiry}
                className="px-[1.75vw] py-[0.75vw] lg:max-xl:px-6 lg:max-xl:py-3 max-lg:px-6 max-lg:py-3 max-md:px-5 max-md:py-2.5 rounded-full bg-white text-ink text-base max-lg:text-sm max-md:text-xs font-medium hover:bg-khaki transition-colors cursor-pointer"
              >
                Unlock this plan
              </button>
            </div>
          </div>
        </div>

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
