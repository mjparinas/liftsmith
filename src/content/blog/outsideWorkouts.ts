import type { Article } from "../articles";

// Blog: workouts from other apps count in recovery and the plan (Melvin, 2026-11-19,
// docs/decisions/outside-workouts.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_OUTSIDE_WORKOUTS: Article[] = [
  {
    slug: "workouts-from-other-apps",
    kind: "blog",
    title: "Your runs, rides and matches now count in your recovery",
    description:
      "Turn on Count workouts from other apps, and the runs, rides, sports and classes in your phone's health app shape Liftsmith's recovery map and tomorrow's plan.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Lifting is rarely the only training in a week. A Saturday football match, a long ride or a spin class all tire the same legs you squat with. Until now, Liftsmith only knew about the workouts you logged in it, so a plan could ask for heavy squats the morning after a 90-minute match. Now it can see the rest.",
      },
      { h2: "How it works" },
      {
        p: "Your watch or running app already saves its workouts to Health Connect on Android or Apple Health on iPhone. Turn on Count workouts from other apps in Settings › Connected apps, allow Liftsmith to read workouts, and they come in each time you open the app.",
      },
      {
        ul: [
          "Each one tires the muscles it uses on the recovery map, more the longer it ran: a 45-minute run leaves your legs Ready, a long match leaves them Recovering.",
          "Tomorrow's adaptive plan reads that map, so it picks upper body or lighter leg work while your legs recover.",
          "A hard session in the last day shows as its own reason under today's call, so you know why the plan eased off.",
          "Yoga, Pilates and stretching come in but don't tire anything, and very short sessions are left out.",
        ],
      },
      { cta: "plan" },
      { h2: "What it doesn't do" },
      {
        p: "Outside workouts never count as Liftsmith workouts: no sets, personal bests, XP or weekly goal from them, because those are about your lifting. If a watch recorded your Liftsmith workout too, that copy is left out, so nothing counts twice. Your own Liftsmith workouts, which are saved to your health app, are never read back.",
      },
      {
        tip: "You can see what's being counted under the recovery map on Body: the last week's workouts from other apps, each with how long it ran.",
      },
      { h2: "Turning it off" },
      {
        p: "It's off until you turn it on. Turn it off again and every workout it brought in is removed, so your recovery goes back to your lifting alone.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. It's free, like the rest of the health app connection."],
      [
        "Does it work in the web app?",
        "The web app can't read your phone's health app, so the switch is on Android and iPhone. Once your phone has read them, the workouts sync to your account and the web app's recovery map counts them too.",
      ],
    ],
  },
];
