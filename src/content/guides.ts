import type { Article } from "./articles";

export const GUIDES: Article[] = [
  {
    slug: "reps-in-reserve",
    kind: "guide",
    title: "Reps in reserve (RIR): how hard each set should be",
    description:
      "What reps in reserve means, how it maps to RPE, how close to failure to train for strength and muscle, and how to get better at judging it.",
    date: "2026-11-09",
    tag: "Effort",
    cta: "rir",
    body: [
      {
        p: "Reps in reserve, or RIR, is how many more good reps you could have done when you racked the bar. Stop a set of squats at 8 when you could have ground out 10, and that set was **RIR 2**. It's the simplest way to say how hard a set should be, and it works for any lift, any weight and any lifter.",
      },
      { h2: "Why effort matters more than the number on the bar" },
      {
        p: 'A set of 10 at a weight you could lift 20 times does very little. The same 10 reps at a weight you could lift 11 times is a hard, productive set. What makes muscles grow and strength climb is getting reasonably close to failure, so writing a program in reps alone leaves out the part that matters. RIR fills that gap: "3 sets of 8 at RIR 2" means the same thing to a beginner and to someone who has trained for ten years.',
      },
      {
        p: "Research backs this up. Sets taken within a few reps of failure build muscle about as well as sets taken all the way to failure, with much less fatigue. Training to failure on every set mostly adds soreness and longer recovery, not extra growth.",
      },
      { h2: "RIR and RPE" },
      {
        p: "RPE (rating of perceived exertion) is the same idea counted the other way. The lifting version, from Zourdos and colleagues in 2016, ties each RPE to reps left in the tank:",
      },
      {
        ul: [
          "RPE 10 = RIR 0: nothing left, a true max effort",
          "RPE 9 = RIR 1: one more rep was there",
          "RPE 8 = RIR 2: two more reps",
          "RPE 7 = RIR 3: three more, the bar still moves quickly",
          "RPE 6 or lower = RIR 4+: a warm-up or a technique set",
        ],
      },
      { p: "Use whichever feels more natural. They describe the same set." },
      { h2: "How close to failure should you train?" },
      {
        ul: [
          "**For muscle:** most working sets at RIR 1 to 3. The last set of an isolation exercise can go to RIR 0.",
          "**For strength:** big lifts at RIR 1 to 3, with fewer reps. Leave grinding max reps for the occasional test.",
          "**For beginners:** RIR 2 to 4 while you learn the movement. Your first sessions are about practice, and you'll make progress anyway.",
          "**Big compound lifts** (squats, deadlifts) carry more risk and more fatigue near failure, so keep an extra rep or two in the tank. Curls and raises can go closer.",
        ],
      },
      { cta: "rir" },
      { h2: "Step RIR down across a training block" },
      {
        p: "A good way to use RIR is to start a block a bit easier and finish it harder: RIR 3 in the first week, then 2, then 1, then 0 in the last hard week, followed by a lighter [deload week](/guides/deload-week/). You build momentum without piling up fatigue early, and you get a planned push at the end.",
      },
      { h2: "Getting better at judging it" },
      { p: "Most people underestimate how many reps they have left, especially on higher-rep sets. A few ways to calibrate:" },
      {
        ol: [
          "Once in a while, take the last set of a safe exercise (a machine, dumbbell curls) to true failure and compare with your guess.",
          "Watch bar speed: when reps slow down noticeably, you're usually 2 to 3 reps from failure.",
          "Write down your RIR right after the set, not at the end of the workout.",
          "Be honest. Reporting RIR 2 when it was RIR 0 just makes your next session too heavy.",
        ],
      },
      { tip: "A rep only counts if it's a good rep. RIR means reps you could do with the same form, not ugly reps you could force out." },
      { h2: "How Liftsmith uses it" },
      {
        p: "Liftsmith gives every working set an RIR target from the week of your block, and lets you show it as RPE if you prefer. During rest you can tap how many reps you had left; sets that felt easier than planned nudge the next session's weight up, and sets that felt harder pull it back. Missed reps and \"too hard\" feedback count too, so the plan follows how you're actually lifting.",
      },
    ],
    faq: [
      [
        "What does RIR 2 mean?",
        "You stopped the set with two good reps still in you. If the target was 8 reps at RIR 2, you could have done about 10.",
      ],
      ["Is RIR the same as RPE?", "They describe the same thing. RPE 8 is RIR 2, RPE 9 is RIR 1 and RPE 10 is RIR 0."],
      [
        "Do I need to train to failure to build muscle?",
        "No. Sets stopped one to three reps short of failure build muscle about as well, with less fatigue and soreness.",
      ],
    ],
  },
  {
    slug: "deload-week",
    kind: "guide",
    title: "Deload week: what it is, when to take one and how",
    description:
      "A deload is a planned lighter week that lets fatigue drop so strength can show. When to deload, how to cut volume and load, and signs you need one early.",
    date: "2026-11-09",
    tag: "Recovery",
    cta: "deload",
    body: [
      {
        p: "A deload is a planned easier week. You still go to the gym and do the same lifts, but with fewer sets and a little less weight. Fatigue drops away, aches settle, and the strength you've built over the last few weeks gets a chance to show. Most lifters come back from a deload feeling stronger, not weaker.",
      },
      { h2: "Why lighter weeks make you stronger" },
      {
        p: "Hard training does two things at once: it builds fitness and it piles up fatigue. Fatigue hides fitness. After a few hard weeks the weights feel heavier, sleep gets worse and joints complain, even though you're fitter than when you started. Cutting the workload for a week lets the fatigue fall faster than the fitness, so you start the next block ahead.",
      },
      { h2: "When to deload" },
      {
        ul: [
          "**On a schedule:** after every 3 to 6 hard weeks. Four hard weeks and one deload is a good default for most people.",
          "**Early, when the signs show up:** reps you used to hit get missed for several workouts in a row, more than one lift stalls at once, joints ache, you dread sessions or sleep falls apart.",
          "**Before a test or a busy week:** a short deload before a max attempt, a holiday or a hard stretch at work.",
        ],
      },
      { p: "Beginners recover fast and can go longer between deloads. The stronger you get, the more often a lighter week pays off." },
      { cta: "deload" },
      { h2: "How to deload" },
      { p: "There's no single right way, but the simplest one works well:" },
      {
        ol: [
          "Keep the same exercises, so you don't lose the skill.",
          "Cut the number of sets roughly in half.",
          "Take the weight down a little, or leave it and stop much further from failure: about 4 reps in reserve.",
          "Keep training on your usual days, so the habit stays.",
          "Skip anything new or brutal. No max tests, no punishing finishers.",
        ],
      },
      {
        tip: "A deload isn't a week off. Short breaks are fine now and then, but a lighter week keeps your technique sharp and your routine intact.",
      },
      { h2: "What not to do" },
      {
        ul: [
          "Don't use the spare time for extra cardio or a new hard sport. That just moves the fatigue elsewhere.",
          "Don't test your max at the end of the deload week. Give it a few sessions into the next block.",
          "Don't skip deloads because you feel fine. The point is to clear fatigue before it becomes a stall.",
        ],
      },
      { h2: "How Liftsmith handles it" },
      {
        p: "Liftsmith plans training in blocks: 3 to 6 build weeks with reps in reserve stepping down, then a deload at half the sets and 4 reps in reserve. You don't have to remember it. If your logged sets show fatigue building early, like missed reps three workouts running or several lifts stalling at once, a coach's note on Today offers to make this week the deload in one tap. Read more in [how to break a plateau](/blog/how-to-break-a-strength-plateau/).",
      },
    ],
    faq: [
      [
        "How often should I deload?",
        "Every 3 to 6 hard weeks, or earlier if reps start slipping, several lifts stall at once or your joints ache.",
      ],
      [
        "Will I lose muscle during a deload?",
        "No. A week of lighter training is far too short to lose muscle or strength. Most people come back stronger.",
      ],
      [
        "Should I take a week off instead?",
        "A lighter week usually works better than a week off: fatigue drops while your technique and habit stay sharp.",
      ],
    ],
  },
  {
    slug: "progressive-overload",
    kind: "guide",
    title: "Progressive overload: how to keep getting stronger",
    description:
      "Progressive overload explained: the ways to progress, double progression step by step, how fast to add weight, and what to do when progress stops.",
    date: "2026-11-09",
    tag: "Progress",
    cta: "progress",
    body: [
      {
        p: "Progressive overload means asking your body for a little more over time. Lift the same weight for the same reps forever and your body has no reason to change. Add a rep here and a few kilos there, and it keeps adapting. It's the one principle every good program shares.",
      },
      { h2: "The ways to progress" },
      {
        ul: [
          "**More weight** for the same reps: the classic, and the clearest sign you're stronger.",
          "**More reps** at the same weight: the easiest way to progress when the next plate jump is too big.",
          "**More sets** for a muscle across the week: more total work, up to what you can recover from.",
          "**Better reps:** a deeper squat, a controlled lowering, a pause. Harder for the same weight.",
          "**Less rest** for the same work: a smaller lever, mostly useful for fitness.",
        ],
      },
      { p: "For most lifters, reps and weight do almost all the work." },
      { h2: "Double progression, step by step" },
      { p: "Double progression is the most reliable way to run this week to week. Pick a rep range, say 6 to 10:" },
      {
        ol: [
          "Start with a weight you can lift for 6 reps on every set, with a rep or two to spare.",
          "Each session, try to add a rep to your sets.",
          "When you hit 10 reps on every set, add the smallest weight step you can and drop back to 6.",
          "If you miss your reps by two or more, take a step back and build again.",
        ],
      },
      { p: "You always know what to do next, and the weight only goes up once you've earned it." },
      { cta: "progress" },
      { h2: "How fast should the weight go up?" },
      {
        ul: [
          "**Beginners** can often add weight every session for the first few months, especially on squats and deadlifts.",
          "**Intermediates** usually progress week to week or across a block.",
          "**Advanced lifters** may need a whole block to add a few kilos to a big lift.",
        ],
      },
      {
        p: "Small plates help a lot. Going from 60 to 62.5 kg is a 4% jump; 60 to 65 kg is 8%, which is hard to repeat. If your gym's jumps are big, use reps to bridge the gap. The [plate calculator](/tools/plate-calculator/) shows what your plates can make.",
      },
      { h2: "When progress stops" },
      {
        p: "Everyone stalls eventually. Before changing everything, check the basics: are you sleeping, eating enough protein, resting long enough between sets and doing enough weekly sets for the muscle? Then try one change at a time, like a short reset to a lighter weight, a different rep range, or a [deload week](/guides/deload-week/). More on this in [how to break a strength plateau](/blog/how-to-break-a-strength-plateau/).",
      },
      { tip: "Track your sets. You can't add a rep to last week's number if you don't know what it was." },
      { h2: "How Liftsmith handles it" },
      {
        p: 'Liftsmith runs double progression for you on top of your block\'s effort targets. Every set is pre-filled with the next weight and reps, rounded to what your plates can make. Hit every set and the next session adds a rep; reach the top of the range and the weight goes up one loadable step. Miss by two or more and it steps back. Tap "Why?" under any target to see the reasoning in plain words.',
      },
    ],
    faq: [
      [
        "What is progressive overload?",
        "Gradually asking more of your muscles over time, usually by adding reps or weight, so they keep adapting.",
      ],
      [
        "How much weight should I add each week?",
        "The smallest step your plates allow, and only after you hit the top of your rep range on every set.",
      ],
      [
        "What if I can't add weight?",
        "Add reps first. When reps stall too, check sleep, food, rest and weekly sets, then try a short reset or a deload.",
      ],
    ],
  },
];
