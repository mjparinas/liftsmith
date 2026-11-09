"use client";
import { EXERCISES } from "@/lib/exercises";
import type { BodyKey } from "@/lib/demo/rig";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { DemoSettings, Loop, View } from "./engine";

// The exercise demo: a procedural 3D hologram figure (three.js, lazy-loaded) performing the lift,
// male or female from the same motion, with toggles for the skeleton, target muscles and bar path.
// Phones without WebGL get the same figure drawn with the 2D canvas.
//
//   <LiftDemo exerciseId="back-squat" />                     inline demo
//   <LiftDemo exerciseId="back-squat" controls />            full controls
//   <LiftDemo highlight={{ quads: 1 }} view="front" still /> standing figure with muscles lit
//   <LiftDemo exerciseId="bench-press" reps={3} label="New best: 100 kg × 5" />  plays 3 reps, then stops

export interface LiftDemoProps {
  exerciseId?: string | null;
  /** Play this many reps, then hold the last frame. */
  reps?: number;
  /** Shown at the top left of the stage. */
  label?: string;
  body?: BodyKey;
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
  /** Frames per second cap; the inline demo uses 30 to save battery. */
  fps?: number;
  className?: string;
  onDone?: () => void;
  onClick?: () => void;
}

const BODY_KEY = "liftsmith.demo.body";
const noSubscribe = () => () => {};
const readBody = (): BodyKey | null => {
  try {
    const v = localStorage.getItem(BODY_KEY);
    return v === "male" || v === "female" ? v : null;
  } catch {
    return null;
  }
};

