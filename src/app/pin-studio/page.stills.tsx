// Build-only page for scripts/pins.mjs: it lays out an exercise's Pinterest pin or a frame of its clip (PinStudio.tsx).
// The `.stills.tsx` extension keeps it out of every normal build (next.config.ts adds that extension only when
// STILLS=1), so it never ships.
import { PinStudio } from "@/components/site/PinStudio";
import { hasMotion } from "@/lib/demo/motions";
import { pinOrder } from "@/lib/pinContent";

export default function PinStudioPage() {
  return <PinStudio order={pinOrder(hasMotion)} />;
}
