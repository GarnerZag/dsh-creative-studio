/** Tracks whether any open editor holds unsaved input, so navigating away can ask first. */
type Guard = () => boolean;

const guards = new Set<Guard>();

export function registerDirtyGuard(guard: Guard): () => void {
  guards.add(guard);
  return () => { guards.delete(guard); };
}

export function hasUnsavedEdits(): boolean {
  for (const guard of guards) {
    try { if (guard()) return true; } catch { /* a broken editor must not block navigation */ }
  }
  return false;
}
