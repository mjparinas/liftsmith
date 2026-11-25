"use client";

// The interactive 3D demo on the home page: the app's own LiftDemo with its full controls, plus a
// picker for a few showcase lifts. three.js loads only when this mounts (LiftDemo imports it lazily). Muscle
// names come from the server (`labels`), so the page doesn't load the app's language catalogues. The figure's heart
// beats at a made-up heart rate that rises and settles (`demoHeartRate`), with the bpm and its trend in the corner,
// as it would with a monitor connected; with reduced motion the heart stays still (engine.ts).
import { useEffect, useState } from "react";

import { LiftDemoCore, type DemoWords } from "@/components/demo/LiftDemoCore";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { Muscle } from "@/lib/types";

import { DEMO_LIFTS, demoHeartRate } from "./heroProgram";

export { DEMO_LIFTS };

export function DemoPicker({
  labels,
  names,
  words,
  picker = "Exercise",
  /** Marketing tease: one lift, drag only — full body/view/overlay controls stay in the app. */
  teaser = false,
}: {
  labels: Partial<Record<Muscle, string>>;
  /** The lifts' names in the page's language; English from the library otherwise. */
  names?: Record<string, string>;
  /** The demo's own words (DEMO_WORDS) in the page's language. */
  words?: DemoWords;
  picker?: string;
  teaser?: boolean;
}) {
  const [id, setId] = useState(DEMO_LIFTS[0]);
  const hr = useDemoHeartRate();
  const lifts = teaser ? DEMO_LIFTS.slice(0, 1) : DEMO_LIFTS;
  const shown = teaser ? DEMO_LIFTS[0]! : id;
  return (
    <div className="mx-auto grid max-w-[720px] gap-4">
      {!teaser && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={picker}>
          {lifts.map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={x === id}
              onClick={() => setId(x)}
              className={`press min-h-11 rounded-full border px-4 text-sm font-medium ${x === id ? "border-accent bg-accent/15 text-accent" : "border-line bg-surface text-ink"}`}
            >
              {names?.[x] ?? EXERCISE_BY_ID.get(x)!.name}
            </button>
          ))}
        </div>
      )}
      <LiftDemoCore
        exerciseId={shown}
        controls={!teaser}
        bodyToggle={!teaser}
        labels={labels}
        words={words}
        name={names?.[shown]}
        fps={30}
        maxDpr={1.5}
        autoPlay2d={false}
        bpm={hr.bpm}
        hrTrend={hr.trend}
      />
    </div>
  );
}

/** How often the made-up heart rate moves, in seconds. */
const TICK = 2;

/** The demo's heart rate and its recent readings, moving every couple of seconds while the page is on screen. */
function useDemoHeartRate(): { bpm: number; trend: number[] } {
  const [hr, setHr] = useState(() => ({ bpm: demoHeartRate(0), trend: [demoHeartRate(0)] }));
  useEffect(() => {
    let s = 0;
    const id = setInterval(() => {
      if (document.hidden) return;
      s += TICK;
      const bpm = demoHeartRate(s);
      setHr((h) => ({ bpm, trend: [...h.trend.slice(-59), bpm] }));
    }, TICK * 1000);
    return () => clearInterval(id);
  }, []);
  return hr;
}
