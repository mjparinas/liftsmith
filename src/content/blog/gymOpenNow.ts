import type { Article } from "../articles";

// Blog: open now in the gym finder (Melvin, 2026-11-19, docs/decisions/gyms.md "Open now"). Only what ships, and no
// other app named (seo.test.ts).
export const BLOG_GYM_OPEN_NOW: Article[] = [
  {
    slug: "gyms-open-now",
    kind: "blog",
    title: "Find a gym that's open right now",
    description:
      "The gym finder now says whether each gym near you is open, when it closes or opens next, and can show only the ones open right now.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Travelling, working late or just fancying a session at an odd hour, the first question is simple: which gym can I walk into now? Until today the gym finder showed how far away each gym was and its full week of hours, and you did the maths. Now it does it for you.",
      },
      { h2: "What you see" },
      {
        ul: [
          "Open now, with the time it closes, in green.",
          "Closes soon, in amber, when there's less than an hour left.",
          "Closed, with when it opens next: later today, tomorrow, or the day of the week.",
          "Open now · 24 hours for gyms that never close.",
        ],
      },
      {
        p: "The words always say it, so you never have to rely on the colour. It shows in Find gyms near you in the app on Android, iPhone and the web, on a gym's page in the app, and on the map at the top of the website's gyms page.",
      },
      { cta: "plan" },
      { h2: "One tap for the ones that are open" },
      {
        p: "Tap Open now above the list and the gyms that are closed drop out, from the list and the map. Tap it again to see them all.",
      },
      { h2: "Where the hours come from" },
      {
        p: "Each gym's opening hours come from the gym's own page: what its owner set, or what's listed for it on the open map. Gyms without hours, or with hours written in a way we can't read for sure, simply show no line, so we never guess.",
      },
      {
        p: "We work it out on your own clock, and only for gyms near you, because we don't know the time zone of a gym hundreds of kilometres away. Further off, the gym's page still shows its full week.",
      },
      {
        tip: "Holidays can change a gym's hours. If it's a public holiday, check the gym's own website or give them a call before you head out.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. Open now is free in the gym finder for everyone."],
      [
        "A gym's hours are wrong. What can I do?",
        "Use Report a problem on its page, or, if it's your gym, claim the page and set the hours yourself.",
      ],
    ],
  },
];
