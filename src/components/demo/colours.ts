// Hologram colours (from the approved prototype). The demo is always on a dark stage.
export const DEMO_COLOURS = {
  holo: "#5cc8ff",
  ember: "#ff5b3a",
  bone: "#f3e6d3",
  steel: "#d4e0ea",
  /** The live heart rate and its trend line: the dark theme's `--color-heart` (a test keeps them in step). */
  heart: "#f0605d",
} as const;

/**
 * Recovery band colours on the dark stage (the recovery map in 3D). They are the dark theme's
 * `--band-*-std` and `--band-*-cvd` tokens from globals.css, kept in step by a test, and used whatever
 * the app's Appearance because the stage is always dark.
 */
export const STAGE_BANDS = {
  standard: { fresh: "#34d399", ready: "#a3d977", recovering: "#f5b544", fatigued: "#f0605d" },
  cvd: { fresh: "#2f7dff", ready: "#8fd0ff", recovering: "#ffb000", fatigued: "#e8467c" },
} as const;
