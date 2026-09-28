"use client";

import { useEffect, useId, useRef, useState } from "react";

// Hand-drawn style line doodles for the Amenities and Why Invest cards. Each
// doodle is a list of plain stroked paths on a 240 x 180 canvas; a small
// turbulence filter roughens the lines so they read as pen strokes rather
// than vector art.
// Paths draw in one after another (pathLength="1" + stroke-dashoffset) when
// the card scrolls into view.

// Circle as a path, so it can be drawn in like the other strokes.
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

// Tree: a cloud-shaped canopy on a trunk, anchored at its base (x, y); k
// scales it.
const tree = (x: number, y: number, k = 1) =>
  `M${x - 7 * k} ${y - 18 * k} C${x - 17 * k} ${y - 20 * k} ${x - 19 * k} ${y - 34 * k} ${x - 9 * k} ${y - 37 * k} ` +
  `C${x - 9 * k} ${y - 48 * k} ${x + 5 * k} ${y - 48 * k} ${x + 6 * k} ${y - 37 * k} ` +
  `C${x + 16 * k} ${y - 35 * k} ${x + 14 * k} ${y - 20 * k} ${x + 4 * k} ${y - 18 * k} M${x - 1 * k} ${y - 18 * k} L${x - 1 * k} ${y}`;

type Stroke = { d: string; transform?: string };

