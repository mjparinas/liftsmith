"use client";

// Extras on the workout screen, all between sets or as optional one-tap shortcuts, never an extra tap
// during a set: smart plate memory, ghost mode, "same as last time", the voice coach, and a breathing
// guide or plate-math mini-game on the rest timer.
import { useEffect, useMemo, useRef, useState } from "react";

import { breathAt, breathPattern, DEFAULT_PATTERN, patternCounts } from "@/lib/breathing";
import { ghostFor, paceDelta, paceText, sameAsLast, type Ghost } from "@/lib/ghost";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { barFor } from "@/lib/loads";
import { changeText, lastLoadedKg, plateChange } from "@/lib/plateMemory";
import { loadBar } from "@/lib/plates";
import { TIMED } from "@/lib/progression";
import { hash, rng } from "@/lib/random";
import { useApp } from "@/lib/store";
import type { AppEvent, Exercise, Gym, Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { exerciseCue, restCue, say, setCue, voice } from "@/lib/voice";

import { clock } from "./format";
import { PlateBar } from "./Plates";

export function useGhost(events: readonly AppEvent[], exerciseId: string | undefined, sessionId: string | undefined): Ghost | null {
  // Only earlier sessions matter, so the ghost is stable through the workout.
  const prior = events.filter((e) => e.type === "set" && e.sessionId !== sessionId).length;
  return useMemo(() => (exerciseId ? ghostFor(events, exerciseId, sessionId) : null), [exerciseId, sessionId, prior]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** "Take off 2.5, then add 10 kg each side" under the plate graphic, once the bar has plates on it. */
export function PlateChange({ ex, gym, kg, sessionId }: { ex: Exercise; gym: Gym; kg: number; sessionId: string }) {
  const { events, profile } = useApp();
  if (profile.delight?.plateMemory === false || ex.load !== "barbell") return null;
  const prev = lastLoadedKg(events, sessionId, ex.id);
  if (prev === null) return null;
  const bar = barFor(ex, gym);
  const from = loadBar(fromKg(prev, gym.unit), bar.weight, gym.plates).perSide;
  const to = loadBar(fromKg(kg, gym.unit), bar.weight, gym.plates).perSide;
  const c = plateChange(from, to);
  const same = !c.add.length && !c.remove.length;
  return (
    <div
      className={`mt-2 rounded-xl px-3 py-2 text-center text-sm font-medium ${same ? "bg-good/10 text-good" : "bg-accent/10 text-accent"}`}
    >
      {/* The change, drawn: plates to take off slide out, new ones slide on (one side). Lean mode shows it without the motion. */}
      {!same && (
        <div className="mb-1.5 flex flex-wrap items-center justify-center gap-1" aria-hidden data-testid="plate-change">
          {c.remove.map((p, i) => (
            <span
              key={`r${i}`}
              className="animate-plate-off num rounded-md border border-dashed border-line px-1.5 py-0.5 text-xs text-muted line-through"
            >
              {fmtNum(p)}
            </span>
          ))}
          {c.add.map((p, i) => (
            <span
              key={`a${i}`}
              className="animate-plate-on num rounded-md bg-accent/20 px-1.5 py-0.5 text-xs font-bold text-accent"
              style={{ animationDelay: `${450 + i * 90}ms` }}
            >
              {fmtNum(p)}
            </span>
          ))}
        </div>
      )}
      <p aria-live="polite">{changeText(c, gym.unit, fmtNum)}</p>
    </div>
  );
}

/** Last time's numbers for this set, with one tap to use them. Shown on the set card. */
export function SameAsLastChip({
  ghost,
  setIndex,
  ex,
  unit,
  weight,
  reps,
  onUse,
}: {
  ghost: Ghost | null;
  setIndex: number;
  ex: Exercise;
  unit: Unit;
  weight: number;
  reps: number;
  onUse: (w: number, r: number) => void;
}) {
  const last = sameAsLast(ghost, setIndex);
  if (!last) return null;
  const same = Math.abs(last.weight - weight) < 0.01 && last.reps === reps;
  const txt = `${ex.load === "bodyweight" && last.weight === 0 ? t("ghost.bodyweight") : `${fmtNum(fromKg(last.weight, unit))} ${unit}`} × ${last.reps}${TIMED.has(ex.id) ? " s" : ""}`;
  return (
    <div className="mt-3 flex justify-center">
      {same ? (
        <span className="text-xs text-faint">{t("ghost.same", { set: txt })}</span>
      ) : (
        <button
          type="button"
          onClick={() => {
            haptic("tick");
            onUse(last.weight, last.reps);
          }}
          className="press min-h-11 rounded-full border border-line bg-raised px-4 text-sm text-muted"
        >
          {t("ghost.last", { set: txt })} · <span className="text-accent">{t("ghost.use")}</span>
        </button>
      )}
    </div>
  );
}

/** Ghost mode on the rest card: last time's rest and pace for this set. */
export function GhostLine({
  ghost,
  logged,
  nextIndex,
  unit,
}: {
  ghost: Ghost | null;
  logged: readonly { at: number }[];
  nextIndex: number;
  unit: Unit;
}) {
  const { profile } = useApp();
  if (profile.delight?.ghost === false || !ghost) return null;
  const next = ghost.sets[nextIndex];
  const delta = paceDelta(ghost, logged);
  if (!next && delta === null) return null;
  return (
    <p className="mt-3 text-center text-sm text-muted">
      <span aria-hidden>👻 </span>
      {next
        ? t(next.restSec ? "ghost.lastSetRest" : "ghost.lastSet", {
            weight: fmtNum(fromKg(next.weight, unit)),
            unit,
            reps: next.reps,
            rest: next.restSec ? clock(next.restSec) : "",
          })
        : t("ghost.stopped")}
      {delta !== null && <span className={delta >= 5 ? "text-good" : delta <= -5 ? "text-warn" : ""}> · {paceText(delta)}</span>}
    </p>
  );
}

/** The ghost's rest as a marker on the ring: where last time's rest ended. */
export function ghostRestFraction(ghost: Ghost | null, nextIndex: number, restTotal: number): number | null {
  const r = ghost?.sets[nextIndex]?.restSec;
  if (!r || restTotal <= 0) return null;
  return Math.max(0, Math.min(1, 1 - r / restTotal));
}

// --- Voice coach ------------------------------------------------------------------------------

export interface VoiceState {
  exName: string;
  exerciseId: string;
  setNo: number;
  sets: number;
  kg: number;
  reps: number;
  rir: number;
  unit: Unit;
  load: string;
  challenge?: boolean;
  resting: boolean;
  left: number;
  index: number;
  warmup?: boolean;
}

const platform = () =>
  (typeof window !== "undefined"
    ? (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.()
    : undefined) ?? "web";

/** The cue said when rest ends. Android's workout service says it (screen locked too); elsewhere this hook does. */
export function restEndCue(v: VoiceState): string {
  return setCue({
    name: v.exName,
    setNo: v.setNo,
    sets: v.sets,
    kg: v.kg,
    reps: v.reps,
    rir: v.rir,
    unit: v.unit,
    load: v.load,
    timed: TIMED.has(v.exerciseId),
    challenge: v.challenge,
    warmup: v.warmup,
  });
}

export function useVoiceCoach(v: VoiceState | null, enabled: boolean) {
  useEffect(() => {
    voice.enabled = enabled;
  }, [enabled]);
  const lastIndex = useRef<number | null>(null);
  const said10 = useRef(false);
  const wasResting = useRef(false);
  useEffect(() => {
    if (!v || !enabled) return;
    // A new exercise on screen (not the first render of the workout).
    if (lastIndex.current !== null && lastIndex.current !== v.index && !v.resting) {
      say(
        exerciseCue(v.exName, v.sets, { kg: v.kg, reps: v.reps, rir: v.rir, unit: v.unit, load: v.load, timed: TIMED.has(v.exerciseId) }),
      );
    }
    lastIndex.current = v.index;
    if (v.resting && v.left <= 10.5 && v.left > 9 && !said10.current) {
      said10.current = true;
      say(restCue.ten);
    }
    if (!v.resting) said10.current = false;
    if (wasResting.current && !v.resting && platform() !== "android") say(restEndCue(v));
    wasResting.current = v.resting;
  }, [v?.index, v?.resting, Math.ceil(v?.left ?? 0), enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}

// --- Rest extras: breathing guide and plate-math mini-game ------------------------------------

export function RestExtra({ left, gym }: { left: number; gym: Gym }) {
  const { profile, setProfile } = useApp();
  const mode = profile.delight?.restExtra ?? "off";
  const pick = (m: "breathe" | "game" | "off") => {
    haptic("tick");
    setProfile({ delight: { ...profile.delight, restExtra: m } });
  };
  return (
    <div className="mt-4 w-full">
      {mode === "breathe" && <Breathe left={left} />}
      {mode === "game" && <PlateMath gym={gym} />}
      <div className="mt-2 flex justify-center gap-1 text-xs" role="group" aria-label={t("extra.group")}>
        {(["breathe", "game", "off"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => pick(m)}
            className={`press min-h-11 rounded-full px-3 ${mode === m ? "bg-raised text-ink" : "text-faint"}`}
          >
            {t(`extra.${m}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The breathing guide: box breathing unless the lifter picked another pattern (`breathing.ts`). */
function Breathe({ left }: { left: number }) {
  const { profile } = useApp();
  const id = profile.delight?.breath ?? DEFAULT_PATTERN;
  const phases = useMemo(() => breathPattern(id, profile.delight?.breathCustom), [id, profile.delight?.breathCustom]);
  // Paced by useNow, so the animation stops while the app is in the background. The pattern is picked
  // in Settings, so it doesn't change while the guide is on screen.
  const [t0] = useState(() => Date.now());
  const key = patternCounts(phases);
  const secs = (useNow(100) - t0) / 1000;
  const m = breathAt(phases, secs);
  // A soft cue at each change of step, so the guide can be followed with eyes closed. Not on the
  // first one: the lifter just picked it.
  const lastStep = useRef<number | null>(null);
  useEffect(() => {
    if (lastStep.current !== null && lastStep.current !== m.index) {
      haptic("select");
      sound.breath(m.step === "in" || m.step === "sip" ? "up" : m.step === "out" ? "down" : "hold");
    }
    lastStep.current = m.index;
  }, [m.index, m.step]);
  const scale = 0.3 + 0.7 * m.size;
  const dot = boxPoint(m.cycle);
  return (
    <div className="flex flex-col items-center rounded-2xl bg-raised py-4 text-center">
      <div className="relative grid h-32 w-32 place-items-center text-accent">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d={BOX_PATH} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={3} strokeLinejoin="round" />
          <path
            d={BOX_PATH}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={`${m.cycle} 1`}
          />
          <circle cx={dot.x} cy={dot.y} r={5} fill="currentColor" />
        </svg>
        <div
          className="absolute rounded-2xl bg-accent/25 motion-reduce:transition-none"
          style={{ width: `${scale * 62}%`, height: `${scale * 62}%`, transition: "width 100ms linear, height 100ms linear" }}
        />
        <span className="display relative text-3xl text-ink" aria-hidden>
          {m.left}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold" aria-live="polite">
        {t(STEP_TEXT[m.step])}
      </p>
      <p className="text-xs text-muted">{t("extra.patternLine", { name: t(`extra.p.${id}`), counts: key })}</p>
      {left > 0 && <p className="mt-1 px-4 text-xs text-faint">{t(`extra.why.${id}`)}</p>}
    </div>
  );
}

const STEP_TEXT = { in: "extra.in", sip: "extra.sip", hold: "extra.hold", out: "extra.out", holdOut: "extra.holdOut" } as const;

/** The box, drawn from the bottom left: up the left side, across the top, down the right, back along the bottom. */
const BOX_PATH = "M10 90 L10 10 L90 10 L90 90 Z";

/** The point `cycle` (0 to 1) of the way round the box; for box breathing each side is one step. */
export function boxPoint(cycle: number): { x: number; y: number } {
  const d = (((cycle % 1) + 1) % 1) * 4;
  const side = Math.floor(d);
  const f = d - side;
  if (side === 0) return { x: 10, y: 90 - 80 * f };
  if (side === 1) return { x: 10 + 80 * f, y: 10 };
  if (side === 2) return { x: 90, y: 10 + 80 * f };
  return { x: 90 - 80 * f, y: 90 };
}

export interface PlateQuiz {
  bar: number;
  perSide: number[];
  answer: number;
  options: number[];
}

/** A random loading from the gym's own plates and the three choices for its total. */
export function plateQuiz(gym: Pick<Gym, "plates" | "bars" | "unit">, seed: number): PlateQuiz {
  const r = rng(seed);
  const bar = gym.bars[0]?.weight ?? (gym.unit === "kg" ? 20 : 45);
  const kinds = gym.plates
    .filter((p) => p.count >= 2)
    .map((p) => p.weight)
    .sort((a, b) => b - a);
  const perSide: number[] = [];
  const n = 1 + Math.floor(r() * 4);
  for (let i = 0; i < n && kinds.length; i++) perSide.push(kinds[Math.floor(r() * kinds.length)]);
  perSide.sort((a, b) => b - a);
  const answer = bar + 2 * perSide.reduce((s, x) => s + x, 0);
  const step = kinds.at(-1) ?? (gym.unit === "kg" ? 2.5 : 5);
  const wrong = new Set<number>();
  const deltas = [2 * step, -2 * step, 4 * step, 10, -10, perSide[0] ?? 5, -(perSide[0] ?? 5)];
  while (wrong.size < 2) {
    const d = deltas[Math.floor(r() * deltas.length)];
    const w = Math.round((answer + d) * 100) / 100;
    if (w > 0 && w !== answer) wrong.add(w);
  }
  const options = [answer, ...wrong].sort(() => r() - 0.5);
  return { bar, perSide, answer, options };
}

function PlateMath({ gym }: { gym: Gym }) {
  const [round, setRound] = useState(0);
  const [seed] = useState(() => Date.now());
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = useMemo(() => plateQuiz(gym, hash(`${seed}:${round}`)), [gym, round, seed]);
  const choose = (v: number) => {
    if (picked !== null) return;
    setPicked(v);
    const ok = v === q.answer;
    haptic(ok ? "tap" : "tick");
    setStreak(ok ? streak + 1 : 0);
    setTimeout(() => {
      setPicked(null);
      setRound((x) => x + 1);
    }, 900);
  };
  return (
    <div className="rounded-2xl bg-raised p-3">
      <div className="flex items-center justify-between text-xs text-faint">
        <span>{t("extra.quiz")}</span>
        <span className="num">{t("extra.streak", { count: streak })}</span>
      </div>
      <div className="mt-1">
        <PlateBar loading={{ total: q.answer, perSide: q.perSide, exact: true }} bar={q.bar} unit={gym.unit} compact />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {q.options.map((o) => {
          const show = picked !== null;
          const cls =
            show && o === q.answer ? "border-good bg-good/15" : show && o === picked ? "border-bad bg-bad/15" : "border-line bg-surface";
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              className={`press num min-h-11 rounded-xl border text-sm font-semibold ${cls}`}
            >
              {fmtNum(o)} {gym.unit}
            </button>
          );
        })}
      </div>
    </div>
  );
}
