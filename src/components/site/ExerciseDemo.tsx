"use client";
// The app's own 3D demo on a public exercise page (2D when the device has no WebGL). three.js loads only
// when this mounts, so the page itself stays light.
import { LiftDemo } from "@/components/demo/LiftDemo";

export function ExerciseDemo({ id }: { id: string }) {
  return <LiftDemo exerciseId={id} controls bodyToggle />;
}
