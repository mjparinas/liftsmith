"use client";
// Rep counter lab (experiment, `repLab` flag). Counts reps from the camera or from the phone's motion
// sensors, and grades each one: full, partial or failed, grinders, set length and bar speed. Nothing is
// saved to the workout yet; this screen exists to test accuracy on real lifts before we build it in.
import { cacheFlags, flag } from "@/lib/flags";
import { ImuRepCounter, imuProfile } from "@/lib/reps/imu";
import { BLAZEPOSE, PoseSignal, type Keypoint } from "@/lib/reps/pose";
import { profileFor } from "@/lib/reps/profiles";
import { loadPose, openCamera, startMotion, type PoseEngine } from "@/lib/reps/sources";
import { RepTracker } from "@/lib/reps/tracker";
import type { MotionProfile, SetSummary } from "@/lib/reps/types";
import type { Pattern } from "@/lib/types";
import { LiftDemo } from "@/components/demo/LiftDemo";
import { useCallback, useEffect, useRef, useState } from "react";
import { go } from "./router";
import { Button, Chip, Section } from "./ui";

const LIFTS: [id: string, label: string, pattern: Pattern][] = [
  ["back-squat", "Squat", "squat"],
  ["bench-press", "Bench", "hpush"],
  ["deadlift", "Deadlift", "hinge"],
  ["overhead-press", "Press", "vpush"],
  ["barbell-row", "Row", "hpull"],
  ["barbell-curl", "Curl", "isolation"],
];

const BONES: [number, number][] = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
const HEIGHT_KEY = "liftsmith.lab.heightCm";

type Source = "camera" | "motion";
type Facing = "user" | "environment";

