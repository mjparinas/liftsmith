import type { Article } from "../articles";

// Blog, physio support (Melvin, 2026-11-13: "add physios support", and blog posts for it). One post for physios and rehab
// clinicians, one for lifters working with one. Neither gives medical advice or says what's safe for an injury: they
// say what the app shows and leave the call to the clinician. Other apps aren't named (seo.test.ts).
export const BLOG_P: Article[] = [
  {
    slug: "track-rehab-exercises-between-physio-visits",
    kind: "blog",
    title: "How physios can see home exercise adherence and pain between visits",
    description:
      "Most rehab happens at home, out of sight. How to set a home program, see how often it's done and follow pain ratings exercise by exercise.",
    date: "2026-11-13",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "A home exercise program is only as good as how often it's done, and most of it happens between appointments, where you can't see it. By the next visit you hear \"I did it most days\" and a pain score from memory. A shared log gives you the real picture before the client walks in.",
      },
      { h2: "What's worth seeing between visits" },
      {
        ul: [
          "**How often they did it.** Sessions in the last two weeks against the number you asked for. Low adherence explains a lot of slow progress.",
          "**Pain, exercise by exercise.** A 0 to 10 rating after the sets of each exercise shows which movement is the problem, not just whether the day was bad.",
          "**The trend, not one number.** Pain rising across a week is worth a call; one high rating after a long day may not be.",
          "**New injuries.** If a client logs a new sore spot, you hear about it before the next session, not at it.",
        ],
      },
      { h2: "Keep the program small enough to keep" },
      {
        p: "Four or five exercises, two or three sets each, done a few times a week will usually be kept up better than a long list. Bodyweight work that needs only a wall or the floor removes another excuse. You know what each client needs; the job of the app is to make that plan easy to follow and easy to check.",
      },
      { exercises: ["wall-sit", "glute-bridge", "bird-dog", "clamshell", "bw-calf-raise"] },
      { cta: "coach" },
      { h2: "In Liftsmith" },
      {
        p: "Pick Physio under Settings › Coaching. Each client's report then leads with the pain ratings and injuries they choose to share, with the latest rating on each exercise and the trend across their last ratings. Assign one of the gentle rehab starting points (knee, lower back, shoulder, ankle, hip, neck and upper back) or any routine you've built, with how many times a week. The report shows how often they keep to it, and you get a notification when a rating of 5 or more comes in. Clients use the app free. See [coaching in Liftsmith](/coaches/).",
      },
      {
        p: "Liftsmith shows what your client logs. It doesn't diagnose or treat anything, and the rehab starting points are there to adjust, not a treatment plan: your assessment decides what's right for each person.",
      },
    ],
    faq: [
      [
        "Do clients have to share pain ratings?",
        "No. Sharing pain and injuries is a separate switch for each coach, off until the client turns it on. They can turn it off at any time.",
      ],
      [
        "Does the app change a rehab program when a client logs an injury?",
        "Not one you assign as a rehab program. Those keep every exercise as written and ask about pain between sets. The client's other workouts still skip or lighten the exercises that load a sore spot.",
      ],
    ],
  },
  {
    slug: "doing-your-physio-exercises-at-home",
    kind: "blog",
    title: "How to keep up your physio exercises at home",
    description:
      "Home exercises from a physio work best when they're done and when your physio hears how they felt. Simple ways to keep up with them and report pain.",
    date: "2026-11-13",
    tag: "Coaching",
    cta: "injury",
    body: [
      {
        p: "Your physio gave you a handful of exercises to do at home, a few times a week. Then life happens: a busy week, a day the knee feels fine, a day it doesn't. Keeping up with the plan, and telling your physio honestly how it went, is a big part of what you can control.",
      },
      { h2: "Make it easy to do" },
      {
        ul: [
          "**Pick the days now.** Put the sessions on the days and times you'll really do them, the same way you'd book an appointment.",
          "**Keep it where you train.** If your exercises sit in the same app as the rest of your training, they're one tap away instead of on a sheet of paper.",
          "**Log as you go.** Tick off each set as you do it. It's faster than remembering later, and it's what your physio will look at.",
        ],
      },
      { h2: "Rate pain the same way each time" },
      {
        p: 'A 0 to 10 scale works when you use it consistently: 0 is no pain, 10 is the worst you can imagine. Rate right after the sets of each exercise, not at the end of the day, so the rating belongs to the movement. A few numbers over a couple of weeks tell your physio far more than "it\'s been okay".',
      },
      { cta: "injury" },
      { h2: "Know when to stop" },
      {
        p: "Stop and get in touch with your physio if you feel sharp pain, pain that builds through the session, swelling, numbness or tingling, or a joint that gives way. Don't push through those to finish a set. See [training around an injury](/blog/training-around-an-injury/).",
      },
      { h2: "In Liftsmith" },
      {
        p: "Enter your physio's code under Settings › Coaching, then turn on Share pain and injuries for them if you want them to see your ratings. It's off until you do. A rehab program they send keeps every exercise as written even with an injury logged, and asks how the area feels after each exercise's sets. Being a client is free. Liftsmith isn't a medical app and doesn't give medical advice; your physio does.",
      },
    ],
    faq: [
      [
        "What does my physio see?",
        "Your workouts, and, only if you turn it on, the areas you logged as hurting, when, and your pain ratings with the exercise each was rated on. Never your heart rate, health readings, notes or photos.",
      ],
      [
        "What if I miss a session?",
        "Do the next one as planned rather than doubling up, and tell your physio if missing sessions is becoming a pattern. A shorter plan you keep up usually beats a longer one you don't.",
      ],
    ],
  },
];
