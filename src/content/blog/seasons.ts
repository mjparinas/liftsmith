import type { Article } from "../articles";

// Blog: training seasons (Melvin, 2026-11-17, docs/decisions/seasons.md). Only what ships, and no other app or game named (seo.test.ts).
export const BLOG_SEASONS: Article[] = [
  {
    slug: "training-seasons",
    kind: "blog",
    title: "Training seasons: ten weeks, 20 tiers, rewards you can only earn once",
    description:
      "Ten-week training seasons: climb 20 tiers by meeting your own weekly goal and earn season-only badges, an avatar, an accent and a theme with its app icon.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Starting Monday 23 November, Liftsmith runs training seasons. Each one lasts about ten weeks and has its own track of 20 tiers, its own look and its own rewards. Season 1 is called Ember, with a warm red and gold theme for the winter.",
      },
      { h2: "You climb by meeting your own goal" },
      {
        p: "Season points come from training toward the weekly goal you set, not from how much you train. Each week, your goal days share 600 points between them, meeting the goal adds a 200 point bonus, and each weekly quest you finish adds 50. Three season challenges are worth 500 each.",
      },
      {
        ul: [
          "Days past your goal earn nothing, so someone training twice a week climbs exactly as fast as someone training five times.",
          "Rest days never cost you anything, and there's no reason to squeeze in an extra session when you're sore.",
          "Missed a week? The next week you meet your goal pays the bonus twice, so you can catch up.",
          "The last week of the season is the finale, and every point counts double.",
        ],
      },
      {
        p: "Meeting your goal about eight weeks out of ten reaches tier 20. Serious lifters who keep going past it earn prestige stars, still capped by the same weekly goal.",
      },
      { cta: "plan" },
      { h2: "Rewards that belong to one season" },
      {
        p: "Tiers bring rewards that only exist in that season: four season badges from bronze to platinum, an avatar for Friends, an accent colour, and a colour theme with a matching app icon on Android and iPhone. You can only earn them while the season runs, and they're yours to keep after it ends.",
      },
      {
        p: "Every tier and its rewards are free. With Pro at any point during the season, three tiers also bring a bonus reward: another avatar, another accent, and a gold version of the theme and icon.",
      },
      { h2: "Challenges, a rare drop and a recap" },
      {
        ul: [
          "Season challenges: meet your goal in six weeks, set five new bests, and try eight exercises you've never done.",
          "A rare drop: every new best during the season has a 1 in 6 chance to drop a set of season-only plates.",
          "A recap card when the season ends, with your tier, workouts, new bests and best week, ready to share.",
        ],
      },
      { h2: "A fresh start every season" },
      {
        p: "Each new season starts back at tier 0 with a new track and new rewards. Your levels, badges and streaks carry on as before. Seasons show as one row on Today's This week card and as a card on Awards. If you'd rather not see them, turn off Training seasons in Settings › Look and feel; your training still counts in the background.",
      },
    ],
    faq: [
      [
        "Does training more days earn more season points?",
        "No. Points come from meeting your own weekly goal, and days past it earn nothing, so rest is never wasted and nobody is pushed to overtrain.",
      ],
      [
        "Do I keep season rewards after the season ends?",
        "Yes. Badges, avatars, accents, themes and app icons earned in a season stay yours. Rewards you didn't reach can't be earned once the season is over.",
      ],
      [
        "Does it work on the web app?",
        "Yes. The track, badges, avatar, accent and theme are the same on the web. Only the app icon needs the Android or iPhone app.",
      ],
    ],
  },
];
