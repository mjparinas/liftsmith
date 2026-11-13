import type { Article } from "../articles";

// Blog, part twenty-two: staff accounts and a starter program for gyms (Melvin, 2026-11-13, docs/decisions/gyms.md
// "Staff and the starter program"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_V: Article[] = [
  {
    slug: "gym-staff-accounts-and-a-starter-program",
    kind: "blog",
    title: "Gyms can now add their staff and a starter program",
    description:
      "An official gym's owner can invite managers and front-desk staff to run its Liftsmith page, and publish one program new members save in a tap.",
    date: "2026-11-13",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Once a gym claims its page in Liftsmith, it gets a check mark, its own club and a page that lifters find on the map and on the web. Until now only the person who claimed it could keep that page up to date. A gym is rarely run by one person, so two things change today: owners can bring their team in, and every official gym can suggest a program to the people who just joined.",
      },
      { h2: "Staff accounts" },
      {
        p: "On the gym's page in the app, the owner taps **Manage this gym’s page**, then **Invite someone** under **Staff** and sends the link to a manager or the front desk. The link works once, for a week. Whoever opens it signs in with their own Liftsmith account, types the name the owner will see, and joins.",
      },
      {
        p: "Staff can do what the owner does on the page: opening hours and contact details, the logo and photos, amenities and prices, announcements to the gym's club, equipment problems lifters reported, trainers waiting for approval, the poster and the starter program. Problem reports and trainer requests now reach everyone on the staff, not only the owner. Inviting and removing people, and letting the gym go, stay with the owner. Up to ten people can help run one gym, and a staff member can step away at any time.",
      },
      { cta: "plan" },
      { h2: "A starter program for new members" },
      {
        p: "New members ask the same question at every front desk: what should I do? Now the gym can answer it in the app. The owner or staff pick one of their own routines as the gym's **starter program**. It shows on the gym's page in the app and on the web with each exercise and its sets, and **Save the starter program** adds it to the lifter's routines in one tap.",
      },
      {
        p: "Only the exercises, their order, set counts and supersets travel with it. No weights, reps or notes, because Liftsmith fills those in from each lifter's own history, so the same program works for someone on their first day and someone coming back after years away. When the gym changes its starter program, people who saved the old one keep theirs.",
      },
      { h2: "On every phone" },
      {
        p: "Both features are part of the app's shared code, so they work the same on Android, on iPhone and in the web app. If you run a gym and haven't claimed its page yet, find it with **Find gyms near you** in the app and tap **Is this your gym? Claim it**. If you're a lifter, read [how to build a workout routine](/blog/how-to-build-a-workout-routine/) for what makes a good starting program.",
      },
    ],
    faq: [
      ["Do staff need to be paid Liftsmith members?", "No. Managing a gym's page is free for the owner and for everyone on the staff."],
      [
        "Can staff see the gym's lifters?",
        "No. The page shows the same totals the owner sees, like how many lifters added the gym. Nobody's workouts or names are shown.",
      ],
      [
        "What happens to the starter program I saved if the gym changes it?",
        "Nothing. A saved program is your own routine, so it stays as it was until you change or delete it.",
      ],
    ],
  },
];
