"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { BodyKey } from "@/lib/demo/rig";
import { EXERCISES } from "@/lib/exercises";
import type { Muscle } from "@/lib/types";
import { probeWebGL } from "@/lib/webgl";

import type { DemoSettings, Loop, View } from "./engine";
import { HeartReadout } from "./HeartReadout";

// The demo without the language catalogues: muscle names come in as `labels`, so the public website can pass
// English names from the server and keep every app string (three languages) out of its pages. The app uses
// LiftDemo (LiftDemo.tsx), which passes the translated names.
//
// The exercise demo: a procedural 3D hologram figure (three.js, lazy-loaded) performing the lift,
// male or female from the same motion, with toggles for the skeleton, target muscles and bar path.
// In the app the body follows the sex in Settings (male when it isn't set; Melvin, 2026-11-09), so
// there's no body toggle or body label there; the public site's demos keep the toggle (`bodyToggle`).
// Phones without WebGL get the same figure drawn with the 2D canvas.
//
//   <LiftDemo exerciseId="back-squat" />                     inline demo
//   <LiftDemo exerciseId="back-squat" controls />            full controls
//   <LiftDemo highlight={{ quads: 1 }} view="front" still /> standing figure with muscles lit
//   <LiftDemo exerciseId="bench-press" reps={3} label="New best: 100 kg × 5" />  plays 3 reps, then stops

export interface LiftDemoProps {
  /** Cap on device pixels per CSS pixel (2 by default; the public site uses 1.5). */
  maxDpr?: number;
  /**
   * Start playing on its own in 2D mode (on by default). The public site turns it off: the 2D figure means the
   * phone has no GPU WebGL, and drawing it every frame on the main thread would make the page slow to respond,
   * so it shows a still pose and a Play button instead.
   */
  autoPlay2d?: boolean;
  exerciseId?: string | null;
  /** The movement's name for screen readers when it isn't an exercise (stretches pass "stretch:<id>" as the id). */
  name?: string;
  /** Play this many reps, then hold the last frame. */
  reps?: number;
  /** Shown at the top left of the stage. */
  label?: string;
  /** Which figure. The app passes `bodyFor(profile.sex)`; left out, it's the male figure. */
  body?: BodyKey;
  /** Offer the Male / Female toggle with the controls (public site only; the app uses Settings). */
  bodyToggle?: boolean;
  view?: View;
  /** Don't animate (a still pose). */
  still?: boolean;
  /** Pause without unmounting (for example while a sheet covers it). */
  paused?: boolean;
  /** Show the body, view, overlay and tempo controls and the muscle legend. */
  controls?: boolean;
  highlight?: Partial<Record<Muscle, number>>;
  /** Live heart rate: the figure's heart beats at this rate. Leave out when no monitor is connected. */
  bpm?: number | null;
  /** Recent heart rate readings (oldest first), drawn as a small trend line beside the bpm. */
  hrTrend?: readonly number[];
  /** Frames per second cap; the inline demo uses 30 to save battery. */
  fps?: number;
  /** Follow the lifter instead of the demo's timing: 0 at the start position, 1 at the far end, null for the demo. */
  follow?: () => number | null;
  className?: string;
  /** No frame, backdrop or phase readout: the figure stands on the screen itself (the welcome screen). */
  bare?: boolean;
  onDone?: () => void;
  onClick?: () => void;
}

const noSubscribe = () => () => {};
/** The figure for the lifter: the sex set in Settings, the male figure when it isn't set. */
export const bodyFor = (sex?: string | null): BodyKey => (sex === "female" ? "female" : "male");

export type DemoMode = "3d" | "2d" | "none";
/**
 * WebGL when the device draws it on a GPU, the 2D canvas otherwise (no WebGL, or WebGL drawn in software, which
 * turns every frame into a long task on the main thread), nothing where there is no canvas (tests).
 */
let detected: DemoMode | null = null;
export function detectMode(): DemoMode {
  if (typeof window === "undefined" || typeof document === "undefined") return "none";
  if (/jsdom/i.test(navigator.userAgent)) return "none";
  if (detected) return detected;
  detected = probeWebGL() === "gpu" ? "3d" : "2d";
  return detected;
}

