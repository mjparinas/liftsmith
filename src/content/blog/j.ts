import type { Article } from "../articles";

// Blog, part ten: workouts for one body part. Chest, back, legs, shoulders, arms, glutes, hamstrings,
// abs, calves and a home upper-body workout. Each links to its muscle page and the exercise pages.
export const BLOG_J: Article[] = [
  {
    slug: "chest-workout",
    kind: "blog",
    title: "Chest workout: 5 exercises, sets and reps for every level",
    description:
      "A chest workout built on a heavy press, an incline press and a fly, with sets and reps, how often to train chest, and a version for home.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "A good chest workout needs three things: a heavy press for strength, an incline press for the upper chest, and a fly or dip to work the muscle through a long stretch. Everything else is detail. Here's a session you can run once or twice a week.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Bench press:** 3 to 4 sets of 5 to 8",
          "**Incline dumbbell press:** 3 sets of 8 to 12",
          "**Cable fly or pec deck:** 2 to 3 sets of 12 to 15",
          "**Dip:** 2 sets of as many as you can with good form, leaving one or two in the tank",
          "**Push-up:** 1 set to finish, stopping a rep or two short of failure",
        ],
      },
      { exercises: ["bench-press", "db-incline-press", "cable-fly", "pec-deck", "dip", "push-up"] },
      { cta: "plan" },
      { h2: "How often and how much" },
      {
        p: "About 10 to 20 hard sets a week for the [chest](/muscles/chest/), over two sessions, works well for most people. The workout above is around 11 sets, so do it twice a week, or once alongside pressing on another day. Presses for the shoulders and triceps also train the chest a little.",
      },
      { h2: "Tips for a better chest workout" },
      {
        ul: [
          "**Pull your shoulder blades back and down** on presses. It protects the shoulders and puts more of the work on the chest.",
          "**Let the dumbbells and cables stretch the chest,** under control, rather than cutting the range short.",
          "**Add weight with double progression:** hit the top of the rep range on every set, then go up. See [progressive overload](/guides/progressive-overload/).",
        ],
      },
      { h2: "Chest workout at home" },
      {
        p: "With dumbbells and a bench: dumbbell bench press, incline press and dumbbell fly. With nothing: push-ups with your feet raised for the upper chest, slow tempo push-ups, and dips between two sturdy chairs. See [no-equipment strength workout](/blog/no-equipment-strength-workout/).",
      },
      { exercises: ["db-bench-press", "db-fly", "push-up"] },
    ],
    faq: [
      [
        "How many chest exercises should I do?",
        "Two to four per session is plenty: a heavy press, an incline press and a fly covers the whole muscle.",
      ],
      [
        "Is bench press enough for chest?",
        "It builds a lot of chest, but adding an incline press and a fly trains the upper chest and the stretched position better.",
      ],
    ],
  },
  {
    slug: "back-workout",
    kind: "blog",
    title: "Back workout: build width and thickness with 5 exercises",
    description:
      "A back workout with a vertical pull, a heavy row, a chest-supported row and rear-delt work. Sets, reps and how to feel your back working.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "Your back is a lot of muscles. The [lats](/muscles/lats/) give width and are trained by pulling down and in. The [upper back](/muscles/upper-back/) and [traps](/muscles/traps/) give thickness and are trained by rowing. A complete back workout does both.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Pull-up or lat pulldown:** 3 to 4 sets of 6 to 10",
          "**Barbell row:** 3 sets of 6 to 10",
          "**Chest-supported row:** 3 sets of 10 to 12",
          "**Face pull:** 2 to 3 sets of 12 to 15",
          "**Straight-arm pulldown:** 2 sets of 12 to 15",
        ],
      },
      { exercises: ["pull-up", "lat-pulldown", "barbell-row", "chest-supported-row", "face-pull", "rope-straight-arm-pulldown"] },
      { cta: "plan" },
      { h2: "How to feel your back, not your arms" },
      {
        ul: [
          "**Think about the elbows.** Pull them down to your sides on pulldowns and back past your ribs on rows. The hands just hold on.",
          "**Pause at the end** for a moment with the shoulder blades squeezed.",
          "**Use straps on heavy rows** if your grip gives out before your back does.",
        ],
      },
      { h2: "How often and how much" },
      {
        p: "About 10 to 20 hard sets a week, split over two sessions. Deadlifts and Romanian deadlifts also work the back hard, so count them if they're in your week. See [how many sets per week](/blog/how-many-sets-per-week-to-build-muscle/).",
      },
      { h2: "Back workout at home" },
      {
        p: "A pull-up bar does most of the job: pull-ups, chin-ups and hanging rows. With dumbbells, add one-arm rows and chest-supported rows on a bench. With no equipment at all, a towel row in a doorway is a start.",
      },
      { exercises: ["chin-up", "db-row", "towel-row"] },
    ],
    faq: [
      ["What's the best exercise for a wider back?", "Pull-ups and lat pulldowns, which train the lats. Width comes mostly from the lats."],
      [
        "Should I train back and biceps together?",
        "It's a common pairing because rows and pulldowns already work the biceps, so curls at the end finish them off.",
      ],
    ],
  },
  {
    slug: "leg-workout",
    kind: "blog",
    title: "Leg workout: a complete session for quads, hamstrings and glutes",
    description:
      "A leg workout with a squat, a hinge, a single-leg exercise and isolation work for each muscle, with sets, reps and a home version.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "A complete leg workout trains the front of the thigh ([quads](/muscles/quads/)), the back ([hamstrings](/muscles/hamstrings/)), the [glutes](/muscles/glutes/) and the [calves](/muscles/calves/). One squat and one hinge do most of it; the rest fills the gaps.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Back squat or leg press:** 3 to 4 sets of 5 to 10",
          "**Romanian deadlift:** 3 sets of 8 to 10",
          "**Bulgarian split squat:** 2 to 3 sets of 8 to 12 a side",
          "**Lying or seated leg curl:** 2 to 3 sets of 10 to 15",
          "**Leg extension:** 2 sets of 12 to 15",
          "**Standing calf raise:** 3 sets of 10 to 15",
        ],
      },
      {
        exercises: [
          "back-squat",
          "leg-press",
          "romanian-deadlift",
          "bulgarian-split-squat",
          "seated-leg-curl",
          "leg-extension",
          "standing-calf-raise",
        ],
      },
      { cta: "plan" },
      { h2: "Why each exercise is there" },
      {
        ul: [
          "**The squat** builds the quads and glutes and is the main strength lift.",
          "**The Romanian deadlift** trains the hamstrings and glutes in a long stretch.",
          "**The split squat** works each leg on its own and evens out differences.",
          "**Leg curls** are the only way to train the knee-bending job of the hamstrings.",
          "**Leg extensions** hit the part of the quads that squats train least.",
        ],
      },
      { h2: "How often" },
      {
        p: "Twice a week suits most people: one heavier day built on the squat and one lighter day built on the hinge or the leg press. Legs take longer to recover than smaller muscles, so leave two days between hard leg sessions. See [how long muscles take to recover](/blog/how-long-do-muscles-take-to-recover/).",
      },
      { h2: "Leg workout at home" },
      {
        p: "Goblet squats, split squats, single-leg Romanian deadlifts and calf raises with one dumbbell or kettlebell. Slow the lowering down to make light weights harder.",
      },
      { exercises: ["goblet-squat", "single-leg-rdl", "step-up"] },
    ],
    faq: [
      ["How many leg exercises should I do?", "Four to six: a squat, a hinge, a single-leg move and one or two isolation exercises."],
      [
        "Should I squat and deadlift on the same day?",
        "You can, but keep one of them lighter. Many people put the squat and Romanian deadlift together and save heavy deadlifts for another day.",
      ],
    ],
  },
  {
    slug: "shoulder-workout",
    kind: "blog",
    title: "Shoulder workout: front, side and rear delts in 4 exercises",
    description:
      "A shoulder workout that trains all three parts of the delts: an overhead press, lateral raises and rear-delt work, with sets, reps and form tips.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "The shoulder muscle has three parts. The [front delts](/muscles/front-delts/) get plenty of work from any pressing. The [side delts](/muscles/side-delts/) make the shoulders look wide and need raises. The [rear delts](/muscles/rear-delts/) balance things out and are trained by pulling apart. A good shoulder workout gives each its share.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Overhead press:** 3 to 4 sets of 5 to 8",
          "**Lateral raise:** 3 to 4 sets of 12 to 20",
          "**Rear delt fly or reverse pec deck:** 3 sets of 12 to 20",
          "**Face pull:** 2 sets of 12 to 15",
        ],
      },
      { exercises: ["overhead-press", "db-shoulder-press", "lateral-raise", "cable-lateral-raise", "reverse-pec-deck", "face-pull"] },
      { cta: "plan" },
      { h2: "Lateral raise tips" },
      {
        ul: [
          "**Go light.** The side delts are small. Most people can raise far less than they think with good form.",
          "**Lead with the elbows,** a little in front of your body, and stop around shoulder height.",
          "**Use higher reps.** 12 to 20 per set works well, and the burn is part of the deal.",
          "**Train them often.** Side delts recover quickly, so two or three times a week is fine.",
        ],
      },
      { h2: "Do you need front raises?" },
      {
        p: "Usually not. Bench presses and overhead presses already work the front delts hard. Spend those sets on the side and rear delts instead.",
      },
      { h2: "Shoulder workout at home" },
      {
        p: "A pair of dumbbells covers it: seated or standing dumbbell press, lateral raises and bent-over rear delt flys. Pike push-ups work the shoulders with no equipment.",
      },
      { exercises: ["rear-delt-fly", "pike-push-up"] },
    ],
    faq: [
      [
        "How many sets for shoulders per week?",
        "About 8 to 16 hard sets for the side and rear delts, on top of your pressing, spread over two or three sessions.",
      ],
      [
        "Should I train shoulders on chest day?",
        "Many people do, because pressing already warms them up. Put lateral and rear delt raises after the chest work.",
      ],
    ],
  },
  {
    slug: "arm-workout",
    kind: "blog",
    title: "Arm workout: biceps and triceps in 30 minutes",
    description:
      "A 30-minute arm workout with supersets for biceps and triceps: curls, pushdowns, overhead extensions and hammer curls, with sets and reps.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "time",
    body: [
      {
        p: "Arms get a lot of work from presses and rows, but direct work is what fills the sleeves. The [biceps](/muscles/biceps/) bend the elbow; the [triceps](/muscles/triceps/), which make up most of the upper arm, straighten it. Pairing them as supersets gets a full arm workout done in half an hour.",
      },
      { h2: "The workout (as three supersets)" },
      {
        ol: [
          "**A1. Barbell curl:** 3 sets of 8 to 12. **A2. Close-grip bench press:** 3 sets of 6 to 10.",
          "**B1. Incline dumbbell curl:** 3 sets of 10 to 12. **B2. Overhead cable extension:** 3 sets of 10 to 12.",
          "**C1. Hammer curl:** 2 sets of 10 to 15. **C2. Cable pushdown:** 2 sets of 12 to 15.",
        ],
      },
      { exercises: ["barbell-curl", "close-grip-bench", "incline-db-curl", "cable-overhead-extension", "hammer-curl", "cable-pushdown"] },
      {
        p: "Do one set of the first exercise, rest about 30 seconds, do one set of the second, then rest a minute or so before the next round. More in [supersets explained](/blog/supersets-explained/).",
      },
      { cta: "time" },
      { h2: "Why these exercises" },
      {
        ul: [
          "**Overhead extensions** stretch the long head of the triceps, which pushdowns train less.",
          "**Incline curls** work the biceps in a long stretch.",
          "**Hammer curls** add the brachialis and forearms, which make the arm look thicker.",
        ],
      },
      { h2: "How often" },
      {
        p: "Arms recover quickly. Two short arm sessions a week, or a few sets at the end of upper-body days, beats one long arm day. Count the work your arms already do in rows and presses.",
      },
    ],
    faq: [
      [
        "Should I train biceps and triceps on the same day?",
        "Yes, it's a good fit. They do opposite jobs, so one rests while the other works, which makes supersets easy.",
      ],
      [
        "How do I make my arms bigger?",
        "Train them directly twice a week with about 8 to 12 hard sets each, add weight or reps over time, and eat enough protein.",
      ],
    ],
  },
  {
    slug: "glute-workout",
    kind: "blog",
    title: "Glute workout: 5 exercises to build stronger glutes",
    description:
      "A glute workout with hip thrusts, Romanian deadlifts, split squats and hip abduction, with sets, reps and how to feel your glutes working.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "The [glutes](/muscles/glutes/) are the biggest muscles in the body. They extend the hip (stand you up from a hinge or squat) and move the leg out to the side. A complete glute workout trains both jobs, in both the stretched and the squeezed position.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Hip thrust:** 3 to 4 sets of 8 to 12",
          "**Romanian deadlift:** 3 sets of 8 to 10",
          "**Bulgarian split squat:** 3 sets of 8 to 12 a side, leaning slightly forward",
          "**Hip abduction (machine or cable):** 2 to 3 sets of 12 to 20",
          "**Cable kickback:** 2 sets of 12 to 15 a side",
        ],
      },
      { exercises: ["hip-thrust", "romanian-deadlift", "bulgarian-split-squat", "hip-abduction", "cable-kickback"] },
      { cta: "plan" },
      { h2: "How to feel your glutes working" },
      {
        ul: [
          "**Hip thrusts:** tuck your chin, keep your ribs down and push through your heels. Squeeze at the top for a second.",
          "**Split squats:** a longer stride and a slight forward lean move the work from the quads to the glutes.",
          "**Romanian deadlifts:** push your hips back until you feel a strong stretch, then drive them forward to stand.",
        ],
      },
      { h2: "How often" },
      {
        p: "Two or three times a week works well for glutes. Squats, lunges and deadlifts on leg days already count, so a glute-focused day can be short.",
      },
      { h2: "Glute workout at home" },
      {
        p: "Glute bridges and single-leg bridges, split squats, step-ups and band side steps need little or no equipment. Add a pause at the top of each bridge to make it harder.",
      },
      { exercises: ["glute-bridge", "step-up", "band-lateral-walk"] },
    ],
    faq: [
      [
        "Are squats enough for glutes?",
        "Squats train the glutes, but adding a hip thrust or Romanian deadlift and some side work trains them more fully.",
      ],
      [
        "Hip thrust or glute bridge?",
        "Both train the same movement. The hip thrust, with your back on a bench, allows a longer range and heavier loads.",
      ],
    ],
  },
  {
    slug: "hamstring-workout",
    kind: "blog",
    title: "Hamstring workout: train both jobs of the hamstrings",
    description:
      "A hamstring workout with a hinge and a leg curl, why you need both, sets and reps, and how to build up to Nordic curls safely.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "The [hamstrings](/muscles/hamstrings/) have two jobs: they extend the hip, as in a deadlift, and they bend the knee, as in a leg curl. Squats train them surprisingly little. A good hamstring workout includes one exercise for each job.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Romanian deadlift:** 3 to 4 sets of 6 to 10",
          "**Seated leg curl:** 3 sets of 10 to 15",
          "**Good morning or back extension:** 2 sets of 10 to 12",
          "**Nordic curl (assisted):** 2 sets of 3 to 6 slow lowerings",
        ],
      },
      { exercises: ["romanian-deadlift", "seated-leg-curl", "lying-leg-curl", "good-morning", "nordic-curl"] },
      { cta: "plan" },
      { h2: "Why seated leg curls" },
      {
        p: "In a seated curl your hips are bent, which puts the hamstrings on a stretch while they work. Research comparing the two found seated curls built a bit more hamstring than lying curls. Both are good; use whichever your gym has.",
      },
      { h2: "Building up to Nordic curls" },
      {
        p: "Nordic curls are hard on the hamstrings and are linked with fewer hamstring strains in sport. Start with only the lowering, as slowly as you can, catching yourself with your hands. Use a band for help if you need it, and add a set every couple of weeks.",
      },
      { h2: "How often" },
      {
        p: "Twice a week, with a hinge on one day and a curl on both. Hamstrings get very sore after new or long-range work like Romanian deadlifts and Nordics, so start with fewer sets than you think. See [should you train when sore](/blog/should-you-train-when-sore/).",
      },
    ],
    faq: [
      ["Do squats work the hamstrings?", "Only a little. The hamstrings barely change length in a squat, so add a hinge and a leg curl."],
      [
        "Why do my hamstrings cramp on leg curls?",
        "It's common in the shortened position. Warm up with a light set, avoid pointing your toes hard, and stay hydrated.",
      ],
    ],
  },
  {
    slug: "ab-workout",
    kind: "blog",
    title: "Ab workout: a 10-minute core routine that builds strength",
    description:
      "A 10-minute ab workout with a loaded crunch, a leg raise, an anti-rotation hold and a plank, and how often to train your abs.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "time",
    body: [
      {
        p: "Your [abs](/muscles/abs/) and [obliques](/muscles/obliques/) bend and turn the trunk, and they stop it bending and turning when you lift something heavy. Squats and deadlifts train the second job. A short ab workout covers the first and adds a little extra bracing work.",
      },
      { h2: "The 10-minute workout" },
      {
        ol: [
          "**Cable crunch:** 3 sets of 10 to 15",
          "**Hanging leg raise:** 3 sets of 8 to 12",
          "**Pallof press:** 2 sets of 10 a side",
          "**Plank or side plank:** 2 holds of 30 to 45 seconds",
        ],
      },
      { exercises: ["cable-crunch", "hanging-leg-raise", "pallof-press", "plank", "side-plank", "ab-wheel"] },
      { cta: "time" },
      { h2: "Train abs like any other muscle" },
      {
        ul: [
          "**Add load.** A cable crunch or a weighted crunch lets you add weight like any other exercise.",
          "**Use a full range.** Curl your spine on crunches; lift your hips on leg raises, not just your legs.",
          "**Progress over time.** More reps, more weight, longer holds or a harder version, like the ab wheel.",
        ],
      },
      { h2: "How often" },
      {
        p: "Two or three times a week, at the end of a session so your core is fresh for squats and deadlifts. See [exercise order](/blog/exercise-order/).",
      },
      { h2: "Will an ab workout give me a six-pack?" },
      {
        p: "It builds the muscle. Seeing it depends on body fat, which comes down to food. See [lifting on a cut](/blog/lifting-on-a-cut/).",
      },
    ],
    faq: [
      [
        "Should I train abs every day?",
        "You don't need to. Two or three times a week with enough effort works better than a few easy sets every day.",
      ],
      ["Are planks enough for abs?", "Planks train bracing. Add a crunch or leg raise to train the abs through a range of motion too."],
    ],
  },
  {
    slug: "calf-workout",
    kind: "blog",
    title: "Calf workout: how to finally make your calves grow",
    description:
      "A calf workout with standing and seated raises, the pause and full stretch that make calves grow, sets and reps, and how often to train them.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "Calves have a reputation for not growing. Usually the problem is how they're trained: short, bouncy reps, too heavy, at the end of a long leg day. Slow reps through a full range, done often, work much better.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Standing calf raise:** 3 sets of 8 to 12, with a 2-second pause at the bottom",
          "**Seated calf raise:** 3 sets of 12 to 20",
          "**Single-leg calf raise:** 1 to 2 sets to near failure each side",
        ],
      },
      { exercises: ["standing-calf-raise", "seated-calf-raise", "single-leg-calf-raise"] },
      { cta: "plan" },
      { h2: "What makes calves grow" },
      {
        ul: [
          "**The stretch.** Lower all the way and pause. Research suggests calf training in the stretched position builds more muscle.",
          "**No bouncing.** The Achilles tendon is springy, and bouncing lets it do the work instead of the muscle.",
          "**Both kinds of raise.** Straight-knee raises train the big [calf](/muscles/calves/) muscle; bent-knee raises shift more work to the deeper one.",
          "**Frequency.** Calves recover fast. Two or three short sessions a week work well.",
        ],
      },
      { h2: "Calf workout at home" },
      {
        p: "Single-leg calf raises on a step, holding a dumbbell for more load, are all you need. Pause at the bottom of every rep.",
      },
    ],
    faq: [
      [
        "Why won't my calves grow?",
        "Most often it's bouncy, partial reps. Use a full range with a pause at the bottom, and train them two or three times a week.",
      ],
      ["How many reps for calves?", "Anywhere from 8 to 20 works, as long as the sets are hard and the range is full."],
    ],
  },
  {
    slug: "upper-body-dumbbell-workout",
    kind: "blog",
    title: "Upper-body dumbbell workout you can do at home",
    description:
      "An upper-body dumbbell workout for chest, back, shoulders and arms with one pair of dumbbells and a bench, plus how to progress with light weights.",
    date: "2026-11-11",
    tag: "Workouts",
    cta: "home",
    body: [
      {
        p: "A pair of dumbbells and a bench can train your whole upper body. This workout covers the chest, back, shoulders and arms, and it works with adjustable dumbbells or a small fixed set.",
      },
      { h2: "The workout" },
      {
        ol: [
          "**Dumbbell bench press:** 3 sets of 8 to 12",
          "**One-arm dumbbell row:** 3 sets of 8 to 12 a side",
          "**Seated dumbbell shoulder press:** 3 sets of 8 to 12",
          "**Chest-supported dumbbell row:** 2 sets of 10 to 15",
          "**Lateral raise:** 2 to 3 sets of 12 to 20",
          "**Dumbbell curl and overhead extension:** 2 sets of 10 to 15 each, as a superset",
        ],
      },
      {
        exercises: [
          "db-bench-press",
          "db-row",
          "db-shoulder-press",
          "db-chest-supported-row",
          "lateral-raise",
          "db-curl",
          "db-overhead-extension",
        ],
      },
      { cta: "home" },
      { h2: "When your dumbbells feel too light" },
      {
        ul: [
          "**More reps.** Up to about 20 to 30 still builds muscle if the set is hard.",
          "**Slower lowering.** Three to four seconds down makes every rep harder.",
          "**Pauses.** Hold the bottom of a press or the top of a row for two seconds.",
          "**One arm at a time** on presses, which also works your core.",
        ],
      },
      { h2: "Pair it with a lower-body day" },
      {
        p: "Do this twice a week with a lower-body day in between, or see the full [home dumbbell workout](/blog/home-gym-dumbbell-workout/) for a full-body version. Setting up a space? Start with [home gym on a budget](/blog/home-gym-on-a-budget/).",
      },
      {
        p: "In Liftsmith, set up a home gym with the dumbbells you own and every workout is planned around that equipment.",
      },
    ],
    faq: [
      [
        "Can you build muscle with only dumbbells?",
        "Yes. Dumbbells train every upper-body muscle, and with enough hard sets and some way to progress, they build muscle as well as barbells.",
      ],
      [
        "What weight dumbbells should I buy?",
        "Adjustable dumbbells are the most useful. If buying fixed pairs, a light, medium and heavy pair cover most exercises.",
      ],
    ],
  },
];
