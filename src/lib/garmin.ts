// The Garmin watch app (garmin/, a Connect IQ app; docs/decisions/watch-apps.md). The workout reaches the watch
// natively (GarminLink.java and GarminLink.swift, from the same WorkoutSession calls as the Wear OS and Apple Watch
// apps), so this file only serves Connected apps: which Garmin watches the phone knows and whether they have our app.
// Android finds the watches through Garmin Connect by itself; iOS needs the lifter to pick them once in Garmin
// Connect (`chooseGarmin`). The web app has no way to reach a Garmin watch.
import { platform } from "./auth";
import { unlisten, type ListenerHandle } from "./nativeListen";

export type GarminWatch = { name: string; connected: boolean; installed: boolean };
/** `missing`: Garmin Connect isn't on this phone (the SDK needs it). */
export type GarminStatus = { app: "missing" | "ready"; devices: GarminWatch[] };

type Plugin = {
  status(): Promise<GarminStatus>;
  choose(): Promise<void>;
  addListener?(event: "change", cb: () => void): ListenerHandle | Promise<ListenerHandle>;
};

/**
 * The watch app's page in Garmin's Connect IQ Store. Empty until Garmin approves the first upload; Connected apps
 * then shows a "Get the watch app" button. Set it to the listing's link (apps.garmin.com/apps/<store id>).
 */
export const GARMIN_STORE_URL = "";

function plugin(): Plugin | undefined {
  if (typeof window === "undefined" || platform() === "web") return undefined;
  return (window as unknown as { Capacitor?: { Plugins?: { Garmin?: Plugin } } }).Capacitor?.Plugins?.Garmin;
}

export async function garminStatus(): Promise<GarminStatus | null> {
  const p = plugin();
  if (!p) return null;
  try {
    return await p.status();
  } catch {
    return null;
  }
}

/** iOS: Garmin Connect's watch picker. Android: opens Garmin Connect (or its store page when it's missing). */
export async function chooseGarmin(): Promise<void> {
  await plugin()?.choose();
}

/** Called when the picked watches change (iOS, after Garmin Connect sends the lifter back). */
export function onGarminChange(cb: () => void): () => void {
  return unlisten(plugin()?.addListener?.("change", cb));
}

/** One line per watch for Connected apps: ready, needs our app, or out of reach. */
export function watchState(w: GarminWatch): "ready" | "install" | "away" {
  if (!w.connected) return "away";
  return w.installed ? "ready" : "install";
}
