import type { Article } from "../articles";

// Blog: common form mistakes beside the 3D figures (Melvin, 2026-11-15; docs/decisions/form-cues.md). Only what
// ships, and no other app named (seo.test.ts).
export const BLOG_FORM_CUES: Article[] = [
  {
    slug: "common-form-mistakes-and-how-to-fix-them",
    kind: "blog",
    title: "Common form mistakes, and the fix, on every exercise",
    description:
      "Every exercise and stretch in Liftsmith now lists its two or three most common mistakes, each with a fix and a short reason, and the rest timer shows one before your next set.",
    date: "2026-11-16",
    tag: "Exercises",
    cta: "plan",
    body: [
      {
        p: "A 3D figure shows what a good rep looks like. What it can't tell you is what a bad one usually looks like, and that's often the more useful thing to know mid-workout. Knees drifting in on a squat, a back rounding on a deadlift, a swing turning into a squat: most lifters make the same handful of mistakes, and each one has a simple fix.",
      },
      { cta: "plan" },
      { h2: "Two or three mistakes for every move" },
      {
        p: "All 1,000 exercises and 48 stretches now come with their most common mistakes. Each one says what it looks like, what to do instead and why it matters, in a line each. For example:",
      },
      {
        ul: [
          "Knees caving in. Push your knees out in line with your toes. Keeps the strain off the inside of the knee and your hips working.",
          "Weight drifting away from your legs. Keep it brushing your legs the whole way. Every bit of distance makes the load heavier on your back.",
          "Swinging the weight up. Go lighter, keep your torso still and lift with the target muscle. Momentum takes the work off the muscle.",
        ],
      },
      {
        p: "They sit under the setup and cues, next to the 3D figure: in the How to sheet during a workout, on each exercise's page in the library, and on every stretch. The same mistake reads the same way on every move it applies to, so once you've learned a fix it sticks.",
      },
      { h2: "A form check while you rest" },
      {
        p: "Between sets, the rest timer now shows one mistake to watch for on your next set, with its fix. After the next set it shows a different one, so over three sets you've seen them all without opening anything. It never shows during a set. If you'd rather not see it, turn off Form checks while resting in Settings › Workout.",
      },
      { h2: "Works offline" },
      {
        p: "There's no video to load: the mistakes are part of the app, in all six of its languages, so they're there in a basement gym with no signal. They're free for everyone, on Android, iPhone and the web app.",
      },
      {
        tip: "If something hurts, stop. A form fix is for a lift that feels wrong, not for pain that's telling you something.",
      },
    ],
  },
];
