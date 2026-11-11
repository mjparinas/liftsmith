// A short message that floats over the screen and goes away by itself ("Link copied"). One at a
// time: a new one replaces the one showing. The Toaster in App.tsx draws it, over sheets too.
import { useSyncExternalStore } from "react";

export type Toast = { id: number; text: string };

/** How long a toast stays up. */
export const TOAST_MS = 2200;

let current: Toast | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Show a toast; it hides itself after TOAST_MS. */
export function toast(text: string): void {
  current = { id: ++seq, text };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    timer = undefined;
    emit();
  }, TOAST_MS);
  emit();
}

/** Hide the toast now (tests, or a screen that wants it gone). */
export function clearToast(): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
  current = null;
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** The toast showing now, or null. */
export function useToast(): Toast | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
