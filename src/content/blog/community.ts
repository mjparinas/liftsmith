import type { Article } from "../articles";

// Blog: the Liftsmith community, where lifters suggest ideas, vote, report bugs and see the roadmap (Melvin, 2026-11-17;
// docs/decisions/community.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_COMMUNITY: Article[] = [
  {
    slug: "liftsmith-community",
    kind: "blog",
    title: "Vote for what Liftsmith builds next",
    description:
      "The Liftsmith community is open: suggest ideas, vote for the ones you want, report bugs and follow each one from under review to shipped.",
    date: "2026-11-17",
    tag: "Tracking",
    cta: "plan",
    body: [
      {
        p: "The best ideas for a training app come from people who train. So Liftsmith now has a community of its own, inside the app and on the website, where you can suggest what we build next, vote for the ideas you want and tell us when something breaks.",
      },
      { cta: "plan" },
      { h2: "Ideas and bugs, with votes" },
      {
        p: "Open Settings › Help › Community. Ideas and bugs each have their own list, sorted by votes or by what's new, and a search box. One tap on the arrow beside a post is your vote; tap again to take it back. Voting is how the team sees what matters most, so a popular idea moves up the list.",
      },
      {
        p: "Posting is quick. Give it a short title and, if you like, a few lines of detail. As you type the title, ideas that look the same show underneath, so you can vote for the one that's already there instead of posting it twice. When two posts turn out to be the same, the team merges them and the votes move across.",
      },
      { h2: "Bug reports with a screenshot" },
      {
        p: "A bug report can carry one screenshot. Only you and the Liftsmith team ever see it, because a picture of the app can show your name, your weights or your health numbers. Your phone and app version go with it, so the team can find the bug faster.",
      },
      { h2: "From under review to shipped" },
      {
        p: "Every post shows where it is: Under review, Planned, In progress, Shipped (Fixed, for a bug) or Won't do, with a note from the team when it moves. You follow a post when you post it, vote for it or comment, and you get a notification when its status changes. When an idea you voted for ships, you hear about it.",
      },
      {
        ul: [
          "Comment to add detail, and reply to someone with their @handle from Friends.",
          "A mention only reaches people who are already part of that post, never a stranger.",
          "Turn off updates on any post with one switch.",
          "The Roadmap tab shows what's in progress, what's planned and what just shipped.",
        ],
      },
      { h2: "On the website too" },
      {
        p: "Anyone can read the top ideas, the roadmap and the changelog at getliftsmith.com/community, and each idea has its own page. Voting, posting and commenting happen in the app, on Android, iPhone and the web app, with a free account.",
      },
      {
        p: "Posts and comments are public with your Friends name, or your first name and last initial. If you're under 18, your name never shows and what you write stays off the website. Everything goes through the same filter as Friends, and anyone can report a post or comment for the team to look at.",
      },
      {
        tip: "One idea per post works best. A short, specific title, like “Rest timer on my watch face”, gathers more votes than a list of wishes.",
      },
    ],
  },
];
