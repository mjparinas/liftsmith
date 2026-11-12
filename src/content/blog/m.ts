import type { Article } from "../articles";

// Blog, part thirteen: coaching (trainer mode out of Labs, 2026-11-12). For personal trainers and online coaches, and
// for lifters working with one. Each post points coaches to /coaches/ and says only what the app does today.
export const BLOG_M: Article[] = [
  {
    slug: "how-to-track-client-workouts",
    kind: "blog",
    title: "How to track your clients' workouts without a spreadsheet",
    description:
      "Spreadsheets and screenshots break down past a few clients. How to see what each client lifted, spot who's slipping, and act on it in minutes a week.",
    date: "2026-11-12",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Most coaches start with a shared spreadsheet, or clients sending screenshots of their notes app. It works for three clients. By ten, you spend Sunday night copying numbers instead of coaching, and the client who quietly stopped training two weeks ago slips through.",
      },
      { h2: "What you actually need to see" },
      {
        ul: [
          "**Did they train?** Workouts per week against the goal you agreed. This is the number that predicts results.",
          "**Did they hit their reps?** Missing target reps three sessions in a row usually means fatigue is building, not a lack of effort.",
          "**Is the main lift still moving?** A lift with no new best in three or more weeks needs a change: a new rep range, an extra set or a close variation.",
          "**What went well?** New bests are worth a message. Progress someone notices keeps them coming back.",
        ],
      },
      {
        p: "Everything else (every set's rest time, every warm-up) is nice to have, but it shouldn't be the first thing you read.",
      },
      { h2: "A weekly review in ten minutes" },
      {
        ol: [
          "Start with whoever hasn't trained in a week or more. Send a short, friendly check-in before anything else.",
          "Next, anyone behind on their weekly goal. Ask what got in the way, and plan fewer, shorter sessions they can keep up if that's the answer.",
          "Then anyone missing reps or stalled on a lift. Adjust one thing for the next three weeks, not five.",
          "Finish with the wins. A one-line note about a new best takes seconds and lands well.",
        ],
      },
      { cta: "coach" },
      { h2: "Let the client log, not report" },
      {
        p: "The data is only as good as the logging. Ask clients to log in an app as they lift, set by set, rather than writing a summary afterwards: it's quicker for them and far more accurate for you. A pre-filled next set and a one-tap log make it easy to keep up. See [how to track your workouts](/blog/how-to-track-your-workouts/).",
      },
      { h2: "In Liftsmith" },
      {
        p: "Clients log their workouts in the app as usual. You make one invite link in Settings › Coaching, and each client's report opens with what to do first: gone quiet, behind on their weekly goal, missing reps, stalled lifts and new bests. Then come their weeks, recent workouts and new bests. See [coaching in Liftsmith](/coaches/).",
      },
    ],
    faq: [
      [
        "How many clients can one coach track this way?",
        "With a report that leads with what needs attention, a weekly review takes a minute or two per client, so dozens is realistic.",
      ],
      [
        "Should clients share everything with their coach?",
        "No. Training is enough to coach well. Health readings, body measurements and notes can stay private unless the client chooses to share them.",
      ],
    ],
  },
  {
    slug: "keep-personal-training-clients-consistent",
    kind: "blog",
    title: "How to keep personal training clients consistent between sessions",
    description:
      "Most results happen on the days you're not there. Practical ways to help clients train on their own: simple plans, quick check-ins and the right goal.",
    date: "2026-11-12",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "If you see a client once or twice a week, most of their training happens without you. Whether they show up on those other days decides their results, and whether they renew.",
      },
      { h2: "Make the plan easy to follow" },
      {
        ul: [
          "**Give them a routine, not a list of ideas.** Exercises in order with set counts, so there's nothing to decide in the gym.",
          "**Let the weights take care of themselves.** If the app fills in each set from their last workout, they don't need to remember what they lifted.",
          "**Keep sessions short enough to keep.** Three 45-minute sessions they do beat five hour-long ones they skip. See [how many days a week to lift](/blog/how-many-days-a-week-to-lift/).",
        ],
      },
      { h2: "Check in at the right moment" },
      {
        p: "A message after a week of silence works better than one after a month. Look at who hasn't trained in seven days and reach out first. Keep it short and curious: what got in the way, and what would make next week easier.",
      },
      { cta: "coach" },
      { h2: "Set a weekly goal they can hit" },
      {
        p: "A weekly goal in workouts (not kilos) is easy to understand and easy to measure. Start one session below what they think they can do. Hitting it builds the habit, and you can raise it once it sticks.",
      },
      { h2: "Notice the wins" },
      {
        p: "A new best on a lift, three weeks without missing a session, a first pull-up. Say something. A short note from their coach is often the thing a client remembers about the week.",
      },
      { h2: "In Liftsmith" },
      {
        p: "Assign any routine you've saved and see how often each client does it. Leave a note that sits at the top of their Today screen until you change it, and see who's gone quiet or fallen behind first in each client's report. Clients use the app free. See [coaching in Liftsmith](/coaches/).",
      },
    ],
    faq: [
      [
        "How often should I check in with clients?",
        "A quick look once a week is enough for most, with a message to anyone who hasn't trained in seven days.",
      ],
      [
        "What's a good weekly goal for a new client?",
        "Two or three workouts a week. Raise it once they've hit it for a few weeks in a row.",
      ],
    ],
  },
  {
    slug: "what-to-share-with-your-coach",
    kind: "blog",
    title: "Training with a coach: what to share and what stays private",
    description:
      "Working with a personal trainer or online coach? What they need to see to help you, what you can keep to yourself, and how to get the most from it.",
    date: "2026-11-12",
    tag: "Coaching",
    cta: "log",
    body: [
      {
        p: "A coach can only help with what they can see. But sharing your training doesn't have to mean sharing everything: a good setup gives your coach what they need and nothing more.",
      },
      { h2: "What your coach needs" },
      {
        ul: [
          "**Your workouts:** exercises, sets, weights and reps. This is how they know whether the plan is working.",
          "**How hard sets felt.** Reps in reserve or a quick rating tells them whether to push or ease off. See [what RIR means](/guides/reps-in-reserve/).",
          "**How often you train** against the goal you agreed, and what got in the way when you missed.",
          "**Anything that hurts.** Tell them directly, so they can change the plan.",
        ],
      },
      { cta: "log" },
      { h2: "What can stay private" },
      {
        p: "Heart rate, body weight, body fat, measurements, sleep and other health readings, your menstrual cycle, notes and progress photos. Some coaches ask for some of these, and sharing them can help, but it should be your choice, item by item.",
      },
      { h2: "Get the most from it" },
      {
        ol: [
          "Log every set as you go, not from memory afterwards.",
          "Do the plan as written for a few weeks before asking to change it.",
          "Read their notes, and reply when something isn't working.",
        ],
      },
      { h2: "In Liftsmith" },
      {
        p: "Enter your coach's code (or open their invite link) and you'll see exactly what they'll see before you agree: your workouts from the last year, how long you trained, how hard sets felt and your weekly goal. They never see your heart rate, body, health readings, cycle, injuries, notes, gyms or photos. You can stop sharing at any time, and being a client is free. Coaches can read more on [coaching in Liftsmith](/coaches/).",
      },
    ],
    faq: [
      ["Does my coach see my heart rate in Liftsmith?", "No. Coaches see your training only, never heart rate or health readings."],
      ["Can I stop sharing with my coach?", "Yes, at any time, from Settings › Coaching. They lose access straight away."],
      ["Do I need to pay to work with a coach in Liftsmith?", "No. Being a client is free."],
    ],
  },
];
