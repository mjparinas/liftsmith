import type { Article } from "../articles";

// Blog: club chat and crew sessions (Melvin, 2026-11-17; docs/decisions/friends.md "Club chat and crew sessions").
// Only what ships, and no other app named (seo.test.ts).
export const BLOG_CLUB_CHAT: Article[] = [
  {
    slug: "club-chat-and-crew-sessions",
    kind: "blog",
    title: "Club chat and crew sessions: train together, not just side by side",
    description:
      "Your club now has a chat and a way to plan sessions: pick a day and a time, see who's in, get a reminder an hour before, and see who trained.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "People who train with a friend show up more often. Not because a friend makes the sets easier, but because someone is expecting them. Clubs already showed your crew's weekly board and a shared goal. Now they have the two things that turn a board into plans: a chat and crew sessions.",
      },
      { cta: "plan" },
      { h2: "A chat for the club" },
      {
        p: "Open a club on Friends › Clubs and tap Chat. Everyone in the club can write there, between workouts or on the way to the gym:",
      },
      {
        ul: [
          "New messages show up while the chat is open, and the club list shows how many you haven't read.",
          "A push tells you when the club is talking, at most once an hour per club, and each club has its own switch.",
          "Anything that isn't right can be reported in two taps. The writer and the person who started the club can delete a message.",
          "Links aren't allowed, and the same word filter as the rest of Friends applies.",
        ],
      },
      { h2: "Plan a crew session" },
      {
        p: "Tap Plan a session, give it a name like Leg day or Saturday deadlifts, pick a day from the chips and set the time with − and +. No typing a time, no calendar to scroll. Add a place if you like. In a gym's own club it fills in the gym's name.",
      },
      {
        p: "Everyone in the club sees it at the top of the club, with who's in. One tap on I'm in adds you, and everyone who's in gets a reminder an hour before.",
      },
      { h2: "Who trained" },
      {
        p: "Post your workout to Friends around the session's time and the session marks you as trained, with a tick by your name. Friends who said they were in are tagged on the post as training partners, so the session ends up in everyone's history, not just a chat message.",
      },
      { h2: "Safe by default" },
      {
        p: "Club chat and crew sessions are for adults. Lifters under 18 keep the club's board and goal, without the chat or sessions. Joining a club still never shows anyone your posts: the chat is the club's, and your workouts keep their own audience. It works the same on Android, iPhone and the web app.",
      },
      {
        tip: "Plan the next session before you leave the gym. A time everyone has already said yes to is the easiest workout to show up for.",
      },
    ],
  },
];
