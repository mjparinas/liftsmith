import type { Article } from "../articles";

// Blog: class schedules on gym pages (Melvin, 2026-11-17, docs/decisions/gyms.md "Class schedules"). Only what ships,
// and no other app named (seo.test.ts).
export const BLOG_GYM_CLASSES: Article[] = [
  {
    slug: "gym-class-schedules",
    kind: "blog",
    title: "Your gym's class schedule, on its Liftsmith page",
    description:
      "Official gyms can now post the classes they run every week, mark the dates a class is off, and let members add the next one to their calendar.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Plenty of lifters split their week between the weights and a class or two: a spin session on Monday, yoga on Sunday to loosen up. Until now a gym's page in Liftsmith showed its hours, equipment, trainers and announcements, but not its classes. Now official gyms can put their weekly schedule right there, in the app and on the website.",
      },
      { h2: "What members see" },
      {
        p: "Open your gym's page and the next seven days of classes sit near the top, today first. Each class shows its time, its name and who leads it. Tap one for the details:",
      },
      {
        ul: [
          "The days it runs and how long it lasts.",
          "The instructor, the room and a short note from the gym, such as the level or how to book.",
          "Any coming date the gym has marked as off, so you don't turn up to an empty studio.",
          "Add the next one to my calendar, which puts it in your phone's calendar on Android and iPhone, or downloads a calendar file on the web.",
        ],
      },
      {
        p: "The same week shows on the gym's page on the website, Monday to Sunday, so anyone looking for a gym nearby can see what's on before they visit.",
      },
      { cta: "plan" },
      { h2: "For gym owners and staff" },
      {
        p: "Owners and the staff they've invited add classes from their gym's page in the app. Pick the type (strength, HIIT, spin, yoga, boxing and more), tap the days, set the start time on the dial and choose the length. The type fills in the name, so most classes need no typing at all. Add the instructor, the room and a note if you like.",
      },
      {
        p: "Closed for a holiday? Open the class and tap the dates it won't run. Members see it struck out on those days, and it comes back on its own the week after.",
      },
      { h2: "Times stay on the gym's clock" },
      {
        p: "A class at 6 PM shows as 6 PM, wherever the reader is. Classes happen at the gym, so the schedule always reads the way it does on the poster by the front desk.",
      },
      { h2: "Booking stays with the gym" },
      {
        p: "Liftsmith shows the schedule, but it doesn't take bookings. Most gyms already handle spots, waitlists and memberships at the front desk or in their own system, so the note on each class can say how to book. Coaches and personal trainers who book one-on-one sessions keep doing that in Coaching, as before.",
      },
      {
        tip: "Put a yoga or mobility class on a rest day. It keeps you moving without piling more hard sets on muscles that are still recovering.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. Class schedules are free for official gyms and for everyone who reads them."],
      [
        "Can any gym post classes?",
        "Only official gyms, the ones whose owner has claimed the page, so the schedule always comes from the gym itself.",
      ],
    ],
  },
];
