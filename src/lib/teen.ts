// Teen-safe defaults (school teams, Melvin 2026-11-13; docs/decisions/school-teams.md). For someone under 18 by the
// age they gave, body composition (the body fat box, the figure shaped like them, body data shared with a coach) is
// off until they turn it on in Body › Health. Their Friends profile can't be public and they aren't suggested to
// strangers (decided on the server, social.ts). Nobody under 13 sets the app up at all (Onboarding.tsx).
import type { Profile } from "./types";

/** The youngest age that can use Liftsmith (COPPA in the US; GDPR's lowest digital age of consent in the EU). */
export const MIN_AGE = 13;

/** Age this year from a birth year (may be a year more than today, which errs toward the teen-safe side). */
export const ageOf = (birthYear: number, now = Date.now()) => new Date(now).getFullYear() - birthYear;

/** Under 18 by the age on the profile. Unknown age counts as an adult, as everywhere else in the app. */
export const isTeen = (p: Pick<Profile, "birthYear">, now = Date.now()) => !!p.birthYear && ageOf(p.birthYear, now) < 18;

/** Whether body fat and the shaped figure are on: always for adults, and for teens only once they turn it on. */
export const bodyCompOn = (p: Pick<Profile, "birthYear" | "bodyComp">, now = Date.now()) => !isTeen(p, now) || p.bodyComp === true;

/** A typed age that's too young to set up the app. Empty or unknown isn't. */
export const tooYoung = (age: string | number) => {
  const n = Number(age);
  return Number.isFinite(n) && n > 0 && n < MIN_AGE;
};
