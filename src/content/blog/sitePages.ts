import type { Article } from "../articles";

// Blog: the new public pages (Melvin, 2026-11-15: "Do 1, 2, 3, 4, 5, 6, 7, 8", the traffic plan;
// docs/decisions/public-pages-and-seo.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_SITE_PAGES: Article[] = [
  {
    slug: "new-on-the-website-programs-comparisons-and-real-standards",
    kind: "blog",
    title: "New on the website: programs, comparisons and real strength standards",
    description:
      "Programs day by day, the best exercises for each muscle, lift comparisons, strength standards from real lifters and trainers by city, in six languages.",
    date: "2026-11-15",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "The Liftsmith website has always had free calculators and an exercise library. It now answers more of the questions people ask before they ever open a training app: what does this program look like, which exercise is better for my goal, how strong is strong, and who can coach me nearby. Everything comes from the same data the app plans with, and nothing needs an account.",
      },
      { h2: "Every program, day by day" },
      {
        p: "Each classic program now has a page of its own, starting with [Classic 5×5](/programs/classic-5x5/). It shows each training day with its exercises, sets and reps as the app would plan them on a first week, how many days a week it takes, which muscles it trains most, and who it suits. The [programs page](/programs/) lists them all, so you can compare them before you pick one.",
      },
      { cta: "plan" },
      { h2: "The best exercises for each muscle" },
      {
        p: "[Exercises by muscle](/muscles/) now ranks the best exercises for every muscle and explains each pick, then gives the best one for no equipment, dumbbells, a barbell or machines. Each page also says how many hard sets a week to start with for that muscle.",
      },
      { h2: "One lift against another" },
      {
        p: "Comparison pages put two exercises side by side, like the back squat and the front squat, with what each one trains, what it needs and when to pick one over the other. We only made comparisons where there's real advice to give, and every exercise page lists its closest alternatives for when the rack is taken or a joint complains. They all start from [exercise comparisons](/exercises/vs/).",
      },
      { h2: "Strength standards from real lifters" },
      {
        p: "Most strength standards online come from competition records or guesswork. Ours will come from lifters who use Liftsmith: for the squat, bench press, deadlift and overhead press, the 25th, 50th, 75th and 90th percentile of estimated one-rep maxes, by sex and body weight, rebuilt every morning from the past year.",
      },
      {
        ul: [
          "**Only groups, never people.** A body-weight group shows only once it has at least 30 lifters, and we keep only the percentiles and the count. Nobody's own numbers are stored or shown.",
          "**Adults only.** Under-18s never count, whatever their settings say.",
          "**Your choice.** Settings › Your data and privacy › Strength standards is one switch. In the EU, EEA, UK and Switzerland you count only if you turn it on.",
          "**No BMI.** Groups are by body weight, which is what matters for how much you lift.",
        ],
      },
      {
        p: "Until enough lifters count, those pages wait. Meanwhile the [strength standards calculator](/tools/strength-standards/) still tells you where your lifts stand.",
      },
      { h2: "Trainers, coaches and physios by city" },
      {
        p: "Trainers who list themselves at their gym in Liftsmith now also show in a directory by city on the website, next to the gym pages: their role, their bio, the gyms they train at and a link to start training with them. Physios get their own section. Only adults are listed, and only people who chose to list themselves.",
      },
      { h2: "In six languages" },
      {
        p: "The new pages, like the rest of the site, come in English, Spanish, French, German, Italian and Japanese, with exercise and program names as the app shows them in each language.",
      },
      {
        tip: "Every page is free to read and share. When you want a plan made for your gym and your week, open the app and it does the planning for you.",
      },
    ],
  },
];
