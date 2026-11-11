"use client";

import { useEffect } from "react";

import { figureStill } from "@/components/demo/still";
import type { BodyKey } from "@/lib/demo/rig";
import type { OgCard } from "@/lib/ogImages";

declare global {
  interface Window {
    __ogCards?: OgCard[];
    __still?: (exerciseId: string, body: BodyKey, size: number) => Promise<string | null>;
  }
}

/** Used only by the build-only /stills/ page (scripts/og-images.mjs). */
export function StillsHarness({ cards }: { cards: OgCard[] }) {
  useEffect(() => {
    window.__ogCards = cards;
    window.__still = async (exerciseId, body, size) => {
      const c = await figureStill({ exerciseId, body, width: size, height: size });
      return c ? c.toDataURL("image/png") : null;
    };
  }, [cards]);
  return <p>Stills harness</p>;
}