const doodles: Record<string, Stroke[]> = {
  "swimming-pool": [
    // sun
    { d: circle(44, 34, 11) },
    { d: "M44 15 L44 9 M44 53 L44 59 M25 34 L19 34 M63 34 L69 34 M31 21 L27 17 M57 21 L61 17 M31 47 L27 51 M57 47 L61 51" },
    // pool edge
    { d: "M14 76 C70 72 150 78 226 73" },
    // ladder
    { d: "M150 120 L150 46 C150 32 166 32 168 46 L168 62" },
    { d: "M180 120 L180 46 C180 32 196 32 198 46 L198 62" },
    { d: "M150 92 L180 92 M150 110 L180 110" },
    // water
    { d: "M18 98 q10 -7 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" },
    { d: "M30 126 q10 -7 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" },
    { d: "M14 154 q10 -7 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" },
  ],
  racquet: [
    // racquet head, strings and handle, tilted
    { d: "M54 72 a24 32 0 1 0 48 0 a24 32 0 1 0 -48 0", transform: "rotate(-25 78 72)" },
    { d: "M66 46 L66 98 M78 40 L78 104 M90 46 L90 98 M58 58 L98 58 M56 72 L100 72 M58 86 L98 86", transform: "rotate(-25 78 72)" },
    { d: "M78 104 L78 156 M73 132 L83 132 M73 140 L83 140 M73 148 L83 148", transform: "rotate(-25 78 72)" },
    // shuttlecock in flight
    { d: circle(182, 40, 7) },
    { d: "M176 45 L154 70 M180 47 L164 76 M185 47 L178 80 M154 70 Q162 82 178 80" },
    // flight trail
    { d: "M112 58 Q126 44 140 42 M120 70 Q134 58 148 56" },
    // court line
    { d: "M14 170 C80 166 160 172 226 167" },
  ],
  park: [
    // birds
    { d: "M54 48 q6 -6 12 0 q6 -6 12 0 M88 34 q5 -5 10 0 q5 -5 10 0" },
    // bench
    { d: "M44 104 L124 104 M44 116 L124 116" },
    { d: "M52 104 L52 132 M116 104 L116 132" },
    { d: "M38 132 L130 132" },
    { d: "M50 132 L48 164 M118 132 L120 164" },
    // tree
    { d: "M180 166 L180 112 M180 130 L192 118" },
    { d: "M180 112 C152 114 148 84 166 76 C162 54 192 46 200 64 C222 62 228 92 208 102 C206 116 188 118 180 112" },
    // ground
    { d: "M14 168 C80 164 160 170 226 166" },
  ],
  elevator: [
    // floor indicator
    { d: "M110 32 L115 25 L120 32 M126 25 L131 32 L136 25" },
    // frame and doors
    { d: "M72 166 L72 44 L168 44 L168 166" },
    { d: "M80 166 L80 54 L119 54 L119 166" },
    { d: "M121 166 L121 54 L160 54 L160 166" },
    // call buttons
    { d: "M182 96 L196 96 L196 130 L182 130 Z" },
    { d: `${circle(189, 106, 3)} ${circle(189, 120, 3)}` },
    // plant
    { d: "M28 166 L24 140 L50 140 L46 166" },
    { d: "M37 140 C30 120 22 116 20 104 M37 140 C40 118 36 106 40 92 M37 140 C46 124 54 118 58 108" },
    // floor
    { d: "M14 168 C80 164 160 170 226 166" },
  ],
  "flower-lotus": [
    // glow behind
    { d: "M72 88 A48 48 0 0 1 168 88" },
    // seated figure
    { d: circle(120, 62, 10) },
    { d: "M104 84 C112 76 128 76 136 84 M104 84 L108 118 M136 84 L132 118" },
    { d: "M104 86 C94 98 90 110 92 122 M136 86 C146 98 150 110 148 122" },
    { d: "M82 126 C100 112 140 112 158 126 C140 136 100 136 82 126" },
    // lotus
    { d: "M200 142 C194 132 196 124 204 120 C212 124 214 132 208 142 M200 142 C190 140 186 134 186 130 M208 142 C218 140 222 134 222 130" },
    // deck
    { d: "M28 150 L212 150 M18 166 L222 166" },
    { d: "M60 150 L56 166 M100 150 L98 166 M140 150 L142 166 M180 150 L184 166" },
  ],
  "person-simple-run": [
    // sun
    { d: circle(202, 34, 9) },
    // runner
    { d: circle(130, 44, 9) },
    { d: "M127 54 L116 92" },
    { d: "M124 62 L108 72 L100 64 M124 62 L140 74 L150 68" },
    { d: "M116 92 L132 108 L126 128 M116 92 L104 110 L86 110" },
    // speed lines
    { d: "M68 60 L90 60 M62 76 L86 76 M70 92 L92 92" },
    // track lanes
    { d: "M14 148 C80 128 160 128 226 148" },
    { d: "M14 168 C80 148 160 148 226 168" },
  ],
  barbell: [
    // dumbbell
    { d: "M52 140 L112 140" },
    { d: "M40 122 L52 122 L52 158 L40 158 Z M28 129 L40 129 L40 151 L28 151 Z" },
    { d: "M112 122 L124 122 L124 158 L112 158 Z M124 129 L136 129 L136 151 L124 151 Z" },
    // kettlebell
    { d: "M166 118 C160 92 200 92 194 118" },
    { d: circle(180, 138, 24) },
    // sparkles
    { d: "M82 82 L82 96 M75 89 L89 89 M206 60 L206 70 M201 65 L211 65" },
    // floor
    { d: "M14 168 C80 164 160 170 226 166" },
  ],
  "tennis-ball": [
    // pickleball paddle, leaning at the side of the court
    { d: "M22 100 C22 84 52 84 52 100 L52 120 C52 134 22 134 22 120 Z", transform: "rotate(-12 37 110)" },
    { d: "M41 132 L45 162" },
    // ball and its flight
    { d: circle(160, 46, 12) },
    { d: "M150 39 C157 44 157 51 150 55 M170 39 C163 44 163 51 170 55" },
    { d: "M66 78 Q100 44 142 46" },
    // net
    { d: "M80 166 L80 106 M212 166 L212 106" },
    { d: "M80 108 C120 104 170 110 212 106" },
    { d: "M100 108 L100 160 M120 107 L120 160 M140 107 L140 160 M160 107 L160 160 M180 107 L180 160 M196 106 L196 160 M80 126 L212 124 M80 144 L212 142 M80 160 L212 158" },
    // ground
    { d: "M14 168 C80 164 160 170 226 166" },
  ],
  // Why Invest
  connectivity: [
    // map pin
    { d: "M60 84 C50 70 44 62 44 54 a16 16 0 0 1 32 0 C76 62 70 70 60 84 Z" },
    { d: circle(60, 54, 6) },
    // plane taking off, with its trail
    { d: "M146 62 L206 32 C212 29 216 34 211 38 L152 68 Z" },
    { d: "M178 48 L166 28 L174 26 L192 42 M172 56 L180 74 L188 72 L188 52 M152 62 L144 50 L150 48 L160 58" },
    { d: "M100 88 L112 82 M120 78 L132 72" },
    // winding road
    { d: "M10 170 C60 150 70 120 120 118 C170 116 190 96 230 90" },
    { d: "M34 178 C80 158 92 134 124 132 C172 130 196 112 232 108" },
    { d: "M40 162 L52 156 M80 138 L92 132 M118 125 L130 124 M160 120 L172 116 M200 104 L212 100" },
  ],
  lifestyle: [
    // tree
    { d: "M34 166 L34 120" },
    { d: "M34 122 C18 122 14 102 26 96 C24 80 44 76 48 90 C60 92 58 116 44 118 C42 124 36 124 34 122" },
    // home
    { d: "M60 108 L100 72 L140 108 M118 90 L118 76 L126 76 L126 97" },
    { d: "M70 166 L70 104 M130 104 L130 166" },
    { d: "M92 166 L92 138 L108 138 L108 166 M78 116 L90 116 L90 128 L78 128 Z M110 116 L122 116 L122 128 L110 128 Z" },
    // gate
    { d: "M150 166 L150 136 M166 166 L166 136 M182 166 L182 136 M198 166 L198 136 M214 166 L214 136 M146 146 L218 146 M146 158 L218 158" },
    // birds
    { d: "M168 64 q5 -5 10 0 q5 -5 10 0" },
    // ground
    { d: "M14 168 C80 164 160 170 226 166" },
  ],
  growth: [
    // rising skyline
    { d: "M30 166 L30 136 L56 136 L56 166" },
    { d: "M64 166 L64 116 L92 116 L92 166" },
    { d: "M100 166 L100 94 L130 94 L130 166" },
    { d: "M138 166 L138 70 L170 70 L170 166" },
    { d: "M38 146 L48 146 M72 128 L84 128 M72 142 L84 142 M108 106 L122 106 M108 120 L122 120 M108 134 L122 134 M146 84 L162 84 M146 98 L162 98 M146 112 L162 112 M146 126 L162 126" },
    // upward arrow
    { d: "M24 118 C70 100 120 70 196 36" },
    { d: "M180 32 L198 35 L190 51" },
    { d: "M214 70 L214 82 M208 76 L220 76" },
    // ground
    { d: "M14 168 C80 164 160 170 226 166" },
  ],
  // FAQs
  map: [
    // folded map
    { d: "M20 40 L80 24 L160 44 L220 28 L220 150 L160 166 L80 146 L20 162 Z" },
    { d: "M80 24 L80 146 M160 44 L160 166" },
    // route to the pin
    { d: "M40 132 Q64 104 92 116 T138 98" },
    // pin
    { d: "M150 94 C140 80 134 72 134 64 a16 16 0 0 1 32 0 C166 72 160 80 150 94 Z" },
    { d: circle(150, 64, 6) },
  ],
  apartments: [
    // two towers
    { d: "M46 166 L46 64 L100 64 L100 166" },
    { d: "M124 166 L124 38 L186 38 L186 166" },
    { d: "M56 80 L66 80 M80 80 L90 80 M56 100 L66 100 M80 100 L90 100 M56 120 L66 120 M80 120 L90 120 M56 140 L66 140 M80 140 L90 140" },
    { d: "M136 56 L148 56 M162 56 L174 56 M136 78 L148 78 M162 78 L174 78 M136 100 L148 100 M162 100 L174 100 M136 122 L148 122 M162 122 L174 122" },
    { d: "M146 166 L146 144 L164 144 L164 166" },
    // shrub
    { d: "M204 166 C196 164 194 150 204 148 C206 138 222 140 220 150 C228 152 226 166 216 166" },
    // ground
    { d: "M14 168 C80 164 160 170 226 166" },
  ],
  "site-plan": [
    // plot boundary
    { d: "M40 52 L188 38 L208 138 L60 154 Z" },
    // trees
    { d: `${circle(92, 92, 11)} ${circle(146, 112, 13)} ${circle(160, 70, 9)}` },
    // measurements along two sides
    { d: "M44 170 L204 154 M44 164 L44 176 M204 148 L204 160" },
    { d: "M222 44 L226 134 M216 44 L228 43 M220 134 L232 134" },
    // north arrow
    { d: "M24 18 L24 40 M18 26 L24 18 L30 26" },
  ],
  "tape-measure": [
    // floor-plan sketch
    { d: "M138 30 L222 30 L222 96 L138 96 Z" },
    { d: "M180 30 L180 62 M138 64 L166 64 M196 96 L196 76 L222 76" },
    // tape measure case
    { d: circle(76, 116, 36) },
    { d: circle(76, 116, 12) },
    // tape and its marks
    { d: "M104 138 L224 138 L224 154 L94 154" },
    { d: "M124 138 L124 146 M144 138 L144 150 M164 138 L164 146 M184 138 L184 150 M204 138 L204 146" },
  ],
  // Contact Us: two buildings with trees, shrubs and birds
  buildings: [
    // tall building and a smaller one
    { d: "M36 58 L88 58 M50 58 L50 46 L74 46 L74 58 M40 58 L40 168 M84 58 L84 168" },
    { d: "M48 74 L58 74 M66 74 L76 74 M48 92 L58 92 M66 92 L76 92 M48 110 L58 110 M66 110 L76 110 M48 128 L58 128 M66 128 L76 128 M54 168 L54 148 L70 148 L70 168" },
    { d: "M92 168 L92 96 L126 96 L126 168 M100 112 L108 112 M112 112 L120 112 M100 130 L108 130 M112 130 L120 130 M100 148 L108 148 M112 148 L120 148" },
    // trees, tallest in the middle of the row
    { d: tree(146, 168) },
    { d: tree(176, 168, 1.35) },
    { d: tree(208, 168, 1.1) },
    // low shrubs along the ground
    { d: "M14 168 C12 160 20 154 26 160 C28 152 38 154 36 162 M128 168 C127 162 133 158 137 162 M218 168 C216 160 224 156 228 162 C231 156 238 160 236 168" },
    // birds
    { d: "M120 40 q5 -5 10 0 q5 -5 10 0 M150 26 q4 -4 8 0 q4 -4 8 0 M176 44 q4 -4 8 0 q4 -4 8 0" },
    // ground
    { d: "M8 168 C80 164 160 170 234 166" },
  ],
};

