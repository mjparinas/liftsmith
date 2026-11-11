import type { Article } from "../articles";

// Blog, part nine: splits and weekly plans. Two, three, four and five days a week, the body-part split,
// choosing a split, how often to train each muscle, building a routine, workout length and exercise order.
export const BLOG_I: Article[] = [
  {
    slug: "3-day-full-body-workout",
    kind: "blog",
    title: "3-day full-body workout: a simple plan that works",
    description:
      "A 3-day full-body workout plan with two alternating sessions, the sets and reps for each lift, and how to add weight from week to week.",
    date: "2026-11-11",
    tag: "Programs",
    cta: "plan",
    body: [
      {
        p: "Three full-body sessions a week is the most reliable schedule in lifting. Each muscle gets trained three times, every session has a day off after it, and missing one workout costs you a third of the week, not a whole muscle group. It suits beginners, busy people and anyone coming back after a break.",
      },
      { h2: "How the week looks" },
      {
        p: "Train on three days with a rest day between, such as Monday, Wednesday and Friday. Alternate two sessions, A and B, so week one is A, B, A and week two is B, A, B. Each session has one squat or leg press, one hinge, one push and one pull, plus a little extra if you have time.",
      },
      { h2: "Workout A" },
      {
        ul: [
          "**Back squat:** 3 sets of 5 to 8",
          "**Bench press:** 3 sets of 5 to 8",
          "**Barbell row:** 3 sets of 8 to 10",
          "**Romanian deadlift:** 2 sets of 8 to 10",
          "**Plank:** 2 holds of 30 to 45 seconds",
        ],
      },
      { exercises: ["back-squat", "bench-press", "barbell-row", "romanian-deadlift", "plank"] },
      { h2: "Workout B" },
      {
        ul: [
          "**Deadlift:** 2 sets of 5",
          "**Overhead press:** 3 sets of 5 to 8",
          "**Lat pulldown or pull-up:** 3 sets of 8 to 10",
          "**Walking lunge:** 2 sets of 10 a side",
          "**Barbell curl:** 2 sets of 10 to 12",
        ],
      },
      { exercises: ["deadlift", "overhead-press", "lat-pulldown", "walking-lunge", "barbell-curl"] },
      { cta: "plan" },
      { h2: "How to add weight" },
      {
        p: "Use the rep ranges. When you get the top of the range on every set, add the smallest jump your gym allows next time (2.5 kg or 5 lb on the big lifts, less on presses), and work back up the range. This is called [double progression](/blog/linear-vs-double-progression/), and it keeps working long after adding weight every session stops.",
      },
      {
        tip: "Leave one or two reps in the tank on most sets. You'll recover between sessions and still make steady progress. See [reps in reserve](/guides/reps-in-reserve/).",
      },
      { h2: "How long it takes" },
      {
        p: "About 45 to 60 minutes with [warm-up sets](/blog/how-to-warm-up-for-lifting/) and two to three minutes of rest between the heavy sets. Short on time? Pair the push and the pull as a [superset](/blog/supersets-explained/).",
      },
      { h2: "When to move on" },
      {
        p: "Full body three days a week can carry you for years. Move to four days, like an [upper/lower split](/blog/upper-lower-split/), only when you want more weekly sets than three sessions can hold, or you'd rather train shorter sessions more often.",
      },
    ],
    faq: [
      [
        "Is a 3-day full-body workout enough to build muscle?",
        "Yes. Training each muscle two to three times a week with about 10 hard sets a week is plenty for most people, and three full-body sessions get you there.",
      ],
      [
        "Can I do full body three days in a row?",
        "It's better to keep a rest day between sessions so the same muscles have time to recover. If you must train on back-to-back days, make the second day lighter.",
      ],
    ],
  },
  {
    slug: "2-day-full-body-workout",
    kind: "blog",
    title: "2-day workout plan: build strength with two sessions a week",
    description:
      "Only two days a week to lift? A 2-day full-body plan, how to fit enough sets into each session, and how much progress to expect.",
    date: "2026-11-11",
    tag: "Programs",
    cta: "time",
    body: [
      {
        p: "Two sessions a week is enough to get stronger and build muscle, especially if you've been doing none. The trick is to train your whole body both times, so every muscle is worked twice a week, and to make every set count.",
      },
      { h2: "How the week looks" },
      {
        p: "Pick two days with at least two days between them, such as Monday and Thursday or Tuesday and Saturday. Do the same kind of session each time, with a different main lift on each day so both get practised.",
      },
      { h2: "Day 1" },
      {
        ul: [
          "**Back squat:** 3 sets of 5 to 8",
          "**Bench press:** 3 sets of 6 to 10",
          "**Seated cable row:** 3 sets of 8 to 12",
          "**Romanian deadlift:** 3 sets of 8 to 10",
          "**Lateral raise:** 2 sets of 12 to 15",
        ],
      },
      { exercises: ["back-squat", "bench-press", "seated-cable-row", "romanian-deadlift", "lateral-raise"] },
      { h2: "Day 2" },
      {
        ul: [
          "**Deadlift:** 3 sets of 5",
          "**Overhead press:** 3 sets of 6 to 10",
          "**Pull-up or lat pulldown:** 3 sets of 6 to 12",
          "**Bulgarian split squat:** 2 sets of 8 to 10 a side",
          "**Hanging leg raise:** 2 sets of 8 to 12",
        ],
      },
      { exercises: ["deadlift", "overhead-press", "pull-up", "bulgarian-split-squat", "hanging-leg-raise"] },
      { cta: "time" },
      { h2: "Getting enough sets in two days" },
      {
        p: "Most muscles grow well on about 10 hard sets a week ([how many sets per week](/blog/how-many-sets-per-week-to-build-muscle/)). With two sessions, that's around five per muscle per session, which the plan above gets close to for the big muscle groups. If you have the time, add a set to the lifts you care most about rather than adding more exercises.",
      },
      {
        tip: "Supersets save the most time here: pair the press with the row, or the split squat with the leg raise, and rest after both. See [supersets explained](/blog/supersets-explained/).",
      },
      { h2: "What to expect" },
      {
        p: "Beginners make close to the same strength gains on two sessions as on three in the first months. Progress slows sooner than on a higher-frequency plan, so if you later find a third day, a [3-day full-body workout](/blog/3-day-full-body-workout/) is the natural next step.",
      },
    ],
    faq: [
      [
        "Is working out twice a week enough?",
        "Yes, to get stronger and build some muscle, as long as each session trains your whole body with enough hard sets. It's far better than nothing, and many people make good progress on it for a long time.",
      ],
      ["How long should a 2-day workout be?", "About 60 minutes with warm-ups. Supersets can bring it down to 40 to 45."],
    ],
  },
  {
    slug: "4-day-workout-split",
    kind: "blog",
    title: "4-day workout split: three ways to set up your week",
    description:
      "Three 4-day workout splits compared: upper/lower, push/pull/legs plus full body, and two full-body pairs. Who each suits, with a sample week.",
    date: "2026-11-11",
    tag: "Programs",
    cta: "plan",
    body: [
      {
        p: "Four days a week is a sweet spot: enough sessions to train each muscle twice with plenty of sets, and still three days off. There are a few good ways to split it. Here are three, and who each one suits.",
      },
      { h2: "1. Upper/lower (the classic)" },
      {
        p: "Upper body on Monday and Thursday, lower body on Tuesday and Friday. Every muscle gets trained twice a week, and each session is focused enough to keep short. It's the most popular 4-day split for good reason. Full details in our [upper/lower split guide](/blog/upper-lower-split/).",
      },
      {
        ul: [
          "**Upper A:** bench press, barbell row, overhead press, lat pulldown, curls and triceps",
          "**Lower A:** back squat, Romanian deadlift, leg extension, calf raise",
          "**Upper B:** overhead press, pull-up, incline bench press, cable row, lateral raise",
          "**Lower B:** deadlift, leg press, lying leg curl, walking lunge, core",
        ],
      },
      {
        exercises: [
          "bench-press",
          "barbell-row",
          "back-squat",
          "romanian-deadlift",
          "incline-bench-press",
          "pull-up",
          "deadlift",
          "leg-press",
        ],
      },
      { cta: "plan" },
      { h2: "2. Push, pull, legs, then full body" },
      {
        p: "Run [push/pull/legs](/blog/push-pull-legs-split/) once, then finish the week with a full-body session that hits everything again. It gives you PPL's focused days while still training each muscle twice. Good if you like PPL but only have four days.",
      },
      { h2: "3. Full body, four times" },
      {
        p: "Four shorter full-body sessions, alternating two workouts. Each session has fewer sets per muscle, but each muscle is worked four times. It suits people who like short sessions (35 to 45 minutes) and anyone whose recovery is better with smaller doses.",
      },
      { h2: "Which to pick" },
      {
        ul: [
          "**Want the simplest plan?** Upper/lower.",
          "**Like long sessions for one area?** Push, pull, legs plus full body.",
          "**Want short sessions?** Full body four times.",
        ],
      },
      {
        p: "Whichever you pick, the weekly sets per muscle matter more than the label. Aim for about 10 to 20 hard sets a week for the muscles you want to grow, spread over two or more days.",
      },
      { h2: "Or skip the split" },
      {
        p: "If you set four days a week in Liftsmith, Pro doesn't follow a fixed split at all: each workout trains the muscles that have recovered and still need sets that week, so a missed day doesn't throw the week out. If you'd rather follow a fixed plan, the upper/lower program (Pro) runs it for you, with every weight worked out.",
      },
    ],
    faq: [
      [
        "Is a 4-day split good for building muscle?",
        "Yes. Four days lets you train each muscle twice a week with plenty of sets, which is about ideal for muscle growth.",
      ],
      [
        "Which days should I train on a 4-day split?",
        "Monday, Tuesday, Thursday and Friday is the usual pattern: two days on, one off, two on, two off. Any layout works as long as the same muscles aren't trained hard two days in a row.",
      ],
    ],
  },
  {
    slug: "5-day-workout-split",
    kind: "blog",
    title: "5-day workout split: how to train five days without burning out",
    description:
      "How to set up a 5-day workout split: upper/lower plus a fifth day, push/pull/legs plus upper and lower, and how to keep recovery on track.",
    date: "2026-11-11",
    tag: "Programs",
    cta: "recovery",
    body: [
      {
        p: "Five days a week gives you room for a lot of training, and it's a good fit if you enjoy the gym and have the time. The risk is that it's easy to pile up more work than you recover from. A good 5-day split spreads the load so no muscle gets hammered on back-to-back days.",
      },
      { h2: "Option 1: upper/lower plus a weak-point day" },
      {
        p: "Run an [upper/lower split](/blog/upper-lower-split/) on four days and use the fifth for what you most want to improve: arms and shoulders, glutes and hamstrings, or a lift that's stuck. Keep the fifth day lighter, because those muscles are also trained on the other days.",
      },
      { h2: "Option 2: push, pull, legs, upper, lower" },
      {
        p: "Monday push, Tuesday pull, Wednesday legs, then rest, then upper on Friday and lower on Saturday. Each muscle is trained twice, with at least a day between hard sessions for the same muscles. It's a popular way to get most of [push/pull/legs](/blog/push-pull-legs-split/) in five days.",
      },
      {
        exercises: ["bench-press", "overhead-press", "pull-up", "barbell-row", "back-squat", "romanian-deadlift"],
      },
      { cta: "recovery" },
      { h2: "Option 3: the body-part split" },
      {
        p: "Chest, back, legs, shoulders, arms, one each day. It works, but each muscle is only trained hard once a week. Read about the trade-offs in [the body-part split](/blog/body-part-split/).",
      },
      { h2: "Keeping five days recoverable" },
      {
        ul: [
          "**Watch the weekly sets, not just the days.** More days should mean the same sets spread thinner, not twice as many. About 10 to 20 hard sets per muscle a week is plenty for most people.",
          "**Leave reps in reserve.** Most sets should stop one to three reps short of failure. See [should you train to failure](/blog/should-you-train-to-failure/).",
          "**Plan a lighter week every four to six weeks.** A [deload](/guides/deload-week/) clears the fatigue that five days a week builds up.",
          "**Sleep comes first.** If you're sleeping badly, four good sessions beat five tired ones.",
        ],
      },
      {
        p: "Liftsmith keeps a recovery estimate for every muscle from the sets you log, and Pro plans each day around the muscles that are ready, so five days a week stays recoverable even when your week doesn't go to plan.",
      },
    ],
    faq: [
      [
        "Is working out five days a week too much?",
        "Not if the sets are spread sensibly and you recover between sessions. Train different muscles on back-to-back days and keep the weekly sets per muscle reasonable.",
      ],
      [
        "What's a good 5-day split for beginners?",
        "Most beginners do better on three or four days. If you want five, push, pull, legs, upper, lower is easy to follow and trains each muscle twice.",
      ],
    ],
  },
  {
    slug: "body-part-split",
    kind: "blog",
    title: "The body-part split: does one muscle a day still work?",
    description:
      "What a body-part split is, what research says about training each muscle once a week, who it suits, and how to make it work better.",
    date: "2026-11-11",
    tag: "Programs",
    cta: "plan",
    body: [
      {
        p: "The body-part split gives each muscle group its own day: chest Monday, back Tuesday, legs Wednesday, shoulders Thursday, arms Friday. It's how many bodybuilders have trained for decades, and it still fills gyms on a Monday. So does it work?",
      },
      { h2: "What the research says" },
      {
        p: "When the weekly sets are the same, training a muscle twice a week tends to build a little more muscle than once a week, and spreading sets out makes each session shorter and fresher. The difference is modest, though. A body-part split with enough hard sets still builds muscle; it's just not the most efficient way to spend five days.",
      },
      { h2: "The pros" },
      {
        ul: [
          "**Lots of variety for one muscle.** You can fit several angles and exercises into one session.",
          "**Long recovery for each muscle.** A full week between hard sessions.",
          "**Simple to plan.** Each day has one job.",
        ],
      },
      { h2: "The cons" },
      {
        ul: [
          "**Missing a day costs a whole muscle for a week.**",
          "**Very high sets in one session.** After about 6 to 8 hard sets for one muscle, each extra set does less.",
          "**Overlap you might not expect.** Chest day works the front of the shoulders and triceps, so shoulder and arm days pile on top.",
        ],
      },
      { cta: "plan" },
      { h2: "How to make it work better" },
      {
        ol: [
          "**Cap each muscle at about 8 to 10 hard sets per session.**",
          "**Pair muscles so each gets two days:** for example chest and back, then legs, then shoulders and arms, repeated.",
          "**Put legs away from back day** so the lower back gets a break between deadlifts and squats.",
          "**Count indirect work.** Rows train biceps; presses train triceps.",
        ],
      },
      { exercises: ["bench-press", "incline-bench-press", "cable-fly", "barbell-row", "lat-pulldown", "lateral-raise"] },
      { h2: "Who it suits" },
      {
        p: "People who enjoy long sessions on one area, have five or more days, and rarely miss one. If your week is unpredictable, a [full-body](/blog/3-day-full-body-workout/) or [upper/lower](/blog/upper-lower-split/) plan is more forgiving. Still unsure? See [how to choose a workout split](/blog/how-to-choose-a-workout-split/).",
      },
    ],
    faq: [
      [
        "Is training each muscle once a week enough?",
        "It can build muscle with enough hard sets, but training each muscle twice a week with the same total sets usually works a little better.",
      ],
      [
        "Is a body-part split good for beginners?",
        "It's not the best start. Beginners learn the main lifts faster by practising them more often, which full-body plans allow.",
      ],
    ],
  },
  {
    slug: "how-to-choose-a-workout-split",
    kind: "blog",
    title: "How to choose a workout split: a 2-minute guide",
    description:
      "Full body, upper/lower, push/pull/legs or a body-part split? Pick the right workout split from how many days you can train and how long you have.",
    date: "2026-11-11",
    tag: "Programs",
    cta: "plan",
    body: [
      {
        p: "A workout split is just how you share out your muscles across the week. There's no single right one. The right split is the one that fits the days you can actually train, gives each muscle enough sets, and that you'll stick to.",
      },
      { h2: "Start with your days" },
      {
        ul: [
          "**2 days:** full body both days. See the [2-day plan](/blog/2-day-full-body-workout/).",
          "**3 days:** full body three times. See the [3-day full-body workout](/blog/3-day-full-body-workout/).",
          "**4 days:** upper/lower, or full body four times. See [4-day splits](/blog/4-day-workout-split/).",
          "**5 days:** push, pull, legs, upper, lower. See [5-day splits](/blog/5-day-workout-split/).",
          "**6 days:** push/pull/legs twice. See [push/pull/legs](/blog/push-pull-legs-split/).",
        ],
      },
      { cta: "plan" },
      { h2: "Then check three things" },
      {
        ol: [
          "**Does each muscle get trained at least twice a week?** That's a good target for most people. See [how often to train each muscle](/blog/how-often-to-train-each-muscle/).",
          "**Does each muscle get about 10 or more hard sets a week?** See [how many sets per week](/blog/how-many-sets-per-week-to-build-muscle/).",
          "**Can you finish each session in the time you have?** If not, use fewer exercises, or pick a split with more, shorter days. See [how long a workout should be](/blog/how-long-should-a-workout-be/).",
        ],
      },
      { h2: "What if your week changes?" },
      {
        p: "Fixed splits assume the same days every week. If yours varies, full body is the most forgiving: miss a day and every muscle still got trained this week. Liftsmith's Pro planning goes a step further: it doesn't use a fixed split, and instead plans each workout from what's recovered and what still needs sets this week, so whatever day you show up, the plan fits.",
      },
      { h2: "Don't switch too often" },
      {
        p: "Any sensible split works if you run it long enough to add weight. Give a new split at least 8 to 12 weeks before judging it, and track your lifts so you know whether it's working. The [one-rep max calculator](/tools/one-rep-max-calculator/) is a quick way to compare sets of different reps.",
      },
    ],
    faq: [
      [
        "What is the best workout split?",
        "The one that fits your schedule and that you'll keep doing. For most people that's full body on 2 or 3 days, upper/lower on 4, or push/pull/legs on 5 or 6.",
      ],
      [
        "Should beginners do a split?",
        "Most beginners do best with full-body workouts, because practising the main lifts often helps them learn faster.",
      ],
    ],
  },
  {
    slug: "how-often-to-train-each-muscle",
    kind: "blog",
    title: "How often should you train each muscle group?",
    description:
      "Training frequency explained: why twice a week per muscle is a good target, when once or three times makes sense, and how frequency and sets interact.",
    date: "2026-11-11",
    tag: "Training",
    cta: "recovery",
    body: [
      {
        p: "Training frequency is how many times a week you train a muscle. It matters less than how many hard sets you do in total, but it shapes how those sets feel: spread over more days, each session is shorter and each set is done fresher.",
      },
      { h2: "The short answer: about twice a week" },
      {
        p: "For most people, training each muscle twice a week works well. Research comparing frequencies with the same weekly sets finds twice a week tends to do a little better than once, and that going higher than two or three makes little extra difference for muscle growth. Strength may benefit from practising a lift more often, because it's partly a skill.",
      },
      { cta: "recovery" },
      { h2: "Frequency and sets go together" },
      {
        p: "Think of it as weekly sets divided by days. If a muscle needs about 12 hard sets a week, that could be:",
      },
      {
        ul: [
          "**Once a week:** 12 sets in one session (the later sets do less).",
          "**Twice a week:** 6 sets per session (a good balance).",
          "**Three times a week:** 4 sets per session (short and fresh).",
        ],
      },
      {
        p: "See [how many sets per week to build muscle](/blog/how-many-sets-per-week-to-build-muscle/) for the right weekly number for you.",
      },
      { h2: "How long muscles take to recover" },
      {
        p: "After a hard session, a muscle usually needs about 48 to 72 hours before it's ready to be trained hard again, less after a few sets and more after a lot of sets or new exercises. That's why training the same muscle on back-to-back days rarely works. More in [how long muscles take to recover](/blog/how-long-do-muscles-take-to-recover/).",
      },
      { h2: "Small muscles vs big lifts" },
      {
        ul: [
          "**Arms, calves, side delts, abs:** recover quickly and can be trained two or three times a week.",
          "**Big lifts (squat, deadlift):** tire the whole body, so twice a week is usually plenty, with one day heavier than the other.",
        ],
      },
      { exercises: ["back-squat", "deadlift", "lateral-raise", "standing-calf-raise"] },
      {
        p: "Liftsmith tracks recovery for every muscle from your own sets and shows it on a 3D map, so you can see when each one is ready rather than guessing from the calendar.",
      },
    ],
    faq: [
      [
        "Is it bad to train the same muscle two days in a row?",
        "Hard sessions two days in a row usually leave the muscle under-recovered. Light work or a different muscle group is fine.",
      ],
      [
        "Can I train a muscle every day?",
        "Small amounts for small muscles can work, but most people make better progress training each muscle two or three times a week with rest between.",
      ],
    ],
  },
  {
    slug: "how-to-build-a-workout-routine",
    kind: "blog",
    title: "How to build a workout routine in 6 steps",
    description:
      "Build your own workout routine: pick your days and split, choose exercises for each movement, set sets and reps, plan progression and a deload.",
    date: "2026-11-11",
    tag: "Programs",
    cta: "plan",
    body: [
      {
        p: "You don't need a fancy program to make progress. A good routine is a handful of decisions made once: how many days, which exercises, how many sets and reps, and how you'll add weight. Here's how to make each one.",
      },
      { h2: "1. Pick your days and split" },
      {
        p: "Be honest about how many days you'll actually train. Two or three: full body. Four: upper/lower. Five or six: push/pull/legs. See [how to choose a workout split](/blog/how-to-choose-a-workout-split/).",
      },
      { h2: "2. Cover the main movements" },
      {
        p: "Every week should include a squat, a hinge, a horizontal push and pull, a vertical push and pull, and a lunge or single-leg move. Start each session with the bigger [compound lifts](/blog/compound-vs-isolation-exercises/).",
      },
      {
        exercises: ["back-squat", "romanian-deadlift", "bench-press", "barbell-row", "overhead-press", "pull-up", "bulgarian-split-squat"],
      },
      { h2: "3. Add a few isolation exercises" },
      {
        p: "Then add one or two smaller exercises for what the big lifts miss or what you want to grow: lateral raises for the shoulders, curls and pushdowns for the arms, leg curls for the hamstrings, calf raises.",
      },
      { cta: "plan" },
      { h2: "4. Set sets and reps" },
      {
        ul: [
          "**Main lifts:** 3 to 4 sets of 5 to 8 reps.",
          "**Other compound lifts:** 3 sets of 8 to 12 reps.",
          "**Isolation exercises:** 2 to 3 sets of 10 to 15 reps.",
          "**Weekly total:** about 10 to 20 hard sets per muscle.",
        ],
      },
      { h2: "5. Decide how you'll progress" },
      {
        p: "Use a rep range and add weight when you hit the top of it on every set. That's [double progression](/blog/linear-vs-double-progression/), the simplest way to keep [progressive overload](/guides/progressive-overload/) going. Write everything down so you know what to beat next time; see [how to track your workouts](/blog/how-to-track-your-workouts/).",
      },
      { h2: "6. Plan a lighter week" },
      {
        p: "Every four to eight weeks, or when you feel run down and stop progressing, take a [deload week](/guides/deload-week/): same exercises, about half the sets, lighter weights.",
      },
      {
        p: "In Liftsmith you can save your own routine and run it any day, with the plates drawn for every barbell set and every set saved to your history. Or let Pro build each workout from your equipment and recovery, and skip steps 2 to 6.",
      },
    ],
    faq: [
      [
        "How many exercises should a workout have?",
        "Four to six is plenty for most sessions: one or two main lifts, then two to four smaller exercises.",
      ],
      [
        "How long should I keep the same routine?",
        "As long as you keep adding weight or reps. Most people run a routine for 8 to 12 weeks or more before changing exercises.",
      ],
    ],
  },
  {
    slug: "how-long-should-a-workout-be",
    kind: "blog",
    title: "How long should a workout be? It depends on your sets",
    description:
      "How long a strength workout should be, why 45 to 75 minutes is typical, what makes sessions run long, and how to train well in 30 minutes.",
    date: "2026-11-11",
    tag: "Training",
    cta: "time",
    body: [
      {
        p: "There's no magic number, but most effective strength sessions take 45 to 75 minutes, warm-ups included. What decides the length is how many hard sets you do and how long you rest between them, not the clock itself.",
      },
      { h2: "Do the math on your session" },
      {
        p: "A hard set takes about a minute, and rest is usually two to three minutes on the big lifts and one to two on the rest. So each set costs roughly two to four minutes. Fifteen sets with warm-ups lands around an hour.",
      },
      { h2: "Is a longer workout better?" },
      {
        p: "Only up to a point. After roughly 6 to 8 hard sets for one muscle in a session, each extra set does less, and fatigue makes later exercises worse. If your sessions run past 90 minutes, you'll usually do better spreading the work over more days. See [how often to train each muscle](/blog/how-often-to-train-each-muscle/).",
      },
      { cta: "time" },
      { h2: "What makes workouts run long" },
      {
        ul: [
          "**Resting longer than you planned,** usually while on your phone. A [rest timer that starts itself](/features/rest-timer/) helps.",
          "**Too many exercises.** Four to six is plenty.",
          "**Waiting for equipment.** Have a swap ready for busy machines.",
        ],
      },
      { h2: "How to train well in 30 minutes" },
      {
        ol: [
          "Do two or three compound lifts, not six exercises.",
          "Pair exercises for different muscles as [supersets](/blog/supersets-explained/).",
          "Keep warm-ups short: one or two lighter sets of the first lift.",
          "Stop each set one or two reps short of failure so you can keep the rest short.",
        ],
      },
      {
        p: "More in our [30-minute strength workout](/blog/30-minute-strength-workout/).",
      },
      {
        p: "In Liftsmith you set how long you have today with a slider, and the plan fits the time, warm-ups and rest included: a short day drops exercises from the end, a long day adds them. Link two exercises as a superset and the time saved is counted in.",
      },
    ],
    faq: [
      [
        "Is a 30-minute workout enough?",
        "Yes, if it's focused on a few compound lifts with short rests or supersets. Three 30-minute sessions a week can build real strength.",
      ],
      [
        "Is a 2-hour workout too long?",
        "For most people, yes. Past about 90 minutes, the extra sets add fatigue more than results. Split the work into more sessions instead.",
      ],
    ],
  },
  {
    slug: "exercise-order",
    kind: "blog",
    title: "Exercise order: what to do first in your workout",
    description:
      "Does exercise order matter? Why big compound lifts usually go first, when to put isolation work first, and how to order a full-body workout.",
    date: "2026-11-11",
    tag: "Training",
    cta: "warmup",
    body: [
      {
        p: "The exercises you do first get your best effort. You're fresh, focused and haven't tired the smaller muscles that help with bigger lifts. So the simple rule is: put what matters most to you first.",
      },
      { h2: "The usual order" },
      {
        ol: [
          "**Warm-up:** a few minutes of easy movement and lighter sets of your first lift. See [how to warm up for lifting](/blog/how-to-warm-up-for-lifting/).",
          "**Main compound lift:** squat, deadlift, bench press or overhead press.",
          "**Other compound lifts:** rows, pull-ups, lunges, Romanian deadlifts.",
          "**Isolation exercises:** curls, raises, leg curls, calf raises.",
          "**Core:** planks, leg raises.",
        ],
      },
      { exercises: ["back-squat", "barbell-row", "romanian-deadlift", "barbell-curl", "plank"] },
      { cta: "warmup" },
      { h2: "Why big lifts usually go first" },
      {
        p: "Heavy compound lifts need the most skill and the most muscles, so they suffer the most from fatigue. Doing curls before rows tires the biceps you need for the row. And core work last means your trunk is fresh for squats and deadlifts, when you need it to brace.",
      },
      { h2: "When to break the rule" },
      {
        ul: [
          "**A weak point you want to grow:** do it first sometimes, when you're fresh. Lateral raises before pressing is a common example.",
          "**A muscle that's hard to feel:** a light isolation set first can help you find it.",
          "**An injury:** start with the exercise that feels best and warms the area up.",
        ],
      },
      { h2: "Ordering a full-body workout" },
      {
        p: "Alternate upper and lower body so one rests while the other works: squat, bench, Romanian deadlift, row. Or alternate which main lift goes first each session, as in the [3-day full-body workout](/blog/3-day-full-body-workout/), so each one gets a turn when you're fresh.",
      },
      {
        p: "Liftsmith orders each workout this way for you, bigger lifts first, and adds [warm-up sets](/features/warm-up-sets/) to the first loaded lift for each muscle.",
      },
    ],
    faq: [
      [
        "Should I do compound or isolation exercises first?",
        "Compound first, in most cases. They need more energy and skill, and the isolation work can come once those are done.",
      ],
      [
        "Should I do abs at the start or end of a workout?",
        "At the end. Your core helps you brace in squats and deadlifts, so keep it fresh for those.",
      ],
    ],
  },
];
