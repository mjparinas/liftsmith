"use client";

// Camera rep counting on the workout screen (Melvin, 2026-11-09; AGENTS.md "Camera rep counting").
// An optional switch beside the exercise: while it's on, the camera watches the set, the 3D figure follows
// the lifter, and the reps counted fill in the reps for Log set, so logging stays one tap. Frames are read
// in memory and dropped: video never leaves the phone and is never recorded.
// It's a lab (Settings › Labs, Pro): on the workout screen only while the `labRepCount` lab is on. Phone
// motion counting is a second lab (`repMotion`), because it was unreliable; it works on its own, without the
// camera lab (Melvin, 2026-11-11), and with both on the stage switches between them. Camera bar speed is a third
// (`labBarSpeed`): the last rep's speed, its drop from the fastest rep, and when to end the set. Camera form
// check is a fourth (`labFormCheck`): between sets, one tip on depth, short range or a lean, shown on the figure.
import { useCallback, useEffect, useRef, useState } from "react";

import { LiftDemo } from "@/components/demo/LiftDemo";
import { Info } from "@/components/Info";
import { num, t } from "@/lib/i18n";
import { calm, haptic, oops } from "@/lib/juice";
import { labOn } from "@/lib/labs";
import { barSpeed, type BarSpeedReadout } from "@/lib/reps/barSpeed";
import { checksFor, FormCheck, formFrame, mainIssue, type FormIssue, type FormReport } from "@/lib/reps/form";
import { imuProfile, ImuRepCounter } from "@/lib/reps/imu";
import { BLAZEPOSE, PoseSignal } from "@/lib/reps/pose";
import { profileFor } from "@/lib/reps/profiles";
import { skeleton } from "@/lib/reps/skeleton";
import { loadPose, openCamera, startMotion, type PoseEngine } from "@/lib/reps/sources";
import { RepTracker } from "@/lib/reps/tracker";
import type { SetSummary } from "@/lib/reps/types";
import type { Pattern } from "@/lib/types";

import { Icon } from "./icons";

export type Facing = "user" | "environment";
export type CountSource = "camera" | "motion";
export interface CountPrefs {
  on: boolean;
  facing: Facing;
  source: CountSource;
}

const KEY = "liftsmith.autoCount";
const DEFAULTS: CountPrefs = { on: false, facing: "user", source: "camera" };

