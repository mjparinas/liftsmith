import type { Article } from "../articles";

// Blog: check-in forms with body weight, photos, repeats every 1, 2 or 4 weeks and trends (Melvin, 2026-11-17;
// docs/decisions/trainer-mode.md "Check-in forms and questionnaires"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_COACH_CHECKINS: Article[] = [
  {
    slug: "client-check-in-forms",
    kind: "blog",
    title: "Client check-ins with weight, photos and trends",
    description:
      "Build a check-in form with scores, body weight and photos, send it every week, two weeks or four, and see each answer's trend on your client's report.",
    date: "2026-11-17",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Between sessions, a short check-in tells a coach more than a month of guessing: how a client slept, whether hunger is getting in the way, and what changed in the mirror. Check-in forms in Liftsmith now ask for body weight and photos, repeat on the schedule you pick, and show how every answer is moving.",
      },
      { cta: "coach" },
      { h2: "Build the form once" },
      {
        p: "In Coaching › Check-ins, start from a template or a blank form and change any words. Each question takes one of six kinds of answer:",
      },
      {
        ul: [
          "1 to 5, for sleep, energy, hunger or how closely they followed the plan.",
          "A number, yes or no, or a few words.",
          "Body weight, which fills in from the client's last weigh-in in their own unit.",
          "A photo, up to three on a form, like one from the front and one from the side.",
        ],
      },
      {
        p: "The new Progress check-in template has weight, two photos, energy, hunger, the plan and one open question, so a monthly progress check takes a few taps to set up.",
      },
      { h2: "Send it on a schedule" },
      {
        p: "On a client's report, pick the form and send it once, every week, every 2 weeks or every 4 weeks. It goes out on the same day each time, with a notification, and a client back from a break finds at most three waiting, not a pile. Editing a form later never changes answers already given.",
      },
      { h2: "Quick to answer" },
      {
        p: "Clients answer with taps where they can. A weight question starts at their last weigh-in, so most weeks it's a bump or two, and the new weight goes into their own weigh-ins too unless they turn that off. A photo question opens the phone's camera or photo picker. Anything can be skipped.",
      },
      { h2: "Trends, not a pile of answers" },
      {
        p: "Under the form on the report, Trends shows each score, number and weight across the answers with a small line and the change since the first one, and yes or no questions as a count. What to look at first says when a score drops two or more across the last three check-ins, as well as a low score or a check-in that's been waiting three days.",
      },
      { h2: "Photos stay private" },
      {
        p: "A photo answer goes only to the coach who asked, is loaded only when they open it, and is deleted when either of you ends the coaching or deletes the account. It's a copy the client chose to send: progress photos in the app stay on their phone. Clients under 18 are never asked for photos.",
      },
      {
        p: "Check-in forms are part of coaching on every plan, Pro, Coach and Coach Plus alike, and free for clients. They work the same on Android, iPhone and the web app.",
      },
      {
        tip: "Ask for photos every 4 weeks rather than every week. Changes are easier to see, and a client is more likely to keep sending them.",
      },
    ],
  },
];
