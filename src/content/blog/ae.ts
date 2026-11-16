import type { Article } from "../articles";

// Blog, part thirty-one: progress photos that line up (Melvin, 2026-11-15, docs/decisions/progress-photos.md). Only what
// ships, and no other app named (seo.test.ts).
export const BLOG_AE: Article[] = [
  {
    slug: "progress-photos-that-line-up",
    kind: "blog",
    title: "Progress photos that line up, and compare any two dates",
    description:
      "Take progress photos with your last one as an outline to line up with, then compare any two dates with a slider or side by side. They stay on your phone.",
    date: "2026-11-15",
    tag: "Tracking",
    cta: "plan",
    body: [
      {
        p: "The mirror lies by being there every day. Change in your body is slow, so you only see it when you put two photos weeks apart next to each other. That only works if the two photos are taken the same way: same spot, same distance, same light. Liftsmith's progress photos now help with exactly that.",
      },
      { h2: "Line it up with last time" },
      {
        p: "Open Progress › Body and photos, pick front, side or back, and tap Add a photo. The camera opens with your last photo of that pose as a faint outline over the live picture. Step until your outline matches, and the new photo is framed like the old one. A 3 or 10 second timer gives you time to put the phone down and step back.",
      },
      {
        p: "You check the photo before it's kept, and you can still choose one that's already on your phone instead.",
      },
      { h2: "Compare any two dates" },
      {
        ul: [
          "Start with your first and latest photo, then move either side to an older or newer one with the arrows.",
          "Wipe between them with a slider, or put them side by side.",
          "Each photo shows what you weighed that week, and the line under them says how far apart they are and how much your weight changed.",
        ],
      },
      { cta: "plan" },
      { h2: "Every four weeks is enough" },
      {
        p: "Under the photos, Liftsmith says when your next one is due: four weeks after the last. Weekly photos mostly show water and lighting. Monthly ones show training. Weigh in the same morning and both stories line up.",
      },
      { h2: "Private by default" },
      {
        p: "Progress photos stay on your phone. They're never uploaded, never synced to your account and never seen by a coach. If you want them on a new phone, switch on Include progress photos in Settings › Saving and backup and keep the backup file somewhere private. Signing out offers the same backup before your photos are removed.",
      },
      {
        p: "Adults can share a pair as one side by side image through the phone's share sheet, with the dates and weights under it. Nothing is shared unless you tap it, and lifters under 18 don't get the option at all.",
      },
      {
        tip: "Same time of day, same clothes, relaxed and then flexed. Morning, before food, is the most repeatable.",
      },
    ],
    faq: [
      [
        "Are my progress photos uploaded anywhere?",
        "No. They stay in the app's storage on your phone. They only leave it in a backup file you make yourself, or an image you choose to share.",
      ],
      [
        "Does this work in the web app?",
        "Yes. The web app uses your computer's or phone's camera the same way, and the photos stay in that browser.",
      ],
      [
        "Why does the front camera look mirrored?",
        "The live picture is mirrored like a mirror, so moving left moves left. The saved photo isn't mirrored, the same as your phone's own camera, and the outline is drawn to match.",
      ],
    ],
  },
];
