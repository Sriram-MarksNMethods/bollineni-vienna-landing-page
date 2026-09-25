// Shared, ref-counted body-scroll lock. Multiple independent UI pieces (the
// preloader, the mobile nav menu) can each hold a lock at the same time
// without one's unlock clobbering the other's -- a plain unguarded
// `document.body.style.overflow = ...` in each component stomps on whichever
// one last ran its effect.
//
// Toggling `overflow: hidden` on html/body is NOT reliable on iOS Safari --
// it can leave the page permanently unscrollable even after being cleared
// (a well-documented WebKit quirk). Instead we take the body out of the
// document flow entirely with `position: fixed`, which iOS respects
// correctly, then restore the exact scroll position on unlock.
let lockCount = 0;
let savedScrollY = 0;

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
  lockCount += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    // "instant" overrides html { scroll-behavior: smooth }, which would
    // otherwise sweep the page up from the top (through the pinned Hero).
    window.scrollTo({ top: savedScrollY, behavior: "instant" });
  }
}
