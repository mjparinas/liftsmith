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
  {
    slug: "training-seasons-2027",
    kind: "blog",
    title: "Training seasons in 2027: six seasons, back to back",
    description:
      "The 2027 training season calendar: Tempest, Bloom, Solstice, Maple and Obsidian follow Ember, each with its own look, rewards and three challenges.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Training seasons now run back to back all the way through 2027. Ember opens on 23 November 2026, and five more seasons follow it, each ten weeks long. When one ends, the next starts the following Monday, so there's always a season to climb.",
      },
      { h2: "The calendar" },
      {
        ul: [
          "Season 1, Ember: 23 November 2026 to 31 January 2027. Warm red and gold for the winter.",
          "Season 2, Tempest: 1 February to 11 April 2027. Storm indigo, with lightning silver for Pro.",
          "Season 3, Bloom: 12 April to 20 June 2027. Blossom pink, with meadow green for Pro.",
          "Season 4, Solstice: 21 June to 29 August 2027. Midsummer yellow, with dusk coral for Pro.",
          "Season 5, Maple: 30 August to 7 November 2027. Maple-leaf red, with copper for Pro.",
          "Season 6, Obsidian: 8 November 2027 to 16 January 2028. Volcanic-glass violet, with ice for Pro, running over New Year.",
        ],
      },
      { h2: "Every season looks different" },
      {
        p: "Each season has its own reward set, and none is ever used twice: a colour theme with a matching app icon on Android and iPhone, an avatar for Friends, an accent colour, season badges from bronze to platinum, and a rare set of plates that a new best can drop. Pro adds a second avatar, a second accent and a second theme and icon in each season. Rewards you earn are yours to keep after the season ends.",
      },
      { cta: "plan" },
      { h2: "Every season asks something different" },
      {
        p: "Each season brings three challenges of its own, worth 500 points each. None of them asks for more days than your weekly goal, so the rule that two days a week climbs as fast as five still holds.",
      },
      {
        ul: [
          "Ember: meet your goal in six weeks, set five new bests and try eight exercises you've never done.",
          "Tempest: meet your goal four weeks in a row, set new bests on four different exercises and finish eight weekly quests.",
          "Bloom: try ten new exercises, do six stretch routines of ten minutes or more on their own, and meet your goal in the first and the last week.",
          "Solstice: meet your goal in seven weeks, three weeks in a row, and set new bests on five different exercises.",
          "Maple: meet your goal in the first and the last week, set four new bests and finish twelve weekly quests.",
          "Obsidian: meet your goal five weeks in a row, do five stretch routines on their own and try six new exercises.",
        ],
      },
      {
        p: "Seasons appear once you've finished five workouts, and you can turn them off in Settings › Look and feel at any time. Your training still counts in the background.",
      },
    ],
    faq: [
      [
        "Do the seasons start on their own?",
        "Yes. Each season starts on its first Monday and ends ten weeks later, and the next one starts the following Monday.",
      ],
      [
        "Can I still earn Ember rewards after Ember ends?",
        "No. Each season's rewards can only be earned while it runs, and every reward you earned stays yours.",
      ],
    ],
  },
];
