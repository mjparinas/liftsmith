"use client";
// Camera rep counting on the workout screen (Melvin, 2026-11-09; AGENTS.md "Camera rep counting").
// An optional switch beside the exercise: while it's on, the camera watches the set, the 3D figure follows
// the lifter, and the reps counted fill in the reps for Log set, so logging stays one tap. Frames are read
// in memory and dropped: video never leaves the phone and is never recorded.
// Phone motion counting is behind the `repMotion` flag (off by default), because it was unreliable.
import { LiftDemo } from "@/components/demo/LiftDemo";
import { can } from "@/lib/entitlements";
import { flag } from "@/lib/flags";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { ImuRepCounter, imuProfile } from "@/lib/reps/imu";
import { BLAZEPOSE, PoseSignal } from "@/lib/reps/pose";
import { profileFor } from "@/lib/reps/profiles";
import { loadPose, openCamera, startMotion, type PoseEngine } from "@/lib/reps/sources";
import { RepTracker } from "@/lib/reps/tracker";
import type { Pattern } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
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
      source: p.source === "motion" && flag("repMotion") ? "motion" : "camera",
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

/** Whether this exercise can be counted: the camera knows how to read it (and motion, when that's on). */
export function countable(id: string, pattern: Pattern, source: CountSource = "camera"): boolean {
  if (!can("autoCount")) return false;
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

/**
 * The stage while counting: the 3D figure following the lifter, a small camera preview in the corner
 * (mirrored for the front camera) with a flip button, and the live count. `counting` is false during rest,
 * and each new set starts a fresh count (`setKey` changes when a set is logged).
 */
export function AutoCount({ exerciseId, pattern, body, bpm, prefs, onPrefs, counting, setKey, onCount, onClose, paused }: {
  exerciseId: string;
  pattern: Pattern;
  body: "male" | "female";
  bpm?: number | null;
  prefs: CountPrefs;
  onPrefs: (p: CountPrefs) => void;
  counting: boolean;
  setKey: string;
  onCount: (reps: number) => void;
  onClose: () => void;
  paused?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const progress = useRef<number | null>(null);
  const follow = useCallback(() => progress.current, []);
  // Read inside the frame loop, so the loop never restarts when they change.
  const live = useRef({ counting, onCount });
  useEffect(() => {
    live.current = { counting, onCount };
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
      setError(name === "NotAllowedError" || name === "SecurityError" ? t("count.err.denied") : name === "NotFoundError" || name === "OverconstrainedError" ? t("count.err.noCamera") : camera ? t("count.err.model") : t("count.err.motion"));
      setPhase("error");
      oops();
    };

    if (camera && cameraProfile) {
      const v = video.current!;
      let tracker = new RepTracker(cameraProfile);
      const signal = new PoseSignal(cameraProfile, BLAZEPOSE);
      reset.current = () => {
        tracker = new RepTracker(cameraProfile);
        base = 0;
        last = -1;
        setCount(0);
      };
      let raf = 0;
      let lastT = -1;
      let seen = false;
      (async () => {
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
          const smp = signal.sample(now, pose.detect(v, now), v.videoWidth / Math.max(1, v.videoHeight));
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
          progress.current = visible ? tracker.progress : null;
          if (tracker.over) {
            base += tracker.summary().full;
            tracker = new RepTracker(cameraProfile);
          }
          report(base + tracker.summary().full);
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
        report(base + counter.summary().full);
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

  const mirror = camera && prefs.facing === "user" ? { transform: "scaleX(-1)" } : undefined;
  const status = phase === "error" ? error : phase === "starting" ? t("count.opening") : phase === "loading" ? t("count.loading") : !counting ? t("count.resting") : inView ? t("count.counting") : t("count.position");

  return (
    <div className="relative h-full" data-testid="auto-count">
      <LiftDemo exerciseId={exerciseId} body={body} view="side" bpm={bpm} follow={follow} paused={paused} className="h-full" />
      <div className="absolute left-2 top-2 rounded-2xl border border-line bg-bg/80 px-3 py-1.5 text-center backdrop-blur" aria-live="polite">
        <div className="display text-3xl leading-none">{count}</div>
        <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">{t("count.reps")}</div>
      </div>
      <p className={`absolute inset-x-2 bottom-2 mr-[36%] rounded-lg bg-bg/80 px-2 py-1 text-xs ${phase === "error" ? "text-bad" : inView || !counting ? "text-muted" : "text-warn"}`} role={phase === "error" ? "alert" : "status"}>{status}</p>
      <button type="button" onClick={onClose} className="press absolute right-2 top-7 inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-bg/80 px-3 text-sm text-muted" aria-label={t("count.off")}>
        <Icon name="camera" size={16} className="text-accent" />{t("count.stop")}
      </button>
      {camera && (
        <div className="absolute bottom-2 right-2 aspect-[3/4] w-[32%] overflow-hidden rounded-xl border border-line bg-bg shadow-lg">
          <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" style={mirror} aria-hidden />
          <span className={`absolute left-1 top-1 h-2.5 w-2.5 rounded-full ${inView ? "bg-good" : "bg-warn"}`} aria-hidden />
          <button
            type="button"
            onClick={() => { haptic("select"); onPrefs({ ...prefs, facing: prefs.facing === "user" ? "environment" : "user" }); }}
            className="press absolute bottom-0 right-0 grid h-11 w-11 place-items-center text-ink"
            aria-label={prefs.facing === "user" ? t("count.flipToBack") : t("count.flipToFront")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-bg/80"><Icon name="flip" size={18} /></span>
          </button>
        </div>
      )}
      {flag("repMotion") && motionProfile && cameraProfile && (
        <button
          type="button"
          onClick={() => onPrefs({ ...prefs, source: camera ? "motion" : "camera" })}
          className="press absolute right-2 top-[4.5rem] min-h-11 rounded-full border border-line bg-bg/80 px-3 text-xs text-muted"
        >
          {camera ? t("count.useMotion") : t("count.useCamera")}
        </button>
      )}
    </div>
  );
}

/** On the exercise demo, opposite "How to": turns camera counting on (the stage's Stop turns it off). */
export function AutoCountButton({ on, onToggle, className = "" }: { on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => { haptic("toggle"); onToggle(); }}
      aria-pressed={on}
      aria-label={t("count.toggle")}
      className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm ${on ? "border-accent bg-accent/15 text-accent" : "border-line bg-bg/70 text-muted hover:text-ink"} ${className}`}
    >
      <Icon name="camera" size={16} className="text-accent" />{t("count.start")}
    </button>
  );
}
