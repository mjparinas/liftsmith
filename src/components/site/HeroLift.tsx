"use client";

// The home page hero: the 3D hologram lifter (the app's own demo engine, src/components/demo) working
// through a short session of squat, deadlift, bench and press, switching between the male and female
// figures. The working muscles are labelled on the body, and the numbers the app tracks tick up: reps,
// the volume sum, an Epley one-rep max estimate, plates per side from the real plate solver, a running
// total, and a heart rate trace that also beats in the figure's chest. It is all demo data and says so.
// three.js loads once the page has loaded and gone quiet, and the figure runs at 30 fps; without GPU WebGL (none,
// or drawn in software) the hero shows a real app screenshot instead (src/lib/webgl.ts).
import { useEffect, useRef, useState } from "react";

import type { Frame, Loop, Scene } from "@/components/demo/engine";
import { lerpV, type Vec } from "@/lib/demo/rig";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { Muscle } from "@/lib/types";
import { probeWebGL } from "@/lib/webgl";

import { epley, HERO_PROGRAM, labelled, muscleAnchor } from "./heroProgram";
import { Screenshot } from "./Screenshot";

const lb = (kg: number) => Math.round(kg / 0.45359237);
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const LABEL_W = 104;

/** Resolves once the page has loaded and the browser has a quiet moment (at most 2 s after load). */
export function afterLoad(): Promise<void> {
  return new Promise((resolve) => {
    const idle = () =>
      window.requestIdleCallback ? window.requestIdleCallback(() => resolve(), { timeout: 2000 }) : setTimeout(resolve, 200);
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  });
}

export interface HeroLiftProps {
  /** Muscle names, from the server (English), so the page doesn't load the app's language catalogues. */
  labels: Partial<Record<Muscle, string>>;
  /** Plates per side for each step of HERO_PROGRAM, worked out on the server (heroPlates.ts). */
  plates: number[][];
}

