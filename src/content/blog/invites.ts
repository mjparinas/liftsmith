import type { Article } from "../articles";

// Blog: invite friends and earn Pro (Melvin, 2026-11-14, docs/decisions/growth.md "The invite loop"). Only what ships,
// and no other app named (seo.test.ts).
export const BLOG_INVITES: Article[] = [
  {
    slug: "invite-friends-earn-pro",
    kind: "blog",
    title: "Invite a friend to lift with you, and you both get a month of Pro",
    description:
      "Share your Liftsmith invite link from Friends, the end of a workout or a share card. When your friend finishes three workouts, you both get a month of Pro.",
    date: "2026-11-14",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "People who train with a friend show up more often. Someone expects you, and a missed session is harder to explain. So we made it easy to bring a friend along, and we pay you both for it: when a friend joins with your invite link and finishes **three workouts**, you each get **a month of Pro**.",
      },
      { h2: "Where to find your invite link" },
      {
        ul: [
          "**Friends › People › Invite a friend** sends your link through any app on your phone.",
          "**At the end of a workout**, open Share or save and tap Invite a friend to train with you.",
          "**On any share card** (a workout, a new best, a level or a badge), leave Add my invite link on and the link goes along with the picture.",
          "**Scan to follow** shows your link as a QR code for a friend standing next to you.",
        ],
      },
      { cta: "plan" },
      { h2: "What happens when a friend joins" },
      {
        p: "Your friend opens the link, installs Liftsmith if they need to, and signs in. You follow each other straight away, so you see each other's workouts in Friends without asking. On Android, the invite survives the trip through the store, so it still counts after the install.",
      },
      {
        p: "Under the invite button, **Your invites** lists everyone who joined with your link and how close each is, like 2 of 3 workouts done. Your friend sees the same from their side: whose link they joined with and how many workouts are left. When the third one lands, you both get a notification and Pro switches on for both of you on every device, the web app included.",
      },
      { h2: "The fine print, in plain words" },
      {
        ul: [
          "A workout counts once it has at least three logged sets, so the month goes to friends who really train.",
          "Only new accounts count, and only the first invite each friend accepts.",
          "Months stack end to end. You can earn up to 12 a year from invites; your friends always get theirs.",
          "There's nothing to buy and no store subscription: the month lives on your account.",
        ],
      },
      { h2: "Lifters under 18" },
      {
        p: "Younger lifters can still invite their friends, but Liftsmith doesn't offer them the reward or send them promotions. Invite links aren't added to their share cards either, because a card can end up anywhere and an invite connects whoever opens it.",
      },
      {
        tip: "Send the link before a session you already planned together. A friend who logs their first workout with you is most of the way to the third.",
      },
    ],
    faq: [
      ["Do I need Pro to invite someone?", "No. Inviting friends is free for everyone. The month of Pro is the reward, not the price."],
      [
        "My friend joined but nothing happened yet. Why?",
        "The month lands when they've finished three workouts with at least three logged sets each, after joining with your link. Your invites shows how many they have left.",
      ],
    ],
  },
];
