"use client";

import { useState } from "react";
import Image from "next/image";
import { useVilla, GalleryImage as GalleryImageType } from "./Villa";

// Height per gallery position (1-indexed), across breakpoints — same values
// used by VillaGallery on the villa detail pages.
const itemHeights = [
  "h-[18vw] max-lg:h-[80vw]",
  "h-[30vw] max-lg:h-[80vw]",
  "h-[20vw] max-lg:h-[80vw]",
  "h-[25vw] max-lg:h-[50vw] max-md:h-[80vw]",
  "h-[20vw] max-lg:h-[50vw] max-md:h-[80vw]",
  "h-[30vw] max-lg:h-[50vw] max-md:h-[80vw]",
  "h-[23vw] max-lg:h-[50vw] max-md:h-[80vw]",
  "h-[27vw] max-lg:h-[50vw] max-md:h-[80vw]",
  "h-[18vw] max-lg:h-[50vw] max-md:h-[80vw]",
];

const GalleryItem = ({
  item,
  index,
  onOpen,
}: {
  item: GalleryImageType;
  index: number;
  onOpen: () => void;
}) => (
  <div
    className={`relative overflow-hidden w-full cursor-pointer ${itemHeights[index]}`}
    // On mobile the column wrappers collapse (max-md:contents), so this
    // order puts the images back in 01 → 09 sequence in the single column.
    style={{ order: index }}
    onClick={onOpen}
  >
    <Image
      src={item.src}
      loading="lazy"
      alt={item.name}
      title={item.name}
      fill
      sizes="(max-width: 1024px) 50vw, 33vw"
      className="object-cover"
    />
    <div className="gap-[0.5vw] flex absolute inset-x-0 bottom-0 pt-[1vw] pb-[1vw] pl-[1vw] max-lg:gap-3 max-lg:pt-3 max-lg:pb-3 max-lg:pl-3 bg-[linear-gradient(#0000,#0c0c0cbf)]">
      <div className="text-white">{String(index + 1).padStart(2, "0")}</div>
      <div className="text-white">{item.name}</div>
    </div>
  </div>
);

export default function Residences() {
  const villa = useVilla();
  const { gallery } = villa;

  const col1 = [0, 3, 6].map((i) => gallery[i]).filter(Boolean);
  const col2 = [1, 4, 7].map((i) => gallery[i]).filter(Boolean);
  const col3 = [2, 5, 8].map((i) => gallery[i]).filter(Boolean);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const showPrev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
  const showNext = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.length));

  return (
    <section id="residences" className="bg-beige">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <div className="flex flex-col items-center gap-[2vw] max-lg:gap-6">
          <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none">RESIDENCE</h2>
          <p className="text-xl max-lg:text-lg max-md:text-base text-center max-lg:text-justify max-w-[55vw] max-lg:max-w-[38rem] max-md:max-w-[28rem] max-sm:max-w-[90vw]">
            {villa.summary}
          </p>
        </div>
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>

        <div className="grid grid-cols-3 gap-[1.5vw] lg:max-xl:gap-4 max-lg:grid-cols-2 max-lg:grid-rows-[auto_auto] max-lg:gap-6 max-md:grid-cols-1 max-md:grid-rows-none max-sm:gap-4">
          <div className="flex flex-col gap-[1.5vw] pt-[3.5vw] max-lg:gap-6 max-lg:pt-0 max-md:contents max-sm:gap-5">
            {col1.map((item) => (
              <GalleryItem
                key={item.id}
                item={item}
                index={gallery.indexOf(item)}
                onOpen={() => setLightboxIndex(gallery.indexOf(item))}
              />
            ))}
          </div>
          <div className="flex flex-col gap-[1.5vw] max-lg:gap-6 max-md:contents max-sm:gap-4">
            {col2.map((item) => (
              <GalleryItem
                key={item.id}
                item={item}
                index={gallery.indexOf(item)}
                onOpen={() => setLightboxIndex(gallery.indexOf(item))}
              />
            ))}
          </div>
          <div className="flex flex-col gap-[1.5vw] pt-[3.5vw] max-lg:gap-6 max-lg:pt-0 max-md:contents max-sm:gap-4">
            {col3.map((item) => (
              <GalleryItem
                key={item.id}
                item={item}
                index={gallery.indexOf(item)}
                onOpen={() => setLightboxIndex(gallery.indexOf(item))}
              />
            ))}
          </div>
        </div>

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>

      {lightboxIndex !== null && (
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
        </div>
      )}
    </section>
  );
}
