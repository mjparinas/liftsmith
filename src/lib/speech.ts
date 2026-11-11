"use client";

import { currentTag } from "./i18n";

// Speech to text for voice set logging (a lab, src/lib/voiceLog.ts reads the words). On-device only
// (2026-11-11): the microphone is heard by the phone's own recognizer and the audio never leaves it.
//
// - Android: the SpeechLog plugin (SpeechLogPlugin.java), SpeechRecognizer's on-device recognizer
//   (Android 12+). Phones without one get "unavailable" rather than a recognizer that sends audio away.
// - iOS: the SpeechLog plugin (SpeechLogPlugin.swift), SFSpeechRecognizer with
//   requiresOnDeviceRecognition.
// - Web: the Web Speech API with processLocally (Chrome 139+), installing the language pack on first
//   use. Browsers that only recognize on a server get "unavailable".
//
// One utterance per listen(): it stops by itself after the lifter stops talking, or after 8 s.

export type SpeechFail = "unavailable" | "denied" | "nomatch" | "error";

export interface SpeechResult {
  /** The recognizer's guesses, best first. */
  guesses: string[];
}

type Plugin = {
  available(o: { lang: string }): Promise<{ available: boolean }>;
  listen(o: { lang: string; hints: string[] }): Promise<{ results: string[] }>;
  stop(): Promise<void>;
};
type Cap = { isNativePlatform?: () => boolean; Plugins?: { SpeechLog?: Plugin } };
const cap = (): Cap | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);
const native = (): Plugin | undefined => {
  const c = cap();
  return c?.isNativePlatform?.() ? c.Plugins?.SpeechLog : undefined;
};

// The parts of the Web Speech API used here (on-device recognition is newer than TypeScript's DOM types).
interface WebRecognition {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  continuous: boolean;
  processLocally?: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface WebRecognitionClass {
  new (): WebRecognition;
  available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>;
  install?: (o: { langs: string[]; processLocally: boolean }) => Promise<boolean>;
}
const webClass = (): WebRecognitionClass | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: WebRecognitionClass; webkitSpeechRecognition?: WebRecognitionClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/** Whether this phone or browser can recognize speech on the device, in the app's language. */
export async function speechAvailable(lang = currentTag()): Promise<boolean> {
  const p = native();
  if (p) {
    try {
      return (await p.available({ lang })).available;
    } catch {
      return false;
    }
  }
  const W = webClass();
  if (!W?.available) return false;
  try {
    const state = await W.available({ langs: [lang], processLocally: true });
    return state !== "unavailable";
  } catch {
    return false;
  }
}

let web: WebRecognition | null = null;

/** Listens for one utterance. Rejects with a SpeechFail. */
export async function listen(hints: string[], lang = currentTag()): Promise<SpeechResult> {
  const p = native();
  if (p) {
    try {
      const r = await p.listen({ lang, hints });
      const guesses = (r.results ?? []).filter((s) => s.trim());
      if (!guesses.length) throw new Error("nomatch");
      return { guesses };
    } catch (e) {
      throw fail(e);
    }
  }
  const W = webClass();
  if (!W?.available) throw "unavailable" satisfies SpeechFail;
  const state = await W.available({ langs: [lang], processLocally: true }).catch(() => "unavailable");
  if (state === "unavailable") throw "unavailable" satisfies SpeechFail;
  if (state !== "available" && !(await W.install?.({ langs: [lang], processLocally: true }).catch(() => false)))
    throw "unavailable" satisfies SpeechFail;
  return new Promise<SpeechResult>((resolve, reject) => {
    web?.abort();
    const r = new W();
    web = r;
    r.lang = lang;
    r.maxAlternatives = 5;
    r.interimResults = false;
    r.continuous = false;
    r.processLocally = true;
    let done = false;
    const timer = setTimeout(() => r.stop(), 8000);
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (web === r) web = null;
      fn();
    };
    r.onresult = (e) => {
      const first = e.results[0];
      const guesses = first ? Array.from(first, (a) => a.transcript).filter((s) => s.trim()) : [];
      finish(() => (guesses.length ? resolve({ guesses }) : reject("nomatch" satisfies SpeechFail)));
    };
    r.onerror = (e) =>
      finish(() =>
        reject(
          (e.error === "not-allowed" || e.error === "service-not-allowed"
            ? "denied"
            : e.error === "no-speech" || e.error === "aborted"
              ? "nomatch"
              : e.error === "language-not-supported"
                ? "unavailable"
                : "error") satisfies SpeechFail,
        ),
      );
    r.onend = () => finish(() => reject("nomatch" satisfies SpeechFail));
    try {
      r.start();
    } catch {
      finish(() => reject("error" satisfies SpeechFail));
    }
  });
}

/** Stops listening (the screen closed, or the lifter tapped again). */
export function stopListening(): void {
  const p = native();
  if (p) void p.stop().catch(() => {});
  web?.abort();
  web = null;
}

function fail(e: unknown): SpeechFail {
  const code =
    typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : e instanceof Error ? e.message : String(e);
  return code === "denied" || code === "unavailable" || code === "nomatch" ? code : "error";
}
