/** Tracks whether any open editor holds unsaved input, so navigating away can ask first. */
type Guard = () => boolean;

const guards = new Set<Guard>();
let unloadInstalled = false;

export function registerDirtyGuard(guard: Guard): () => void {
  guards.add(guard);
  installUnloadListener();
  return () => { guards.delete(guard); };
}

function installUnloadListener(): void {
  if (unloadInstalled || typeof window === 'undefined') return;
  unloadInstalled = true;
  window.addEventListener('beforeunload', event => {
    if (!hasUnsavedEdits()) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

export function hasUnsavedEdits(): boolean {
  for (const guard of guards) {
    try { if (guard()) return true; } catch { /* a broken editor must not block navigation */ }
  }
  return false;
}
