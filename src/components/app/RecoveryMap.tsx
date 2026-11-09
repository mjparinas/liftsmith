"use client";
import { BodyMap, Legend, Swatch } from "@/components/BodyMap";
import { DEMO_COLOURS, STAGE_BANDS } from "@/components/demo/colours";
import type { DemoSettings, Loop, View } from "@/components/demo/engine";
import { detectMode, readBody } from "@/components/demo/LiftDemo";
import { blockWeek, weekStart } from "@/lib/block";
import { weeklySets } from "@/lib/generator";
import { list, t } from "@/lib/i18n";
import { calm } from "@/lib/juice";
import { muscleAdvice } from "@/lib/muscleAdvice";
import { BANDS, bandOf, type Band } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import { togglePriority } from "@/lib/training";
import { MUSCLE_LABEL, MUSCLES, type Muscle } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "./ui";

// The recovery map (Melvin, 2026-11-09): the exercise demos' 3D hologram figure, standing, with each
// muscle drawn inside the glass body as a glowing volume in its recovery band's colour. Fatigued muscles also get stripes, so the
// state never rests on colour alone, and every band is listed in words under the figure. Tapping a
// muscle (on the body or in the list) says what to do with it and why (action over stats).
// Devices without WebGL get the 2D map (BodyMap), with the same list and advice.

/** Muscles seen from behind; the camera turns to the back when one is picked. */
const BACK = new Set<Muscle>(["traps", "rearDelts", "upperBack", "lats", "triceps", "lowerBack", "glutes", "hamstrings"]);
const FRONT = new Set<Muscle>(["frontDelts", "chest", "biceps", "abs", "obliques", "quads", "adductors"]);

const noSubscribe = () => () => {};

/** Muscles in each band, worst first, as words: "Fatigued: chest and triceps." */
export function bandGroups(rec: Record<Muscle, number>): { band: Band; label: string; muscles: Muscle[] }[] {
  return [...BANDS].reverse()
    .map((b) => ({ band: b.band, label: b.label, muscles: MUSCLES.filter((m) => bandOf(rec[m]).band === b.band).sort((x, y) => rec[x] - rec[y]) }))
    .filter((g) => g.muscles.length);
}

export function RecoveryMap({ rec, focus, compact, chips = true, selected: selectedProp, onSelect }: {
  rec: Record<Muscle, number>;
  /** Today's focus muscles: lit on the figure while nothing is picked. */
  focus?: Muscle[];
  compact?: boolean;
  /** List the muscles by band under the figure (the Recovery screen has its own list). */
  chips?: boolean;
  selected?: Muscle | null;
  onSelect?: (m: Muscle | null) => void;
}) {
  const env = useSyncExternalStore(noSubscribe, detectMode, () => null);
  const [failed, setFailed] = useState(false);
  const [own, setOwn] = useState<Muscle | null>(null);
  const selected = selectedProp !== undefined ? selectedProp : own;
  const select = (m: Muscle | null) => (onSelect ?? setOwn)(m);
  const groups = bandGroups(rec);
  const three = env === "3d" && !failed;

  return (
    <div>
      {three ? (
        <Body3D rec={rec} focus={focus} selected={selected} onPick={select} compact={compact} onFail={() => setFailed(true)} groups={groups} />
      ) : (
        <BodyMap rec={rec} focus={selected ? [selected] : focus} compact={compact} />
      )}
      {three && <Legend hatchOnly />}
      {chips && (
        <ul className="mt-3 space-y-1.5" aria-label={t("map.byBand")}>
          {groups.map((g) => (
            <li key={g.band} className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <Swatch band={g.band} colour={BANDS.find((b) => b.band === g.band)!.colour} hatchOnly={three} />{g.label}
              </span>
              {g.muscles.map((m) => (
                <button key={m} type="button" aria-pressed={selected === m} onClick={() => select(selected === m ? null : m)}
                  className={`press min-h-11 rounded-full border px-3 text-sm ${selected === m ? "border-accent bg-accent/15 text-ink" : "border-line text-muted"}`}>
                  {MUSCLE_LABEL[m]}
                </button>
              ))}
            </li>
          ))}
        </ul>
      )}
      {chips && !selected && <p className="mt-2 text-sm text-faint">{t("map.pick")}</p>}
      <div aria-live="polite">{selected && <Advice muscle={selected} rec={rec} onClose={() => select(null)} />}</div>
    </div>
  );
}

/** What to do with one muscle, and why. */
export function Advice({ muscle, rec, onClose }: { muscle: Muscle; rec: Record<Muscle, number>; onClose: () => void }) {
  const { events, profile, setProfile } = useApp();
  const now = useNow();
  const goal = blockWeek(profile, now).setsPerMuscle;
  const done = weeklySets(events, weekStart(profile, now))[muscle];
  const a = muscleAdvice({ muscle, events, now, rec, done, goal, priorities: profile.training?.priorities });
  const b = bandOf(a.pct);
  return (
    <section className="card mt-3 p-4" aria-label={MUSCLE_LABEL[muscle]} data-testid="muscle-advice">
      <div className="flex items-start gap-2">
        <span className="mt-1 flex"><Swatch band={b.band} colour={b.colour} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{MUSCLE_LABEL[muscle]} <span className="num font-normal text-muted">· {b.label} · {a.pct}%</span></h3>
          <p className="mt-1 font-medium text-ink">{a.call}</p>
          <p className="mt-1 text-sm text-muted">{a.why}</p>
        </div>
        <button type="button" onClick={onClose} className="press -mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted" aria-label={t("map.close")}>✕</button>
      </div>
      {a.offerPriority && (
        <div className="mt-3">
          <Button kind="ghost" icon="target" onClick={() => setProfile({ training: togglePriority(profile.training, muscle) })}>{t("advice.priority")}</Button>
          <p className="mt-1 text-xs text-faint">{t("advice.priority.hint")}</p>
        </div>
      )}
    </section>
  );
}

