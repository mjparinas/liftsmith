import type { Article } from "../articles";

// Blog, part twelve: more training ideas. Belly fat, sleep, creatine, eating before training, grip,
// gaining as a skinny lifter, minimal workouts, lifting belts, lifting for runners and overtraining.
export const BLOG_L: Article[] = [
  {
    slug: "how-to-lose-belly-fat",
    kind: "blog",
    title: "How to lose belly fat: what actually works",
    description:
      "You can't burn fat from one spot with crunches. Here's what does shrink your waist: a calorie deficit, enough protein, strength training and patience.",
    date: "2026-11-11",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: "Crunches build your abs, but they don't burn the fat over them. Your body decides where it loses fat first, and for many people the belly is one of the last places to go. What you control is the total: lose fat overall and your waist comes down with it.",
      },
      { h2: "What works" },
      {
        ul: [
          "**A modest calorie deficit:** about 300 to 500 calories a day under maintenance. Our [TDEE calculator](/tools/tdee-calculator/) gives a starting point.",
          "**Plenty of protein,** about 1.6 to 2.2 g per kg of body weight. It keeps you full and protects muscle. See [how much protein to build muscle](/blog/how-much-protein-to-build-muscle/).",
          "**Strength training** two to four times a week, so the weight you lose is fat and not muscle. See [lifting on a cut](/blog/lifting-on-a-cut/).",
          "**Daily movement:** walking adds up to more than most gym cardio.",
          "**Sleep:** short nights make you hungrier and less careful with food.",
        ],
      },
      { cta: "tdee" },
      { h2: "How to track it" },
      {
        p: "Measure your waist at the belly button once a week, first thing in the morning, and watch the trend over a month. It tells you more than the scale, which swings with water. See [how to take body measurements](/blog/how-to-take-body-measurements/).",
      },
      { h2: "Do ab exercises help?" },
      {
        p: "They build the muscle underneath, which shows more as fat comes off, and a strong core helps every lift. Two or three sets a few times a week is plenty. See [ab workout](/blog/ab-workout/).",
      },
      { exercises: ["plank", "side-plank", "hanging-leg-raise", "cable-crunch"] },
      { h2: "In Liftsmith" },
      {
        p: "Log your waist on Body and photos. If your waist is growing or shrinking and there's no body fat data, a coach's note tells you what it means for your goal.",
      },
    ],
    faq: [
      ["Can I lose belly fat with exercise alone?", "It's hard. Exercise helps, but a calorie deficit from food does most of the work."],
      [
        "How long does it take to lose belly fat?",
        "At about 0.5 to 1% of body weight a week, most people see a clear difference in their waist in two to three months.",
      ],
    ],
  },
  {
    slug: "sleep-and-muscle-growth",
    kind: "blog",
    title: "Sleep and muscle growth: how much sleep do lifters need?",
    description:
      "Why sleep matters for strength and muscle, how many hours lifters need, what a short night does to your next workout, and simple ways to sleep better.",
    date: "2026-11-11",
    tag: "Recovery",
    cta: "recovery",
    body: [
      {
        p: "Training breaks muscle down and asks it to grow back stronger. Most of that rebuilding happens while you rest, and sleep is the biggest part of rest. Lifters who sleep well recover faster, feel better in the gym and tend to keep more muscle when dieting.",
      },
      { h2: "How much sleep" },
      {
        p: "Seven to nine hours a night suits most adults. If you train hard, aim for the top of that range. One short night won't ruin anything; weeks of six hours or less will show up as stalled lifts and lingering soreness.",
      },
      { cta: "recovery" },
      { h2: "Training after a bad night" },
      {
        ul: [
          "**Keep the session, lower the effort.** Do the plan, but stop each set a rep or two further from failure.",
          "**Skip records.** A short night isn't the day to test a max.",
          "**Shorten it if you need to.** Main lifts first, accessories if you feel up to it.",
        ],
      },
      { h2: "Sleeping better" },
      {
        ul: [
          "Go to bed and get up at about the same time every day.",
          "Keep the bedroom dark, cool and quiet.",
          "Stop caffeine about eight hours before bed.",
          "Train earlier in the evening if late sessions keep you awake.",
        ],
      },
      { h2: "In Liftsmith" },
      {
        p: "If your phone or watch tracks sleep through Health Connect or Apple Health, a short night counts toward today's readiness, along with heart rate variability and resting heart rate, and the day's call can ease the workout. See [HRV and training readiness](/blog/hrv-and-training-readiness/).",
      },
    ],
    faq: [
      [
        "Does lack of sleep stop muscle growth?",
        "It doesn't stop it, but regular short sleep slows recovery and makes it harder to train hard and keep muscle on a diet.",
      ],
      ["Should I work out if I slept badly?", "Usually yes, a little easier than planned. Skip it if you feel unwell."],
    ],
  },
  {
    slug: "creatine-for-lifters",
    kind: "blog",
    title: "Creatine for lifters: what it does and how to take it",
    description:
      "Creatine is the best-studied supplement for strength. What it does, how much to take, whether you need to load it, and common worries answered.",
    date: "2026-11-11",
    tag: "Nutrition",
    cta: "progress",
    body: [
      {
        p: "Creatine helps your muscles make energy for short, hard efforts like a set of squats. Taking it raises the amount stored in your muscles, which lets most people do a rep or two more per set. Over months that adds up to a little more strength and muscle. It's one of the most studied supplements there is.",
      },
      { h2: "How to take it" },
      {
        ul: [
          "**Creatine monohydrate,** the plain kind. Fancier forms cost more and aren't better.",
          "**3 to 5 g a day,** every day, at any time. With a meal is easiest to remember.",
          "**Loading is optional.** 20 g a day for a week fills your muscles faster; 3 to 5 g a day gets there in about a month.",
        ],
      },
      { cta: "progress" },
      { h2: "Common worries" },
      {
        ul: [
          "**Weight gain:** a kilo or so in the first weeks is water stored in the muscle, not fat.",
          "**Kidneys:** studies in healthy people at normal doses haven't found harm. If you have kidney problems or take medication, ask your doctor first.",
          "**Hair loss:** this comes from one small study that has never been repeated, and it didn't measure hair loss.",
        ],
      },
      { h2: "It's a small extra" },
      {
        p: "Creatine helps at the edges. Training hard, adding weight over time, eating enough protein and sleeping well matter far more. See [progressive overload](/guides/progressive-overload/) and [sleep and muscle growth](/blog/sleep-and-muscle-growth/).",
      },
    ],
    faq: [
      ["Do I need to cycle creatine?", "No. It's taken daily without breaks in most studies."],
      ["Does creatine work for women?", "Yes. The effects are similar, and the water weight gain is usually small."],
    ],
  },
  {
    slug: "what-to-eat-before-a-workout",
    kind: "blog",
    title: "What to eat before a workout (and after)",
    description:
      "Simple pre-workout meals and snacks for lifting, how long before training to eat, whether training fasted is fine, and what to eat afterwards.",
    date: "2026-11-11",
    tag: "Nutrition",
    cta: "plan",
    body: [
      {
        p: "You don't need anything special before lifting. A normal meal a few hours before, or a small snack an hour before, gives you energy without a heavy stomach. What you eat over the whole day matters much more than the hour around training.",
      },
      { h2: "Before" },
      {
        ul: [
          "**Two to three hours before:** a normal meal with protein and carbs. Chicken and rice, eggs on toast, a burrito.",
          "**Under an hour before:** something small and easy to digest. A banana, yogurt, a slice of toast with honey.",
          "**Keep fat and fibre light** right before training, so your stomach is settled.",
        ],
      },
      { cta: "plan" },
      { h2: "Can I train fasted?" },
      {
        p: "Yes, if it suits you. Many people lift fine first thing in the morning on an empty stomach. If your sessions feel flat, try a small snack or a coffee with milk first and see if it helps.",
      },
      { h2: "After" },
      {
        p: "Eat a meal with 20 to 40 g of protein within a few hours. There's no need to rush a shake into the changing room; the window is wide. See [how much protein to build muscle](/blog/how-much-protein-to-build-muscle/).",
      },
      { h2: "Caffeine" },
      {
        p: "A coffee 30 to 60 minutes before training helps most people lift a little more. Skip it for evening sessions if it costs you sleep.",
      },
    ],
    faq: [
      ["How long before a workout should I eat?", "A meal two to three hours before, or a small snack under an hour before."],
      ["Do I need a protein shake after lifting?", "No. Any meal with protein in the hours after works just as well."],
    ],
  },
  {
    slug: "grip-strength",
    kind: "blog",
    title: "Grip strength: why it matters and how to train it",
    description:
      "A weak grip limits your deadlifts, rows and pull-ups. The best grip exercises, how to fit them into your week, and when to use straps.",
    date: "2026-11-11",
    tag: "Strength",
    cta: "plan",
    body: [
      {
        p: "If the bar slips out of your hands before your back or legs are done, your grip is holding back the rest of you. Grip also matters for carrying, climbing and daily life. The good news: it responds quickly to training.",
      },
      { h2: "The best grip exercises" },
      {
        ul: [
          "**Farmer's carry:** heavy dumbbells or kettlebells, walk 20 to 40 metres. 3 trips.",
          "**Dead hang:** hang from a pull-up bar as long as you can. 2 to 3 holds.",
          "**Suitcase carry:** one heavy weight in one hand, walk tall. It trains your sides too.",
          "**Wrist curl:** 2 sets of 15 to 20 for the forearms.",
        ],
      },
      { exercises: ["farmers-carry", "dead-hang", "db-suitcase-carry", "barbell-wrist-curl"] },
      { cta: "plan" },
      { h2: "Fitting it in" },
      {
        p: "Add one grip exercise at the end of two sessions a week. Pull-ups, rows and deadlifts done without straps also train grip, so you may not need much extra. See [forearms](/muscles/forearms/).",
      },
      { h2: "Straps, chalk and mixed grip" },
      {
        ul: [
          "**Chalk** keeps your hands dry and helps on every pulling lift.",
          "**Straps** are fine for your heaviest deadlift and row sets, so grip doesn't cut a back workout short. Keep the warm-ups and lighter sets strap-free.",
          "**Mixed grip** (one palm up) holds heavier deadlifts but is harder on the biceps of the palm-up arm. Swap hands between sets.",
        ],
      },
    ],
    faq: [
      [
        "How do I stop my grip failing on deadlifts?",
        "Use chalk, hold the bar low in your fingers, train carries and hangs, and use straps for the heaviest sets.",
      ],
      ["How long does it take to improve grip?", "Most people notice a stronger grip within four to six weeks."],
    ],
  },
  {
    slug: "skinny-guy-workout",
    kind: "blog",
    title: "Workout plan for skinny guys: how to finally gain weight",
    description:
      "Struggling to gain weight? A simple plan for skinny lifters: eat enough, train three or four days a week with the big lifts, and track the scale.",
    date: "2026-11-11",
    tag: "Beginners",
    cta: "tdee",
    body: [
      {
        p: "If you've always been skinny, the problem is almost never the workout. It's food. Most people who can't gain weight eat less than they think. Fix that, train the big lifts with a simple plan, and you'll gain.",
      },
      { h2: "Eat enough" },
      {
        ul: [
          "**Work out your maintenance** with our [TDEE calculator](/tools/tdee-calculator/), then eat about 300 to 500 more a day.",
          "**Weigh yourself** a few mornings a week. Aim for about 0.25 to 0.5 kg a week. No gain for two weeks? Add 200 calories.",
          "**Drink some of it.** Milk, smoothies and shakes add calories without filling you up.",
          "**Protein at every meal:** about 1.6 to 2.2 g per kg of body weight a day.",
        ],
      },
      { cta: "tdee" },
      { h2: "Train the big lifts" },
      {
        p: "Three full-body days a week, built on squats, presses, rows and deadlifts, 3 sets of 6 to 12, adding weight or reps every week. See [3-day full-body workout](/blog/3-day-full-body-workout/) or, for four days, the [upper/lower split](/blog/upper-lower-split/).",
      },
      { exercises: ["back-squat", "bench-press", "barbell-row", "romanian-deadlift", "overhead-press", "pull-up"] },
      { h2: "What to skip" },
      {
        ul: [
          "Lots of cardio. Keep it to a couple of short sessions a week for health.",
          "Program hopping. Run one plan for at least three months.",
          "Training to failure on every set. It costs recovery you need for growing. See [should you train to failure](/blog/should-you-train-to-failure/).",
        ],
      },
      { h2: "What to expect" },
      {
        p: "A new lifter eating enough can gain several kilos in the first few months, much of it muscle. See [lean bulk](/blog/lean-bulk/) and [how long to build muscle](/blog/how-long-to-build-muscle/).",
      },
    ],
    faq: [
      [
        "Why can't I gain weight?",
        "Almost always because you're not eating more than you burn. Track your food and the scale for two weeks.",
      ],
      ["Is it OK to eat junk food to bulk?", "Some is fine, but most of your food should be meals with protein, carbs and vegetables."],
    ],
  },
  {
    slug: "minimalist-workout",
    kind: "blog",
    title: "Minimalist workout: the least you can do and still get strong",
    description:
      "Short on time? A minimalist strength plan with four movements, two short sessions a week, and how far it can take you before you need more.",
    date: "2026-11-11",
    tag: "Short workouts",
    cta: "time",
    body: [
      {
        p: "You don't need five days a week and a dozen exercises to get strong. A few big movements, done hard twice a week, build most of the strength and muscle a busy person needs. It's the plan to fall back on when life is full.",
      },
      { h2: "The workout" },
      {
        p: "Twice a week, 30 to 40 minutes. 3 hard sets of each, 6 to 12 reps, stopping a rep or two short of failure.",
      },
      {
        ol: [
          "**A squat or lunge:** goblet squat, back squat or split squat",
          "**A hinge:** Romanian deadlift, deadlift or hip thrust",
          "**A push:** bench press, push-up or overhead press",
          "**A pull:** row, pulldown or pull-up",
        ],
      },
      { exercises: ["goblet-squat", "romanian-deadlift", "push-up", "db-row"] },
      { cta: "time" },
      { h2: "Why it works" },
      {
        p: "Those four movements train nearly every muscle. Six hard sets a week per muscle is less than ideal, but it's well past the point where most of the benefit comes from. See [how many sets per week](/blog/how-many-sets-per-week-to-build-muscle/).",
      },
      { h2: "When to add more" },
      {
        p: "When progress stalls for a few weeks and you have the time, add a third day or a couple of sets of arms and calves. See [how many days a week to lift](/blog/how-many-days-a-week-to-lift/) and [2-day full-body workout](/blog/2-day-full-body-workout/).",
      },
      { h2: "In Liftsmith" },
      {
        p: "Set your weekly goal to two days and slide the length down to 30 minutes. Liftsmith keeps the big compound lifts and drops exercises from the end of the plan.",
      },
    ],
    faq: [
      ["Can you get strong training twice a week?", "Yes. Two hard full-body sessions a week build strength for years."],
      [
        "What's the minimum workout to maintain muscle?",
        "About a third of your usual sets, at the same effort, holds most muscle for months.",
      ],
    ],
  },
  {
    slug: "lifting-belt",
    kind: "blog",
    title: "Lifting belt: do you need one and when to use it",
    description:
      "What a lifting belt does, who benefits, which lifts to wear it for, how tight to wear it and how to brace with it. Plus when to leave it off.",
    date: "2026-11-11",
    tag: "Strength",
    cta: "plan",
    body: [
      {
        p: "A lifting belt doesn't hold your back straight. It gives your core something to push against when you brace, which raises the pressure inside your trunk and makes it stiffer. Most lifters can squat and deadlift a little more with one.",
      },
      { h2: "Do you need one?" },
      {
        ul: [
          "**Not as a beginner.** Learn to brace without one first, for the first several months.",
          "**Useful later** for heavy squats, deadlifts and overhead presses, at roughly 80% of your max and up.",
          "**Not needed** for light sets, machines, isolation work or most dumbbell exercises.",
        ],
      },
      { exercises: ["back-squat", "deadlift", "overhead-press"] },
      { cta: "plan" },
      { h2: "How to wear it" },
      {
        ol: [
          "Wrap it around your belly, just above your hip bones.",
          "Tighten it so you can just slide a flat hand between belt and belly.",
          "Breathe into your belly and push out against the belt in every direction, then lift.",
        ],
      },
      { h2: "Which belt" },
      {
        p: "A plain 10 mm leather belt with a prong or lever lasts years. Velcro belts are fine for lighter work and for carrying in a gym bag.",
      },
      { h2: "Belt or no belt in your log" },
      {
        p: "Belted lifts are usually a bit heavier. Use the belt the same way each time, for example only on your top sets, so your numbers stay comparable. See [how to increase your squat](/blog/how-to-increase-your-squat/) and [how to increase your deadlift](/blog/how-to-increase-your-deadlift/).",
      },
    ],
    faq: [
      [
        "Does a lifting belt make your core weak?",
        "No. You still brace hard with a belt; it just gives the brace something to push against.",
      ],
      ["When should I start using a belt?", "After you've learned to brace without one, for heavy sets of squats and deadlifts."],
    ],
  },
  {
    slug: "strength-training-for-runners",
    kind: "blog",
    title: "Strength training for runners: a simple twice-a-week plan",
    description:
      "Lifting makes runners more efficient and more durable. A twice-weekly strength plan for runners, how to fit it around runs, and what to skip.",
    date: "2026-11-11",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Strength training helps runners in two ways: stronger legs and hips make each stride cheaper, and stronger tissues hold up better to mileage. It won't make you bulky; two short sessions a week is plenty.",
      },
      { h2: "The workout" },
      {
        p: "Twice a week, 30 to 40 minutes. 3 sets of 5 to 8 on the main lifts, 2 to 3 sets of 8 to 12 on the rest.",
      },
      {
        ol: [
          "**Back squat or trap bar deadlift:** heavy, 3 sets of 5 to 6",
          "**Bulgarian split squat or step-up:** 3 sets of 8 per leg",
          "**Single-leg calf raise:** 3 sets of 10 to 15 per leg, slow",
          "**Nordic curl or Romanian deadlift:** 2 to 3 sets",
          "**Side plank or Copenhagen plank:** 2 holds per side",
        ],
      },
      {
        exercises: [
          "back-squat",
          "trap-bar-deadlift",
          "bulgarian-split-squat",
          "step-up",
          "single-leg-calf-raise",
          "nordic-curl",
          "copenhagen-plank",
        ],
      },
      { cta: "plan" },
      { h2: "Fitting it around runs" },
      {
        ul: [
          "**Lift on hard run days,** after the run or later the same day, so easy days stay easy.",
          "**Keep two days between lifting and a long run or race.**",
          "**Cut to one session a week** in the last weeks before a race, at the same weight with fewer sets.",
        ],
      },
      { h2: "Heavy or light?" },
      {
        p: "Heavy. Light weights for lots of reps mostly add more of the endurance you already get from running. Heavy sets of 3 to 6 build the strength and stiffness that make running cheaper. See [cardio and strength training](/blog/cardio-and-strength-training/).",
      },
    ],
    faq: [
      ["Will lifting slow me down?", "No. Two short heavy sessions a week usually make runners faster and less injury-prone."],
      ["Should runners lift before or after running?", "After a hard run, or later the same day, so the run gets your best legs."],
    ],
  },
  {
    slug: "overtraining-signs",
    kind: "blog",
    title: "Overtraining: the signs and what to do about it",
    description:
      "Stalled lifts, constant soreness, poor sleep and dreading the gym can mean you're doing more than you recover from. The signs and how to fix it.",
    date: "2026-11-11",
    tag: "Recovery",
    cta: "deload",
    body: [
      {
        p: "True overtraining, months of being run down, is rare in lifters. What's common is doing a bit more than you recover from for a few weeks: fatigue builds faster than fitness, and progress stalls. The fix is usually simple.",
      },
      { h2: "The signs" },
      {
        ul: [
          "Missing reps you hit easily two weeks ago, on several lifts at once.",
          "Soreness that doesn't fade between sessions.",
          "Sleeping badly, feeling flat, or dreading workouts you used to enjoy.",
          "Resting heart rate higher than usual, or heart rate variability lower, for several days.",
          "Aches in joints and tendons that keep coming back.",
        ],
      },
      { cta: "deload" },
      { h2: "What to do" },
      {
        ol: [
          "**Take a deload week:** about half the sets, lighter effort. See [deload week](/guides/deload-week/).",
          "**Check the basics:** sleep, food and stress outside the gym.",
          "**Come back with a little less:** fewer sets, or stop each set a rep further from failure. See [reps in reserve](/guides/reps-in-reserve/).",
        ],
      },
      { h2: "How to avoid it" },
      {
        p: "Plan easier weeks before you need them, raise volume gradually, and treat a bad week as information rather than something to push through. See [periodization explained](/blog/periodization-explained/) and [how to break a strength plateau](/blog/how-to-break-a-strength-plateau/).",
      },
      { h2: "In Liftsmith" },
      {
        p: "Liftsmith plans a deload after each block. If you miss reps three workouts running, a coach's note offers to start the deload now, and when several lifts stall at once it suggests a deload rather than pushing harder.",
      },
    ],
    faq: [
      ["How long does it take to recover from overtraining?", "A week or two of lighter training fixes most short-term fatigue."],
      [
        "Is it overtraining or just a bad day?",
        "One bad session is normal. Several weeks of slipping numbers and feeling flat is a sign to back off.",
      ],
    ],
  },
];
