"use client";
import { useApp } from "./store";

// Voice and system shortcuts (Melvin, 2026-11-09). Every entry point lands here with one of three
// actions, so they all behave the same:
//   iOS: App Intents and App Shortcuts (Siri, Spotlight, the Shortcuts app, the Action button and a
//        Control Center "Shortcut" control), ios/App/App/ShortcutIntents.swift.
//   Android: launcher shortcuts and App Actions (res/xml/shortcuts.xml), the Quick Settings tile
//        (WorkoutTileService.java) and liftsmith:// links.
//   Web: the web manifest's shortcuts (/app/?do=start).
// The native side hands the action to the WorkoutSession plugin's "action" event, the same event the
// lock-screen notification buttons use.

export type ShortcutAction = "start" | "log" | "add30";
export const SHORTCUT_ACTIONS: readonly ShortcutAction[] = ["start", "log", "add30"];

export const isShortcut = (a: unknown): a is ShortcutAction => typeof a === "string" && (SHORTCUT_ACTIONS as readonly string[]).includes(a);

/**
 * Runs a shortcut against the store and returns the screen to show. "start" begins today's planned
 * workout (or reopens the one running); "log" and "add30" act on the workout in progress and do
 * nothing without one, so a stray tap can never log a set nobody did.
 */
export function runShortcut(action: ShortcutAction): "workout" | "today" {
  const s = useApp.getState();
  if (!s.ready || !s.profile.onboarded) return "today";
  if (action === "start") {
    if (!s.active) s.start();
    return useApp.getState().active ? "workout" : "today";
  }
  if (!s.active) return "today";
  if (action === "log") s.logSet();
  else s.addRest(30);
  return "workout";
}

/** The ?do= action on a web link (manifest shortcuts), if any. */
export function linkAction(search: string): ShortcutAction | null {
  const a = new URLSearchParams(search).get("do");
  return isShortcut(a) ? a : null;
}
