"use client";

// The Liftsmith mascot (juice pass, 2026-11-09): a small, friendly kettlebell, drawn in the brand
// gradient so it follows the theme and light mode. It appears only where the app is otherwise quiet:
// empty states, the start of setup and the end of a workout. Never on the workout screen during a set.
// Decorative only (aria-hidden): the words next to it carry the meaning.
import { useId } from "react";

export type Mood = "happy" | "sleepy" | "cheer" | "curious";

const INK = "var(--btn-ink)";

export function Mascot({ mood = "happy", size = 96, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className={`inline-block ${className}`} style={{ width: size, height: size }} aria-hidden data-mascot={mood}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="animate-bob overflow-visible">
        <defs>
          <linearGradient id={`m${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--grad-a)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--grad-b)" }} />
            <stop offset="1" style={{ stopColor: "var(--grad-c)" }} />
          </linearGradient>
        </defs>
        {/* Ground shadow. */}
        <ellipse cx="50" cy="96" rx="24" ry="3.5" style={{ fill: "var(--shadow)" }} />
        <g>
          {/* Handle and body. */}
          <path d="M25 56C18 30 24 10 50 10s32 20 25 46" fill="none" stroke={`url(#m${id})`} strokeWidth="11" strokeLinecap="round" />
          <path d="M50 36c20 0 33 12 33 29 0 9-3 17-9 24H26c-6-7-9-15-9-24 0-17 13-29 33-29z" fill={`url(#m${id})`} />
          {/* Highlight. */}
          <ellipse cx="36" cy="48" rx="7" ry="4" transform="rotate(-35 36 48)" fill="#fff" opacity="0.32" />
          {/* Cheeks. */}
          <ellipse cx="32" cy="70" rx="5" ry="3" style={{ fill: "color-mix(in srgb, var(--color-ember) 55%, transparent)" }} />
          <ellipse cx="68" cy="70" rx="5" ry="3" style={{ fill: "color-mix(in srgb, var(--color-ember) 55%, transparent)" }} />
          <Face mood={mood} />
        </g>
        {mood === "sleepy" && (
          <g style={{ stroke: "var(--color-cyan)" }} fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path className="float-z" d="M74 26h7l-7 8h7" />
            <path className="float-z" style={{ animationDelay: "1.3s" }} d="M84 12h5l-5 6h5" />
          </g>
        )}
        {mood === "cheer" && (
          <g style={{ fill: "var(--color-gold)" }}>
            <path className="twinkle" d="M14 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
            <path className="twinkle" style={{ animationDelay: "0.5s" }} d="M86 22l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" />
            <path className="twinkle" style={{ animationDelay: "1s" }} d="M88 58l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" />
          </g>
        )}
      </svg>
    </span>
  );
}

function Face({ mood }: { mood: Mood }) {
  const line = { fill: "none", stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const };
  if (mood === "sleepy")
    return (
      <>
        <path d="M37 63q4 3.5 8 0M55 63q4 3.5 8 0" {...line} />
        <ellipse cx="50" cy="74" rx="2.6" ry="2" style={{ fill: INK }} />
      </>
    );
  if (mood === "cheer")
    return (
      <>
        <path d="M37 64q4-5.5 8 0M55 64q4-5.5 8 0" {...line} />
        <path d="M42 70q8 11 16 0z" style={{ fill: INK }} />
      </>
    );
  if (mood === "curious")
    return (
      <>
        <g className="blink">
          <circle cx="41" cy="62" r="3.6" style={{ fill: INK }} />
          <circle cx="59" cy="61" r="4.6" style={{ fill: INK }} />
        </g>
        <path d="M54 52l9-2" {...line} strokeWidth={2.4} />
        <ellipse cx="51" cy="74" rx="3" ry="3.4" style={{ fill: INK }} />
      </>
    );
  return (
    <>
      <g className="blink">
        <circle cx="41" cy="62" r="4.2" style={{ fill: INK }} />
        <circle cx="59" cy="62" r="4.2" style={{ fill: INK }} />
        <circle cx="42.4" cy="60.6" r="1.3" fill="#fff" />
        <circle cx="60.4" cy="60.6" r="1.3" fill="#fff" />
      </g>
      <path d="M44 71q6 6 12 0" {...line} />
    </>
  );
}
