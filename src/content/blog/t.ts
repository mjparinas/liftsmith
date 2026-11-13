import type { Article } from "../articles";

// Blog, part twenty: more on gym pages (Melvin, 2026-11-13, docs/decisions/gyms.md "Round 3"). Amenities and prices,
// announcements to the gym's club, reporting broken equipment so the plan works around it, and trainers listed on
// the gyms where they coach. Only what ships, and no other app named (seo.test.ts).
export const BLOG_T: Article[] = [
  {
    slug: "gym-pages-trainers-prices-and-broken-equipment",
    kind: "blog",
    title: "Gym pages now show trainers, prices and what's broken",
    description:
      "Gym owners can list amenities and prices and post announcements, coaches can list the gyms they train at, and a broken machine drops out of your plan.",
    date: "2026-11-13",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Every gym in Liftsmith has its own page, in the app and on the web, with its address, hours, equipment and how many lifters train there. Owners can claim theirs, add a logo and photos and start a club. This week the pages get four more things, all aimed at the question you ask before a visit and the one you ask when you walk in: is it worth going, and can I do my workout today?",
      },
      { h2: "Amenities and prices" },
      {
        p: "An owner can now tick what the gym has besides equipment: showers, lockers, towels, parking, wheelchair access, a women's area, childcare, a sauna or pool, classes, personal training, lifting platforms, turf, 24/7 member access and a free first visit. They can also set what a day pass, a week pass and a membership cost. Both show on the gym's page and help people searching for a gym like it, which matters most when you're travelling and just need somewhere to train.",
      },
      { h2: "Announcements from the gym" },
      {
        p: "Holiday hours, new racks, a class that moved: an official gym's owner can post a short announcement from the gym's page in the app. It shows on the page for 60 days, and members of the gym's club get a notification. Members only hear from gyms whose club they joined, and the Friends notification switches still apply.",
      },
      { h2: "Report broken equipment" },
      {
        p: "Nothing stalls a session like walking up to the leg press and finding an out of order sign. Now, from your gym in Settings › Gyms and equipment, tap **Report a problem**, pick the equipment and say whether it's broken or missing. Your plan leaves it out straight away, and Today says so. Everyone else who trains at that gym gets the same the next time they open the app, so nobody plans a workout around a machine that isn't there.",
      },
      {
        ul: [
          "**The owner sees every report** on the gym's page in the app, with how many lifters reported it, and taps Fixed when it's back.",
          "**Anyone can say it works again**, so a fixed machine doesn't stay out of plans.",
          "**Reports run out after 14 days** without a new one, so an old report never sticks around by mistake.",
        ],
      },
      { cta: "plan" },
      { h2: "Trainers on gym pages" },
      {
        p: "Personal trainers and coaches who use Liftsmith's coaching can now list themselves on the pages of the gyms where they train clients, with a short line about themselves. Someone who finds them there taps the button with their name, which opens the usual screen where they see exactly what the coach will see before they agree to share their workouts. On an official gym, the owner approves trainers before they show. On a gym nobody has claimed yet, they show straight away, and the owner can remove them once they claim it.",
      },
      {
        p: "Training with a coach is free. Coaching clients is part of Pro. See [coaching in Liftsmith](/coaches/) for how it works.",
      },
    ],
    faq: [
      [
        "How do I report a broken machine at my gym?",
        "Open Settings › Gyms and equipment on the gym you added from Find gyms near you, tap Report a problem, pick the equipment and say whether it's broken or missing.",
      ],
      [
        "Who can post announcements on a gym's page?",
        "Only the owner of an official gym, one that has been claimed. Members of the gym's club get a notification.",
      ],
      [
        "How do I list myself as a trainer at a gym?",
        "In Coaching, under Gyms you train at, pick a gym you added from Find gyms near you. An official gym's owner approves you first.",
      ],
    ],
  },
];
