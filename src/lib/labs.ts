import { can } from "./entitlements";
import { flag, setLocalFlag } from "./flags";

// Labs (Melvin, 2026-11-10): experimental features that aren't ready for everyone, each behind its own
// feature flag that a Pro lifter switches on in Settings › Labs. Labs is Pro: without Pro no lab is on,
// whatever its flag says. A lab's switch sets the flag on this device (setLocalFlag), so the server can't
// turn it back off; the admin panel can still switch a lab on for everyone (still Pro only) to test it wider.
// When a lab is ready, its flag and its entry here go, and the feature ships to whoever it belongs to.

/** Flags that are labs: on or off switches. */
export type LabFlag = "labRepCount" | "repMotion" | "labBarSpeed" | "labHrRest" | "labTrainer" | "labFormCheck" | "labVoiceLog" | "labSpeedMax";

export interface Lab {
  flag: LabFlag;
  /** Catalogue keys: `lab.<key>.title` and `lab.<key>.body`. */
  key: "repCount" | "repMotion" | "barSpeed" | "hrRest" | "trainer" | "formCheck" | "voiceLog" | "speedMax";
  /** Another lab this one only works with. */
  needs?: LabFlag;
}

// One line per lab, so two changes adding one don't touch the same line.
export const LABS: readonly Lab[] = [
  { flag: "labRepCount", key: "repCount" },
  { flag: "repMotion", key: "repMotion", needs: "labRepCount" },
  { flag: "labBarSpeed", key: "barSpeed", needs: "labRepCount" },
  { flag: "labHrRest", key: "hrRest" },
  { flag: "labFormCheck", key: "formCheck", needs: "labRepCount" },
  { flag: "labTrainer", key: "trainer" },
  { flag: "labVoiceLog", key: "voiceLog" },
  { flag: "labSpeedMax", key: "speedMax", needs: "labBarSpeed" },
];

/** Whether a lab is on for this lifter: Pro, and its flag on (and the lab it needs, if any). */
export function labOn(name: LabFlag): boolean {
  if (!can("labs") || flag(name) !== true) return false;
  const lab = LABS.find((l) => l.flag === name);
  return !lab?.needs || labOn(lab.needs);
}

/** Switches a lab on or off on this device. */
export function setLab(name: LabFlag, on: boolean): void {
  setLocalFlag(name, on);
}
