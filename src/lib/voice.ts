"use client";

import { currentLang, currentTag, t } from "./i18n";
import type { Unit } from "./types";
import { fmtNum, fromKg } from "./units";

// The voice coach: optional spoken cues between sets ("Last set, 2 in reserve"). Off by default
// (Settings › Voice coach). In the native shells it uses the platform speech engine through the
// VoiceCoach plugin (Android TextToSpeech, iOS AVSpeechSynthesizer), which lowers music while it talks
// and works with the screen locked on Android. The web build uses the Web Speech API.

type Plugin = { speak(o: { text: string; rate?: number; lang?: string }): Promise<void>; stop(): Promise<void> };
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
    void p.speak({ text, rate: 1, lang: currentTag() }).catch(() => {});
    return;
  }
  try {
    const s = window.speechSynthesis;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.lang = currentTag();
    s.speak(u);
  } catch {}
}

// --- Cues (pure, tested) -----------------------------------------------------------------------
// Whole lines from the catalogue (vc.*), so each language words them its own way. English says small
// counts as words ("set two of four"), which reads more naturally; other languages pass digits, which
// their speech engines say well.

const WORDS = ["zero", "one", "two", "three", "four", "five"];
const n = (x: number) => (currentLang() === "en" && x >= 0 && x < WORDS.length ? WORDS[x]! : String(x));
const weight = (kg: number, unit: Unit) => t(unit === "kg" ? "vc.kilos" : "vc.pounds", { n: fmtNum(fromKg(kg, unit)) });

export function spokenLoad(kg: number, unit: Unit, load: string): string {
  if (load === "bodyweight") return kg > 0 ? t("vc.bodyweightPlus", { weight: weight(kg, unit) }) : t("vc.bodyweight");
  const w = weight(kg, unit);
  return load === "dumbbell" || load === "kettlebell" ? t("vc.each", { weight: w }) : w;
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
  const what = t(c.timed ? "vc.whatTimed" : "vc.what", { load: spokenLoad(c.kg, c.unit, c.load), reps: String(c.reps) });
  if (c.warmup) return t("vc.warmup", { what });
  if (c.challenge && c.setNo === c.sets) return t("vc.challenge", { what });
  const effort = c.rir <= 0 ? t("vc.failure") : t("vc.reserve", { n: n(c.rir) });
  if (c.setNo === c.sets && c.sets > 1) return t("vc.last", { what, effort });
  return t("vc.set", { n: n(c.setNo), total: n(c.sets), what, effort });
}

/** Said when a new exercise comes up. */
export function exerciseCue(name: string, sets: number, c: Omit<SetCue, "name" | "setNo" | "sets">): string {
  return t(c.timed ? "vc.nextTimed" : "vc.next", { name, sets: n(sets), reps: String(c.reps), load: spokenLoad(c.kg, c.unit, c.load) });
}

export const restCue = {
  get ten() {
    return t("vc.ten");
  },
  get go() {
    return t("vc.go");
  },
};

export function prCue(name: string): string {
  return t("vc.pr", { name });
}

export function doneCue(sets: number, volumeKg: number, unit: Unit): string {
  const v = Math.round(fromKg(volumeKg, unit));
  if (v <= 0) return t("vc.done", { sets: String(sets) });
  return t("vc.doneMoved", { sets: String(sets), moved: t(unit === "kg" ? "vc.kilos" : "vc.pounds", { n: v }) });
}
