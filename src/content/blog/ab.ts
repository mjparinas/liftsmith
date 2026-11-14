import type { Article } from "../articles";

// Blog, part twenty-eight: a tagline and a home gym on Friends profiles (Melvin, 2026-11-14, docs/decisions/friends.md
// "Tagline and home gym"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_AB: Article[] = [
  {
    slug: "tagline-and-home-gym",
    kind: "blog",
    title: "Say a little more on your profile: a tagline and your home gym",
    description:
      "Friends profiles now have a short tagline under your name and an optional home gym, picked from the gym finder so friends know where you train.",
    date: "2026-11-14",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Your Friends profile has your name, your handle, your best lifts and your training calendar. Now it can say two more things: a short line about you, and the gym you call home.",
      },
      { h2: "A tagline" },
      {
        p: "Open Friends, tap the gear for Friends settings, and write a line under Tagline, up to 60 characters. Early mornings, heavy squats. Training for my first meet. Back after a long break. It shows under your name on your profile, and on your public page if you have one.",
      },
      {
        p: "Taglines follow the same community rules as names: no links and no words we don't allow. If someone's tagline crosses the line, report the profile and pick Offensive name, handle or tagline. Our team can clear it.",
      },
      { cta: "plan" },
      { h2: "Your home gym" },
      {
        p: "Under Home gym in the same settings, tap one of your gyms. You can pick any gym you added from Find gyms near you, because those are real gyms with their own page. A gym you set up by hand, like a garage gym, isn't on the list, and there's nowhere to type a place. Pick None to take it off.",
      },
      {
        ul: [
          "It shows to the people who can see your workouts: followers, or everyone if your profile is public.",
          "On your public page it links to the gym's own page, with its hours and equipment.",
          "On someone's profile in the app, tap their home gym to open that gym.",
          "It's never your location. It's the gym's name and city, nothing about where you are.",
        ],
      },
      { h2: "18 and over" },
      {
        p: "A home gym is for adults. Lifters under 18 don't see the option, and a home gym picked before doesn't show on their profile. Liftsmith goes by the age in your profile or your school team.",
      },
      {
        tip: "Picking the same home gym as your training partners makes it easy for people at your gym to recognize you, and the gym's own club and leaderboard are one tap away on its page.",
      },
    ],
    faq: [
      [
        "Can I type my city instead of a gym?",
        "No. A home gym is always a real gym from the gym finder, and there's no free-text place on a profile.",
      ],
      [
        "My gym isn't in the finder. What can I do?",
        "Add it from Add a gym in Gyms and equipment. Once our team checks it, add it to your gyms from Find gyms near you and pick it as your home gym.",
      ],
    ],
  },
];