export type DemoMode = "3d" | "2d" | "none";
/** WebGL when the device has it, the 2D canvas otherwise, nothing where there is no canvas (tests). */
let detected: DemoMode | null = null;
export function detectMode(): DemoMode {
  if (typeof window === "undefined" || typeof document === "undefined") return "none";
  if (/jsdom/i.test(navigator.userAgent)) return "none";
  if (detected) return detected;
  detected = "2d";
  try {
    const c = document.createElement("canvas");
    const gl = "WebGLRenderingContext" in window ? ((c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null) : null;
    if (gl) {
      detected = "3d";
      gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the probe context straight away
    }
  } catch {}
  return detected;
}

const VIEWS: [View, string][] = [["orbit", "Orbit"], ["front", "Front"], ["three", "3/4"], ["side", "Side"]];

export function LiftDemo({ exerciseId = null, reps, label, body: bodyProp, view: viewProp, still, paused, controls, highlight, bpm, fps, className = "", onDone, onClick }: LiftDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<Loop | null>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const envMode = useSyncExternalStore(noSubscribe, detectMode, () => null);
  const [fellBack, setFellBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const mode: DemoMode | null = fellBack ? "2d" : envMode;
  const savedBody = useSyncExternalStore(noSubscribe, readBody, () => null);
  const [bodyPick, setBodyPick] = useState<BodyKey | null>(null);
  const body: BodyKey = bodyProp ?? bodyPick ?? savedBody ?? "male";
  const [viewPick, setViewPick] = useState<View | null>(null);
  const view: View = viewPick ?? viewProp ?? (controls ? "orbit" : "three");
  const [skeleton, setSkeleton] = useState(false);
  const [muscles, setMuscles] = useState(true);
  const [path, setPath] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(!still);

  const settings: DemoSettings = { exerciseId, body, view, skeleton, muscles, path, speed, playing: playing && !paused && !still, reps, highlight, bpm: bpm ?? null, fps: fps ?? (controls ? 60 : 30) };
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
        if (!canvas.getContext("2d")) { setFailed(true); return; }
        scene = createScene2D(canvas);
      }
      if (cancelled) { scene.dispose(); return; }
      loopRef.current = startLoop(canvas, scene, latest.current, (l) => {
        const el = phaseRef.current;
        if (el && el.textContent !== l.toUpperCase()) el.textContent = l.toUpperCase();
      }, () => onDoneRef.current?.());
    })().catch(() => setFailed(true));
    return () => {
      cancelled = true;
      loopRef.current?.dispose();
      loopRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    loopRef.current?.update(latest.current);
  }, [exerciseId, body, view, skeleton, muscles, path, speed, playing, paused, still, reps, highlight, bpm, fps]);

  const pickBody = (b: BodyKey) => {
    setBodyPick(b);
    try { localStorage.setItem(BODY_KEY, b); } catch {}
  };
  const setView = setViewPick;

  const ex = exerciseId ? EXERCISES.find((e) => e.id === exerciseId) : undefined;
  const name = ex?.name ?? "Figure";
  const alt = ex ? `3D figure doing ${ex.name}${controls ? ". Drag to rotate." : ""}` : "3D figure";

  return (
    <div className={className}>
      <div
        className={`relative overflow-hidden rounded-2xl border border-line ${controls ? "aspect-[4/5] sm:aspect-square" : "h-full min-h-40"}`}
        style={{ background: "radial-gradient(ellipse at 50% 40%, #0b1a2a 0%, #05080c 72%)" }}
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
        {(mode === "none" || failed) && <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted">{name}</div>}
        <div className="pointer-events-none absolute inset-x-3 top-2 flex justify-between gap-2 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
          <span className="truncate">{label ?? (controls ? VIEWS.find((v) => v[0] === view)?.[1] : "")}</span>
          <span ref={phaseRef} className="shrink-0 text-[#5cc8ff]" aria-hidden />
        </div>
        {!!bpm && (
          <span className="pointer-events-none absolute bottom-2 left-3 font-mono text-[0.6875rem] tabular-nums text-[#ff6b84]" aria-label={`Heart rate ${bpm}`}>♥ {bpm}</span>
        )}
        {controls && (
          <div className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-between font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
            <span>{bpm ? "" : "Drag to rotate"}</span>
            <span>{body === "male" ? "Male" : "Female"}{mode === "2d" ? " · 2D" : ""}</span>
          </div>
        )}
      </div>
      {controls && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Demo controls">
            <Seg label="Body" value={body} options={[["male", "Male"], ["female", "Female"]]} onPick={pickBody} />
            <Seg label="View" value={view} options={VIEWS} onPick={setView} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Toggle on={skeleton} onClick={() => setSkeleton((v) => !v)} dot="#f3e6d3">Skeleton</Toggle>
            <Toggle on={muscles} onClick={() => setMuscles((v) => !v)} dot="#ff5b3a">Target muscles</Toggle>
            <Toggle on={path} onClick={() => setPath((v) => !v)} dot="#d4e0ea">{ex && (ex.load === "barbell") ? "Bar path" : "Hand path"}</Toggle>
            <Seg label="Tempo" value={String(speed)} options={[["0.5", "0.5×"], ["1", "1×"]]} onPick={(v) => setSpeed(Number(v))} />
            <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} className="press min-h-11 rounded-xl border border-line bg-surface px-3 text-sm">{playing ? "Pause" : "Play"}</button>
          </div>
          {ex && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">Works</span>
              {ex.primary.map((m) => <span key={m} className="rounded-full border border-[#ff5b3a]/60 bg-[#ff5b3a]/10 px-2.5 py-0.5 text-[0.8125rem] text-[#ffb3a3]">{MUSCLE_LABEL[m]}</span>)}
              {ex.secondary.map((m) => <span key={m} className="rounded-full border border-line px-2.5 py-0.5 text-[0.8125rem] text-muted">{MUSCLE_LABEL[m]}</span>)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Seg<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-line bg-surface" role="group" aria-label={label}>
      {options.map(([v, l], i) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onPick(v)} className={`press min-h-11 px-3 text-sm ${i ? "border-l border-line" : ""} ${v === value ? "bg-accent/15 text-accent" : "text-ink"}`}>{l}</button>
      ))}
    </div>
  );
}

function Toggle({ on, onClick, dot, children }: { on: boolean; onClick: () => void; dot: string; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`press inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm ${on ? "border-[#2c3b4b] bg-surface text-ink" : "border-line bg-surface text-muted"}`}>
      <span className="h-2.5 w-2.5 rounded-full border" style={{ borderColor: on ? dot : "currentColor", background: on ? dot : "transparent", boxShadow: on ? `0 0 8px ${dot}` : "none" }} aria-hidden />
      {children}
    </button>
  );
}