// play: "on-scroll" draws in once the doodle scrolls into view (cards);
// "on-mount" draws in as soon as it appears (FAQ answers, which mount when
// opened, so it replays on every open); "still" shows it already drawn with
// no animation (the small previews in closed FAQ rows).
export default function Doodle({
  name,
  label,
  className,
  play = "on-scroll",
}: {
  name: string;
  label: string;
  className?: string;
  play?: "on-scroll" | "on-mount" | "still";
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(play === "on-mount");
  const filterId = `doodle-rough-${useId().replace(/:/g, "")}`;
  const strokes = doodles[name] ?? [];

  useEffect(() => {
    const el = ref.current;
    if (!el || play !== "on-scroll") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      // Only once the doodle is well up the screen (clear of the bottom
      // quarter), so the cards visible from the start draw in while the
      // visitor is looking at them, not while they're still peeking in at
      // the bottom edge.
      { threshold: 0.4, rootMargin: "0px 0px -25% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [play]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 240 180"
      className={className}
      // An empty label means purely decorative: hidden from screen readers.
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g
        filter={`url(#${filterId})`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {strokes.map((s, i) => (
          <path
            key={i}
            d={s.d}
            transform={s.transform}
            pathLength={1}
            // Reduced motion: no draw-in, just the finished doodle.
            className="motion-reduce:[animation:none]! motion-reduce:[stroke-dashoffset:0]!"
            style={
              play === "still"
                ? undefined
                : {
                    strokeDasharray: 1,
                    strokeDashoffset: 1,
                    animation: drawn ? `doodle-draw 0.7s ease-out ${i * 0.18}s both` : "none",
                  }
            }
          />
        ))}
      </g>
    </svg>
  );
}
