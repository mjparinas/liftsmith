"use client";

import { useEffect, useRef, useState } from "react";

import { exercise } from "@/lib/exercises";
import { currentLang, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { listen, speechAvailable, stopListening, type SpeechFail } from "@/lib/speech";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";
import { toKg } from "@/lib/units";
import { parseBest, rirFor, voiceHints, type VoiceCommand } from "@/lib/voiceLog";

import { loadText, repsText } from "../format";
import { Icon } from "../icons";

// Voice set logging (a lab, Settings › Labs): one button above Log set. Tap it and say "100 for 8",
// "8 reps", "too easy" or "undo"; the phone hears it on the device (src/lib/speech.ts) and the set is
// logged the same way Log set logs it. It's an extra way in, never an extra tap: Log set still works,
// and nothing here shows during a set unless the lab is on. The line under it says what was heard and
// what was done, so a mishearing is caught before the next set (and Undo is right there).

type Say = { text: string; tone: "ok" | "warn" };

/** What one heard command did, as a line for the lifter. Uses the store's state at the moment, so it's never stale. */
export function applyVoice(cmd: VoiceCommand, said: string, unit: Unit, onLog: () => void, now = Date.now()): Say {
  const st = useApp.getState();
  const a = st.active;
  const item = a?.plan.items[a.index];
  if (!a || !item) return { text: t("vl.unknown", { said }), tone: "warn" };
  const ex = exercise(item.exerciseId);
  if (cmd.undo) {
    if (st.undoable && now <= st.undoable.until && st.undoable.prev.sessionId === a.sessionId) {
      st.undoLast();
      return { text: t("vl.undone", { said }), tone: "ok" };
    }
    return { text: t("vl.noUndo"), tone: "warn" };
  }
  const parts: string[] = [];
  if (cmd.weight !== undefined || cmd.reps !== undefined || cmd.log) {
    const kg = cmd.weight !== undefined ? toKg(cmd.weight, unit) : a.weight;
    const reps = cmd.reps ?? a.reps;
    st.adjust(kg, reps);
    const set = `${loadText(ex, kg, unit)} × ${repsText(ex, reps)}`;
    if (cmd.reps !== undefined || cmd.log) {
      // Said during rest: the set's done, the same as Log now.
      if (a.restUntil && a.restUntil > now) st.skipRest();
      onLog();
      parts.push(t("vl.logged", { set }));
    } else parts.push(t("vl.changed", { set }));
  }
  if (cmd.rating !== undefined) {
    const s2 = useApp.getState();
    const a2 = s2.active;
    const feel = t(cmd.rating === 1 ? "vl.easy" : cmd.rating === -1 ? "vl.hard" : "vl.right");
    const last = a2 ? [...s2.events].reverse().find((e) => e.type === "set" && e.sessionId === a2.sessionId) : undefined;
    if (a2?.askFeedback) {
      s2.feedback(cmd.rating);
      parts.push(t("vl.noted", { feel }));
    } else if (last?.type === "set" && !s2.events.some((e) => e.type === "effort" && e.setId === last.id)) {
      s2.rateEffort(last.id, rirFor(cmd.rating, last.rir));
      parts.push(t("vl.noted", { feel }));
    } else if (!parts.length) return { text: t("vl.noRate"), tone: "warn" };
  }
  return { text: [t("vl.heard", { said }), ...parts].join(" "), tone: "ok" };
}

/** The microphone button and the line that says what it heard. */
export function VoiceLog({ unit, onLog, paused }: { unit: Unit; onLog: () => void; paused: boolean }) {
  const [state, setState] = useState<"idle" | "listening" | "unavailable">("idle");
  const [line, setLine] = useState<Say | null>(null);
  const clear = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let live = true;
    void speechAvailable().then((ok) => live && !ok && setState("unavailable"));
    return () => {
      live = false;
      stopListening();
      if (clear.current) clearTimeout(clear.current);
    };
  }, []);
  // A sheet opened or the app went to the background: stop listening.
  useEffect(() => {
    if (paused) stopListening();
  }, [paused]);

  const show = (s: Say) => {
    setLine(s);
    if (clear.current) clearTimeout(clear.current);
    clear.current = setTimeout(() => setLine(null), 6000);
  };

  const tap = async () => {
    if (state === "listening") {
      stopListening();
      return;
    }
    if (state === "unavailable") {
      show({ text: t("vl.unavailable"), tone: "warn" });
      return;
    }
    haptic("tick");
    setState("listening");
    setLine(null);
    try {
      const lang = currentLang();
      const r = await listen(voiceHints(lang));
      const best = parseBest(r.guesses, lang);
      if (!best) {
        oops();
        show({ text: t("vl.unknown", { said: r.guesses[0] ?? "" }), tone: "warn" });
      } else {
        const out = applyVoice(best.command, best.text, unit, onLog);
        if (out.tone === "warn") oops();
        else if (!best.command.reps && !best.command.log) haptic("success");
        show(out);
      }
      setState("idle");
    } catch (e) {
      const code = (typeof e === "string" ? e : "error") as SpeechFail;
      setState(code === "unavailable" ? "unavailable" : "idle");
      if (code === "nomatch") show({ text: t("vl.nothing"), tone: "warn" });
      else {
        oops();
        show({ text: t(code === "denied" ? "vl.denied" : code === "unavailable" ? "vl.unavailable" : "vl.error"), tone: "warn" });
      }
    }
  };

  const listening = state === "listening";
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => void tap()}
        aria-pressed={listening}
        aria-label={listening ? t("vl.stop") : t("vl.label")}
        className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold backdrop-blur ${listening ? "border-accent bg-accent/15 text-accent" : "border-line bg-surface/90 text-muted hover:text-ink"} ${state === "unavailable" ? "opacity-60" : ""}`}
        data-testid="voice-log"
      >
        <Icon name="mic" size={16} className={listening ? "animate-pulse text-accent" : "text-accent"} />
        {listening ? t("vl.listening") : t("vl.say")}
      </button>
      <p
        aria-live="polite"
        className={`max-w-full text-center text-xs ${line?.tone === "warn" ? "text-warn" : "text-muted"}`}
        data-testid="voice-line"
      >
        {line?.text ?? ""}
      </p>
    </div>
  );
}
