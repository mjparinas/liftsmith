"use client";

import { can } from "./entitlements";
import { currentLang, currentTag, t } from "./i18n";
import { amyUsable, amyWarm, speakAmy, stopAmy } from "./piperAmy";
import type { Unit } from "./types";
import { fmtNum, fromKg } from "./units";

// The voice coach: optional spoken cues between sets ("Last set, 2 in reserve"). Off by default
// (Settings › Voice coach). Engine: system TTS (Android TextToSpeech, iOS AVSpeechSynthesizer, Web
// Speech API) or Piper Amy (Pro, English, bundled under /piper/). Amy falls back to system on any
// failure. Native shells duck music through the VoiceCoach plugin; Amy plays in the page and ducks
// less reliably (Platform deltas).

type Plugin = {
  speak(o: { text: string; rate?: number; lang?: string; voiceId?: string }): Promise<void>;
  stop(): Promise<void>;
  voices?(): Promise<{ voices: { id: string; name: string; lang: string }[] }>;
};
type Cap = { isNativePlatform?: () => boolean; Plugins?: { VoiceCoach?: Plugin } };
const cap = (): Cap | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);

export type VoiceEngine = "system" | "amy";

export const voice = {
  enabled: false,
  engine: "system" as VoiceEngine,
  voiceId: "" as string,
};

export function voiceSupported(): boolean {
  const c = cap();
  if (c?.isNativePlatform?.() && c.Plugins?.VoiceCoach) return true;
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Amy is Pro, English-only, and needs the bundled Piper assets. */
export function amyAllowed(engine: VoiceEngine = voice.engine): boolean {
  return engine === "amy" && can("voiceAmy") && currentLang() === "en" && amyUsable();
}

export function setVoicePrefs(p: { enabled?: boolean; engine?: VoiceEngine; voiceId?: string }) {
  if (p.enabled !== undefined) voice.enabled = p.enabled;
  if (p.engine !== undefined) voice.engine = p.engine;
  if (p.voiceId !== undefined) voice.voiceId = p.voiceId;
  if (voice.enabled && amyAllowed()) amyWarm();
}

function systemSpeak(text: string) {
  const c = cap();
  const p = c?.Plugins?.VoiceCoach;
  if (p && c?.isNativePlatform?.()) {
    void p.speak({ text, rate: 1, lang: currentTag(), voiceId: voice.voiceId || undefined }).catch(() => {});
    return;
  }
  try {
    const s = window.speechSynthesis;
    s.cancel();
    stopAmy();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.lang = currentTag();
    if (voice.voiceId) {
      const match = s.getVoices().find((v) => v.voiceURI === voice.voiceId || v.name === voice.voiceId);
      if (match) u.voice = match;
    }
    s.speak(u);
  } catch {
    /* system TTS unavailable */
  }
}

export function say(text: string, force = false) {
  if ((!voice.enabled && !force) || !text) return;
  if (amyAllowed()) {
    void speakAmy(text).then((ok) => {
      if (!ok) systemSpeak(text);
    });
    return;
  }
  systemSpeak(text);
}

export function stopVoice() {
  stopAmy();
  const c = cap();
  const p = c?.Plugins?.VoiceCoach;
  if (p && c?.isNativePlatform?.()) void p.stop().catch(() => {});
  else if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** System voices the lifter can pick (native plugin or Web Speech). Empty when none are listed yet. */
export async function listSystemVoices(): Promise<{ id: string; name: string; lang: string }[]> {
  const c = cap();
  const p = c?.Plugins?.VoiceCoach;
  if (p?.voices && c?.isNativePlatform?.()) {
    try {
      const r = await p.voices();
      return r.voices ?? [];
    } catch {
      return [];
    }
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const ready = () => window.speechSynthesis.getVoices();
  let voices = ready();
  if (!voices.length) {
    await new Promise<void>((resolve) => {
      const done = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", done);
        resolve();
      };
      window.speechSynthesis.addEventListener("voiceschanged", done);
      setTimeout(done, 500);
    });
    voices = ready();
  }
  const tag = currentTag().toLowerCase();
  const lang = currentLang();
  return voices
    .filter((v) => {
      const l = v.lang.toLowerCase();
      return l === tag || l.startsWith(`${lang}-`) || l === lang;
    })
    .map((v) => ({ id: v.voiceURI || v.name, name: v.name, lang: v.lang }));
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
