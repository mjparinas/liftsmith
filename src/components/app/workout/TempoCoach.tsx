"use client";

import { useEffect, useRef, useState } from "react";

import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { phaseWord, timeline, type Beat, type PhaseWord, type Tempo } from "@/lib/tempo";

import { Icon } from "../icons";

// Tempo coach (a lab, Settings › Labs): one button above Log set on tempo and paused lifts. Tap it as
// you take the weight and it counts "Get set" 3, 2, 1, then every second of every rep in sound and
// haptics: a falling pair to lower, a middle note to hold, a rising pair (and a stronger buzz) to lift.
// It stops by itself after the planned reps, on Stop, when Log set is tapped (rest starts and this goes)
// or when a sheet opens or the app leaves the screen. It never logs anything: Log set is still the one
// tap. Sounds and buzzes follow the Sounds and Vibration switches; the words on screen are always there.

function play(b: Beat) {
  sound.tempo(b.phase, b.start);
  if (b.phase === "lead" || !b.start) haptic("select");
  else haptic(b.phase === "up" ? "tap" : "tick");
}

/** The tempo in words, one phase after another: "3 s down · 1 s up". */
export function tempoSummary(tempo: Tempo): string {
  return tempo.phases.map((x) => t(`tempo.s.${phaseWord(tempo, x.phase) as Exclude<PhaseWord, "lead">}`, { s: x.s })).join(" · ");
}

export function TempoCoach({ tempo, reps, paused }: { tempo: Tempo; reps: number; paused: boolean }) {
  const [beat, setBeat] = useState<Beat | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setBeat(null);
  };

  const start = () => {
    const { beats, end } = timeline(tempo, reps);
    const t0 = performance.now();
    let i = 0;
    const step = () => {
      const b = beats[i];
      if (!b) {
        timer.current = null;
        setBeat(null);
        haptic("success");
        return;
      }
      play(b);
      setBeat(b);
      i++;
      // Each beat is timed from the start, so a late timer doesn't push the rest of the set back.
      const next = beats[i]?.at ?? end;
      timer.current = setTimeout(step, Math.max(0, t0 + next - performance.now()));
    };
    step();
  };

  // A sheet opened or the app left the screen: stop counting (the beat is cleared while rendering, the timer here).
  const [wasPaused, setWasPaused] = useState(paused);
  if (paused !== wasPaused) {
    setWasPaused(paused);
    if (paused) setBeat(null);
  }
  useEffect(() => {
    if (paused && timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, [paused]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const running = !!beat;
  const word = beat ? t(`tempo.${phaseWord(tempo, beat.phase)}`) : "";
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => (running ? stop() : start())}
        aria-pressed={running}
        aria-label={running ? t("tempo.stop") : t("tempo.label")}
        className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold backdrop-blur ${running ? "border-accent bg-accent/15 text-accent" : "border-line bg-surface/90 text-muted hover:text-ink"}`}
        data-testid="tempo-coach"
      >
        <Icon name={running ? "clock" : "play"} size={16} className="text-accent" />
        {running ? t("tempo.stopShort") : t("tempo.start")}
      </button>
      <p className="max-w-full text-center text-xs text-muted tabular-nums" data-testid="tempo-line">
        {beat
          ? beat.rep === 0
            ? `${word} ${beat.left}`
            : t("tempo.now", { phase: word, left: beat.left, rep: beat.rep, reps })
          : tempoSummary(tempo)}
      </p>
    </div>
  );
}
