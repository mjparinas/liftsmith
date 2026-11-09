import { isNative } from "./juice";

// Where the lifter's data lives, and how to keep it safe (Melvin, 2026-11-09: "it's not clear how to
// save my information or register"). Everything is saved on the device as
// it happens (IndexedDB, localdb.ts). On Android and iOS that storage belongs to the app and stays
// until it's uninstalled. In a browser it can be cleared: by clearing site data, in a private window,
// and by Safari, which deletes a site's storage after 7 days without a visit unless it's on the home
// screen. So the web app asks the browser to keep its storage (`navigator.storage.persist`) and offers
// "Add to home screen".

export type Where = "native" | "installed" | "browser";

export function where(): Where {
  if (isNative()) return "native";
  if (typeof window === "undefined") return "browser";
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone ? "installed" : "browser";
}

/** iPhone and iPad (iPadOS reports a Mac with touch), where "Add to Home Screen" is in the Share menu. */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** Asks the browser not to clear this site's storage. Chrome and Safari answer quietly; Firefox may ask. */
export async function keepStorage(): Promise<boolean> {
  if (where() === "native") return true;
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storageKept(): Promise<boolean> {
  if (where() === "native") return true;
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}

// Chrome and Edge on Android offer their own install sheet through `beforeinstallprompt`; keep the
// event so "Add to home screen" can open it. Safari has no such event, so the app shows the steps.
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    listeners.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    void keepStorage();
    listeners.forEach((f) => f());
  });
}

export const canPromptInstall = () => !!deferred;
export function onInstallChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** Opens the browser's own install sheet. True when the lifter installed. */
export async function promptInstall(): Promise<boolean> {
  const d = deferred;
  if (!d) return false;
  deferred = null;
  try {
    await d.prompt();
    const { outcome } = await d.userChoice;
    listeners.forEach((f) => f());
    return outcome === "accepted";
  } catch {
    return false;
  }
}
