import type { Article } from "../articles";

// Blog: team sessions for school coaches (Melvin, 2026-11-19, gap item 5; docs/decisions/school-teams.md "Team
// sessions"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_TEAM_SESSION: Article[] = [
  {
    slug: "team-session-one-tablet",
    kind: "blog",
    title: "Run a whole team's lift from one tablet",
    description:
      "School coaches can run one workout for the whole team on one tablet: athletes tap their name to log sets, and a board shows who's left.",
    date: "2026-11-19",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "A weight room with thirty athletes, six racks and one coach doesn't run on everyone's phone. Phones stay in lockers, half the team forgot theirs, and the reception in a basement gym is whatever it is. So Liftsmith now has team sessions: one tablet on the wall, one workout for the whole team, and every athlete's sets still end up in their own training history.",
      },
      { h2: "How a session runs" },
      {
        ol: [
          "On the tablet, open **Coaching › Teams** and tap **Start team session** on the team.",
          "Pick one of your routines. Each exercise keeps its sets and aims for the bottom of its rep range, so a team of mixed levels can all hit it. Change the reps right there if you want.",
          "Hand the tablet round. An athlete taps their first name, checks the weight and reps, and taps **Log set**. The roster comes straight back for the next one, with **Undo** for a slip.",
          "When you're done, tap **End session**. Each athlete's sets are saved to their own account as a workout, and they see it in their history the next time they open the app.",
        ],
      },
      { cta: "coach" },
      { h2: "The weight starts where they left off" },
      {
        p: "Every set starts from that athlete's last set of the same exercise today, or where they finished last session, and the line under the weight says which. Someone trying an exercise for the first time is told to start light and add weight. Nobody has to remember last week's number, and nobody has to shout it across the room.",
      },
      { h2: "A board that tells you who to call up" },
      {
        p: "The **Board** tab leads with what to do next: how many athletes haven't logged a set yet, then everyone by sets done with the exercise they're on. It never shows a weight, so nobody gets compared on the bar. On your phone, the team's card in Coaching shows a **Live board** that refreshes every 15 seconds while you're looking at it.",
      },
      {
        tip: "No reception in the weight room? It doesn't matter. Every set is kept on the tablet and goes up when it finds a connection, even after you've ended the session.",
      },
      { h2: "Built for teenagers" },
      {
        ul: [
          "First names only on the tablet and the board.",
          "Only athletes who joined your team with its code show up, and only you, the team's verified coach, can run a session for it.",
          "Each workout lands in the athlete's own account, where they can see it, keep training from it, or delete it.",
        ],
      },
    ],
    faq: [
      [
        "Does it cost anything?",
        "No. Team sessions are part of school teams, which are free for high school coaches who confirm a school email address and for their athletes aged 13 to 18.",
      ],
      [
        "Does each athlete need the app?",
        "They need to have joined the team, which takes the app or the web app once. After that, the session runs on your tablet, and their workouts reach their own account on their own.",
      ],
      ["Does it work on an iPad or an Android tablet?", "Yes, both, and in the web app on any tablet or laptop."],
    ],
  },
];
