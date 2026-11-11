import type { Article } from "../articles";

// Blog, part seven: the bigger exercise library. Bands, cables, machines versus free weights, cardio
// alongside lifting, and short conditioning finishers.
export const BLOG_G: Article[] = [
  {
    slug: "resistance-band-workout",
    kind: "blog",
    title: "Full-body resistance band workout: build strength with bands",
    description:
      "A full-body resistance band workout you can do anywhere, how to pick band tension, and how to keep progressing when bands are all you have.",
    date: "2026-11-11",
    tag: "Home",
    cta: "home",
    body: [
      {
        p: "A set of resistance bands costs less than one dumbbell, fits in a drawer and trains every muscle you have. They're perfect for travel, a small flat, or as a warm-up and finisher in a full gym. The catch is that bands get harder as they stretch, so you need to set them up well and progress them on purpose.",
      },
      { h2: "How bands are different" },
      {
        p: "A dumbbell weighs the same at every point of a rep. A band is easiest at the start and hardest at full stretch. That suits pressing, rowing and hip work, where you're strongest at the end, and it's kind to joints. It also means you should control the way back: let the band snap you back and you lose half the rep.",
      },
      { h2: "The workout" },
      {
        p: "Do this two or three times a week. Three sets of 12 to 20 reps for each exercise, stopping one or two reps before you can't keep good form. Rest about a minute.",
      },
      { exercises: ["band-squat", "band-chest-press", "band-row", "band-deadlift", "band-overhead-press", "band-lat-pulldown"] },
      { cta: "home" },
      { h2: "Add these for arms, shoulders and hips" },
      { exercises: ["band-curl", "band-triceps-extension", "band-face-pull", "band-pull-apart", "band-lateral-walk", "band-pallof-press"] },
      {
        tip: "[Band pull-aparts](/exercises/band-pull-apart/) and [face pulls](/exercises/band-face-pull/) are worth doing even in a full gym: a couple of sets before pressing warms up your shoulders and balances out all the pushing.",
      },
      { h2: "How to keep progressing with bands" },
      {
        ol: [
          "**Add reps first.** Once you hit 20 clean reps on every set, it's time for more tension.",
          "**Shorten the band.** Stand wider, step further from the anchor, or wrap it once more round your hands.",
          "**Move up a band, or double up.** Two lighter bands together are often the right step between two heavier ones.",
          "**Slow down.** Three seconds on the way back makes a light band feel heavy.",
          "**Go one side at a time.** One-arm rows and presses double the load on each side.",
        ],
      },
      { h2: "Planning a band workout in Liftsmith" },
      {
        p: "Tell Liftsmith you have bands (and anything else you own, like a [pull-up bar](/equipment/pullup-bar/)) and every workout uses only that. Liftsmith has over 20 band exercises, each with setup, cues and a 3D demo, and it moves your reps forward each session. See also [home gym on a budget](/blog/home-gym-on-a-budget/) for what to buy next.",
      },
    ],
    faq: [
      [
        "Can you build muscle with resistance bands?",
        "Yes. Muscles respond to hard sets close to failure, and bands can provide that, especially for beginners and higher-rep work. Progress by adding reps, tension and slower lowering.",
      ],
      [
        "What band tension should I start with?",
        "One you can do 15 controlled reps with while the last few feel hard. Most people need a lighter band for arms and shoulders and a heavier one for squats, rows and deadlifts.",
      ],
    ],
  },
  {
    slug: "cable-machine-exercises",
    kind: "blog",
    title: "Cable machine exercises: a beginner's guide to the cable stack",
    description:
      "How to use the cable machine: pulley height, attachments, and the cable exercises worth learning for chest, back, shoulders, arms and core.",
    date: "2026-11-11",
    tag: "Exercises",
    cta: "plan",
    body: [
      {
        p: "The cable machine looks complicated: pulleys that move, a box of handles, numbers on a stack. But it's one of the most useful pieces of kit in the gym. Cables keep tension on the muscle through the whole rep, let you pull from any angle, and change weight with a pin. Once you know three settings, you can use it for almost anything.",
      },
      { h2: "The three settings" },
      {
        ul: [
          "**Pulley height:** low for curls, kickbacks and low-to-high flies; chest height for rows, presses and Pallof presses; high for pushdowns, face pulls and crunches.",
          "**Attachment:** a single handle for one-arm work, a rope for face pulls, pushdowns and hammer curls, a bar for pulldowns and curls.",
          "**Weight:** stacks vary between machines, so the number on one won't match another. Find your weight once per machine, and log it so you can repeat it.",
        ],
      },
      { h2: "Cable exercises worth learning" },
      { exercises: ["face-pull", "cable-fly", "single-arm-cable-row", "cable-lateral-raise", "rope-pushdown", "cable-curl"] },
      { cta: "plan" },
      { h2: "For your core and hips" },
      { exercises: ["pallof-press", "cable-woodchop", "cable-crunch", "cable-pull-through", "cable-kickback"] },
      {
        p: "The [Pallof press](/exercises/pallof-press/) is a favourite: you press the handle straight out and resist the cable pulling you round, which trains your core to stay still, exactly its job when you squat and deadlift.",
      },
      { h2: "Tips for better cable sets" },
      {
        ol: [
          "**Step away until the stack lifts** at the start of the rep, so tension never drops.",
          "**Stand in a split stance** for presses and flies, so you're braced instead of being pulled over.",
          "**Pause at the squeeze,** then lower slowly. The plates should never clank between reps.",
          "**Use cables after your big lifts,** not instead of them: they're ideal for the second half of a workout. See [compound vs isolation exercises](/blog/compound-vs-isolation-exercises/).",
        ],
      },
      { h2: "Let Liftsmith pick them" },
      {
        p: "Add a cable station to your gym in Liftsmith and it can pick from over 20 cable exercises to fill the muscles you still need this week, each with setup, cues and a 3D demo. Your last weight on each one is filled in next time, so you never have to remember which pin you used.",
      },
    ],
    faq: [
      [
        "Are cable exercises as good as free weights?",
        "For building muscle, yes. Cables keep steady tension and are easy to adjust. Free weights still matter for heavy compound lifts, so most plans use both.",
      ],
      [
        "Why does the same cable weight feel different on another machine?",
        "Pulley ratios and friction differ, so the number on the stack isn't a true weight. Keep notes per machine, or let your app remember per gym.",
      ],
    ],
  },
  {
    slug: "machines-vs-free-weights",
    kind: "blog",
    title: "Machines vs free weights: which should you use?",
    description:
      "Machines vs free weights for muscle and strength: what each does best, who should start with which, and how to combine them in one plan.",
    date: "2026-11-11",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "Some lifters treat machines as cheating; others never leave them. Both camps are missing out. Machines and free weights build muscle about equally well when you train them hard. They differ in what else they give you, and the best plans use each for what it does best.",
      },
      { h2: "What free weights do best" },
      {
        ul: [
          "**Heavy strength.** Barbell squats, deadlifts and presses let you load the most weight and build whole-body strength.",
          "**Balance and coordination.** Stabilizing the weight trains the small muscles that machines do for you.",
          "**Anywhere use.** Dumbbells and a bar work at home, in a hotel or in any gym.",
        ],
      },
      { exercises: ["back-squat", "deadlift", "bench-press", "overhead-press", "db-row", "goblet-squat"] },
      { h2: "What machines do best" },
      {
        ul: [
          "**Learning safely.** A fixed path lets beginners push hard without worrying about technique or a spotter.",
          "**Isolating a muscle.** Leg extensions, leg curls and pec decks hit one muscle without the rest of your body tiring first.",
          "**Training hard when tired.** Late in a workout, or around an injury, a machine lets you get close to failure safely.",
        ],
      },
      { exercises: ["leg-press", "lat-pulldown", "machine-chest-press", "seated-leg-curl", "leg-extension", "assisted-pull-up"] },
      { cta: "plan" },
      { h2: "What the research says" },
      {
        p: "Studies comparing machine and free-weight training (for example, Schwanbeck and colleagues, 2020, on squats and leg presses) found similar muscle growth. Free weights tend to win when strength is tested with free weights, and machines when it's tested on machines: you get best at what you practise.",
      },
      { h2: "How to combine them" },
      {
        ol: [
          "**Start each workout with a free-weight compound lift** while you're fresh.",
          "**Follow with machines and cables** for extra sets on the muscles you want to grow.",
          "**Swap freely when you need to.** A busy rack, a sore back or a crowded gym is a reason to pick the machine, not to skip the muscle. See [training around an injury](/blog/training-around-an-injury/).",
        ],
      },
      {
        p: "Liftsmith does this for you. It plans from the equipment your gym actually has, puts the big lifts first, fills the rest with machines and cables, and offers a one-tap swap when something is taken.",
      },
    ],
    faq: [
      [
        "Are machines good for beginners?",
        "Yes. They're a safe way to learn to push hard. Add free-weight lifts like goblet squats and dumbbell presses early so you build balance too.",
      ],
      [
        "Can you build muscle with only machines?",
        "Yes. Muscle growth comes from hard sets and enough weekly volume, which machines provide well.",
      ],
    ],
  },
  {
    slug: "cardio-and-strength-training",
    kind: "blog",
    title: "Cardio and strength training: how to do both without losing gains",
    description:
      "Does cardio kill gains? How to combine cardio and lifting: how much to do, which kinds, whether to do it before or after, and how to track it.",
    date: "2026-11-11",
    tag: "Programming",
    cta: "log",
    body: [
      {
        p: "Cardio has a reputation for eating muscle. The truth is gentler: a sensible amount of cardio barely affects strength or muscle gains, and it makes your heart, your recovery between sets and your general health better. The trouble only starts with a lot of it, done at the wrong time.",
      },
      { h2: "Does cardio kill gains?" },
      {
        p: "Research on doing both (often called concurrent training; see the review by Schumann and colleagues, 2022) found that adding cardio didn't reduce muscle growth or maximal strength for most people. Explosive power took a small hit, mostly with running. If you're not a powerlifter peaking for a meet, you can do both.",
      },
      { h2: "How much is enough" },
      {
        ul: [
          "**Two or three sessions a week, 20 to 40 minutes,** mostly at a pace where you can still talk.",
          "**One harder session a week** if you like it: intervals on a bike or a rower.",
          "**Walking counts.** A daily brisk walk is the easiest cardio there is, and it barely touches your recovery.",
        ],
      },
      { exercises: ["incline-walk", "stationary-bike", "rowing-machine", "outdoor-run", "elliptical", "ski-erg"] },
      { cta: "log" },
      { h2: "Before or after lifting?" },
      {
        ol: [
          "**Lift first** when strength is the goal, then do your cardio, or do cardio on another day.",
          "**Keep hard leg cardio away from leg day.** Intervals the day before heavy squats cost you reps.",
          "**Pick low-impact options** (bike, rower, incline walk) if your legs are sore or recovering. See [how long muscles take to recover](/blog/how-long-do-muscles-take-to-recover/).",
        ],
      },
      { h2: "Track it like a lift" },
      {
        p: "Cardio progress is time and distance: going the same distance faster, or further in the same time. In Liftsmith, cardio exercises log **time** and, for runs, walks, rides, rows and sleds, **distance** too, both pre-filled from last time so logging stays one tap. Strength plans stay strength plans; you add cardio to a routine or a workout when you want it, and pair a heart rate monitor to see how hard each session was.",
      },
    ],
    faq: [
      [
        "Should I do cardio on the same day as lifting?",
        "You can. Lift first, then do cardio, or split them by a few hours. Keep hard intervals away from your heaviest leg day.",
      ],
      [
        "What is the best cardio for lifters?",
        "Low-impact options like cycling, rowing and incline walking. They build fitness with little extra soreness.",
      ],
    ],
  },
  {
    slug: "conditioning-finishers",
    kind: "blog",
    title: "10-minute conditioning finishers to end your workout",
    description:
      "Short conditioning finishers to add after lifting: sled pushes, battle ropes, kettlebell swings, burpees and bike sprints, with sample timings.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "time",
    body: [
      {
        p: "A finisher is a short, hard block of conditioning at the end of a lifting workout. Five to ten minutes is enough to get your heart rate up, build work capacity and leave you feeling like you trained, without taking anything from your main lifts.",
      },
      { h2: "Rules for a good finisher" },
      {
        ul: [
          "**Short:** 10 minutes at most. It's the end of the workout, not a second one.",
          "**Simple:** movements you can do well when tired. No heavy barbell lifts.",
          "**Planned:** pick one before you start, so it doesn't become an excuse to skip the last lifts.",
        ],
      },
      { h2: "Five finishers to try" },
      {
        ol: [
          "**Sled sprints:** push 20 metres, walk back, 6 to 8 rounds. Hard on the legs, easy on the joints.",
          "**Swing ladder:** 10 [kettlebell swings](/exercises/kb-swing/), rest 30 seconds, then 15, then 20, then back down.",
          "**Rope and rest:** 20 seconds of [battle ropes](/exercises/battle-ropes/), 40 seconds rest, 8 rounds.",
          "**Bike sprints:** 15 seconds all-out on a [fan bike](/exercises/air-bike/), 45 seconds easy, 6 to 10 rounds.",
          "**Bodyweight minute:** every minute for 8 minutes, 8 [burpees](/exercises/burpee/) or 20 [mountain climbers](/exercises/mountain-climber/), resting for the rest of the minute.",
        ],
      },
      { exercises: ["sled-push", "kb-swing", "battle-ropes", "air-bike", "burpee", "med-ball-slam"] },
      { cta: "time" },
      { h2: "When to skip it" },
      {
        p: "Skip the finisher on a heavy leg day, in a [deload week](/guides/deload-week/), or when you're short on sleep. Finishers are a bonus. If they leave you sore for your next session, do less of them or keep them gentler.",
      },
      {
        tip: "Pair a heart rate monitor and watch how fast your heart rate drops in the rest periods. Getting faster over a few weeks is a good sign your conditioning is improving. See [heart rate during weight training](/blog/heart-rate-during-weight-training/).",
      },
      { h2: "Fitting it in" },
      {
        p: "Pick how many minutes you have in Liftsmith and it builds a workout that fits, warm-ups and rest included. Add a finisher to the end of a workout or save it in a routine, and log it by time, with distance for sleds, runs and rows.",
      },
    ],
    faq: [
      [
        "Do finishers burn fat?",
        "They burn some extra calories, but fat loss comes mostly from your diet. Finishers are best for fitness and work capacity.",
      ],
      ["How often should I do a finisher?", "Two or three times a week is plenty, on days your legs aren't the main focus."],
    ],
  },
];
