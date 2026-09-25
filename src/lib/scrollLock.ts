// Shared, ref-counted page-scroll lock. Multiple independent UI pieces (the
// preloader, the menu, the enquiry popup) can each hold a lock at the same
// time without one's unlock clobbering the other's.
//
// The lock must NOT change window.scrollY: the Hero and Residences scroll
// sequences are driven by ScrollTrigger, and the old `body { position: fixed }`
// approach dropped scrollY to 0 while locked, so the pinned scenes rewound
// behind the menu and visibly replayed on close. `overflow: hidden` on <html>
// keeps the scroll position; `scrollbar-gutter: stable` (globals.css) stops
// the layout shifting when the scrollbar hides. iOS Safari can still
// rubber-band the page under `overflow: hidden`, so touchmove is blocked too,
// except inside the menu panel and the popup, which scroll on their own.
let lockCount = 0;

const SCROLLABLE_WHILE_LOCKED = "#staggered-menu-panel, dialog";

function blockTouchScroll(e: TouchEvent) {
  if ((e.target as Element | null)?.closest?.(SCROLLABLE_WHILE_LOCKED)) return;
  e.preventDefault();
}

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("touchmove", blockTouchScroll, { passive: false });
  }
  lockCount += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.overflow = "";
    window.removeEventListener("touchmove", blockTouchScroll);
  }
}
