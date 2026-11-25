import type { Article } from "../articles";

// Blog: My team for school athletes, team chat and adding athletes from a team card (Melvin, 2026-11-25;
// docs/decisions/school-teams.md "My team"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_MY_TEAM: Article[] = [
  {
    slug: "my-team-school-athletes",
    kind: "blog",
    title: "My team: one home for every athlete on a school team",
    description:
      "Athletes on a school team now open My team: their team, their coach, the programs they were assigned, a team chat and a chat with the coach.",
    date: "2026-11-25",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "A high school athlete doesn't need a coach's tools. They need to know which team they're on, what their coach wants them to lift this week, and where to ask a question. So athletes on a school team now get **My team**, one screen with all of it, on a phone, a tablet or the web.",
      },
      { h2: "What's on My team" },
      {
        ul: [
          "The team, its school and the coach, with a button to message the coach.",
          "The programs the coach assigned, each with **Follow**, and once followed, the week they're on.",
          "**Team chat**, for the whole team and the coach, with a red count when something new is waiting.",
          "The team's week: who has trained, by first name, never a weight.",
        ],
      },
      {
        p: "The coach's screens (programs, athletes and setup) stay out of the way. An athlete sees only what they need to train.",
      },
      { cta: "coach" },
      { h2: "Add athletes from the team card" },
      {
        p: "If an athlete already coaches with you, open your team in **Coaching › Teams** and tap **Add** next to their name under Add athletes. They get a push and an invite on My team, say their age, and join with one tap. Change your mind before they answer and tap **Take back**.",
      },
      {
        tip: "Sent someone the team's link before they had an account? It now works after they sign in, so they land on the team instead of an empty roster.",
      },
      { h2: "A chat the coach is always in" },
      {
        p: "Team chat is for the team and its coach only. Words go through the same filter as the rest of the app (no links, no blocked words), the coach can delete any message, and each athlete can delete their own. While the chat is on screen it checks for new messages every 15 seconds, and it sends at most one push an hour per team, so nobody's phone buzzes all evening.",
      },
    ],
    faq: [
      [
        "Does it cost anything?",
        "No. School teams are free for high school coaches who confirm a school email address and for their athletes aged 13 to 18.",
      ],
      ["Does it work on the web?", "Yes. On a wide window My team is two columns, and on a phone or in the apps it's one."],
    ],
  },
];
