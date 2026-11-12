// The public list of Bluetooth scales for the smart scale lab (/works-with/scales/, linked from the lab's
// button in the app). The lab (src/lib/scale.ts) subscribes to the standard Weight Measurement (0x2A9D) and Body
// Composition Measurement (0x2A9C) characteristics and nothing else: it doesn't register a user on the scale
// through the User Data Service (0x181C). So a scale belongs in `works` only when it sends readings without that
// step. The models come from the open-source openScale project's handlers (checked 2026-11-12), which show which
// scales use the standard services and which also need a user registered; none has been tried with Liftsmith
// yet, so the page says "should work". Move a model to `tested` once someone weighs in with it.

export interface ScaleModel {
  brand: string;
  models: string;
  /** What it sends us. */
  reads: string;
}

/** Checked on a real scale with Liftsmith. Empty until someone tries one. */
export const TESTED_SCALES: ScaleModel[] = [];

/** Share the standard weight service with no user setup on the scale, so they should work. */
export const STANDARD_SCALES: ScaleModel[] = [
  { brand: "A&D Medical", models: "UC-352BLE", reads: "Weight" },
  { brand: "Samsung", models: "Smart Scale (GP-BELAD001BP0)", reads: "Weight" },
  { brand: "Redmond", models: "SkyBalance RS-73S, RS-78S, RS-744S, RS-745S, RS-762S, RS-773S", reads: "Weight" },
];

/** Use the standard services but send readings only after an app registers a user on the scale. Not yet. */
export const NEEDS_USER_SCALES: ScaleModel[] = [
  { brand: "Beurer", models: "BF105, BF450, BF500, BF600, BF720, BF850, BF915, BF950, BF1000", reads: "Weight and body fat" },
  { brand: "Sanitas", models: "SBF72, SBF73, SBF76, SBF77", reads: "Weight and body fat" },
  { brand: "Renpho", models: "ES-WBE28", reads: "Weight and body fat" },
];

/** Brands whose scales talk only to their own app: they reach Liftsmith through the phone's health store. */
export const OWN_APP_BRANDS = ["Renpho (most models)", "Eufy", "Xiaomi", "Wyze", "Garmin", "Fitbit", "Hume Health (Body Pod)", "Withings"];

export const SCALES_UPDATED = "2026-11-12";