export function RepLab() {
  const [on, setOn] = useState(() => flag("repLab"));
  const [lift, setLift] = useState(0);
  const [source, setSource] = useState<Source>("camera");
  const [facing, setFacing] = useState<Facing>("user");
  const [heightCm, setHeightCm] = useState(() => {
    try {
      return Number(localStorage.getItem(HEIGHT_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [live, setLive] = useState<{ reps: number; phase: string; fps: number; ms: number; inView?: boolean }>({ reps: 0, phase: "rest", fps: 0, ms: 0 });
  const [result, setResult] = useState<SetSummary>();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef<() => void>(undefined);
  // Where the lifter is in the rep right now (0 at rest, 1 at the bottom), read by the 3D figure every
  // frame so it follows them; null when nothing is running, and the figure plays its own demo.
  const progress = useRef<number | null>(null);
  const follow = useCallback(() => progress.current, []);

  useEffect(() => () => stopRef.current?.(), []);

  if (!on)
    return (
      <div className="pb-24">
        <button type="button" onClick={() => go("settings")} className="press -ml-2 pt-2 text-muted">‹ Settings</button>
        <h1 className="text-2xl font-bold">Rep counter lab</h1>
        <p className="mt-3 text-muted">An experiment: count reps, misses and slow reps from the camera or your phone&apos;s motion. It may get things wrong, and nothing it sees is saved to your workouts.</p>
        <Button className="mt-6 w-full" onClick={() => { cacheFlags({ repLab: true }); setOn(true); }}>Turn on the lab</Button>
      </div>
    );

  const [id, label, pattern] = LIFTS[lift];
  const profile: MotionProfile | undefined = source === "camera" ? profileFor(id, pattern) : imuProfile(id, pattern);

  const stop = () => {
    stopRef.current?.();
    stopRef.current = undefined;
    progress.current = null;
    setRunning(false);
  };

  const start = async () => {
    if (!profile) return;
    setResult(undefined);
    setLive({ reps: 0, phase: "rest", fps: 0, ms: 0 });
    setRunning(true);
    try {
      if (source === "camera") await startCamera(profile);
      else await startPhoneMotion(profile);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Couldn't start");
      stop();
    }
  };

  const finish = (s: SetSummary) => {
    setResult(s);
    stop();
  };

  async function startCamera(p: MotionProfile) {
    const v = video.current!;
    setStatus("Opening the camera…");
    const stream = await openCamera(v, facing);
    setStatus("Loading the pose model (first time only)…");
    let engine: PoseEngine;
    try {
      engine = await loadPose("lite");
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      throw e;
    }
    setStatus("Stand side-on to the camera with your whole body in the small preview. The figure follows you.");
    const signal = new PoseSignal(p, BLAZEPOSE, heightCm ? heightCm / 100 : undefined);
    const tracker = new RepTracker(p);
    let raf = 0;
    let frames = 0;
    let since = 0;
    let inferMs = 0;
    let lastVideoT = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (v.readyState < 2 || v.currentTime === lastVideoT) return;
      lastVideoT = v.currentTime;
      const now = performance.now();
      since ||= now;
      const a = now;
      const kps = engine.detect(v, now);
      inferMs = 0.9 * inferMs + 0.1 * (performance.now() - a);
      draw(kps, v);
      const smp = signal.sample(now, kps, v.videoWidth / Math.max(1, v.videoHeight));
      const evs = tracker.push(smp);
      progress.current = smp.conf >= 0.3 ? tracker.progress : null;
      frames++;
      if (now - since > 500 || evs.length) {
        const s = tracker.summary();
        setLive({ reps: s.full, phase: tracker.state, fps: Math.round((frames * 1000) / (now - since)), ms: Math.round(inferMs), inView: smp.conf >= 0.3 });
        if (now - since > 500) {
          frames = 0;
          since = now;
        }
      }
      if (tracker.over) finish(tracker.summary());
    };
    raf = requestAnimationFrame(loop);
    stopRef.current = () => {
      cancelAnimationFrame(raf);
      engine.close();
      stream.getTracks().forEach((t) => t.stop());
      v.srcObject = null;
      if (!tracker.over && tracker.summary().reps.length) setResult(tracker.finish());
    };
  }

  async function startPhoneMotion(p: MotionProfile) {
    setStatus("Hold the phone against the bar or strap it to your wrist, then lift.");
    const counter = new ImuRepCounter(p);
    let last = 0;
    const off = await startMotion((r) => {
      const evs = r.fused ? counter.pushFused(r.t, r.fused.up, r.fused.rot) : counter.push(r.t, ...r.raw);
      progress.current = counter.progress;
      if (evs.length || r.t - last > 300) {
        last = r.t;
        setLive((l) => ({ ...l, reps: counter.summary().full, phase: counter.tracker.state }));
      }
      if (counter.tracker.over) finish(counter.summary());
    });
    stopRef.current = () => {
      off();
      if (!counter.tracker.over && counter.summary().reps.length) setResult(counter.finish());
    };
  }

  function draw(kps: Keypoint[] | undefined, v: HTMLVideoElement) {
    const c = canvas.current;
    if (!c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const g = c.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    if (!kps) return;
    g.lineWidth = 4;
    g.strokeStyle = "#4c8dff";
    for (const [a, b] of BONES) {
      const p = kps[a], q = kps[b];
      if (!p || !q || (p.visibility ?? 1) < 0.5 || (q.visibility ?? 1) < 0.5) continue;
      g.beginPath();
      g.moveTo(p.x * c.width, p.y * c.height);
      g.lineTo(q.x * c.width, q.y * c.height);
      g.stroke();
    }
  }

  return (
    <div className="pb-24">
      <button type="button" onClick={() => { stop(); go("settings"); }} className="press -ml-2 pt-2 text-muted">‹ Settings</button>
      <h1 className="text-2xl font-bold">Rep counter lab</h1>
      <p className="mt-1 text-sm text-muted">Experiment. Video stays on this device: frames are read and dropped, never recorded or sent.</p>

      <Section title="Lift">
        <div className="flex flex-wrap gap-2">
          {LIFTS.map(([, l], i) => <Chip key={l} active={i === lift} onClick={() => !running && setLift(i)}>{l}</Chip>)}
        </div>
      </Section>
      <Section title="Count with">
        <div className="flex flex-wrap gap-2">
          <Chip active={source === "camera"} onClick={() => !running && setSource("camera")}>Camera</Chip>
          <Chip active={source === "motion"} onClick={() => !running && setSource("motion")}>Phone motion</Chip>
        </div>
      </Section>
      {source === "camera" && (
        <Section title="Your height (for bar speed)">
          <input inputMode="numeric" value={heightCm || ""} placeholder="cm, optional" aria-label="Your height in centimetres" onChange={(e) => { const n = Number(e.target.value) || 0; setHeightCm(n); try { localStorage.setItem(HEIGHT_KEY, String(n)); } catch {} }} className="card num w-full px-4 py-3" />
        </Section>
      )}

      {source === "camera" && (
        <Section title="Camera">
          <div className="flex flex-wrap gap-2">
            <Chip active={facing === "user"} onClick={() => !running && setFacing("user")}>Front (see yourself)</Chip>
            <Chip active={facing === "environment"} onClick={() => !running && setFacing("environment")}>Back</Chip>
          </div>
        </Section>
      )}

      {profile && (
        <div className="relative mt-4 aspect-[4/5] sm:aspect-[4/3]">
          {/* The figure does the lift with you; the camera is only a small preview for lining up. */}
          <LiftDemo exerciseId={id} view="side" label={running ? `${label} · following you` : label} follow={follow} className="h-full" />
          {source === "camera" && (
            <div className="absolute bottom-3 right-3 aspect-[3/4] w-[32%] overflow-hidden rounded-xl border border-line bg-bg shadow-lg" style={{ display: running ? "block" : "none" }}>
              <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }} />
              <canvas ref={canvas} className="absolute inset-0 h-full w-full object-cover" style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }} aria-hidden />
              <span className={`absolute inset-x-1 bottom-1 rounded-md bg-bg/80 px-1 text-center text-xs ${live.inView ? "text-good" : "text-warn"}`} role="status">{live.inView ? "In view" : "Step into view"}</span>
            </div>
          )}
        </div>
      )}

      {running && (
        <div className="card mt-4 p-5 text-center" aria-live="polite">
          <div className="num text-6xl font-bold">{live.reps}</div>
          <div className="text-muted">reps · {live.phase === "rest" ? "ready" : live.phase === "recover" ? "missed, rack it" : "moving"}</div>
          {source === "camera" && <div className="mt-1 text-xs text-faint">{live.fps} fps · {live.ms} ms a frame</div>}
        </div>
      )}
      {status && <p className="mt-3 text-sm text-muted" role="status">{status}</p>}
      {!profile && <p className="mt-3 text-sm text-warn">{label} can&apos;t be counted with {source === "camera" ? "the camera" : "motion"} yet.</p>}

      <Button className="mt-4 w-full" disabled={!profile} onClick={running ? stop : start}>{running ? "Stop" : "Start set"}</Button>
      {result && <Summary s={result} />}
    </div>
  );
}

function Summary({ s }: { s: SetSummary }) {
  const sec = (ms?: number) => (ms === undefined ? "–" : `${(ms / 1000).toFixed(1)} s`);
  const metres = s.reps.some((r) => r.speedIsMetres);
  const speed = (v?: number) => (v === undefined ? "–" : metres ? `${v.toFixed(2)} m/s` : `${Math.round(v)}°/s`);
  return (
    <Section title="Set">
      <div className="card grid grid-cols-2 gap-3 p-4 text-sm">
        <div><div className="num text-2xl font-bold">{s.full}</div><div className="text-muted">full reps</div></div>
        <div><div className="num text-2xl font-bold">{s.partial} · {s.failed}</div><div className="text-muted">partial · missed</div></div>
        <div><div className="num text-lg">{sec(s.durationMs)}</div><div className="text-muted">set length</div></div>
        <div><div className="num text-lg">{s.grinders}</div><div className="text-muted">grinders</div></div>
        <div><div className="num text-lg">{speed(s.bestSpeed)}</div><div className="text-muted">fastest rep</div></div>
        <div><div className="num text-lg">{s.velocityLoss === undefined ? "–" : `${Math.round(s.velocityLoss * 100)}%`}{s.estRir !== undefined ? ` · RIR ~${s.estRir}` : ""}</div><div className="text-muted">slowdown</div></div>
      </div>
      <ol className="mt-2 space-y-1 text-sm">
        {s.reps.map((r) => (
          <li key={r.index} className="card flex justify-between px-4 py-2">
            <span>{r.index + 1}. {r.kind === "full" ? (r.grinder ? "Grinder" : "Full") : r.kind === "partial" ? `Partial (${Math.round(r.depth * 100)}%)` : "Missed"}</span>
            <span className="num text-muted">{r.kind === "failed" ? "" : `${sec(r.concentricMs)} up · ${speed(r.speed)}`}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
