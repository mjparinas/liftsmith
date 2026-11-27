"use client";

import { useEffect } from "react";

import { figureStill } from "@/components/demo/still";
import type { BodyKey } from "@/lib/demo/rig";
import type { OgCard } from "@/lib/ogImages";

declare global {
  interface Window {
    __ogCards?: OgCard[];
    /** Every lift a guide or blog post shows as a figure (articleImages.ts). */
    __articleFigures?: string[];
    __still?: (exerciseId: string, body: BodyKey, size: number) => Promise<string | null>;
  }
}

/** Used only by the build-only /stills/ page (scripts/og-images.mjs). */
export function StillsHarness({ cards, figures }: { cards: OgCard[]; figures: string[] }) {
  useEffect(() => {
    window.__ogCards = cards;
    window.__articleFigures = figures;
    window.__still = async (exerciseId, body, size) => {
      const c = await figureStill({ exerciseId, body, width: size, height: size });
      return c ? c.toDataURL("image/png") : null;
    };
  }, [cards, figures]);
  return <p>Stills harness</p>;
}
