// Types for scripts/play-promotions.mjs, so src/lib/playPromotions.test.ts can check it.
export interface PromoEvent {
  id: string;
  season: string;
  kit: string;
  kind: "launch" | "finale";
  type: string;
  start: string;
  end: string;
  submitBy: string;
  deepLink: string;
  image: string;
  text: Record<string, { tagline: string; description: string }>;
}
export declare const ART: Record<string, { motif: string; launch: string; finale: string }>;
export declare function renderDoc(events: PromoEvent[]): string;
