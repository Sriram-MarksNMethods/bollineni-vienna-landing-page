"use client";

import { useState } from "react";
import EnquiryModal from "./EnquiryModal";

export default function EnquiryLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
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
