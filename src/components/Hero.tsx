"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Button from "./Button";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return;

    const desktop = window.matchMedia("(min-width: 992px)");
    const expandDistance = () => window.innerHeight * 0.8;

    const onScroll = () => {
      if (!desktop.matches) {
        image.style.width = "";
        return;
      }
      const top = section.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, -top / expandDistance()));
      image.style.width = `${65 + (100 - 65) * progress}vw`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="hero" className="bg-beige" ref={sectionRef}>
      <div className="relative">
        <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
          <div className="w-full pt-48 max-lg:pt-44 max-md:pt-40 max-sm:pt-36"></div>
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-7xl max-lg:text-6xl max-md:text-4xl">
              BOLLINENI VIENNA
            </h1>
            <div className="flex justify-center">
              <p className="text-lg max-lg:text-sm max-md:text-xs text-center">
                Luxury 4 & 5 BHK Apartments in Kogilu, North Bangalore
              </p>
            </div>
          </div>
          <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex flex-col justify-center items-center w-full h-[115vh] min-h-[115vh] relative overflow-hidden max-md:h-screen max-md:min-h-screen">
          <div
            className="w-[65vw] h-full relative overflow-hidden max-lg:w-full"
            ref={imageRef}
          >
            <Image
              src="/images/gallery/gallery-04.jpg"
              alt="Swimming pool at Bollineni Vienna surrounded by landscaped greens."
              title="Swimming pool at Bollineni Vienna surrounded by landscaped greens."
              fill
              preload
              loading="eager"
              sizes="100vw"
              className="object-cover"
            />
            <div className="z-[1] bg-black/20 absolute inset-0"></div>
          </div>
          <div className="z-[2] flex flex-col gap-[1.5vw] absolute top-[45%] left-1/2 -translate-x-1/2 max-lg:gap-6 max-md:gap-5">
            <div className="w-[52vw] max-lg:w-[44rem] max-md:w-[30rem] max-sm:w-[85vw]">
              <p className="text-white text-center text-2xl max-lg:text-xl max-md:text-base">
                Expansive 4 & 5 BHK residences, lush greens, and curated amenities come together in a refined address where sophistication meets serenity. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
