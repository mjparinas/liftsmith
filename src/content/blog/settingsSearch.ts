import type { Article } from "../articles";

// Blog: search settings (Melvin, 2026-11-19, docs/decisions/settings-screen.md "Search"). Only what ships, and no
// other app named (seo.test.ts).
export const BLOG_SETTINGS_SEARCH: Article[] = [
  {
    slug: "search-settings",
    kind: "blog",
    title: "Find any setting in a few letters",
    description: "Settings now has a search box. Type a word and it lists every matching setting and takes you straight to it.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Liftsmith has grown a lot of switches: rest timer alerts, one-handed controls, warm-up sets, automatic supersets, text size, the week's first day and plenty more. They're grouped into pages so Settings stays calm, but when you know what you want and not where it lives, hunting through pages is a chore. Now there's a search box at the top of Settings.",
      },
      { h2: "How it works" },
      {
        ul: [
          'Type part of a word: "vibr" finds Vibration, "rest" finds every rest timer setting.',
          "Each result says where it lives, such as Workout or Look and feel.",
          "Tap one and its page opens with that setting in the middle of the screen, ringed for a moment so your eye lands on it.",
          "It searches the words the app shows you, in your language, and English words work too.",
        ],
      },
      { cta: "plan" },
      { h2: "The choices count too" },
      {
        p: 'You don\'t need a setting\'s exact name. Searching for "dark" finds Appearance, and "pounds" finds Units, because those words are among the setting\'s own choices.',
      },
      {
        tip: 'Training on one hand while the other holds a dumbbell? Search "one-handed" and move the weight and rep buttons next to Log set.',
      },
    ],
    faq: [
      ["Is it on every device?", "Yes. It's on Android, iPhone and the web app, in all ten languages."],
      ["Does it search Labs?", "Yes. Each experiment shows by name; Labs is part of Pro."],
    ],
  },
];
