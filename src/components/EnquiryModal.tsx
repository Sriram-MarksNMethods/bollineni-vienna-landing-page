"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

// The form (and its phone-input library) only downloads the first time the
// popup opens.
const ContactForm = dynamic(() => import("./ContactForm"));

export default function EnquiryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the form mounted after the first open so typed values survive closing.
  const [everOpened, setEverOpened] = useState(false);
  if (open && !everOpened) setEverOpened(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    lockScroll();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }
      );
    }
    return () => {
      dialog.close();
      unlockScroll();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="enquire-heading"
      // Escape: keep React state as the source of truth.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Clicks on the backdrop land on the <dialog> itself, not the panel.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto p-0 bg-transparent backdrop:bg-ink/70 max-w-none"
    >
      <div
        ref={panelRef}
        className="relative bg-beige text-ink w-[min(92vw,40rem)] max-h-[90vh] overflow-y-auto rounded-[1vw] max-lg:rounded-2xl p-[2.5vw] max-lg:p-8 max-sm:p-5"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-ink"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <h2 id="enquire-heading" className="text-5xl max-md:text-3xl font-medium leading-none mb-[1.5vw] max-lg:mb-6">
          Enquire Now
        </h2>
        {everOpened && <ContactForm idPrefix="enquire" />}
      </div>
    </dialog>
  );
}
