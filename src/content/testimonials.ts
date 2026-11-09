// Quotes from lifters for the home page (the Gradelings rule, AGENTS.md "Public pages"). Only real quotes,
// given with permission, may be marked `sample: false`. A made-up quote must be `sample: true`: it is then
// shown only in development and on preview deploys, always labelled "Sample quote", and never on the live
// site (`visibleQuotes`), because a made-up review presented as real breaks the FTC's endorsement rules and
// Canada's Competition Act. Someone tied to the company (staff, founder, family) is `connected`, and `about`
// says so. Liftsmith has no users yet, so every quote here is a sample until beta testers send real ones.

export interface Quote {
  quote: string;
  /** First name and last initial, as the lifter agreed. */
  name: string;
  /** Such as "Home gym, 3 days a week". */
  about: string;
  sample: boolean;
  connected?: boolean;
}

export const QUOTES: Quote[] = [
  {
    quote: "I train in my garage with an odd mix of plates. It's the first app that only ever asks for weights I can actually load.",
    name: "Sample lifter",
    about: "Home gym, 3 days a week",
    sample: true,
  },
  {
    quote: "Tap, rest, tap. The timer is on my lock screen and the next set is already filled in, so my phone stays in my pocket.",
    name: "Sample lifter",
    about: "Commercial gym, 4 days a week",
    sample: true,
  },
  {
    quote: "On a bad-sleep day it suggested going easy and told me why. I pushed anyway, and it let me.",
    name: "Sample lifter",
    about: "Powerlifting, 2 years in",
    sample: true,
  },
];

/**
 * The quotes a build may show: real quotes always; sample quotes only in development, on Vercel preview
 * deploys, or with SHOW_SAMPLE_QUOTES=1, so a made-up quote can never reach the live site.
 */
export function visibleQuotes(env: Record<string, string | undefined> = process.env, quotes = QUOTES): Quote[] {
  if (env.VERCEL_ENV === "production") return quotes.filter((q) => !q.sample);
  const samplesOk = env.NODE_ENV !== "production" || env.VERCEL_ENV === "preview" || env.SHOW_SAMPLE_QUOTES === "1";
  return quotes.filter((q) => !q.sample || samplesOk);
}
