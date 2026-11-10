"use client";

import type { Unit } from "./types";
import { fmtNum, fromKg } from "./units";

// The voice coach: optional spoken cues between sets ("Last set, 2 in reserve"). Off by default
// (Settings › Voice coach). In the native shells it uses the platform speech engine through the
// VoiceCoach plugin (Android TextToSpeech, iOS AVSpeechSynthesizer), which lowers music while it talks
// and works with the screen locked on Android. The web build uses the Web Speech API.

type Plugin = { speak(o: { text: string; rate?: number }): Promise<void>; stop(): Promise<void> };
type Cap = { isNativePlatform?: () => boolean; Plugins?: { VoiceCoach?: Plugin } };
const cap = (): Cap | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);

export const voice = { enabled: false };

export function voiceSupported(): boolean {
  const c = cap();
  if (c?.isNativePlatform?.() && c.Plugins?.VoiceCoach) return true;
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function say(text: string, force = false) {
  if ((!voice.enabled && !force) || !text) return;
  const c = cap();
  const p = c?.Plugins?.VoiceCoach;
  if (p && c?.isNativePlatform?.()) {
    void p.speak({ text, rate: 1 }).catch(() => {});
    return;
  }
  try {
    const s = window.speechSynthesis;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.lang = "en-US";
    s.speak(u);
  } catch {}
}

// --- Cues (pure, tested) -----------------------------------------------------------------------

const WORDS = ["zero", "one", "two", "three", "four", "five"];
const n = (x: number) => (x >= 0 && x < WORDS.length ? WORDS[x] : String(x));

export function spokenLoad(kg: number, unit: Unit, load: string): string {
  if (load === "bodyweight")
    return kg > 0 ? `bodyweight plus ${fmtNum(fromKg(kg, unit))} ${unit === "kg" ? "kilos" : "pounds"}` : "bodyweight";
  const w = `${fmtNum(fromKg(kg, unit))} ${unit === "kg" ? "kilos" : "pounds"}`;
  return load === "dumbbell" || load === "kettlebell" ? `${w} each` : w;
}

export interface SetCue {
  name: string;
  setNo: number;
  sets: number;
  kg: number;
  reps: number;
  rir: number;
  unit: Unit;
  load: string;
  timed?: boolean;
  challenge?: boolean;
  warmup?: boolean;
}

/** Said when rest ends: what the next set is. */
export function setCue(c: SetCue): string {
  const what = `${spokenLoad(c.kg, c.unit, c.load)} for ${c.reps}${c.timed ? " seconds" : ""}`;
  if (c.warmup) return `Warm-up. ${what}.`;
  if (c.challenge && c.setNo === c.sets) return `Challenge set. ${what}, as many good reps as you can.`;
  const tank = c.rir <= 0 ? "Take it close to failure." : `${n(c.rir)} in reserve.`;
  if (c.setNo === c.sets && c.sets > 1) return `Last set. ${what}. ${tank}`;
  return `Set ${n(c.setNo)} of ${n(c.sets)}. ${what}. ${tank}`;
}

/** Said when a new exercise comes up. */
export function exerciseCue(name: string, sets: number, c: Omit<SetCue, "name" | "setNo" | "sets">): string {
  return `Next up, ${name}. ${n(sets)} sets of ${c.reps}${c.timed ? " seconds" : ""} at ${spokenLoad(c.kg, c.unit, c.load)}.`;
}

export const restCue = { ten: "Ten seconds.", go: "Time to lift." } as const;

export function prCue(name: string): string {
  return `New personal best on ${name}. Nice.`;
}

export function doneCue(sets: number, volumeKg: number, unit: Unit): string {
  const v = Math.round(fromKg(volumeKg, unit));
  return `Workout done. ${sets} sets${v > 0 ? `, ${v.toLocaleString("en-US")} ${unit === "kg" ? "kilos" : "pounds"} moved` : ""}. Great work.`;
}
