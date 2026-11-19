import type { Article } from "../articles";

// Blog: form video check-ins, with notes pinned to moments in the video (Melvin, 2026-11-19, gap item 3;
// docs/decisions/trainer-mode.md "Form videos"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_FORM_VIDEOS: Article[] = [
  {
    slug: "form-video-check-ins",
    kind: "blog",
    title: "Form video check-ins: notes pinned to the moment that matters",
    description:
      "Clients film a set in the app and send it to their coach or physio, who watches it slowed down and pins notes to the exact moments in the video.",
    date: "2026-11-19",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "A coach who isn't in the room still needs to see the lift. Words like \"my knees felt weird\" rarely say enough, and a long chat about a video somewhere else loses the moment it was about. Form videos in Liftsmith keep the clip, the question and the coach's answer together, with each note pinned to the second it's about.",
      },
      { cta: "coach" },
      { h2: "Film a set in a few taps" },
      {
        p: "In Coaching, a client taps Send a form video, picks the lift (the ones they trained last are a tap away) and says what they'd like checked. Record a set opens the camera with five seconds to get into place and records up to a minute. A clip already on the phone works too.",
      },
      {
        ul: [
          "Prop the phone up side-on, about three steps away, so the whole body and the bar are in view.",
          "Film the hardest set, not a warm-up: that's where form slips.",
          "One set per video. A minute is plenty.",
        ],
      },
      {
        p: "Videos recorded in the app are kept small, about 20 MB a minute, so they send on gym signal. The upload carries on in parts if the connection drops for a moment.",
      },
      { h2: "Notes pinned to the moment" },
      {
        p: "The coach gets a notification, opens the video and slows it to half or quarter speed. Pausing where it matters and tapping Add a note at 0:07 pins the note to that second, and a mark shows where it sits along the clip. The client taps a note to jump straight to that moment, and can answer with a note of their own.",
      },
      {
        p: "Physios use the same notes for rehab: how deep a split squat went today, or where a knee started to wobble, at the exact point it happened.",
      },
      { h2: "Private to the two of you" },
      {
        p: "A form video goes only to the coach it was sent to and is kept in private storage, never on a public link. Each time it's opened, the app gets a link that works for an hour. Either side can delete a video, the twelve newest are kept per coach and client, and every video between them is deleted when either of them ends coaching or deletes their account.",
      },
      {
        p: "Clients under 18 can't send form videos. Sending one is free for clients, and watching and pinning notes is part of coaching on every plan. It works the same on Android, iPhone and the web app.",
      },
      {
        tip: "Ask for the same lift from the same angle every couple of weeks. Side by side over a month, small changes in depth or bar path are easy to see.",
      },
    ],
  },
];