function Body3D({ rec, focus, selected, onPick, compact, onFail, groups }: {
  rec: Record<Muscle, number>;
  focus?: Muscle[];
  selected: Muscle | null;
  onPick: (m: Muscle | null) => void;
  compact?: boolean;
  onFail: () => void;
  groups: ReturnType<typeof bandGroups>;
}) {
  const { profile } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<Loop | null>(null);
  const cvd = profile.a11y?.colours === "cvd";
  const key = MUSCLES.map((m) => rec[m]).join(",");
  // stable objects, so the figure is only rebuilt when a colour actually changes
  const { paint, hatch } = useMemo(() => {
    const set = STAGE_BANDS[cvd ? "cvd" : "standard"];
    const paint: Partial<Record<Muscle, string>> = {}, hatch: Partial<Record<Muscle, number>> = {};
    for (const m of MUSCLES) {
      const band = bandOf(rec[m]).band;
      paint[m] = set[band];
      if (band === "fatigued") hatch[m] = 1;
    }
    return { paint, hatch };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cvd]);
  const focusKey = (focus ?? []).join(",");
  const lit = useMemo(() => (selected ? [selected] : focus?.length ? focus : null), [selected, focusKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [view, setView] = useState<View>(() => (focus?.length && focus.filter((m) => BACK.has(m)).length > focus.filter((m) => FRONT.has(m)).length ? "back" : "front"));
  // turn to the side the picked muscle is on (adjusted while rendering, not in an effect)
  const [turnedFor, setTurnedFor] = useState<Muscle | null>(null);
  if (selected !== turnedFor) {
    setTurnedFor(selected);
    if (selected && BACK.has(selected)) setView("back");
    else if (selected && FRONT.has(selected)) setView("front");
  }

  const settings: DemoSettings = {
    exerciseId: null, body: readBody() ?? "male", view, skeleton: false, muscles: true, path: false, speed: 1, playing: false,
    fps: 30, paint, hatch, selected: lit, calm: calm(),
  };
  const latest = useRef(settings);
  const pickRef = useRef(onPick);
  const failRef = useRef(onFail);
  useEffect(() => {
    latest.current = settings;
    pickRef.current = onPick;
    failRef.current = onFail;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    (async () => {
      const [{ startLoop }, { createScene3D }] = await Promise.all([import("@/components/demo/engine"), import("@/components/demo/scene3d")]);
      if (cancelled) return;
      let scene;
      try {
        scene = createScene3D(canvas);
      } catch {
        failRef.current();
        return;
      }
      loopRef.current = startLoop(canvas, scene, latest.current, undefined, undefined, (m) => pickRef.current(m));
    })().catch(() => failRef.current());
    return () => {
      cancelled = true;
      loopRef.current?.dispose();
      loopRef.current = null;
    };
  }, []);

  useEffect(() => {
    loopRef.current?.update(latest.current);
  }, [view, paint, hatch, lit]);

  const summary = groups.map((g) => t("map.group", { band: g.label, muscles: list(g.muscles.map((m) => MUSCLE_LABEL[m].toLowerCase())) })).join(" ");
  return (
    <div className={`keep-colours relative mx-auto overflow-hidden rounded-2xl border border-line ${compact ? "h-72 max-w-[340px]" : "h-[26rem] max-w-[420px]"}`}
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0b1a2a 0%, #05080c 72%)" }}>
      <canvas
        ref={canvasRef}
        // A canvas drawn as a labelled picture; the muscle buttons below do the same job for keyboards and screen readers.
        // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
        role="img"
        aria-label={t("map.figure", { summary })}
        className="absolute inset-0 block h-full w-full"
        style={{ touchAction: "pan-y", cursor: "pointer" }}
      />
      <div className="absolute right-2 top-2 inline-flex overflow-hidden rounded-xl border border-line bg-surface/80" role="group" aria-label={t("map.view")}>
        {(["front", "back"] as const).map((v, i) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
            className={`press min-h-11 px-3 text-sm ${i ? "border-l border-line" : ""} ${view === v ? "bg-accent/15 text-accent" : "text-ink"}`}>
            {t(v === "front" ? "map.front" : "map.back")}
          </button>
        ))}
      </div>
      <p className="pointer-events-none absolute inset-x-3 bottom-2 font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DEMO_COLOURS.steel }} aria-hidden="true">
        {selected ? t("map.selected", { muscle: MUSCLE_LABEL[selected], pct: rec[selected] }) : t("map.turn")}
      </p>
    </div>
  );
}
