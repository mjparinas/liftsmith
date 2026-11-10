"use client";

// The interactive 3D demo on the home page: the app's own LiftDemo with its full controls, plus a
// picker for a few showcase lifts. three.js loads only when this mounts (LiftDemo imports it lazily). Muscle
// names come from the server (`labels`), so the page doesn't load the app's language catalogues.
import { useState } from "react";

import { LiftDemoCore } from "@/components/demo/LiftDemoCore";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { Muscle } from "@/lib/types";

export const DEMO_LIFTS = ["back-squat", "deadlift", "bench-press", "overhead-press", "pull-up", "romanian-deadlift"].filter((id) =>
  EXERCISE_BY_ID.has(id),
);

export function DemoPicker({ labels }: { labels: Partial<Record<Muscle, string>> }) {
  const [id, setId] = useState(DEMO_LIFTS[0]);
  return (
    <div className="mx-auto grid max-w-[720px] gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Exercise">
        {DEMO_LIFTS.map((x) => (
          <button
            key={x}
            type="button"
            aria-pressed={x === id}
            onClick={() => setId(x)}
            className={`press min-h-11 rounded-full border px-4 text-sm font-medium ${x === id ? "border-accent bg-accent/15 text-accent" : "border-line bg-surface text-ink"}`}
          >
            {EXERCISE_BY_ID.get(x)!.name}
          </button>
        ))}
      </div>
      <LiftDemoCore exerciseId={id} controls bodyToggle labels={labels} fps={30} maxDpr={1.5} autoPlay2d={false} />
    </div>
  );
}
