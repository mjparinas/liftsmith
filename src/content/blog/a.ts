import type { Article } from "../articles";

// Blog, part one: volume, rest, warm-ups, splits, beginners, plateaus, home gyms.
export const BLOG_A: Article[] = [
  {
    slug: "how-many-sets-per-week-to-build-muscle",
    kind: "blog",
    title: "How many sets per week to build muscle?",
    description:
      "How many hard sets each muscle needs a week to grow, how to split them across sessions, and how to tell when you're doing too much or too little.",
    date: "2026-11-09",
    tag: "Volume",
    cta: "plan",
    body: [
      {
        p: "If you want a muscle to grow, the number that matters most is how many **hard sets** it gets in a week. Not total reps, not minutes in the gym: sets taken reasonably close to failure, counted per muscle.",
      },
      { h2: "The short answer" },
      {
        ul: [
          "**Beginners:** about 8 to 12 hard sets per muscle per week.",
          "**A few years in:** about 10 to 16.",
          "**Experienced lifters:** 12 to 20 for the muscles they care about most.",
        ],
      },
      {
        p: "A 2017 meta-analysis by Schoenfeld, Ogborn and Krieger found a clear dose-response: 10 or more weekly sets per muscle produced more growth than fewer than 5. More helps, up to the point where you can't recover from it.",
      },
      { h2: "What counts as a hard set" },
      {
        p: "A set counts when it ends within about 1 to 3 reps of failure. Warm-up sets don't count, and neither do sets you could have done 10 more reps of. See [reps in reserve](/guides/reps-in-reserve/) for how to judge it.",
      },
      {
        p: "Compound lifts count for more than one muscle. A [bench press](/exercises/bench-press/) is a full set for the chest and roughly half a set for the triceps and front delts. A [Romanian deadlift](/exercises/romanian-deadlift/) trains hamstrings and glutes together.",
      },
      { cta: "plan" },
      { h2: "Spread it across the week" },
      {
        p: "Sixteen sets for the chest in one session is mostly junk by the end. Splitting the same sets across two or three sessions keeps each set higher quality. A good rule: no more than about 8 to 10 hard sets for one muscle in a single workout, and train each muscle at least twice a week.",
      },
      { h2: "Signs you're doing too much or too little" },
      {
        ul: [
          "**Too little:** you're never sore, your lifts go up easily but the muscle doesn't change, and sessions feel short.",
          "**Too much:** reps drop session to session, soreness lasts into the next workout for that muscle, joints ache and you dread the gym.",
        ],
      },
      { p: "If you're unsure, start at the low end and add two sets a week to a lagging muscle each block while your lifts keep moving." },
      { tip: "Volume for a muscle you want to bring up should go up first. Keep everything else at a level you can recover from." },
      { h2: "How Liftsmith counts it" },
      {
        p: "Liftsmith counts weekly sets for every muscle, with secondary muscles at half a set, and aims each one at a target for your experience. Up to three priority muscles get a third more. A coach's note tells you when a big muscle has been short of its sets for two weeks, and offers to make it a priority in one tap.",
      },
    ],
  },
  {
    slug: "how-long-to-rest-between-sets",
    kind: "blog",
    title: "How long to rest between sets",
    description: "Rest times for strength and muscle, why short rest can cost you gains, and how to rest less without losing progress.",
    date: "2026-11-09",
    tag: "Rest",
    cta: "rest",
    body: [
      {
        p: "Resting too little between sets is one of the most common ways people sabotage a good workout. You feel busy, but every set after the first gets weaker, and weaker sets build less.",
      },
      { h2: "Rest times that work" },
      {
        ul: [
          "**Heavy compound lifts** ([squat](/exercises/back-squat/), [deadlift](/exercises/deadlift/), [bench](/exercises/bench-press/), rows): 2 to 4 minutes.",
          "**Lighter compound lifts** (lunges, dumbbell presses, pulldowns): 1.5 to 2.5 minutes.",
          "**Isolation exercises** (curls, raises, extensions): 60 to 90 seconds.",
          "**Warm-up sets:** about a minute.",
        ],
      },
      {
        p: "In a 2016 study, Schoenfeld and colleagues had trained men rest either 1 or 3 minutes between sets. The 3-minute group gained more strength and more muscle doing the same exercises.",
      },
      { h2: "Why short rest costs you" },
      {
        p: "Your muscles need a few minutes to refill the energy they use in a hard set. Cut rest short and the next set loses reps. Since growth depends on hard sets with enough load, losing two reps on every set adds up.",
      },
      { cta: "rest" },
      { h2: "How to rest less without losing progress" },
      {
        ol: [
          "**Pair exercises** that don't compete, like a row with a press, and alternate. Each muscle still gets its rest. See [supersets explained](/blog/supersets-explained/).",
          "**Load the next set during rest**, so the bar is ready when the timer ends.",
          "**Keep rest long on the big lifts** and cut it on isolation work, where it matters less.",
          "**Use a timer.** Rest without one tends to drift long when you're chatting and short when you're rushing.",
        ],
      },
      {
        tip: "If your heart is still pounding and your breathing hasn't settled, you're not ready for a heavy set yet, whatever the clock says.",
      },
      { h2: "How Liftsmith does it" },
      {
        p: "Log a set and Liftsmith starts the rest for that lift: longer for big lifts, shorter for small ones, and your own choice if you've set one. It counts down on your lock screen with the next set's plates, gives +30 seconds or Skip, and chimes or buzzes when it's time. Rest you actually took is recorded too, so the plan can tell when short rest is holding a lift back.",
      },
    ],
  },
  {
    slug: "how-to-warm-up-for-lifting",
    kind: "blog",
    title: "How to warm up for lifting (without wasting time)",
    description:
      "A five-minute general warm-up plus ramp-up sets for your first heavy lift: what to do, how many warm-up sets, and which weights to use.",
    date: "2026-11-09",
    tag: "Warm-up",
    cta: "warmup",
    body: [
      {
        p: "A good warm-up gets you ready for your first heavy set in under ten minutes. A bad one either skips the ramp-up and makes your first set feel awful, or burns twenty minutes on a foam roller and leaves you tired.",
      },
      { h2: "Part one: five minutes of movement" },
      { p: "Get warm and move the joints you're about to load:" },
      {
        ul: [
          "2 to 3 minutes of something easy that raises your pulse: a bike, a brisk walk, skipping.",
          "A few drills for today's muscles: [bodyweight squats](/exercises/bodyweight-squat/) and [reverse lunges](/exercises/reverse-lunge/) before legs, [band pull-aparts](/exercises/band-pull-apart/) and [push-ups](/exercises/push-up/) before upper body.",
          "Nothing to failure and nothing long. You want to feel warm, not tired.",
        ],
      },
      { h2: "Part two: ramp-up sets" },
      { p: "Your first heavy lift of the day needs a few lighter sets that build to the working weight. For a barbell lift:" },
      { ol: ["The empty bar for 10 reps.", "About 55% of your working weight for 5.", "About 80% for 2."] },
      {
        p: "If your working weight is very heavy, add one more step (say 50%, 70%, 85%). For machines and dumbbells, two sets are plenty: 50% for 8 and 75% for 4.",
      },
      { cta: "warmup" },
      { h2: "Later lifts need less" },
      {
        p: "Once a muscle is warm, the next exercise for it needs one feeler set at about 70% for 3 reps, or none at all for an isolation exercise. Bodyweight work doesn't need warm-up sets.",
      },
      {
        tip: "Keep warm-up reps low as the weight climbs. The job is to practise the movement and feel the weight, not to tire yourself before the sets that count.",
      },
      { h2: "How Liftsmith does it" },
      {
        p: 'Liftsmith adds warm-up sets for you on weights your plates can make, labelled "Warm-up 1 of 3", with a 60-second rest and a Skip link. They never count toward your stats, records or recovery. "Warm up first" on Today builds the five-minute movement part for today\'s muscles, using only what your gym has.',
      },
    ],
  },
  {
    slug: "full-body-vs-split-workouts",
    kind: "blog",
    title: "Full body or split workouts: which should you do?",
    description:
      "Full body, upper/lower and push/pull/legs compared: how often each trains a muscle, who each suits, and how to pick by the days you can train.",
    date: "2026-11-09",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "The best split is the one that fits the days you can actually train and hits each muscle at least twice a week. Here's how the common options compare.",
      },
      { h2: "Full body (2 to 4 days a week)" },
      { p: "Every session trains every major muscle with a few sets each. With three days a week, each muscle gets trained three times." },
      {
        ul: [
          "**Good for:** beginners, busy people, anyone training three days or fewer.",
          "**Upside:** miss a day and nothing goes untrained for a week.",
          "**Downside:** sessions get long if you want lots of sets per muscle.",
        ],
      },
      { h2: "Upper / lower (4 days a week)" },
      {
        p: "Two upper-body days and two lower-body days. Each muscle gets trained twice a week, with more sets per session than full body.",
      },
      {
        ul: [
          "**Good for:** intermediate lifters with four days.",
          "**Upside:** focused sessions, simple to run.",
          "**Downside:** a missed day leaves half your body untrained that week.",
        ],
      },
      { h2: "Push / pull / legs (3 or 6 days a week)" },
      {
        p: "Pressing muscles one day, pulling muscles the next, legs the third. On three days a week, each muscle gets trained once; on six, twice.",
      },
      {
        ul: [
          "**Good for:** people who like training often and can do six days.",
          "**Downside:** on three days, once a week per muscle is less effective than twice.",
        ],
      },
      { cta: "plan" },
      { h2: "Does frequency matter?" },
      {
        p: "A 2016 meta-analysis found training a muscle twice a week grew more muscle than once. Later work suggests that when the weekly sets are the same, frequency matters less, but in practice spreading sets across two or more sessions keeps them higher quality. Aim for twice a week per muscle and you can't go far wrong.",
      },
      { h2: "Pick by your days" },
      {
        ul: [
          "**2 or 3 days:** full body.",
          "**4 days:** upper/lower, or full body if you like shorter sessions.",
          "**5 days:** upper/lower plus a full body day, or a push/pull/legs rotation.",
          "**6 days:** push/pull/legs twice.",
        ],
      },
      { tip: "Consistency beats the perfect split. A three-day full body plan you never miss beats a six-day plan you do half of." },
      { h2: "Or let the plan decide" },
      {
        p: "Liftsmith's adaptive plan doesn't use a fixed split. Each day it picks the muscles that are recovered and still need sets this week, so you can train whatever days you're free. If you prefer a structure, pick a push/pull/legs or upper/lower split in Settings and it still adapts the exercises and weights inside it.",
      },
    ],
  },
  {
    slug: "beginner-gym-workout-plan",
    kind: "blog",
    title: "Your first 8 weeks in the gym: a beginner plan",
    description:
      "A simple beginner gym plan: three full-body days a week, which lifts to learn, how to pick starting weights, and how to add weight safely.",
    date: "2026-11-09",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "Starting out is when you make the fastest progress you'll ever make. You don't need a complicated program. You need a few good lifts, three days a week, and a clear way to add weight.",
      },
      { h2: "The plan" },
      { p: "Train three non-consecutive days (Monday, Wednesday, Friday works). Alternate two workouts:" },
      {
        p: "**Workout A:** [goblet squat](/exercises/goblet-squat/) 3×8 to 12, [dumbbell bench press](/exercises/db-bench-press/) 3×8 to 12, [one-arm dumbbell row](/exercises/db-row/) 3×8 to 12, [plank](/exercises/plank/) 3×30 s.",
      },
      {
        p: "**Workout B:** [Romanian deadlift](/exercises/db-rdl/) with dumbbells 3×8 to 12, [lat pulldown](/exercises/lat-pulldown/) 3×8 to 12, [seated dumbbell press](/exercises/db-shoulder-press/) 3×8 to 12, [reverse lunge](/exercises/reverse-lunge/) 2×10 each leg.",
      },
      { p: "Rest about 2 minutes between sets. Each session takes 45 to 60 minutes with a warm-up." },
      { cta: "plan" },
      { h2: "Picking your starting weights" },
      {
        p: "Start lighter than you think. Your first two weeks are practice. Pick a weight you could lift for about 12 to 14 reps and do 10. If it felt easy, go up next time. Nobody gets hurt from starting too light.",
      },
      { h2: "Adding weight" },
      {
        p: "Use [double progression](/guides/progressive-overload/): when you hit 12 reps on every set, add the smallest weight jump and go back to 8. Most beginners add weight every week or two on every lift for months.",
      },
      { h2: "After 8 weeks" },
      {
        p: "Once the movements feel natural, start moving to barbell lifts: the [back squat](/exercises/back-squat/), [bench press](/exercises/bench-press/) and [deadlift](/exercises/deadlift/). They let you load more weight in small steps for years.",
      },
      {
        tip: "Write everything down. Beginners progress fast enough that guessing last week's numbers means you're lifting too light or too heavy.",
      },
      { h2: "Skip the planning" },
      {
        p: "Tell Liftsmith you're new, what equipment you have and how many days you can train, and it builds each workout for you, with starting weights estimated from your body weight and experience, set on the light side for your first session. If that first session shows it was too light, the next one catches up straight away.",
      },
    ],
  },
  {
    slug: "how-to-break-a-strength-plateau",
    kind: "blog",
    title: "How to break a strength plateau",
    description:
      "Why lifts stall and how to fix it: check recovery and volume, reset the weight, change the rep range, or take a deload. A step-by-step plan.",
    date: "2026-11-09",
    tag: "Progress",
    cta: "progress",
    body: [
      {
        p: "A plateau is when a lift stops moving for three weeks or more, even though you're training it regularly. It happens to everyone. The fix depends on why it stalled, so start with the cause.",
      },
      { h2: "First: one lift or everything?" },
      {
        p: "If **several lifts stall at the same time**, it's almost always fatigue. You need a [deload week](/guides/deload-week/), not a new program. If **one lift** is stuck while the others move, look at that lift.",
      },
      { h2: "Common causes of a single stall" },
      {
        ul: [
          "**Too few weekly sets** for the muscle: under about 8 hard sets a week is often not enough to keep progressing.",
          "**Too little rest** between sets, so later sets fall short. See [how long to rest](/blog/how-long-to-rest-between-sets/).",
          "**Grinding to failure** on every set, which piles up fatigue.",
          "**The same rep range for months.** Your body adapts to it.",
          "**Sleep, food and stress.** If they slipped, so will your lifts.",
        ],
      },
      { cta: "progress" },
      { h2: "Fixes to try, one at a time" },
      {
        ol: [
          "**Reset:** drop the weight about 10%, then build back up over two or three weeks. You'll often pass the old best.",
          "**Change the rep range:** if you've lived at 8 to 10, spend three weeks at 4 to 6, or the other way round.",
          "**Add a set** to that lift or that muscle for a block.",
          "**Rest a minute longer** between sets of that lift.",
          "**Swap to a close variation** for three weeks, like a [paused or close-grip bench](/exercises/close-grip-bench/) for a stuck bench press.",
        ],
      },
      { p: "Give each fix about three weeks before judging it, and change one thing at a time so you know what worked." },
      {
        tip: "Track your estimated one-rep max, not just your top weight. A rep added at the same weight is progress too. The [one-rep max calculator](/tools/one-rep-max-calculator/) turns any set into an estimate.",
      },
      { h2: "How Liftsmith spots and fixes stalls" },
      {
        p: "Liftsmith watches every lift's estimated max. When one stalls, a coach's note says so. With Pro, the plateau detective looks at your own data for the likely cause, like missed reps, short rest or too few sets, and offers a three-week fix in one tap, then tells you afterwards whether it worked. When several lifts stall together, it offers a deload instead.",
      },
    ],
  },
  {
    slug: "home-gym-dumbbell-workout",
    kind: "blog",
    title: "Dumbbell-only home workouts that build real strength",
    description:
      "How to train every muscle with just dumbbells and a bench: the best exercises, a weekly plan, and how to keep progressing with a limited set.",
    date: "2026-11-09",
    tag: "Home gym",
    cta: "home",
    body: [
      {
        p: "A pair of adjustable dumbbells and a bench can build an impressive body. You lose some of the heavy loading a barbell gives, but you gain range of motion, balance and the ability to train one side at a time.",
      },
      { h2: "The exercises" },
      {
        exercises: [
          "db-bench-press",
          "db-incline-press",
          "db-row",
          "db-shoulder-press",
          "goblet-squat",
          "bulgarian-split-squat",
          "db-rdl",
          "lateral-raise",
          "db-curl",
          "db-overhead-extension",
        ],
      },
      { h2: "A three-day plan" },
      {
        p: "**Day 1:** dumbbell bench press, one-arm row, goblet squat, lateral raise, curl. **Day 2:** Bulgarian split squat, Romanian deadlift, incline press, rear delt fly. **Day 3:** seated press, chest-supported row, walking lunge, overhead extension, hammer curl. Three or four sets each, 8 to 15 reps.",
      },
      { cta: "home" },
      { h2: "Progressing when the dumbbells top out" },
      {
        p: "Heavy legs are the hard part with dumbbells. When goblet squats get easy, move to one-leg work: [Bulgarian split squats](/exercises/bulgarian-split-squat/) double the load on each leg. Other tricks:",
      },
      {
        ul: [
          "**Add reps** up to about 20, then make the exercise harder rather than heavier.",
          "**Slow the lowering** to three or four seconds.",
          "**Pause** at the hardest point, like the bottom of a squat.",
          "**Go one side at a time:** one-arm rows, one-leg RDLs, one-arm presses.",
        ],
      },
      { tip: "Buy the next pair of dumbbells you'll actually run out of first. For most people that's a heavier pair for legs and rows." },
      { h2: "Plan around exactly what you own" },
      {
        p: 'Pick "Home gym" in Liftsmith, tell it which dumbbells you own, and every weight it suggests is one you can actually pick up. The Gyms screen also suggests what to buy next: the plates or equipment that would unlock the most new exercises or smaller weight jumps, with no shop links or sponsored picks.',
      },
    ],
  },
];
