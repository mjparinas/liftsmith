"use client";

// The app's exercise demo: LiftDemoCore with the muscle names in the lifter's language. The public website
// uses LiftDemoCore directly with English names from the server, so its pages don't load the catalogues.
import { MUSCLE_LABEL } from "@/lib/types";

import { LiftDemoCore, type LiftDemoProps } from "./LiftDemoCore";

export { bodyFor, detectMode, type DemoMode, type LiftDemoProps } from "./LiftDemoCore";

export function LiftDemo(props: LiftDemoProps) {
  return <LiftDemoCore {...props} labels={MUSCLE_LABEL} />;
}
