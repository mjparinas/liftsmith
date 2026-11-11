// Build-only page for scripts/og-images.mjs: it draws the 3D figure for any exercise and hands the script the
// list of preview cards. The `.stills.tsx` extension keeps it out of every normal build (next.config.ts adds
// that extension only when STILLS=1), so it never ships.
import { StillsHarness } from "@/components/site/StillsHarness";
import { ogCards } from "@/lib/ogImages";

export default function Stills() {
  return <StillsHarness cards={ogCards()} />;
}