export function HeroLift({ labels, plates: platesByStep }: HeroLiftProps) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const labelEls = useRef<Partial<Record<Muscle, HTMLDivElement | null>>>({});
  const repEl = useRef<HTMLSpanElement>(null);
  const calcEl = useRef<HTMLSpanElement>(null);
  const e1rmEl = useRef<HTMLSpanElement>(null);
  const totalEl = useRef<HTMLSpanElement>(null);
  const hrEl = useRef<HTMLSpanElement>(null);
  const heartEl = useRef<SVGSVGElement>(null);
  const traceEl = useRef<SVGPolylineElement>(null);
  const phaseEl = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loop: Loop | null = null;
    let next: ReturnType<typeof setTimeout> | undefined;
    const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Session state lives outside React: the HUD updates every frame.
    let i = 0,
      reps = reduced ? HERO_PROGRAM[0].reps : 0,
      banked = 0,
      shown = 0,
      prevEffort = 0;
    let hr = 96,
      beat = 0,
      effortS = 0,
      traceClock = 0,
      lastNow = performance.now(),
      lastBpm = 0;
    const trace: number[] = Array(64).fill(96);

    void (async () => {
      try {
        // Software WebGL (no GPU, or a blocklisted one) can't keep up: show the screenshot instead.
        if (probeWebGL() !== "gpu") throw new Error("no GPU WebGL");
        // Let the page finish loading and go quiet before three.js is fetched and the figure starts, so the
        // text and buttons are ready to use first.
        await afterLoad();
        if (cancelled) return;
        const [{ startLoop }, { createScene3D }, { placeVec }, T3] = await Promise.all([
          import("@/components/demo/engine"),
          import("@/components/demo/scene3d"),
          import("@/lib/demo/mesh"),
          import("three"),
        ]);
        if (cancelled || !canvas.current) return;
        const inner = createScene3D(canvas.current);
        const cam = new T3.PerspectiveCamera(32, 1, 0.1, 40);
        const v = new T3.Vector3();
        let size = [1, 1];

        const hud = (f: Frame) => {
          const now = performance.now();
          const dt = Math.min(0.1, (now - lastNow) / 1000);
          lastNow = now;
          const p = HERO_PROGRAM[i];
          // A rep counts when its lifting phase (effort 1) ends.
          if (!reduced && prevEffort === 1 && f.effort !== 1) reps = Math.min(p.reps, reps + 1);
          prevEffort = f.effort;
          const total = banked + reps * p.kg;
          shown += (total - shown) * Math.min(1, dt * 6);
          if (repEl.current) repEl.current.textContent = `${reps}`;
          if (calcEl.current) calcEl.current.textContent = `${reps} × ${p.kg} kg = ${fmt(reps * p.kg)} kg`;
          if (e1rmEl.current) e1rmEl.current.textContent = reps ? `${p.kg} × (1 + ${reps}/30) = ${fmt(epley(p.kg, reps))} kg` : "—";
          if (totalEl.current) totalEl.current.textContent = fmt(shown);

          // Heart rate: climbs while lifting and with each rep, settles between sets.
          effortS += (f.effort - effortS) * Math.min(1, dt * 1.5);
          const target = 88 + 34 * effortS + 7 * reps + (p.id === "deadlift" ? 8 : 0);
          hr += (target - hr) * Math.min(1, dt * 0.6);
          beat = (beat + (dt * hr) / 60) % 1;
          if (hrEl.current) hrEl.current.textContent = `${Math.round(hr)}`;
          if (heartEl.current) heartEl.current.style.transform = `scale(${1 + 0.2 * Math.max(0, 1 - beat * 5)})`;
          traceClock += dt;
          if (traceClock > 0.1) {
            traceClock = 0;
            trace.shift();
            trace.push(hr + (beat < 0.12 ? 10 : beat < 0.22 ? -6 : 0));
            traceEl.current?.setAttribute("points", trace.map((y, k) => `${k * 2},${40 - (y - 80) * 0.42}`).join(" "));
          }
          if (Math.abs(Math.round(hr) - lastBpm) >= 2 && !reduced) {
            lastBpm = Math.round(hr);
            queueMicrotask(() => loop?.update({ bpm: lastBpm })); // the figure's heart beats at the same rate
          }

          // Muscle labels in two columns either side of the figure, with leader lines to the body.
          const { yaw, pitch, target: tg, distance } = f.cam;
          const yr = (yaw * Math.PI) / 180,
            pr = (pitch * Math.PI) / 180;
          cam.position.set(
            tg[0] + Math.sin(yr) * Math.cos(pr) * distance,
            tg[1] + Math.sin(pr) * distance,
            tg[2] + Math.cos(yr) * Math.cos(pr) * distance,
          );
          cam.lookAt(tg[0], tg[1], tg[2]);
          cam.updateMatrixWorld();
          const project = (q: Vec) => {
            const w = placeVec(q, f.roll, f.place.lift, f.place.shiftZ);
            v.set(w[0], w[1], w[2]).project(cam);
            return { x: ((v.x + 1) / 2) * size[0], y: ((1 - v.y) / 2) * size[1] };
          };
          const centre = project(lerpV(f.J.hipC, f.J.shC, 0.5));
          const sides: Record<"l" | "r", { m: Muscle; x: number; y: number }[]> = { l: [], r: [] };
          for (const m of labelled(p.id)) {
            const a = project(muscleAnchor(m, f.J));
            (a.x < centre.x ? sides.l : sides.r).push({ m, ...a });
          }
          // Keep the columns balanced: move the outermost labels across when one side has more than two.
          while (sides.l.length > 2 && sides.l.length > sides.r.length + 1) sides.r.push(sides.l.sort((a, b) => a.x - b.x).pop()!);
          while (sides.r.length > 2 && sides.r.length > sides.l.length + 1) sides.l.push(sides.r.sort((a, b) => b.x - a.x).pop()!);
          const lines: string[] = [];
          for (const side of ["l", "r"] as const) {
            sides[side].sort((a, b) => a.y - b.y);
            let minY = 92;
            for (const { m, x: ax, y: ay } of sides[side]) {
              const el = labelEls.current[m];
              if (!el) continue;
              const y = Math.min(Math.max(ay, minY), size[1] - 130);
              minY = y + 32;
              const x =
                side === "l"
                  ? Math.max(8, Math.min(ax - 36 - LABEL_W, centre.x - 80 - LABEL_W))
                  : Math.min(size[0] - 8 - LABEL_W, Math.max(ax + 36, centre.x + 80));
              el.style.transform = `translate(${x}px, ${y - 12}px)`;
              el.style.opacity = "1";
              lines.push(
                `<line x1="${side === "l" ? x + LABEL_W : x}" y1="${y}" x2="${ax}" y2="${ay}" /><circle cx="${ax}" cy="${ay}" r="3" />`,
              );
            }
          }
          if (svg.current) svg.current.innerHTML = lines.join("");
        };

        const scene: Scene = {
          resize(w, h, dpr) {
            size = [w, h];
            cam.aspect = w / Math.max(1, h);
            cam.updateProjectionMatrix();
            inner.resize(w, h, dpr);
          },
          draw(f) {
            inner.draw(f);
            hud(f);
          },
          dispose: () => inner.dispose(),
        };

        const first = HERO_PROGRAM[0];
        loop = startLoop(
          canvas.current,
          scene,
          {
            exerciseId: first.id,
            body: first.body,
            view: first.view,
            skeleton: false,
            muscles: true,
            path: false,
            speed: 1,
            playing: true,
            reps: first.reps,
            bpm: 96,
            fps: 30,
            maxDpr: 1.5,
          },
          (label) => {
            if (phaseEl.current && phaseEl.current.textContent !== label) phaseEl.current.textContent = label;
          },
          () => {
            // Set done: bank it, pause a beat, then the next lift.
            next = setTimeout(() => {
              const p = HERO_PROGRAM[i];
              banked = (i + 1) % HERO_PROGRAM.length === 0 ? 0 : banked + p.reps * p.kg;
              if (banked === 0) shown = 0;
              i = (i + 1) % HERO_PROGRAM.length;
              reps = 0;
              prevEffort = 0;
              const n = HERO_PROGRAM[i];
              setStep(i);
              for (const el of Object.values(labelEls.current)) if (el) el.style.opacity = "0";
              loop?.update({ exerciseId: n.id, body: n.body, view: n.view });
            }, 900);
          },
        );
        setReduce(reduced);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(next);
      loop?.dispose();
    };
  }, []);

  const p = HERO_PROGRAM[step];
  const ex = EXERCISE_BY_ID.get(p.id);
  const plates = platesByStep[step] ?? [];
  const shown = labelled(p.id);

  if (status === "failed") {
    return (
      <div className="mx-auto w-full max-w-[300px]">
        <Screenshot
          src="/screens/today.webp"
          alt="The app's Today screen: the readiness call and the planned exercises"
          sizes="300px"
          priority
          className="h-auto w-full rounded-[2rem] border border-line shadow-2xl"
        />
      </div>
    );
  }

  return (
    <figure className="relative">
      <div
        ref={stage}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-line sm:aspect-[5/6]"
        style={{ background: "radial-gradient(ellipse at 50% 42%, #0e2236 0%, #070b11 68%)" }}
      >
        <canvas
          ref={canvas}
          className="absolute inset-0 block h-full w-full touch-pan-y"
          // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role -- a labelled picture
          role="img"
          aria-label={`Animated 3D wireframe figure doing ${ex?.name.toLowerCase() ?? "a lift"}, with the working muscles highlighted and labelled`}
        />

        <svg ref={svg} className="pointer-events-none absolute inset-0 h-full w-full fill-[#ff8a6f] stroke-[#ff8a6f]/70" aria-hidden />
        {shown.map((m) => (
          <div
            key={m}
            ref={(el) => {
              labelEls.current[m] = el;
            }}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 rounded-lg border border-[#ff5b3a]/50 bg-[#1a0f0c]/80 px-2 py-1 text-center font-mono text-[0.6875rem] tracking-wide text-[#ffb3a3] uppercase opacity-0 backdrop-blur transition-opacity duration-300"
            style={{ width: LABEL_W }}
          >
            {labels[m] ?? m}
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="min-w-0 rounded-2xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
            <p className="font-mono text-[0.625rem] tracking-widest text-holo uppercase">
              Set 1 · <span ref={phaseEl} />
            </p>
            <p className="truncate text-base font-bold sm:text-lg">{ex?.name}</p>
            <p className="num text-xs text-muted sm:text-sm">
              <b className="text-ink">{p.kg} kg</b> ({lb(p.kg)} lb) · each side {plates.join(" + ")}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/50 px-3 py-2 text-right backdrop-blur">
            <p className="flex items-center justify-end gap-1.5">
              <svg ref={heartEl} width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#f0605d"
                  d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"
                />
              </svg>
              <span ref={hrEl} className="num text-xl font-bold">
                96
              </span>
              <span className="text-xs text-muted">bpm</span>
            </p>
            <svg width="128" height="34" viewBox="0 0 128 34" aria-hidden className="mt-0.5 hidden w-24 sm:block sm:w-32">
              <polyline ref={traceEl} fill="none" stroke="#f0605d" strokeWidth="1.5" strokeLinejoin="round" points="" />
            </svg>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-white/10 bg-black/60 p-3 backdrop-blur">
          <div className="pr-1 text-center sm:pr-3">
            <p className="font-mono text-[0.625rem] tracking-widest text-muted uppercase">Reps</p>
            <p className="num text-4xl leading-none font-bold">
              <span ref={repEl}>0</span>
              <span className="text-lg text-muted">/{p.reps}</span>
            </p>
          </div>
          <div className="min-w-0 border-l border-white/10 pl-3 font-mono text-[0.6875rem] leading-relaxed sm:text-xs">
            <p className="truncate">
              <span className="text-muted">Volume </span>
              <span ref={calcEl} className="num text-ink" />
            </p>
            <p className="truncate">
              <span className="text-muted">Est. 1RM </span>
              <span ref={e1rmEl} className="num text-ink" />
            </p>
            <p className="mt-0.5 flex items-baseline gap-2 font-sans">
              <span className="text-xs text-muted">Total lifted</span>
              <span className="num text-2xl font-bold text-accent">
                <span ref={totalEl}>0</span> kg
              </span>
            </p>
          </div>
        </div>

        {status === "loading" && <p className="absolute inset-0 grid place-items-center text-sm text-muted">Warming up…</p>}
      </div>
      <figcaption className="mt-2 text-center text-xs text-muted">
        {reduce ? "Paused because your device asks for reduced motion. " : ""}Demo data. In the app, these numbers come from your own sets
        and heart rate monitor.
      </figcaption>
    </figure>
  );
}
