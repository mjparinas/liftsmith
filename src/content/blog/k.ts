import type { Article } from "../articles";

// Blog, part eleven: training ideas. Bulking, strength or size, getting stronger without getting
// bigger, tempo, periodization, the first week at the gym, travel, consistency, one-sided training
// and how fast muscle grows.
export const BLOG_K: Article[] = [
  {
    slug: "lean-bulk",
    kind: "blog",
    title: "How to lean bulk: gain muscle without gaining too much fat",
    description:
      "A lean bulk in plain words: how big a surplus to eat, how fast to gain, how much protein, and how to train so the extra food turns into muscle.",
    date: "2026-11-11",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: "A lean bulk means eating a little more than you burn, on purpose, so your body has the material to build muscle, while keeping the extra small enough that most of the weight you gain isn't fat. It's slower than eating everything in sight, and much less work to undo afterwards.",
      },
      { h2: "How much to eat" },
      {
        p: "Start with your maintenance calories, the amount that keeps your weight steady, then add about 200 to 300 calories a day. Our [TDEE calculator](/tools/tdee-calculator/) gives you a starting point; your scale over the next two weeks tells you the real number.",
      },
      { cta: "tdee" },
      { h2: "How fast to gain" },
      {
        ul: [
          "**New lifters:** about 0.5% of body weight a month to 1% at most. You build muscle fastest, so you can use more of the surplus.",
          "**A few years in:** about 0.25 to 0.5% a month. Muscle comes slower, so a bigger surplus mostly becomes fat.",
          "**Weigh yourself several mornings a week** and watch the weekly average, not single days. Water and food swing it by a kilo or more.",
        ],
      },
      { h2: "Protein and the rest" },
      {
        p: "Aim for about 1.6 to 2.2 g of protein per kg of body weight a day, spread over three or four meals. The rest of the surplus can come from whatever carbs and fats you enjoy and can eat consistently. See [how much protein to build muscle](/blog/how-much-protein-to-build-muscle/).",
      },
      { h2: "Train so the food turns into muscle" },
      {
        p: "The surplus only helps if the training asks for more muscle. Train each muscle about twice a week with 10 to 20 hard sets, finish most sets one to three reps short of failure, and add weight or reps over time. See [how many sets per week](/blog/how-many-sets-per-week-to-build-muscle/) and [progressive overload](/guides/progressive-overload/).",
      },
      { h2: "When to stop" },
      {
        p: "Most people bulk for a few months, then hold maintenance or diet down when their waist has grown more than they'd like. A tape measure helps: if your waist is climbing much faster than your arms and chest, the surplus is too big. See [how to take body measurements](/blog/how-to-take-body-measurements/).",
      },
    ],
    faq: [
      [
        "How long should a lean bulk last?",
        "Usually three to six months, or until your waist has grown more than you want. Then spend a while at maintenance before deciding what's next.",
      ],
      [
        "Do I need to bulk to build muscle?",
        "New lifters and people with more body fat can build muscle at maintenance. See body recomposition. Leaner, more experienced lifters usually need a small surplus.",
      ],
    ],
  },
  {
    slug: "strength-vs-hypertrophy",
    kind: "blog",
    title: "Strength vs hypertrophy training: what's the difference?",
    description:
      "Training for strength and training for size overlap a lot. Here's what actually changes: reps, weight, rest and exercise choice, and how to do both.",
    date: "2026-11-11",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "Strength training aims to lift the most weight once or a few times. Hypertrophy training aims to grow muscle. The two overlap a lot, because a bigger muscle can lift more and getting stronger lets you use heavier weights for your growth sets. What changes is mostly how heavy, how many reps, and how much rest.",
      },
      { h2: "What's different" },
      {
        ul: [
          "**Reps:** strength work lives at 1 to 6 reps with heavy weights. Muscle grows across a wide range, from about 5 to 30 reps, as long as the sets are hard.",
          "**Rest:** heavy strength sets need 3 to 5 minutes. Growth sets do fine with 2 to 3. See [how long to rest between sets](/blog/how-long-to-rest-between-sets/).",
          "**Exercises:** strength is specific, so you practise the lift you want to get better at. For size you can use any exercise that loads the muscle well, machines and isolation moves included.",
          "**Practice:** heavy singles and triples are a skill. Strength lifters repeat the main lifts often to get good at them.",
        ],
      },
      { cta: "plan" },
      { h2: "How to do both" },
      {
        p: "Start each session with one main lift at 3 to 6 reps, then move to 8 to 15 reps for the rest of the workout. That's how most good programs work, and it suits nearly everyone who wants to be both bigger and stronger. See [how many reps to build muscle](/blog/how-many-reps-to-build-muscle/) and [compound vs isolation exercises](/blog/compound-vs-isolation-exercises/).",
      },
      { exercises: ["back-squat", "bench-press", "leg-press", "cable-fly"] },
      { h2: "In Liftsmith" },
      {
        p: "Liftsmith puts the loaded compound lifts first and the accessories after, sets your reps and weights from what you've logged, and lets you pick strength, muscle or general fitness as your goal.",
      },
    ],
    faq: [
      [
        "Can you build muscle with low reps?",
        "Yes, but it takes more sets to do the same work, and heavy sets are harder on the joints. A mix of rep ranges works best for most people.",
      ],
      [
        "Do I need to train for strength if I only want size?",
        "Not strictly, but getting stronger in the 6 to 12 rep range is one of the clearest signs your muscles are growing.",
      ],
    ],
  },
  {
    slug: "get-stronger-without-getting-bigger",
    kind: "blog",
    title: "How to get stronger without getting bigger",
    description:
      "Want strength without adding size? Lift heavy for low reps, keep volume modest, eat at maintenance and practise the lifts. Here's how to set it up.",
    date: "2026-11-11",
    tag: "Strength",
    cta: "plan",
    body: [
      {
        p: "A lot of strength comes from your nervous system learning to use the muscle you already have: recruiting more of it, firing it together and coordinating the lift. You can train that side on purpose and keep growth to a minimum, which is useful for weight-class sports, climbing, running or just staying the same size.",
      },
      { h2: "How to set it up" },
      {
        ul: [
          "**Heavy and low rep:** most work at 1 to 5 reps, around 80 to 90% of your max.",
          "**Few hard sets:** 3 to 5 working sets per lift, stopping a rep or two short of failure. Lots of sets near failure is what drives growth.",
          "**Long rest:** 3 to 5 minutes, so every set is high quality.",
          "**Practise the lifts often:** two or three times a week each, like a skill.",
          "**Eat at maintenance.** Muscle growth is slow without a calorie surplus.",
        ],
      },
      { cta: "plan" },
      { exercises: ["back-squat", "bench-press", "overhead-press", "pull-up"] },
      { h2: "A simple week" },
      {
        p: "Three full-body days, each with a squat or deadlift, a press and a pull, at 3 to 5 sets of 3 to 5. Add a little weight when every set feels smooth. See [3-day full-body workout](/blog/3-day-full-body-workout/) and [how to break a strength plateau](/blog/how-to-break-a-strength-plateau/).",
      },
      { h2: "What to expect" },
      {
        p: "Some size will come, especially if you're new, because any hard training builds muscle. But with modest volume and maintenance calories it stays small, while strength keeps climbing for a long time.",
      },
    ],
    faq: [
      [
        "Will lifting heavy make me bulky?",
        "Not by itself. Getting much bigger takes lots of hard sets, a calorie surplus and years of training.",
      ],
      ["How many reps for strength without size?", "Mostly 1 to 5 reps with a few sets per lift and long rests."],
    ],
  },
  {
    slug: "tempo-training",
    kind: "blog",
    title: "Tempo training: what the numbers mean and when to use it",
    description:
      "What tempo numbers like 3-1-1-0 mean, why slowing the lowering helps, and how to use tempo to learn a lift or make light weights harder.",
    date: "2026-11-11",
    tag: "Training",
    cta: "home",
    body: [
      {
        p: "Tempo is how fast you move the weight. Programs write it as four numbers, like 3-1-1-0: three seconds lowering, a one-second pause at the bottom, one second lifting, and no pause at the top. Most of the time you don't need it, but it's a handy tool in a few situations.",
      },
      { h2: "When tempo helps" },
      {
        ul: [
          "**Learning a lift.** A slow lowering and a pause at the bottom teach you where your body should be.",
          "**Light weights at home.** Three to four seconds down makes a pair of dumbbells or your body weight much harder.",
          "**Around an injury.** Slower reps let you train hard with less weight. See [training around an injury](/blog/training-around-an-injury/).",
          "**Breaking a sticking point.** A pause right where you get stuck builds strength there.",
        ],
      },
      { cta: "home" },
      { exercises: ["goblet-squat", "push-up", "db-bench-press", "romanian-deadlift"] },
      { h2: "How to use it" },
      {
        p: "Keep the lowering controlled on every lift, two or three seconds is plenty, and lift as fast as you can with good form. Save very slow reps for the cases above. Count your reps the same way every time so your logs stay comparable: if you start pausing squats, use less weight and treat it as a new exercise.",
      },
      { h2: "Does slow lifting build more muscle?" },
      {
        p: "Not on its own. Muscle grows from hard sets, and reps that take anywhere from about half a second to several seconds work similarly. Very slow reps just mean you use less weight. See [how many reps to build muscle](/blog/how-many-reps-to-build-muscle/).",
      },
    ],
    faq: [
      [
        "What does 3-1-1-0 tempo mean?",
        "Three seconds lowering, a one-second pause at the bottom, one second lifting, and no pause at the top.",
      ],
      [
        "Should every rep be slow?",
        "No. Control the lowering and lift with intent. Use slow tempos to learn a lift or to make light weights harder.",
      ],
    ],
  },
  {
    slug: "periodization-explained",
    kind: "blog",
    title: "Periodization explained: how to plan training in blocks",
    description:
      "Periodization means planning training in blocks: a few build weeks that get harder, then an easier deload week. Here's how it works and why it helps.",
    date: "2026-11-11",
    tag: "Programming",
    cta: "deload",
    body: [
      {
        p: "Periodization is planning your training in stages instead of doing the same thing every week. The simplest version, and the one that works for most people, is a block: a few weeks where the training gets steadily harder, then an easier week to recover, then the next block starts a little higher.",
      },
      { h2: "A typical block" },
      {
        ol: [
          "**Week 1:** a moderate number of sets, finishing about three reps short of failure.",
          "**Weeks 2 and 3:** a few more sets, finishing two and then one rep short.",
          "**Week 4:** the hardest week, with sets taken close to failure.",
          "**Deload:** about half the sets at lighter effort, so fatigue drains away and you start the next block fresh.",
        ],
      },
      { cta: "deload" },
      { h2: "Why it works" },
      {
        p: "Hard training builds fatigue faster than fitness. If you push every week, fatigue eventually hides your progress and makes aches and stalls more likely. Planning a rise and an easy week lets you push hard when it counts and recover before it catches up. See [deload week](/guides/deload-week/) and [reps in reserve](/guides/reps-in-reserve/).",
      },
      { h2: "Other kinds" },
      {
        ul: [
          "**Linear:** the weight goes up a little every session. Great for beginners. See [linear vs double progression](/blog/linear-vs-double-progression/).",
          "**Undulating:** heavy, medium and light days in the same week.",
          "**Block periodization:** longer phases that focus on size, then strength, then peaking for a meet.",
        ],
      },
      { h2: "In Liftsmith" },
      {
        p: "Liftsmith plans in blocks of 3 to 6 build weeks (4 by default) followed by a deload. Reps in reserve step down from 3 to 0 across a four-week block, and the deload is half the sets at easier effort. If fatigue builds early, a coach's note offers to start the deload now.",
      },
    ],
    faq: [
      [
        "Do beginners need periodization?",
        "Beginners progress by adding a little weight each session. A planned easy week every month or two still helps once progress slows.",
      ],
      ["How long should a training block be?", "Usually 3 to 6 weeks of building, then a deload week."],
    ],
  },
  {
    slug: "first-week-at-the-gym",
    kind: "blog",
    title: "Your first week at the gym: what to do and what to expect",
    description:
      "A calm plan for your first week at the gym: three short full-body sessions, which machines and weights to try, how heavy to go and gym etiquette.",
    date: "2026-11-11",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "Your first week isn't about results. It's about learning a handful of moves, finding where things are, and leaving feeling like you could come back tomorrow. Three short sessions is plenty.",
      },
      { h2: "The plan" },
      {
        p: "Do this workout three times, with a day off between each. Two to three sets of 10 to 12 on each, with a weight that feels like you could do three or four more reps.",
      },
      {
        ol: [
          "**Leg press or goblet squat**",
          "**Chest press machine or dumbbell bench press**",
          "**Lat pulldown**",
          "**Seated row or one-arm dumbbell row**",
          "**Plank:** 2 holds of 20 to 30 seconds",
        ],
      },
      { exercises: ["leg-press", "goblet-squat", "db-bench-press", "lat-pulldown", "db-row", "plank"] },
      { cta: "plan" },
      { h2: "How heavy" },
      {
        p: "Lighter than you think. Start with a weight you could lift for 20 reps, do a set of 10, and go up a step if it was easy. You'll be sore for a day or two after the first session either way; that fades fast. See [how much weight should I lift](/blog/how-much-weight-should-i-lift/) and [should you train when sore](/blog/should-you-train-when-sore/).",
      },
      { h2: "Gym etiquette" },
      {
        ul: [
          "Put weights back where you found them.",
          "Wipe down benches and handles after you use them.",
          'Ask "how many sets have you got left?" if you want a machine. Most people are happy to share.',
          "Nobody is watching as closely as you think. Everyone started somewhere.",
        ],
      },
      { h2: "After week one" },
      {
        p: "Keep the same moves and add a rep or a little weight each session. After a month, move to a proper plan like the [beginner gym workout plan](/blog/beginner-gym-workout-plan/). Warm up with a light set of each exercise first: see [how to warm up for lifting](/blog/how-to-warm-up-for-lifting/).",
      },
    ],
    faq: [
      ["How long should my first workouts be?", "30 to 45 minutes is plenty, including a few minutes of warm-up."],
      [
        "Machines or free weights for beginners?",
        "Both work. Machines are easier to learn, so they're a good start. See machines vs free weights.",
      ],
    ],
  },
  {
    slug: "travel-workout",
    kind: "blog",
    title: "Travel workout: how to keep lifting on the road",
    description:
      "How to keep your strength while travelling: a hotel-room workout with no equipment, a hotel gym plan, and why a week away won't undo your progress.",
    date: "2026-11-11",
    tag: "Bodyweight",
    cta: "bodyweight",
    body: [
      {
        p: "A week or two away won't cost you much strength, and you'll get most of it back in a few sessions. So the goal on the road is simple: keep the habit and keep the muscles working, with whatever you have.",
      },
      { h2: "Hotel room, no equipment" },
      {
        p: "Two or three rounds, resting a minute between exercises. Slow the lowering to three seconds to make it harder.",
      },
      {
        ol: [
          "**Split squat or reverse lunge:** 10 to 15 per leg",
          "**Push-up:** as many as you can, stopping a rep or two short",
          "**Towel row** under a sturdy table or in a door frame: 10 to 15",
          "**Single-leg Romanian deadlift:** 10 per leg",
          "**Glute bridge:** 15 to 20",
          "**Plank:** 30 to 45 seconds",
        ],
      },
      { exercises: ["split-squat", "push-up", "towel-row", "single-leg-rdl", "glute-bridge", "plank"] },
      { cta: "bodyweight" },
      { h2: "Hotel gym" },
      {
        p: "Most have a rack of dumbbells and a cable or two. Goblet squats, dumbbell bench press, one-arm rows, Romanian deadlifts and lunges cover the whole body. See [home gym dumbbell workout](/blog/home-gym-dumbbell-workout/).",
      },
      { h2: "Coming back" },
      {
        p: "After a short trip, pick up where you left off. After two weeks or more, start a little lighter and build back over a few sessions. See [getting back into lifting](/blog/getting-back-into-lifting/).",
      },
      { h2: "In Liftsmith" },
      {
        p: "Add a gym with only body weight (or the hotel's dumbbells) and Liftsmith plans each workout from what's there. After a longer gap, the first session back starts lighter on its own.",
      },
    ],
    faq: [
      [
        "Will I lose muscle on a two-week trip?",
        "Very little. Strength and size hold up well for a few weeks, and what you lose comes back quickly.",
      ],
      ["How often should I work out when travelling?", "Two or three short sessions a week is plenty to keep the habit and the muscle."],
    ],
  },
  {
    slug: "how-to-stay-consistent-with-workouts",
    kind: "blog",
    title: "How to stay consistent with your workouts",
    description:
      "Consistency beats the perfect program. Practical ways to keep training: smaller goals, fixed times, shorter sessions on busy days and a plan for missed weeks.",
    date: "2026-11-11",
    tag: "Training",
    cta: "time",
    body: [
      {
        p: "The best program is the one you keep doing. A plain plan done for a year beats a perfect one done for three weeks. These are the habits that keep people training.",
      },
      { h2: "Make it easy to start" },
      {
        ul: [
          "**Pick a number of days you can hit on a bad week,** not a good one. Two or three is plenty to make progress. See [how many days a week to lift](/blog/how-many-days-a-week-to-lift/).",
          "**Put the sessions in your calendar** at fixed times, like any other appointment.",
          "**Shorten, don't skip.** A 30-minute session keeps the habit and most of the progress. See [30-minute strength workout](/blog/30-minute-strength-workout/).",
          "**Know the plan before you arrive.** Deciding what to do is half the effort.",
        ],
      },
      { cta: "time" },
      { h2: "Make progress visible" },
      {
        p: "Log your sets. Seeing a lift climb from 60 to 80 kg over a few months keeps you going far better than a mirror does. See [how to track your workouts](/blog/how-to-track-your-workouts/).",
      },
      { h2: "Plan for missed weeks" },
      {
        p: "You will miss weeks: illness, travel, work. Decide now that a missed week means you start again on Monday, a little lighter, not that the plan has failed. See [getting back into lifting](/blog/getting-back-into-lifting/).",
      },
      { h2: "In Liftsmith" },
      {
        p: "Set a weekly goal and the length you have, and Liftsmith fits the workout to the time. On a busy day, slide the length down and it drops exercises from the end of the plan. If your weekly goal is at risk, a coach's note offers a 30-minute workout to keep it.",
      },
    ],
    faq: [
      [
        "How long does it take to build a workout habit?",
        "It varies a lot from person to person, often a couple of months. Sticking to a small, fixed routine makes it come sooner.",
      ],
      ["Is it better to work out short or skip?", "Short. A shorter session keeps the habit and still counts toward your weekly sets."],
    ],
  },
  {
    slug: "unilateral-training",
    kind: "blog",
    title: "Unilateral training: why single-leg and single-arm work helps",
    description:
      "Single-leg and single-arm exercises even out left-right differences, train balance and work hard with light weights. The best moves and how to use them.",
    date: "2026-11-11",
    tag: "Exercises",
    cta: "plan",
    body: [
      {
        p: "Unilateral exercises train one side at a time: split squats, single-leg Romanian deadlifts, one-arm rows. They won't replace squats and bench presses, but they do a few things two-sided lifts can't.",
      },
      { h2: "Why use them" },
      {
        ul: [
          "**They even out differences.** Each side has to do its own share, so a weaker side can't hide.",
          "**They need less weight.** A split squat works the legs hard with a fraction of a back squat's load, which is kind to the lower back.",
          "**They train balance and the hips' side muscles,** which matter for running, sport and everyday life.",
          "**They're great at home.** One or two dumbbells go a long way.",
        ],
      },
      { cta: "plan" },
      { h2: "The best unilateral exercises" },
      {
        ul: [
          "**Legs:** Bulgarian split squat, reverse lunge, step-up, single-leg Romanian deadlift.",
          "**Upper body:** one-arm dumbbell row, single-arm cable press, one-arm overhead press.",
          "**Core:** suitcase carries and side planks.",
        ],
      },
      { exercises: ["bulgarian-split-squat", "reverse-lunge", "step-up", "single-leg-rdl", "db-row", "side-plank"] },
      { h2: "How to program them" },
      {
        p: "Put one or two after your main lift, at 2 to 3 sets of 8 to 12 per side. Start with your weaker side and match its reps on the other. See [leg workout](/blog/leg-workout/) and [exercise order](/blog/exercise-order/).",
      },
    ],
    faq: [
      [
        "Are single-leg exercises better than squats?",
        "Neither is better. Squats let you lift heavier; single-leg work evens out sides and is easier on the back. Most plans use both.",
      ],
      ["Which side should I start with?", "Your weaker side. Then do the same reps on the stronger one."],
    ],
  },
  {
    slug: "how-long-to-build-muscle",
    kind: "blog",
    title: "How long does it take to build muscle? Realistic numbers",
    description:
      "How fast muscle really grows: what to expect in the first months and years, why progress slows, and how to tell it's working before the mirror shows it.",
    date: "2026-11-11",
    tag: "Progress",
    cta: "progress",
    body: [
      {
        p: "Muscle grows slower than most people hope and faster than most people quit. You'll get stronger within weeks, see a difference in a few months, and keep building for years, just more slowly each year.",
      },
      { h2: "What to expect" },
      {
        ul: [
          "**First few weeks:** strength jumps as you learn the lifts. Not much new muscle yet.",
          "**First year:** the fastest growth you'll ever have, if you train hard, eat enough protein and sleep well. Clear changes in the mirror and in how clothes fit.",
          "**Years two and three:** roughly half as fast as year one.",
          "**After that:** slow and steady. Progress is measured in small strength gains and a little more size each year.",
        ],
      },
      { cta: "progress" },
      { h2: "How to tell it's working" },
      {
        p: "The mirror is the slowest and least reliable signal. Better ones: your weights or reps going up in the 6 to 15 rep range, arm and chest measurements creeping up while your waist stays put, and body weight rising slowly on a surplus. See [how to take body measurements](/blog/how-to-take-body-measurements/).",
      },
      { h2: "What speeds it up" },
      {
        ul: [
          "**Enough hard sets:** about 10 to 20 a week per muscle. See [how many sets per week](/blog/how-many-sets-per-week-to-build-muscle/).",
          "**Adding weight or reps over time.** See [progressive overload](/guides/progressive-overload/).",
          "**Protein and a small surplus.** See [lean bulk](/blog/lean-bulk/).",
          "**Consistency:** months of training, not weeks. See [how to stay consistent](/blog/how-to-stay-consistent-with-workouts/).",
        ],
      },
    ],
    faq: [
      [
        "How long until I see muscle gains?",
        "Most people notice a difference after two to three months of consistent training, and others notice it a little later.",
      ],
      [
        "Why has my muscle growth slowed down?",
        "It's normal: the closer you get to your potential, the slower it comes. More sets, better recovery or a small surplus can help.",
      ],
    ],
  },
];
