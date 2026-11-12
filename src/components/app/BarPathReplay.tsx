"use client";

// Bar path replay (Labs, `labBarPath`): between sets, over the camera preview, the rep worth looking at plays
// back as a stick figure from the landmarks the camera read, with the bar's path drawn as it goes and a dashed
// line straight up from where the rep started. Landmarks only, in memory: no video is recorded. In Lean mode
// (or with reduce motion) the whole path is drawn once, still.
import { useEffect, useRef } from "react";

import { calm } from "@/lib/juice";
import type { PathFrame } from "@/lib/reps/barPath";
import { coverPoint, skeleton } from "@/lib/reps/skeleton";

/** Held on the last frame before the replay starts again (ms). */
const HOLD = 700;

export function BarPathReplay({
  frames,
  video,
  style,
}: {
  frames: readonly PathFrame[];
  /** The camera's frame size, so the replay lines up with the preview's crop. */
  video: { w: number; h: number };
  style?: React.CSSProperties;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const first = frames[0];
    const last = frames[frames.length - 1];
    if (!c || !first || !last) return;
    const span = Math.max(1, last.t - first.t);
    let raf = 0;
    const draw = (upTo: number) => {
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const css = getComputedStyle(c);
      const colour = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      const box = { w, h };
      const pt = (p: { x: number; y: number }) => coverPoint(p, video, box);
      const shown = frames.filter((f) => f.t <= upTo);
      const now = shown[shown.length - 1] ?? first;

      // Straight up from where the bar started: the line a good rep stays on.
      if (first.bar) {
        const s = pt(first.bar);
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = colour("--color-faint", "#808c9d");
        ctx.beginPath();
        ctx.moveTo(s.x, 0);
        ctx.lineTo(s.x, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // The lifter at this moment, faint, so the path stands out.
      const { bones } = skeleton(now.kps, video, box);
      ctx.globalAlpha = 0.45;
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = colour("--color-muted", "#9aa6b8");
      ctx.beginPath();
      for (const [a, b] of bones) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // The path so far, and the bar where it is now.
      const path = shown.flatMap((f) => (f.bar ? [pt(f.bar)] : []));
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeStyle = colour("--color-accent", "#4c8dff");
      ctx.beginPath();
      path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      const end = path[path.length - 1];
      if (end) {
        ctx.fillStyle = colour("--color-mint", "#34d399");
        ctx.beginPath();
        ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (calm()) {
      draw(last.t);
      return;
    }
    const startedAt = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const e = (performance.now() - startedAt) % (span + HOLD);
      draw(first.t + Math.min(span, e));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frames, video]);

  return (
    <canvas
      ref={canvas}
      className="pointer-events-none absolute inset-0 h-full w-full bg-bg"
      style={style}
      data-testid="bar-path-replay"
      aria-hidden
    />
  );
}
