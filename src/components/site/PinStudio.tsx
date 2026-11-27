"use client";

// Used only by the build-only /pin-studio/ page (scripts/pins.mjs, docs/decisions/pinterest.md): it lays out one
// exercise's Pinterest pin (1000×1500) or one frame of its 15-second clip (1080×1920) and draws the 3D figure into it,
// so the script only has to screenshot the page. Every frame is set by the script's clock (`__pinFrame(t)`), never by
// CSS animations, so a slow machine draws the same clip as a fast one.
import { useEffect, useRef, useState } from "react";

import { figureClip, type FigureClip } from "@/components/demo/clip";
import type { BodyKey } from "@/lib/demo/rig";
import { CLIP_SIZE, CLIP_TIMES, PIN_SIZE, pinContent, type PinContent } from "@/lib/pinContent";

type Mode = "pin" | "clip";

declare global {
  interface Window {
    __pinOrder?: string[];
    __pinLoad?: (exerciseId: string, body: BodyKey, mode: Mode) => Promise<PinContent | null>;
    __pinFrame?: (t: number) => Promise<void>;
  }
}

const INK = "#f2f5fa";
const MUTED = "#a3afc0";
const FONT = "Inter, Roboto, 'DejaVu Sans', system-ui, sans-serif";

/** 0 before `at`, 1 a little after, eased: how far a cue or the address card has come in at time t. */
export function arrive(t: number, at: number, length = 0.45): number {
  const x = Math.min(1, Math.max(0, (t - at) / length));
  return 1 - (1 - x) ** 3;
}

/** The camera's gentle sweep around the three-quarter view over the clip, in degrees. */
export const sweep = (t: number) => 26 * Math.sin((t / CLIP_SIZE.seconds) * Math.PI * 2);

export function PinStudio({ order }: { order: string[] }) {
  const [job, setJob] = useState<{ pin: PinContent; mode: Mode } | null>(null);
  const figure = useRef<HTMLCanvasElement | null>(null);
  const cues = useRef<(HTMLLIElement | null)[]>([]);
  const end = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef<FigureClip | null>(null);
  const ready = useRef<(() => void) | null>(null);

  useEffect(() => {
    window.__pinOrder = order;
    window.__pinLoad = async (id, body, mode) => {
      clipRef.current?.dispose();
      clipRef.current = null;
      const pin = pinContent(id, mode === "clip" ? "video" : "image");
      if (!pin) return null;
      const size = mode === "clip" ? { width: CLIP_SIZE.width, height: 860 } : { width: PIN_SIZE.width, height: 660 };
      const c = await figureClip({ exerciseId: id, body, ...size, zoom: 1.3 });
      if (!c) return null;
      clipRef.current = c;
      await new Promise<void>((resolve) => {
        ready.current = resolve;
        setJob({ pin, mode });
      });
      if (mode === "pin" && figure.current) c.still(figure.current);
      await paint();
      return pin;
    };
    window.__pinFrame = async (t) => {
      const c = clipRef.current;
      if (!c || !figure.current) return;
      c.draw(t, sweep(t), figure.current);
      CLIP_TIMES.cues.forEach((at, i) => show(cues.current[i], arrive(t, at)));
      show(end.current, arrive(t, CLIP_TIMES.end));
      await paint();
    };
  }, [order]);

  useEffect(() => {
    if (job) ready.current?.();
  }, [job]);

  if (!job) return <p>Pin studio</p>;
  const { pin, mode } = job;
  const clip = mode === "clip";
  const W = clip ? CLIP_SIZE.width : PIN_SIZE.width;
  const H = clip ? CLIP_SIZE.height : PIN_SIZE.height;
  const pad = clip ? 80 : 72;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: W,
        height: H,
        overflow: "hidden",
        background: "#0a0d12",
        color: INK,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        padding: `${clip ? 96 : 64}px ${pad}px ${clip ? 120 : 56}px`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 40% at 85% 22%, rgba(76,141,255,.34), transparent 70%), radial-gradient(50% 35% at 0% 100%, rgba(167,139,250,.22), transparent 70%), radial-gradient(45% 30% at 100% 95%, rgba(56,214,232,.12), transparent 70%)",
        }}
      />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" width={clip ? 64 : 56} height={clip ? 64 : 56} style={{ borderRadius: 14 }} />
        <span style={{ fontSize: clip ? 40 : 34, fontWeight: 800, letterSpacing: "-0.02em" }}>Liftsmith</span>
      </div>
      <div
        style={{
          position: "relative",
          marginTop: clip ? 56 : 40,
          fontSize: clip ? 30 : 26,
          fontWeight: 800,
          letterSpacing: "0.18em",
          color: "#8fb7ff",
        }}
      >
        FORM CHECK
      </div>
      <h1
        style={{
          position: "relative",
          margin: "14px 0 0",
          fontSize: titleSize(pin.name, clip),
          lineHeight: 1.04,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          maxHeight: clip ? 180 : 170,
          overflow: "hidden",
        }}
      >
        {pin.name}
      </h1>
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <canvas ref={figure} style={{ maxWidth: "100%", maxHeight: "100%" }} />
      </div>
      <ol
        style={{
          position: "relative",
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: clip ? 22 : 18,
        }}
      >
        {pin.cues.map((c, i) => (
          <li
            key={i}
            ref={(el) => {
              cues.current[i] = el;
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: clip ? "22px 28px" : "18px 24px",
              borderRadius: 26,
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              opacity: clip ? 0 : 1,
            }}
          >
            <span
              style={{
                flex: "none",
                width: clip ? 60 : 52,
                height: clip ? 60 : 52,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: clip ? 30 : 26,
                fontWeight: 800,
                color: "#0a0d12",
                background: "linear-gradient(120deg,#5b9cff,#9b86ff)",
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: cueSize(c, clip), lineHeight: 1.2, fontWeight: 650 }}>{c}</span>
          </li>
        ))}
      </ol>
      <div
        ref={end}
        style={{
          position: "relative",
          marginTop: clip ? 36 : 30,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          opacity: clip ? 0 : 1,
        }}
      >
        <span style={{ fontSize: clip ? 30 : 24, color: MUTED }}>Free 3D demo and common mistakes</span>
        <span style={{ fontSize: clip ? 36 : 30, fontWeight: 800, color: "#8fb7ff" }}>{pin.shown}</span>
      </div>
    </div>
  );
}

function show(el: HTMLElement | null | undefined, x: number) {
  if (!el) return;
  el.style.opacity = String(x);
  el.style.transform = `translateY(${Math.round((1 - x) * 28)}px)`;
}

const titleSize = (name: string, clip: boolean) => {
  const base = clip ? 84 : 72;
  return name.length > 34 ? base * 0.72 : name.length > 22 ? base * 0.85 : base;
};
const cueSize = (cue: string, clip: boolean) => {
  const base = clip ? 40 : 34;
  return cue.length > 58 ? base * 0.8 : cue.length > 40 ? base * 0.9 : base;
};

/** Waits for the browser to put the change on screen. */
const paint = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
