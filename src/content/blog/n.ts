import type { Article } from "../articles";

// Blog, part fourteen: what shipped on 2026-11-12. Coaching chat, shared body data and alerts (PR 385), gyms lifters can
// add, gym clubs and owners' results (PR 384), and a fuller import from other apps (PR 386). Other apps aren't named
// (seo.test.ts): the switch pages under /import/ name them. Only what ships (the gym map's Mapbox key was set on
// 2026-11-12).
export const BLOG_N: Article[] = [
  {
    slug: "new-coaching-chat-gym-clubs-and-imports",
    kind: "blog",
    title: "New in Liftsmith: coach chat, gym clubs and a fuller import",
    description:
      "Message your coach in the app, share your body data only if you choose, start a club for your gym, and bring routines and body stats from your old app.",
    date: "2026-11-12",
    tag: "Coaching",
    cta: "log",
    body: [
      {
        p: "Three things landed in Liftsmith this week, and they share one idea: the people and places around your training belong in the same app as your sets. Coaches and clients can now talk where the workouts are. Gyms can bring their members together. And moving over from another app brings more of your history with it.",
      },
      { h2: "Coaching: chat, body data and alerts" },
      {
        p: "Coaching already let a coach link clients with one invite link, read a report that leads with who needs attention, and assign routines. Now there's a conversation to go with it.",
      },
      {
        ul: [
          "**Chat with your coach or client.** Each coach and client pair has its own thread, opened from the client's report or from Your coach. New messages show as a count on Coaching and a card on Today, and the phone gets a notification.",
          "**Body data, only if the client says so.** A client can turn on Share body data for each coach. It's off until they do. The coach then sees weigh-ins, body fat, height and tape measurements from the last year, each with how it's changed, beside a 3D figure shaped from those numbers. Photos, health readings and injuries are never shared, and turning it off hides everything at once.",
          "**Alerts for the coach.** A notification when a client finishes a workout, and one when a client goes a week without training, so the check-in goes out before they drift. One switch turns them off.",
        ],
      },
      {
        p: "Coaching clients is part of Pro. Being someone's client is free. See [coaching in Liftsmith](/coaches/) and [how to track your clients' workouts](/blog/how-to-track-client-workouts/).",
      },
      { h2: "Shape the figure like me" },
      {
        p: "The same shaping now works for your own figure. On Body › Health, turn on **Shape the figure like me** and the 3D figure takes its build from your weight and height, carries body fat at the waist and hips, and sets each part you've measured with a tape. It's an approximate shape, not a scan, and it changes as your numbers do. It's off by default, and it tells you what to log first if a number is missing. If tape measurements are new to you, start with [how to take body measurements](/blog/how-to-take-body-measurements/).",
      },
      { cta: "measure" },
      { h2: "Gyms: add yours, start a club" },
      {
        ul: [
          "**Can't find your gym? Add it.** Give its name, street and city, and once we've checked it, it shows for everyone. Recreation and community centres with a gym inside now show up in the gym finder too, and we've added gyms across the major cities of Canada and the US.",
          "**A club for your gym.** An official gym's owner can start a club with one tap. Members join from the gym's page and get a weekly leaderboard, a crew goal and posts, with room for 1,000 people. Joining is always the lifter's choice.",
          "**Results for owners.** The owner's page now opens with the last 30 days: lifters in all, new lifters and poster scans. Then it gives one next step, like adding opening hours, setting the equipment or putting the poster up.",
          "**A map, a logo and photos.** Each gym's page now shows a street map with a pin, and owners can add their logo and up to six photos. They show on the gym's page in the app and on the web.",
        ],
      },
      {
        p: "Training at the same place as your friends? A club turns that into a [weekly goal you chase together](/blog/how-to-stay-consistent-with-workouts/).",
      },
      { h2: "Switching apps brings more with it" },
      {
        p: "Importing from another app's export file already carried every workout, set, warm-up and drop set. Now it brings more:",
      },
      {
        ul: [
          "**Another app's exports.** One more popular app's workout export is now read, along with the five already supported.",
          "**Cardio.** Runs, rides and rows come across as time and distance on the library's cardio exercises, instead of being skipped.",
          "**Routines.** A workout you did under the same name more than once becomes a routine, ready to start again.",
          "**Body stats.** Body weight, body fat and tape measurements come across from exports that carry them, or from a weigh-in log from a scale app.",
        ],
      },
      {
        p: "You'll find it in Settings, under Data. Each supported app has a page with the steps on its side and what comes across, starting with [how to switch](/import/strong/). It's free, and nothing on the other side is changed.",
      },
      { cta: "log" },
      { h2: "Everything else" },
      {
        p: "All of it is on Android, iPhone and the web app, in all six of the app's languages. Coaching notifications are on the phones; the web app shows new messages when it's open. The [features page](/features/) lists every feature, and [what's new](/whats-new/) has the full list of changes.",
      },
    ],
    faq: [
      [
        "Does my coach see my body weight automatically?",
        "No. Body data stays private until you turn on Share body data for that coach, and you can turn it off at any time.",
      ],
      ["Do I need Pro to message my coach?", "No. Being a client is free, chat included. Coaching your own clients is part of Pro."],
      [
        "Will importing change anything in my old app?",
        "No. You export a file from the other app and Liftsmith reads it. Your old app keeps everything as it was.",
      ],
    ],
  },
];
