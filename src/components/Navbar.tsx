"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      lockScroll();
    }
    return () => {
      if (isOpen) unlockScroll();
    };
  }, [isOpen]);

  return (
    <>
      <nav className="z-10 absolute inset-x-0 top-0">
        <div className="px-[3vw] max-lg:px-10 max-md:px-6 max-sm:px-4">
          <div className="py-[1.25vw] max-lg:py-4">
            <div className="grid grid-cols-3 items-center w-full overflow-hidden">
              <div
                className="justify-self-start cursor-pointer"
                onClick={() => setIsOpen(true)}
              >
                <div className="font-medium">MENU</div>
              </div>
              <a
                href="/"
                aria-current="page"
                className="inline-block max-w-full place-self-center w--current"
              >
                <div className="relative h-[6.5vw] aspect-[1920/1080] max-lg:h-24 max-md:h-20 max-sm:h-16">
                  <Image
                    src="/images/bollineni_vienna.svg"
                    alt="Bollineni Vienna"
                    title="Bollineni Vienna"
                    fill
                    sizes="200px"
                    className="object-contain"
                  />
                </div>
              </a>
              <a
                href="/#book"
                className="inline-block max-w-full self-center justify-self-end text-black font-bold"
              >
                <div className="font-medium">BOOK NOW</div>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`nav-menu_component${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen(false)}
      >
        <div className="nav-menu" onClick={(e) => e.stopPropagation()}>
            <div>
              <div
                className="flex justify-end cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium">CLOSE</div>
              </div>
              <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
              <div className="flex flex-col items-start gap-[0.75vw] max-md:gap-1">
                <a
                  href="/#about"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    About
                  </p>
                </a>
                <a
                  href="/#residences"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    Residences
                  </p>
                </a>
                <a
                  href="/#floor-plans"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    Floor Plans
                  </p>
                </a>
                <a
                  href="/#amenities"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    Amenities
                  </p>
                </a>
                <a
                  href="/#invest"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    Why Invest
                  </p>
                </a>
                <a
                  href="/#builder"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    About BSCPL
                  </p>
                </a>
                
                <a
                  href="/#faq"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    FAQs
                  </p>
                </a>
                <a
                  href="/#location"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    Location
                  </p>
                </a>
                <a
                  href="/#book"
                  className="inline-block max-w-full text-black font-heading"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-3xl max-lg:text-2xl max-md:text-xl uppercase font-medium">
                    Contact Us
                  </p>
                </a>
              </div>
            </div>
            <div className="w-full pt-7 max-lg:pt-6 max-md:pt-5"></div>
            <div className="flex flex-col gap-[0.5vw]">
              <div className="text-neutral-light">CONTACT US</div>
              <div className="flex flex-col">
                <a href="tel:+918722000148" className="inline-block max-w-full text-black">
                  <p className="text-2xl max-lg:text-xl max-md:text-base">+91 87220 00148</p>
                </a>
                <a href="mailto:bscplre9@gmail.com" className="inline-block max-w-full text-black">
                  <p className="text-2xl max-lg:text-xl max-md:text-base">bscplre9@gmail.com</p>
                </a>
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
