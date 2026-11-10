"use client";

import { useEffect, useRef } from "react";

// The phone's back button (Melvin, 2026-11-10: "pressing the back button on your phone should navigate
// back to the previous screen"). One rule for the whole app, so it holds whatever screens exist:
//   1. an open sheet or dialog closes (the most recently opened first),
//   2. otherwise the app goes back to the previous screen in its history,
//   3. a screen with no history behind it (opened from a shortcut or a notification) goes to Today,
//   4. and only on Today does back leave the app.
// Android calls `handleBack` from the system back button and gesture (App.tsx). iOS has no back button;
// its edge swipe and the browser's back button move through the same history (router.ts).

type Handler = () => void;
const handlers: { id: number; run: Handler }[] = [];
let next = 0;

/** Registers something back should close (a sheet, a dialog, a wizard step). Returns the unregister function. */
export function pushBack(run: Handler): () => void {
  const id = ++next;
  handlers.push({ id, run });
  return () => {
    const i = handlers.findIndex((h) => h.id === id);
    if (i >= 0) handlers.splice(i, 1);
  };
}

/** While `active`, back runs `fn` instead of leaving the screen. The latest `fn` is used, so callers needn't memoise it. */
export function useBack(active: boolean, fn: Handler) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    if (!active) return;
    return pushBack(() => ref.current());
  }, [active]);
}

export type BackResult = "closed" | "back" | "home" | "exit";

/**
 * What back does now. `history` is how many screens sit behind this one in the app's own history
 * (router.ts), and `atRoot` is whether this is Today. The caller performs "back", "home" and "exit".
 */
export function handleBack({ history, atRoot }: { history: number; atRoot: boolean }): BackResult {
  const top = handlers[handlers.length - 1];
  if (top) {
    top.run();
    return "closed";
  }
  if (atRoot) return "exit";
  return history > 0 ? "back" : "home";
}

type Nav = { depth: () => number; atRoot: () => boolean; back: () => void };

/**
 * Takes over Android's back button and back gesture. Once anything listens for `backButton`, Capacitor
 * stops its own handling (which closed the app from any screen), so every case is handled here. Leaving
 * the app sends it to the background rather than closing it, like the phone's home screen does, so a
 * workout and its rest timer keep running. Does nothing on iOS (no back button) or the web (the
 * browser's own back moves through the same history). Returns the stop function.
 */
export async function startBackButton(nav: Nav): Promise<() => void> {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return () => {};
  const { App } = await import("@capacitor/app");
  const handle = await App.addListener("backButton", () => {
    switch (handleBack({ history: nav.depth(), atRoot: nav.atRoot() })) {
      case "closed":
        return;
      case "back":
      case "home":
        return nav.back();
      case "exit":
        return void App.minimizeApp();
    }
  });
  return () => void handle.remove();
}

/** For tests: forget every registered handler. */
export function resetBack() {
  handlers.length = 0;
}
