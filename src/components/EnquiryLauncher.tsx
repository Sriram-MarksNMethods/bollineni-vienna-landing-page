"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { onLoaderDone } from "@/lib/loaderDone";
import EnquiryModal from "./EnquiryModal";

// three.js + physics (~1 MB) stay out of the first-load bundle and are only
// fetched once the preloader has finished.
const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

// Some browsers have WebGL switched off (GPU blocklisted, hardware
// acceleration off, Chrome after a GPU crash). three.js throws there, and
// without a check the whole page falls over to Next's error screen.
function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Catches anything else the 3D card throws, so only the card is lost.
class LanyardBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function EnquiryLauncher() {
  const [open, setOpen] = useState(false);
  const [showLanyard, setShowLanyard] = useState(false);
  const [lanyardFailed, setLanyardFailed] = useState(false);

  useEffect(
    () =>
      onLoaderDone(() => {
        if (hasWebGL()) setShowLanyard(true);
        else setLanyardFailed(true);
      }),
    [],
  );

  // Other sections (e.g. Floor Plans' "Unlock this plan") open the same popup
  // by dispatching this event, so the page keeps a single form.
  useEffect(() => {
    const openFromEvent = () => setOpen(true);
    window.addEventListener("open-enquiry", openFromEvent);
    return () => window.removeEventListener("open-enquiry", openFromEvent);
  }, []);

  return (
    <>
      {showLanyard && !lanyardFailed && (
        <LanyardBoundary onError={() => setLanyardFailed(true)}>
          <Lanyard onOpen={() => setOpen(true)} />
        </LanyardBoundary>
      )}
      {/* The 3D card can't take keyboard focus, so keyboard and screen-reader
          users get this button in the same corner. When the card can't be
          drawn at all, the button stays visible in its place. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          lanyardFailed
            ? "fixed top-4 left-4 z-[45] rounded-full bg-ink text-white px-5 py-3"
            : "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[45] focus:rounded-full focus:bg-ink focus:text-white focus:px-5 focus:py-3"
        }
      >
        Inquire now
      </button>
      <EnquiryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