/** The demo's words. English here for the website; the app's LiftDemo passes them in the lifter's language. */
export const DEMO_WORDS = {
  figure: "Figure",
  alt: "3D figure doing {name}",
  altDrag: "3D figure doing {name}. Drag to rotate.",
  altNone: "3D figure",
  drag: "Drag to rotate",
  controls: "Demo controls",
  body: "Body",
  male: "Male",
  female: "Female",
  view: "View",
  orbit: "Orbit",
  front: "Front",
  side: "Side",
  skeleton: "Skeleton",
  muscles: "Target muscles",
  barPath: "Bar path",
  handPath: "Hand path",
  tempo: "Tempo",
  pause: "Pause",
  play: "Play",
  works: "Works",
};
export type DemoWords = Record<keyof typeof DEMO_WORDS, string>;

const viewsOf = (w: DemoWords): [View, string][] => [
  ["orbit", w.orbit],
  ["front", w.front],
  ["three", "3/4"],
  ["side", w.side],
];

export function LiftDemoCore({
  labels,
  words: w = DEMO_WORDS,
  maxDpr,
  autoPlay2d,
  exerciseId = null,
  name: nameProp,
  reps,
  label,
  body: bodyProp,
  bodyToggle,
  view: viewProp,
  still,
  paused,
  controls,
  highlight,
  bpm,
  hrTrend,
  fps,
  follow,
  className = "",
  bare = false,
  onDone,
  onClick,
}: LiftDemoProps & { labels: Partial<Record<Muscle, string>>; words?: DemoWords }) {
  const VIEWS = viewsOf(w);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<Loop | null>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const envMode = useSyncExternalStore(noSubscribe, detectMode, () => null);
  const [fellBack, setFellBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const mode: DemoMode | null = fellBack ? "2d" : envMode;
  const [bodyPick, setBodyPick] = useState<BodyKey | null>(null);
  const body: BodyKey = (bodyToggle ? bodyPick : null) ?? bodyProp ?? "male";
  const [viewPick, setViewPick] = useState<View | null>(null);
  const view: View = viewPick ?? viewProp ?? (controls ? "orbit" : "three");
  const [skeleton, setSkeleton] = useState(false);
  const [muscles, setMuscles] = useState(true);
  const [path, setPath] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playPick, setPlayPick] = useState<boolean | null>(null);
  // The 2D figure is drawn on the main thread; where autoPlay2d is off (the public site), it waits for Play.
  const playing = playPick ?? (!still && (mode !== "2d" || autoPlay2d !== false));

  const settings: DemoSettings = {
    exerciseId,
    body,
    view,
    skeleton,
    muscles,
    path,
    speed,
    playing: playing && !paused && !still,
    reps,
    highlight,
    bpm: bpm ?? null,
    fps: fps ?? (controls ? 60 : 30),
    maxDpr,
    follow: follow ?? null,
  };
  const latest = useRef(settings);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    latest.current = settings;
    onDoneRef.current = onDone;
  });

  // start the loop once the mode is known; 3D is imported only now, so three.js stays out of the main bundle
  useEffect(() => {
    if (!mode || mode === "none" || !canvasRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    (async () => {
      const { startLoop } = await import("./engine");
      let scene;
      if (mode === "3d") {
        try {
          const { createScene3D } = await import("./scene3d");
          scene = createScene3D(canvas);
        } catch {
          detected = "2d";
          if (!cancelled) setFellBack(true); // a fresh canvas is mounted for the 2D drawing
          return;
        }
      } else {
        const { createScene2D } = await import("./scene2d");
        if (!canvas.getContext("2d")) {
          setFailed(true);
          return;
        }
        scene = createScene2D(canvas);
      }
      if (cancelled) {
        scene.dispose();
        return;
      }
      loopRef.current = startLoop(
        canvas,
        scene,
        latest.current,
        (l) => {
          const el = phaseRef.current;
          if (el && el.textContent !== l.toUpperCase()) el.textContent = l.toUpperCase();
        },
        () => onDoneRef.current?.(),
      );
    })().catch(() => setFailed(true));
    return () => {
      cancelled = true;
      loopRef.current?.dispose();
      loopRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    loopRef.current?.update(latest.current);
  }, [exerciseId, body, view, skeleton, muscles, path, speed, playing, paused, still, reps, highlight, bpm, fps, maxDpr, follow]);

  const setView = setViewPick;

  const ex = exerciseId ? EXERCISES.find((e) => e.id === exerciseId) : undefined;
  const shown = ex?.name ?? nameProp;
  const name = shown ?? w.figure;
  const alt = shown ? (controls ? w.altDrag : w.alt).replace("{name}", shown) : w.altNone;

  return (
    <div className={className}>
      <div
        className={`relative overflow-hidden ${bare ? "" : "rounded-2xl border border-line"} ${controls ? "aspect-[4/5] sm:aspect-square" : "h-full min-h-40"}`}
        style={bare ? undefined : { background: "radial-gradient(ellipse at 50% 40%, #0b1a2a 0%, #05080c 72%)" }}
      >
        {mode && mode !== "none" && !failed && (
          <canvas
            key={mode}
            ref={canvasRef}
            // A canvas drawn as a labelled picture; the rule counts every canvas as interactive.
            // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
            role="img"
            aria-label={alt}
            className="absolute inset-0 block h-full w-full"
            style={{ touchAction: controls ? "pan-y" : "auto", cursor: controls ? "grab" : onClick ? "pointer" : "default" }}
            onClick={onClick}
          />
        )}
        {(mode === "none" || failed) && (
          <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted">{name}</div>
        )}
        <div
          className={`pointer-events-none absolute inset-x-3 top-2 ${bare ? "hidden" : "flex"} justify-between gap-2 font-mono text-[0.6875rem] uppercase tracking-wider text-muted`}
        >
          <span className="truncate">{label ?? (controls ? VIEWS.find((v) => v[0] === view)?.[1] : "")}</span>
          <span ref={phaseRef} className="shrink-0 text-[#5cc8ff]" aria-hidden />
        </div>
        {!!bpm && <HeartReadout bpm={bpm} trend={hrTrend} />}
        {controls && (
          <div className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-between font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
            <span>{bpm ? "" : w.drag}</span>
            <span>{mode === "2d" ? "2D" : ""}</span>
          </div>
        )}
      </div>
      {controls && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={w.controls}>
            {bodyToggle && (
              <Seg
                label={w.body}
                value={body}
                options={[
                  ["male", w.male],
                  ["female", w.female],
                ]}
                onPick={setBodyPick}
              />
            )}
            <Seg label={w.view} value={view} options={VIEWS} onPick={setView} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Toggle on={skeleton} onClick={() => setSkeleton((v) => !v)} dot="#f3e6d3">
              {w.skeleton}
            </Toggle>
            <Toggle on={muscles} onClick={() => setMuscles((v) => !v)} dot="#ff5b3a">
              {w.muscles}
            </Toggle>
            <Toggle on={path} onClick={() => setPath((v) => !v)} dot="#d4e0ea">
              {ex && ex.load === "barbell" ? w.barPath : w.handPath}
            </Toggle>
            <Seg
              label={w.tempo}
              value={String(speed)}
              options={[
                ["0.5", "0.5×"],
                ["1", "1×"],
              ]}
              onPick={(v) => setSpeed(Number(v))}
            />
            <button
              type="button"
              onClick={() => setPlayPick(!playing)}
              aria-pressed={playing}
              className="press min-h-11 rounded-xl border border-line bg-surface px-3 text-sm"
            >
              {playing ? w.pause : w.play}
            </button>
          </div>
          {ex && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{w.works}</span>
              {ex.primary.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-[#ff5b3a]/60 bg-[#ff5b3a]/10 px-2.5 py-0.5 text-[0.8125rem] text-[#ffb3a3]"
                >
                  {labels[m] ?? m}
                </span>
              ))}
              {ex.secondary.map((m) => (
                <span key={m} className="rounded-full border border-line px-2.5 py-0.5 text-[0.8125rem] text-muted">
                  {labels[m] ?? m}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Seg<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onPick: (v: T) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-line bg-surface" role="group" aria-label={label}>
      {options.map(([v, l], i) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === value}
          onClick={() => onPick(v)}
          className={`press min-h-11 px-3 text-sm ${i ? "border-l border-line" : ""} ${v === value ? "bg-accent/15 text-accent" : "text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onClick, dot, children }: { on: boolean; onClick: () => void; dot: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`press inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm ${on ? "border-[#2c3b4b] bg-surface text-ink" : "border-line bg-surface text-muted"}`}
    >
      <span
        className="h-2.5 w-2.5 rounded-full border"
        style={{ borderColor: on ? dot : "currentColor", background: on ? dot : "transparent", boxShadow: on ? `0 0 8px ${dot}` : "none" }}
        aria-hidden
      />
      {children}
    </button>
  );
}