/** The lifter's choices, kept on this device: on or off, front (default) or back camera, and the source. */
export function loadCountPrefs(): CountPrefs {
  try {
    const p = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") } as CountPrefs;
    return {
      on: p.on === true,
      facing: p.facing === "environment" ? "environment" : "user",
      source: countSource(p.source) ?? "camera",
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveCountPrefs(p: CountPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage blocked: the choice lasts until the screen closes.
  }
}

/**
 * The source the lifter's labs allow. Camera counting (`labRepCount`) and phone motion (`repMotion`) are
 * separate labs: with only one on, that one counts; with both, the lifter's choice; with neither, none.
 */
export function countSource(pref: CountSource): CountSource | null {
  const cam = labOn("labRepCount");
  const motion = labOn("repMotion");
  if (cam && motion) return pref;
  return cam ? "camera" : motion ? "motion" : null;
}

/** Whether this exercise can be counted: the camera knows how to read it (and motion, when that's on). */
export function countable(id: string, pattern: Pattern, source: CountSource = "camera"): boolean {
  return !!(source === "motion" ? imuProfile(id, pattern) : profileFor(id, pattern));
}

// The pose model loads once per app run and is kept for every set after.
let engine: Promise<PoseEngine> | null = null;
function poseEngine() {
  engine ??= loadPose("lite").catch((e) => {
    engine = null;
    throw e;
  });
  return engine;
}

type Phase = "starting" | "loading" | "ready" | "error";

/** The tip between sets for the set's main form issue, or that nothing needed fixing. */
export function formTip(report: FormReport): { text: string; issue?: FormIssue } {
  const issue = mainIssue(report);
  if (!issue) return { text: t("count.form.good", { count: report.reps }) };
  const key =
    issue.kind === "lean"
      ? issue.side === "left"
        ? "count.form.leanLeft"
        : "count.form.leanRight"
      : issue.kind === "depth"
        ? "count.form.depth"
        : "count.form.rom";
  return { text: t(key, { count: issue.of, hit: issue.hit, deg: issue.deg ?? 0 }), issue };
}

/** How far the figure leans to show a lean: the lifter's own tilt, kept between 8° and 15° so it reads on a small stage. */
export const shownLean = (i?: FormIssue) => (i?.kind === "lean" ? (i.side === "left" ? -1 : 1) * Math.min(15, Math.max(8, i.deg ?? 8)) : 0);

/**
 * The stage while counting: the 3D figure following the lifter, a small camera preview in the corner
 * (mirrored for the front camera) with a flip button, and the live count. `counting` is false during rest,
 * and each new set starts a fresh count (`setKey` changes when a set is logged).
 */
export function AutoCount({
  exerciseId,
  pattern,
  body,
  heightCm,
  bpm,
  hrTrend,
  prefs,
  onPrefs,
  counting,
  setKey,
  onCount,
  onSummary,
  onClose,
  paused,
}: {
  exerciseId: string;
  pattern: Pattern;
  body: "male" | "female";
  /** The lifter's height, which gives the camera a scale for bar speed in m/s. */
  heightCm?: number;
  bpm?: number | null;
  /** Recent heart rate readings for the trend line on the figure. */
  hrTrend?: readonly number[];
  prefs: CountPrefs;
  onPrefs: (p: CountPrefs) => void;
  counting: boolean;
  setKey: string;
  onCount: (reps: number) => void;
  /** Each time the set's full reps change: the tracker's summary (warm-up speeds for today's max). */
  onSummary?: (s: SetSummary) => void;
  onClose: () => void;
  paused?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const bones = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const [speed, setSpeed] = useState<BarSpeedReadout | undefined>();
  const speedOn = labOn("labBarSpeed");
  const formOn = labOn("labFormCheck");
  const [form, setForm] = useState<FormReport | undefined>();
  const progress = useRef<number | null>(null);
  // Between sets, a depth or range tip replays the lifter's short rep on the figure: down to where it stopped and
  // back, every 2.4 s (held still in Lean mode).
  const replay = useRef<number | null>(null);
  const follow = useCallback(() => {
    const r = replay.current;
    if (r === null) return progress.current;
    return calm() ? r : (r * (1 - Math.cos(((performance.now() % 2400) / 2400) * 2 * Math.PI))) / 2;
  }, []);
  // Read inside the frame loop, so the loop never restarts when they change.
  const live = useRef({ counting, onCount, onSummary });
  useEffect(() => {
    live.current = { counting, onCount, onSummary };
  });
  const reset = useRef<() => void>(() => {});

  const camera = prefs.source === "camera";
  const motionProfile = imuProfile(exerciseId, pattern);
  const cameraProfile = profileFor(exerciseId, pattern);

  // Start the source: camera (with the pose model) or phone motion. The workout screen remounts this
  // (by `key`) on a new exercise, a camera flip or a change of source, so each start is fresh.
  useEffect(() => {
    let stopped = false;
    let stop = () => {};
    let base = 0; // reps from earlier parts of this set, when the tracker ended itself after a long pause
    let last = -1;
    let lastSpeed = "";
    let lastFull = -1;
    const summarised = (sum: SetSummary) => {
      if (sum.full === lastFull) return;
      lastFull = sum.full;
      live.current.onSummary?.(sum);
    };
    // Bar speed (its lab): set only when a new rep changes it, so frames don't re-render the stage.
    const showSpeed = (sum: SetSummary) => {
      if (!speedOn) return;
      const b = barSpeed(sum);
      if (!b) return;
      const k = `${sum.full}:${b.speed}`;
      if (lastSpeed.startsWith(`${k}:`)) return;
      // One buzz when it's time to end the set: the lifter is lifting, not looking.
      if (b.advice === "stop" && !lastSpeed.endsWith(":stop")) haptic("warning");
      lastSpeed = `${k}:${b.advice ?? ""}`;
      setSpeed(b);
    };
    const clearSpeed = () => {
      lastSpeed = "";
      setSpeed(undefined);
    };
    const report = (n: number) => {
      if (n === last) return;
      last = n;
      setCount(n);
      if (n > 0 && live.current.counting) {
        haptic("select");
        live.current.onCount(n);
      }
    };
    const fail = (e: unknown) => {
      if (stopped) return;
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? t("count.err.denied")
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? t("count.err.noCamera")
            : camera
              ? t("count.err.model")
              : t("count.err.motion"),
      );
      setPhase("error");
      oops();
    };

    if (camera && cameraProfile) {
      const v = video.current!;
      let tracker = new RepTracker(cameraProfile);
      const signal = new PoseSignal(cameraProfile, BLAZEPOSE, heightCm ? heightCm / 100 : undefined);
      const check = formOn ? new FormCheck(checksFor(pattern)) : null;
      reset.current = () => {
        // Form check: a set that just ended gets its tip, kept through rest; the next set clears it.
        if (check) {
          const r = check.report(tracker.summary().reps);
          if (r.reps > 0) setForm(r);
          else if (live.current.counting) setForm(undefined);
          check.reset();
        }
        tracker = new RepTracker(cameraProfile);
        base = 0;
        last = -1;
        setCount(0);
        clearSpeed();
        lastFull = -1;
      };
      let raf = 0;
      let lastT = -1;
      let seen = false;
      void (async () => {
        let stream: MediaStream;
        try {
          stream = await openCamera(v, prefs.facing);
        } catch (e) {
          return fail(e);
        }
        if (stopped) return stream.getTracks().forEach((tr) => tr.stop());
        stop = () => {
          cancelAnimationFrame(raf);
          stream.getTracks().forEach((tr) => tr.stop());
          v.srcObject = null;
        };
        setPhase("loading");
        let pose: PoseEngine;
        try {
          pose = await poseEngine();
        } catch (e) {
          stop();
          return fail(e);
        }
        if (stopped) return;
        setPhase("ready");
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (v.readyState < 2 || v.currentTime === lastT) return;
          lastT = v.currentTime;
          const now = performance.now();
          const kps = pose.detect(v, now);
          drawBones(bones.current, kps, v);
          const aspect = v.videoWidth / Math.max(1, v.videoHeight);
          const smp = signal.sample(now, kps, aspect);
          const visible = smp.conf >= 0.3;
          if (visible !== seen) {
            seen = visible;
            setInView(visible);
          }
          if (!live.current.counting) {
            progress.current = visible ? 0 : null;
            return;
          }
          tracker.push(smp);
          check?.push(formFrame(now, kps, aspect));
          progress.current = visible ? tracker.progress : null;
          if (tracker.over) {
            check?.keep(tracker.summary().reps);
            base += tracker.summary().full;
            tracker = new RepTracker(cameraProfile);
          }
          const sum = tracker.summary();
          report(base + sum.full);
          showSpeed(sum);
          summarised(sum);
        };
        raf = requestAnimationFrame(loop);
      })();
    } else if (!camera && motionProfile) {
      let counter = new ImuRepCounter(motionProfile);
      reset.current = () => {
        counter = new ImuRepCounter(motionProfile);
        base = 0;
        last = -1;
        setCount(0);
        clearSpeed();
        lastFull = -1;
      };
      startMotion((r) => {
        if (!live.current.counting) return;
        if (r.fused) counter.pushFused(r.t, r.fused.up, r.fused.rot);
        else counter.push(r.t, ...r.raw);
        progress.current = counter.progress;
        if (counter.tracker.over) {
          base += counter.summary().full;
          counter = new ImuRepCounter(motionProfile);
        }
        const sum = counter.summary();
        report(base + sum.full);
        showSpeed(sum);
        summarised(sum);
      }).then((off) => {
        if (stopped) off();
        else {
          stop = off;
          setPhase("ready");
          setInView(true);
        }
      }, fail);
    }
    return () => {
      stopped = true;
      stop();
      progress.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A logged set (or the end of rest) starts a fresh count.
  useEffect(() => {
    reset.current();
  }, [setKey, counting]);

  const tip = formOn && form && !counting ? formTip(form) : undefined;
  useEffect(() => {
    replay.current = tip?.issue?.reach ?? null;
  });

  const mirror = camera && prefs.facing === "user" ? { transform: "scaleX(-1)" } : undefined;
  const status =
    phase === "error"
      ? error
      : phase === "starting"
        ? t("count.opening")
        : phase === "loading"
          ? t("count.loading")
          : !counting
            ? (tip?.text ?? t("count.resting"))
            : !inView
              ? t("count.position")
              : speed?.advice === "stop"
                ? t("count.speed.stop", { loss: Math.round(speed.loss * 100) })
                : speed?.advice === "left"
                  ? t("count.speed.left", { count: speed.rir ?? 0, loss: Math.round(speed.loss * 100) })
                  : t("count.counting");

  // Stop sits on the camera, opposite the flip, so nothing covers the figure.
  const stopButton = (
    <button
      type="button"
      onClick={onClose}
      className={`press absolute inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-bg/80 px-3 text-sm text-muted ${camera ? "bottom-1 left-1" : "right-2 top-7"}`}
      aria-label={t("count.off")}
    >
      <Icon name={camera ? "camera" : "phone"} size={16} className="text-accent" />
      {t("count.stop")}
    </button>
  );

  // The figure on the left and the camera on the right, side by side (Melvin, 2026-11-10: "shift the 3D model
  // left to make room for the camera"), with the bones the camera reads drawn over the lifter.
  return (
    <div className="flex h-full gap-2" data-testid="auto-count">
      <div className="relative h-full min-w-0 flex-1">
        <LiftDemo
          exerciseId={exerciseId}
          body={body}
          view={tip?.issue?.kind === "lean" ? "front" : "side"}
          lean={shownLean(tip?.issue)}
          bpm={bpm}
          hrTrend={hrTrend}
          follow={follow}
          paused={paused}
          className="h-full"
        />
        <div
          className="absolute left-2 top-2 rounded-2xl border border-line bg-bg/80 px-3 py-1.5 text-center backdrop-blur"
          aria-live="polite"
        >
          <div className="display text-3xl leading-none">{count}</div>
          <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">{t("count.reps")}</div>
          {speedOn && (
            <div className="mt-1.5 border-t border-line pt-1.5" data-testid="bar-speed">
              <div className={`display text-base leading-none ${speed?.advice === "stop" ? "text-warn" : ""}`}>
                {!speed
                  ? "–"
                  : speed.metres
                    ? t("count.speed.ms", { speed: num(speed.speed, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })
                    : t("count.speed.pct", { pct: Math.round((1 - speed.loss) * 100) })}
              </div>
              <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">{t("count.speed.label")}</div>
            </div>
          )}
        </div>
        {!camera && stopButton}
        {labOn("repMotion") && labOn("labRepCount") && motionProfile && cameraProfile && (
          <button
            type="button"
            onClick={() => onPrefs({ ...prefs, source: camera ? "motion" : "camera" })}
            className={`press absolute left-2 ${speedOn ? "top-[7.25rem]" : "top-[4.5rem]"} min-h-11 rounded-full border border-line bg-bg/80 px-3 text-xs text-muted`}
          >
            {camera ? t("count.useMotion") : t("count.useCamera")}
          </button>
        )}
        <div className="absolute inset-x-2 bottom-2 flex items-end gap-1">
          <p
            className={`min-w-0 flex-1 rounded-lg bg-bg/80 px-2 py-1 text-xs ${phase === "error" ? "text-bad" : tip ? (tip.issue ? "text-warn" : "text-muted") : speed?.advice === "stop" && inView && counting ? "text-warn" : inView || !counting ? "text-muted" : "text-warn"}`}
            role={phase === "error" ? "alert" : "status"}
          >
            {status}
          </p>
          {tip ? (
            <Info term="formCheck" className="shrink-0 rounded-full bg-bg/80" />
          ) : (
            speedOn && <Info term="barSpeed" className="shrink-0 rounded-full bg-bg/80" />
          )}
        </div>
      </div>
      {camera && (
        <div className="relative h-full w-[42%] shrink-0 overflow-hidden rounded-2xl border border-line bg-bg">
          <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" style={mirror} aria-hidden />
          <canvas ref={bones} className="pointer-events-none absolute inset-0 h-full w-full" style={mirror} aria-hidden />
          <span className={`absolute left-2 top-2 h-2.5 w-2.5 rounded-full ${inView ? "bg-good" : "bg-warn"}`} aria-hidden />
          {stopButton}
          <button
            type="button"
            onClick={() => {
              haptic("select");
              onPrefs({ ...prefs, facing: prefs.facing === "user" ? "environment" : "user" });
            }}
            className="press absolute bottom-0 right-0 grid h-11 w-11 place-items-center text-ink"
            aria-label={prefs.facing === "user" ? t("count.flipToBack") : t("count.flipToFront")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-bg/80">
              <Icon name="flip" size={18} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/** On the exercise demo, opposite "How to": turns rep counting on (the stage's Stop turns it off). */
export function AutoCountButton({
  on,
  onToggle,
  source = "camera",
  className = "",
}: {
  on: boolean;
  onToggle: () => void;
  source?: CountSource;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("toggle");
        onToggle();
      }}
      aria-pressed={on}
      aria-label={source === "motion" ? t("count.toggleMotion") : t("count.toggle")}
      className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm ${on ? "border-accent bg-accent/15 text-accent" : "border-line bg-bg/70 text-muted hover:text-ink"} ${className}`}
    >
      <Icon name={source === "motion" ? "phone" : "camera"} size={16} className="text-accent" />
      {t("count.start")}
    </button>
  );
}

/** Draws the bones the camera reads over the preview, in the brand accent with mint joints, sharp on any screen. */
function drawBones(canvas: HTMLCanvasElement | null, kps: Parameters<typeof skeleton>[0], v: HTMLVideoElement) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const { bones, joints } = skeleton(kps, { w: v.videoWidth, h: v.videoHeight }, { w, h });
  const css = getComputedStyle(canvas);
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = css.getPropertyValue("--color-accent").trim() || "#4c8dff";
  ctx.beginPath();
  for (const [a, b] of bones) {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
  ctx.fillStyle = css.getPropertyValue("--color-mint").trim() || "#34d399";
  for (const p of joints) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
