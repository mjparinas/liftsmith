// The printable plans' words for the website and the server (prt.* in the app's catalogue, so a printed sheet says
// the same words whether it came from a program page, the routine library or the app; docs/decisions/printable-plans.md).
// Server-only, like fromApp.ts: pages pass the lines they need on as props.
import type { PrintWords } from "@/lib/printSheet";
import * as prt from "@/locales/text/prt";

export type PrintLang = "en" | "es" | "fr" | "de" | "it" | "ja" | "pt" | "ko" | "pl" | "tr";
type Key = keyof typeof prt.en;

/** One prt.* line in this language, with its placeholders filled. */
export function printLine(lang: PrintLang, key: Key, vars: Record<string, string | number> = {}): string {
  const m = (prt[lang] as Partial<Record<Key, string>>)[key] ?? prt.en[key];
  return m.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
}

/** The sheet's words, for a program ("program") or a routine someone can add by scanning ("routine"). */
export function printWords(lang: PrintLang, kind: "program" | "routine"): PrintWords {
  const l = (key: Key) => printLine(lang, key);
  return {
    kicker: l("prt.kicker"),
    exercise: l("prt.exercise"),
    setsReps: l("prt.setsReps"),
    rest: l("prt.rest"),
    next: l("prt.next"),
    session: l("prt.session"),
    date: l("prt.date"),
    superset: l("prt.superset"),
    howTitle: l("prt.howTitle"),
    scanTitle: l(kind === "program" ? "prt.scanProgram" : "prt.scanRoutine"),
    scanBody: l(kind === "program" ? "prt.scanProgramBody" : "prt.scanRoutineBody"),
    free: l("prt.free"),
    qrLabel: l("prt.qrLabel"),
    writeIn: l("prt.writeIn"),
    notes: l("prt.notes"),
  };
}
