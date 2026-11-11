import type { Article } from "../articles";

// Blog, part three: short workouts, supersets, heart rate, logging, comebacks, injuries.
export const BLOG_C: Article[] = [
  {
    slug: "30-minute-strength-workout",
    kind: "blog",
    title: "30-minute workouts that still build strength",
    description:
      "How to make a 30-minute gym session count: pick big lifts, pair exercises, trim warm-ups and rest smartly. Plus three sample short workouts.",
    date: "2026-11-09",
    tag: "Short workouts",
    cta: "time",
    body: [
      {
        p: "Thirty minutes is enough to make real progress if you spend it on the right things. The secret isn't working harder. It's cutting what doesn't matter.",
      },
      { h2: "Five rules for short sessions" },
      {
        ol: [
          "**Pick compound lifts** that train several muscles at once: squats, presses, rows, hinges.",
          "**Pair exercises** that don't compete, and alternate them. See [supersets explained](/blog/supersets-explained/).",
          "**Fewer warm-up sets:** ramp up properly for the first lift only.",
          "**Two to three hard sets** per exercise. The first sets give you most of the benefit.",
          "**Train more often:** three 30-minute sessions beat one 90-minute session you can't fit in.",
        ],
      },
      { cta: "time" },
      { h2: "Three sample 30-minute workouts" },
      {
        p: "**Full body A:** [goblet squat](/exercises/goblet-squat/) paired with [one-arm dumbbell row](/exercises/db-row/), 3 rounds; then [dumbbell bench press](/exercises/db-bench-press/) paired with [dumbbell Romanian deadlift](/exercises/db-rdl/), 3 rounds.",
      },
      {
        p: "**Full body B (barbell):** [back squat](/exercises/back-squat/) 3 sets, then [bench press](/exercises/bench-press/) paired with [barbell row](/exercises/barbell-row/), 3 rounds.",
      },
      {
        p: "**No equipment:** [split squat](/exercises/split-squat/) with [push-up](/exercises/push-up/), then [single-leg Romanian deadlift](/exercises/single-leg-rdl/) with [doorway towel row](/exercises/towel-row/), 3 rounds each, plus a [plank](/exercises/plank/).",
      },
      { tip: "Plan before you arrive. Wandering between machines deciding what to do next is where short sessions die." },
      { h2: "Let the app fit the time" },
      {
        p: "Slide Liftsmith's workout length to 30 minutes and it builds a plan that fits, with warm-up sets, rest and setup time all counted. Move the slider and it adds or drops exercises at the end instead of reshuffling. If you run short mid-workout, Pro can trim the rest of the plan to the minutes you have left.",
      },
    ],
  },
  {
    slug: "supersets-explained",
    kind: "blog",
    title: "Supersets explained: train more in less time",
    description:
      "What supersets are, which exercises pair well, how much rest to take, and when supersets help or hurt your strength gains.",
    date: "2026-11-09",
    tag: "Short workouts",
    cta: "time",
    body: [
      {
        p: "A superset is two exercises done back to back: a set of one, a short pause, a set of the other, then rest. Done right, it cuts your workout time a lot without costing you progress.",
      },
      { h2: "Pairs that work" },
      { p: "The best supersets pair exercises that don't use the same muscles, so each one rests while the other works:" },
      {
        ul: [
          "**Push and pull:** [bench press](/exercises/bench-press/) with [barbell row](/exercises/barbell-row/), [overhead press](/exercises/overhead-press/) with [lat pulldown](/exercises/lat-pulldown/).",
          "**Upper and lower:** [goblet squat](/exercises/goblet-squat/) with [dumbbell bench press](/exercises/db-bench-press/).",
          "**Arms:** [curls](/exercises/db-curl/) with [pushdowns](/exercises/cable-pushdown/).",
          "**A big lift with core:** [deadlift](/exercises/deadlift/) with a [plank](/exercises/plank/).",
        ],
      },
      { h2: "Pairs to avoid" },
      {
        ul: [
          "Two exercises for the same muscle, unless you want to tire it out on purpose.",
          "Two heavy lower-body lifts, like squats and deadlifts. Your breathing and back won't recover.",
          "Exercises at opposite ends of a busy gym. You'll lose your equipment.",
        ],
      },
      { cta: "time" },
      { h2: "How to rest" },
      {
        p: "About 15 seconds to switch between exercises, then the full rest for the harder of the two before the next round. You save time because each exercise rests while the other works, not because you rest less overall.",
      },
      {
        tip: "Keep the heaviest lift of the day out of a superset if you're chasing strength. Give it its full rest and pair the lighter exercises.",
      },
      { h2: "Supersets in Liftsmith" },
      {
        p: "Tap the chain button between two exercises on Today's plan to link them. Liftsmith alternates sets with a 15-second switch, rests the longer of the two between rounds, and counts the time saved in the workout length. Tap it again to split them.",
      },
    ],
  },
  {
    slug: "heart-rate-during-weight-training",
    kind: "blog",
    title: "What your heart rate tells you during weight training",
    description:
      "How to use heart rate while lifting: rest until it drops, spot fatigue across sessions, and which monitors work best for weight training.",
    date: "2026-11-09",
    tag: "Heart rate",
    cta: "heart",
    body: [
      {
        p: "Heart rate isn't how hard a set was. A heavy triple barely moves it while a set of 20 squats sends it through the roof. But it's still useful in the gym, if you know what to look for.",
      },
      { h2: "Use it to time your rest" },
      {
        p: "After a hard set, your heart rate spikes and then falls. If it's still high, you're probably not ready for the next heavy set. Waiting until it settles gives you a better next set, especially on leg days.",
      },
      { h2: "Spot fatigue across sessions" },
      {
        ul: [
          "A higher average heart rate than usual for the same workout can mean you're tired, ill, under-slept or dehydrated.",
          "A heart rate that's slow to come down between sets is another sign.",
          "A lower average for the same work over weeks usually means you're getting fitter.",
        ],
      },
      { cta: "heart" },
      { h2: "Which monitors work" },
      {
        ul: [
          "**Chest straps** are the most accurate for lifting, because wrist sensors struggle when you grip a bar.",
          "**Watches and bands** that can broadcast heart rate over Bluetooth work well enough for rest and session averages.",
          "Look for one that supports the standard Bluetooth heart rate profile, so it connects to any app.",
        ],
      },
      {
        tip: "If your heart rate is far higher than normal for a light warm-up, consider an easier session. If you also feel unwell, skip it.",
      },
      { h2: "Heart rate in Liftsmith" },
      {
        p: "Pair any standard Bluetooth heart rate monitor and Liftsmith shows your live heart rate during the workout and on your lock screen, records it for each set and the whole session, and compares it with your usual. Session heart rate feeds the daily readiness score that decides between a push, normal or easy day.",
      },
    ],
  },
  {
    slug: "how-to-track-your-workouts",
    kind: "blog",
    title: "How to track your workouts so they actually improve",
    description:
      "What to log in the gym (weight, reps, effort, rest), what to ignore, and how to turn last session's numbers into this session's plan.",
    date: "2026-11-09",
    tag: "Tracking",
    cta: "log",
    body: [
      {
        p: "A workout log isn't a diary. Its job is to tell you what to lift today. If you can't look at it and know your next set, it isn't doing its job.",
      },
      { h2: "What to log" },
      {
        ul: [
          "**Exercise, weight and reps** for every working set.",
          "**Effort:** how many reps you had left ([reps in reserve](/guides/reps-in-reserve/)), at least on the last set.",
          "**Anything that changed:** a different machine, a new grip, a sore knee.",
          "**Body weight** a few times a week, if it matters to your goal.",
        ],
      },
      { h2: "What you can skip" },
      {
        ul: [
          "Warm-up sets (useful to plan, not to analyze).",
          "Total volume charts you never act on.",
          "Long notes about how the session felt, unless something hurt.",
        ],
      },
      { cta: "log" },
      { h2: "Turn the log into a plan" },
      {
        ol: [
          "Before each exercise, look at last session's sets.",
          "If you hit the top of your rep range on every set, add weight. If not, aim for one more rep.",
          "If you missed by a lot, keep the weight or drop a step.",
          "Every few weeks, look at whether your estimated maxes are rising.",
        ],
      },
      { p: "That's [progressive overload](/guides/progressive-overload/) in four steps." },
      { tip: "Log during the workout, not after. Memory is generous about the reps you did." },
      { h2: "Let the log write the plan" },
      {
        p: "In Liftsmith, every set is already filled in from your history before you start: the weight, reps and effort target. Lift, tap Log set, and it records the weight, reps, rest and heart rate for you, then uses it all to plan the next session. Already have a log in a spreadsheet or another app? Import a CSV export and your history carries over.",
      },
    ],
  },
  {
    slug: "getting-back-into-lifting",
    kind: "blog",
    title: "Getting back into lifting after a break",
    description:
      "How to return to the gym after weeks or months off: how much strength you've lost, how light to start, and how fast you can build back.",
    date: "2026-11-09",
    tag: "Comebacks",
    cta: "comeback",
    body: [
      {
        p: "Good news first: strength and muscle come back much faster than they took to build. If you trained for a year and took three months off, you won't need another year to get back.",
      },
      { h2: "How much have you lost?" },
      {
        ul: [
          "**Up to 2 or 3 weeks:** very little. You may even feel stronger after the rest.",
          "**1 to 3 months:** some strength and muscle, but most comes back within a few weeks.",
          "**Many months:** more, but still far quicker to regain than the first time.",
        ],
      },
      { h2: "Start lighter than you want to" },
      {
        p: "The danger on a comeback isn't strength. Your muscles return quickly, but your tendons and your work capacity lag. Jumping straight back to old weights is the classic way to get very sore or hurt.",
      },
      {
        ol: [
          "First week: about 60 to 70% of your old working weights, with fewer sets.",
          "Stop every set with 3 or more reps in reserve.",
          "Add weight every session while it moves well.",
          "Expect to be near your old numbers within a few weeks to a couple of months.",
        ],
      },
      { cta: "comeback" },
      {
        tip: "Expect some soreness after the first sessions back, even with light weights. It fades within a week or two. See [should you lift when sore](/blog/should-you-train-when-sore/).",
      },
      { h2: "A plan that eases you in" },
      {
        p: "Liftsmith notices when you've been away. After a long break the daily readiness score eases the plan, and a welcome-back note says so. Your weights start from your history, and the plan builds back up from how your first sessions go.",
      },
    ],
  },
  {
    slug: "training-around-an-injury",
    kind: "blog",
    title: "Training around a sore shoulder, knee or back",
    description:
      "How to keep training when something hurts: what to skip, what to keep, how to come back gradually, and the signs that mean see a professional.",
    date: "2026-11-09",
    tag: "Injuries",
    cta: "injury",
    body: [
      {
        p: "This isn't medical advice, and if something hurts badly, see a doctor or a physiotherapist. But for the everyday aches lifters get, stopping training altogether is rarely needed. Training around it usually works better.",
      },
      { h2: "Stop signs" },
      {
        p: "Stop and get it checked if you have **sharp pain, pain that builds during a set, swelling, numbness or tingling, or a joint that gives way**.",
      },
      { h2: "Work around it" },
      {
        ul: [
          "**Skip exercises that hurt.** A sore shoulder might rule out overhead presses but allow rows and leg work.",
          "**Find a version that doesn't hurt:** a different grip, a machine instead of a barbell, a smaller range of motion.",
          "**Go lighter** on exercises that are uncomfortable but not painful, and keep several reps in reserve.",
          "**Keep training everything else.** It keeps your strength, routine and mood up.",
        ],
      },
      { cta: "injury" },
      { h2: "Rate the pain" },
      {
        p: "A simple 0 to 10 scale helps. Pain that stays at 2 or below during and after exercise is generally considered acceptable when coming back. If it climbs above that, or is worse the next morning, ease off.",
      },
      { h2: "Come back gradually" },
      {
        p: "Once pain has been low for about a week, bring the skipped exercises back light, around half your usual weight, and build up over a few weeks: 50%, then 70%, then 90%, moving on only while pain stays low.",
      },
      { tip: "Your physiotherapist's advice beats any general rule, including these. Show them what you're doing." },
      { h2: "Injury mode in Liftsmith" },
      {
        p: "Tell Liftsmith which body part hurts and it skips the exercises that load it, suggests ones that avoid it, or keeps them at a lighter percentage if you choose. It asks how the pain feels on a 0 to 10 scale, and once it has stayed low it offers a gradual return. Injury mode is free, and it never diagnoses anything.",
      },
    ],
  },
];
