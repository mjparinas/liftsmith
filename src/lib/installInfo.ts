"use client";
// Device and install details from the native shells, for usage analytics (src/lib/analytics.ts).
// Android: android/app/src/main/java/com/liftsmith/app/InstallInfoPlugin.java (Build.*, the Play
// Install Referrer, the installing store). iOS: ios/App/App/InstallInfoPlugin.swift (device model,
// iOS version, App Store / TestFlight receipt, Apple Search Ads attribution token from AdServices,
// which needs no ATT prompt). Neither reads an advertising id.
import { isNative } from "./juice";

export interface InstallInfo {
  platform: "android" | "ios";
  appVersion?: string;
  build?: string;
  os: string;
  osVersion: string;
  manufacturer: string;
  /** Marketing-ish model id: "Pixel 8" on Android, "iPhone16,2" on iOS. */
  model: string;
  /** play, appstore, testflight, sideload, unknown */
  store: string;
  /** Android only: the raw Play install referrer ("utm_source=...&utm_medium=..."). */
  installReferrer?: string;
  /** iOS only: Apple Search Ads attribution token, resolved by the server. */
  asaToken?: string;
}

type Plugin = { get(): Promise<InstallInfo> };
const plugin = (): Plugin | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: { Plugins?: { InstallInfo?: Plugin } } }).Capacitor?.Plugins?.InstallInfo : undefined);

/** The native details, or null on the web or when the plugin isn't there (an older shell). */
export async function installInfo(): Promise<InstallInfo | null> {
  const p = plugin();
  if (!p || !isNative()) return null;
  try {
    return await p.get();
  } catch {
    return null;
  }
}
