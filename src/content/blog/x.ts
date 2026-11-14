import type { Article } from "../articles";

// Blog, part twenty-four: reporting a profile and how the team reviews reports (Melvin, 2026-11-14,
// docs/decisions/moderation.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_X: Article[] = [
  {
    slug: "keeping-friends-safe",
    kind: "blog",
    title: "How we keep Friends safe",
    description:
      "Report a profile with one tap on a clear reason, and see what our team does with every report: warnings, suspensions and bans, explained.",
    date: "2026-11-14",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "Friends is where you follow people, cheer them on and see their workouts. It only works if it feels like a good gym floor: friendly, focused and free of people who spoil it. Today we're making reporting clearer and explaining what happens after you report someone.",
      },
      { h2: "Report a profile in two taps" },
      {
        p: "Open someone's page, tap **…**, then **Report profile**. Pick one reason: spam or a scam, bullying or harassment, hate, pretending to be someone else, an offensive name or handle, someone under 13, fake lifts or cheating, or something else. If you pick **Something else**, you can add a short note for our team. Posts and comments have their own list, and fake lifts can be reported on a post too.",
      },
      {
        p: "Reports are private. Nobody is told who reported them, and you can block or mute the person straight away from the same menu while we take a look.",
      },
      { cta: "plan" },
      { h2: "What our team does" },
      {
        p: "A person on our team reads every report about a profile. Depending on what they find, they can:",
      },
      {
        ul: [
          "**Warn** the lifter. They see a short note in Friends saying why, and that their profile may be suspended next time.",
          "**Suspend** the profile for a day, three days, a week or a month. Nobody sees their profile, posts or comments until it ends, and they can't post, comment or follow.",
          "**Ban** the profile from Friends. A ban follows their email address, so starting a new account doesn't get around it.",
          "**Reset** an offensive name or handle, or take someone off leaderboards when their lifts don't add up.",
          "**Dismiss** reports that turn out to be fine, so a post hidden by reports shows again.",
        ],
      },
      {
        p: "Anyone who is warned, suspended or banned is told why, and can tell us if they think we got it wrong through **Send feedback** in Settings.",
      },
      { h2: "Your training is never part of it" },
      {
        p: "Moderation only touches Friends. Even a banned lifter keeps every workout, setting and record they've logged, on Android, on iPhone and in the web app. We moderate the community, not your training.",
      },
      {
        tip: "Teen athletes on school teams already get extra protection: their profiles can't be public and aren't suggested to strangers. Reports involving anyone under 18 are marked for our team so they get extra care.",
      },
    ],
  },
];
