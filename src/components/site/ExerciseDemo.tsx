"use client";

// The app's own 3D demo on a public exercise page (2D when the device has no GPU WebGL). three.js loads only
// when this mounts, so the page itself stays light. Muscle names come from the server (`labels`, English), so
// the page doesn't load the app's language catalogues; 30 fps and 1.5x pixels keep the main thread free.
import { LiftDemoCore } from "@/components/demo/LiftDemoCore";
import type { Muscle } from "@/lib/types";

export function ExerciseDemo({ id, labels }: { id: string; labels: Partial<Record<Muscle, string>> }) {
  return <LiftDemoCore exerciseId={id} controls bodyToggle labels={labels} fps={30} maxDpr={1.5} autoPlay2d={false} />;
}
