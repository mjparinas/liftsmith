"use client";

// Particle and checkmark bursts (juice pass, 2026-11-09). A burst comes from the thing the lifter just
// touched (Log set, a crate, a finished goal), lasts under a second, never blocks a tap, and is skipped
// in Lean mode and with reduced motion. Drawn with plain DOM and the Web Animations API, so there is no
// canvas and nothing to load.
import { calm } from "@/lib/juice";

/** The burst palette is the design tokens, so it follows the theme and light mode. */
const COLOURS = ["var(--color-accent)", "var(--color-violet)", "var(--color-cyan)", "var(--color-mint)", "var(--color-gold)"];

export type BurstOptions = {
  /** Number of particles. */
  count?: number;
  /** How far they fly, in pixels. */
  reach?: number;
  /** Draw a checkmark in a circle at the centre. */
  check?: boolean;
  /** Override the palette (CSS colours). */
  colours?: string[];
};

function canAnimate(): boolean {
  return typeof document !== "undefined" && typeof Element !== "undefined" && typeof Element.prototype.animate === "function" && !calm();
}

/** Bursts from the centre of `from` (an element or a point in the viewport). Returns false when skipped. */
export function burst(from: Element | { x: number; y: number } | null | undefined, opts: BurstOptions = {}): boolean {
  if (!from || !canAnimate()) return false;
  const { count = 12, reach = 70, check = false, colours = COLOURS } = opts;
  let x: number, y: number;
  if ("getBoundingClientRect" in from) {
    const r = from.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else ({ x, y } = from);

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.burst = "";
  layer.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:0;height:0;pointer-events:none;z-index:70`;
  document.body.appendChild(layer);

  let longest = 0;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const bar = i % 3 === 0;
    const w = bar ? 3 : 6 + Math.random() * 3;
    const h = bar ? 10 : w;
    p.style.cssText = `position:absolute;left:${-w / 2}px;top:${-h / 2}px;width:${w}px;height:${h}px;border-radius:${bar ? 2 : 999}px;background:${colours[i % colours.length]}`;
    layer.appendChild(p);
    // Even spread with a little jitter, so it reads as a ring and not a clump.
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const d = reach * (0.65 + Math.random() * 0.45);
    const dx = Math.cos(a) * d;
    const dy = Math.sin(a) * d;
    const spin = (Math.random() - 0.5) * 540;
    const dur = 520 + Math.random() * 260;
    longest = Math.max(longest, dur);
    p.animate(
      [
        { transform: `translate(0,0) rotate(0deg) scale(0.6)`, opacity: 1 },
        { transform: `translate(${dx * 0.85}px,${dy * 0.85}px) rotate(${spin * 0.7}deg) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px,${dy + 14}px) rotate(${spin}deg) scale(0.4)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
    );
  }

  if (check) {
    const size = 52;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("viewBox", "0 0 52 52");
    svg.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;overflow:visible`;
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", "26");
    circle.setAttribute("cy", "26");
    circle.setAttribute("r", "24");
    circle.setAttribute("style", "fill:var(--color-mint)");
    const tick = document.createElementNS(ns, "path");
    tick.setAttribute("d", "M15 27l7 7 15-16");
    tick.setAttribute(
      "style",
      "fill:none;stroke:var(--color-bg);stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:40;stroke-dashoffset:40",
    );
    svg.append(circle, tick);
    layer.appendChild(svg);
    svg.animate(
      [
        { transform: "translateY(0) scale(0.3)", opacity: 0 },
        { transform: "translateY(-30px) scale(1.12)", opacity: 1, offset: 0.3 },
        { transform: "translateY(-36px) scale(1)", opacity: 1, offset: 0.7 },
        { transform: "translateY(-52px) scale(0.9)", opacity: 0 },
      ],
      { duration: 900, easing: "ease-out", fill: "forwards" },
    );
    tick.animate([{ strokeDashoffset: 40 }, { strokeDashoffset: 0 }], { duration: 260, delay: 120, easing: "ease-out", fill: "forwards" });
    longest = Math.max(longest, 900);
  }

  setTimeout(() => layer.remove(), longest + 60);
  return true;
}
