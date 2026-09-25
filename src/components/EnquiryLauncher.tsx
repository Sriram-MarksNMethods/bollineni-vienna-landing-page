"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { onLoaderDone } from "@/lib/loaderDone";
import EnquiryModal from "./EnquiryModal";

// three.js + physics (~1 MB) stay out of the first-load bundle and are only
// fetched once the preloader has finished.
const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

export default function EnquiryLauncher() {
  const [open, setOpen] = useState(false);
  const [showLanyard, setShowLanyard] = useState(false);

  useEffect(() => onLoaderDone(() => setShowLanyard(true)), []);

  return (
    <>
      {showLanyard && <Lanyard onOpen={() => setOpen(true)} />}
      {/* The 3D card can't take keyboard focus, so keyboard and screen-reader
          users get this button in the same corner. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[45] focus:rounded-full focus:bg-ink focus:text-white focus:px-5 focus:py-3"
      >
        Enquire now
      </button>
      <EnquiryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
