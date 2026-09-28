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
      className="m-auto p-0 bg-transparent max-w-none backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
    >
      <div
        ref={panelRef}
        className="relative w-[min(92vw,30rem)] max-h-[90vh] overflow-y-auto rounded-2xl bg-beige p-8 text-ink shadow-2xl max-sm:p-5"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink hover:text-beige"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <div className="mb-6 pr-12">
          <h2 id="enquire-heading" className="text-4xl max-sm:text-3xl font-medium leading-none">
            Inquire Now
          </h2>
          <p className="mt-2 text-sm text-ink/60">Bollineni Vienna · Kogilu, North Bengaluru</p>
        </div>
        {everOpened && <ContactForm idPrefix="enquire" />}
      </div>
    </dialog>
  );
}
