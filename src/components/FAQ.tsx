"use client";

import { useState } from "react";
import Doodle from "./Doodle";

// Doodle shown beside each answer (see Doodle.tsx), in the same order as faqs.
const faqDoodles = ["map", "apartments", "swimming-pool", "site-plan", "tape-measure"];

const faqs = [
  {
    question: "Where is BSCPL Bollineni Vienna Project located?",
    answer: "BSCPL Bollineni Vienna is located in Kogilu, near Yelahanka, a prime locality in North Bangalore.",
  },
  {
    question: "What are the different types of apartments it Offer?",
    answer: "The project offers exclusive 4 & 5 BHK luxurious residential apartments.",
  },
  {
    question: "Does the project have modern amenities?",
    answer: "Yes, the project has 20+ high-end modern amenities like gymnasium, kid’s play area, jogging track, yoga spaces, clubhouse, swimming pool, 24/7 security system, and many more.",
  },
  {
    question: "What is the total project area of the project?",
    answer: "BSCPL Bollineni Vienna total project area is around 2.65 acres.",
  },
  {
    question: "What are the apartment sizes in BSCPL Bollineni Vienna?",
    answer: "The project apartment size range from 3350 – 5550 sft.",
  },
];

function FAQItem({
  faq,
  doodle,
  index,
  isOpen,
  onToggle,
}: {
  faq: { question: string; answer: string };
  doodle: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/20">
      <h3>
        <button
          type="button"
          id={`faq-q-${index}`}
          aria-expanded={isOpen}
          aria-controls={`faq-a-${index}`}
          onClick={onToggle}
          className="group flex w-full items-center gap-[2vw] py-[1.75vw] max-lg:gap-5 max-lg:py-6 text-left cursor-pointer"
        >
          <span className="flex-1 font-heading text-[2vw] lg:max-xl:text-3xl max-lg:text-3xl max-md:text-2xl leading-[1.2]">
            {faq.question}
          </span>
          {/* Small, already-drawn preview of the answer's doodle; hidden while
              the answer (with the full doodle) is open. */}
          <Doodle
            name={doodle}
            label=""
            play="still"
            className={`w-[4.5vw] max-lg:w-16 max-md:hidden shrink-0 text-white/40 transition-opacity duration-300 group-hover:text-white/70 ${isOpen ? "opacity-0" : ""}`}
          />
          {/* + that turns into × when open: the two bars rotate 45° together. */}
          <span
            aria-hidden="true"
            className={`relative size-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
          >
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white" />
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
          </span>
        </button>
      </h3>
      {/* Height animates via grid rows 0fr -> 1fr, which works for any answer
          length without a max-height guess. */}
      <div
        id={`faq-a-${index}`}
        role="region"
        aria-labelledby={`faq-q-${index}`}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden" inert={!isOpen}>
          <div className="flex items-center justify-between gap-[4vw] pb-[1.75vw] max-lg:flex-col-reverse max-lg:items-start max-lg:gap-5 max-lg:pb-7">
            <p className="max-w-[40rem] text-base max-md:text-[0.95rem] leading-relaxed text-white/75">{faq.answer}</p>
            {/* Mounted only while open, so it draws itself in on every open. */}
            {isOpen && (
              <Doodle name={doodle} label="" play="on-mount" className="w-[16vw] max-lg:w-56 max-md:w-48 shrink-0 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-ink text-white">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none">FAQs</h2>

        <div className="w-full pt-12 max-lg:pt-10 max-md:pt-8"></div>

        <div className="border-t border-white/20">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              doodle={faqDoodles[index]}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
