// Lets components wait for the preloader (LoadingScreen) to finish before
// starting scroll animations or pulling in heavy code like the 3D lanyard.
let done = false;
const listeners = new Set<() => void>();

export function markLoaderDone() {
  if (done) return;
  done = true;
  listeners.forEach((cb) => cb());
  listeners.clear();
}

export function onLoaderDone(cb: () => void): () => void {
  if (done) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
