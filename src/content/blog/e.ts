import type { Article } from "../articles";

// Blog, part five: the big three lifts, home gyms, kettlebells, calisthenics, women, older lifters,
// readiness, starting weights and recomposition.
export const BLOG_E: Article[] = [
  {
    slug: "how-to-increase-your-bench-press",
    kind: "blog",
    title: "How to increase your bench press: 8 fixes that work",
    description:
      "Stuck on bench? Eight practical fixes: setup, leg drive, bar path, pressing more often, the right accessories and how to progress the weight.",
    date: "2026-11-10",
    tag: "Strength",
    cta: "progress",
    body: [
      {
        p: "The [bench press](/exercises/bench-press/) is the lift people most want to improve and the one that stalls first. The good news: most stuck benches are a setup or programming problem, not a strength problem, and both are fixable.",
      },
      { h2: "Fix the setup first" },
      {
        ol: [
          "**Shoulder blades back and down.** Squeeze them together before you unrack and keep them pinned. It gives you a stable base and protects your shoulders.",
          "**Feet planted, legs working.** Push your feet into the floor as you press. Leg drive adds a surprising amount to the bar.",
          "**Grip just outside shoulder width.** Too wide shortens the range but strains the shoulders; too narrow turns it into a triceps lift.",
          "**Touch the same spot every rep:** lower chest, around the bottom of the breastbone, with elbows at roughly 45° from your body.",
        ],
      },
      { h2: "Then fix the programming" },
      {
        ol: [
          "**Bench more often.** Twice a week beats once. Make one day heavier (3 to 6 reps) and one lighter (8 to 12).",
          "**Use smaller jumps.** Going from 60 kg to 65 kg is 8%. Use 1.25 kg plates and add 2.5 kg at a time, or add reps first with [double progression](/blog/linear-vs-double-progression/).",
          "**Train the helpers.** Strong triceps and upper back move the bar. Add [close-grip bench](/exercises/close-grip-bench/) or [dips](/exercises/dip/), and match your pressing with rows.",
          "**Rest properly.** Heavy bench sets need 2 to 4 minutes. Cutting rest short costs you reps on every set after.",
        ],
      },
      { cta: "progress" },
      { h2: "Accessories that carry over" },
      { exercises: ["close-grip-bench", "db-incline-press", "dip", "barbell-row", "skull-crusher", "face-pull"] },
      {
        tip: "If the bar stalls just off your chest, add paused reps. If it stalls near lockout, triceps work and close-grip bench are your friends.",
      },
      { h2: "Still stuck?" },
      {
        p: "If nothing has moved for three weeks or more, you're probably carrying fatigue. Take a [deload week](/guides/deload-week/), then restart about 10% lighter and build back. Most people pass their old best within a month. See [how to break a strength plateau](/blog/how-to-break-a-strength-plateau/) for more.",
      },
      { h2: "Track it without testing it" },
      {
        p: "You don't need to max out to know your bench is improving. Liftsmith estimates your one-rep max from every set you log and shows its trend, and a coach's note flags a lift that's stopped moving. With Pro, the plateau detective names the likely cause and offers a three-week fix in one tap.",
      },
    ],
    faq: [
      [
        "How fast can I increase my bench press?",
        "Beginners often add 2.5 kg a week for months. After the first year, a few kilos per training block is good progress.",
      ],
      ["How often should I bench to get stronger?", "Two or three times a week for most people, with one heavier and one lighter day."],
    ],
  },
  {
    slug: "how-to-increase-your-squat",
    kind: "blog",
    title: "How to increase your squat: depth, bracing and programming",
    description:
      "How to squat more weight: brace properly, hit depth, choose the right variations, train often enough and progress without grinding to a halt.",
    date: "2026-11-10",
    tag: "Strength",
    cta: "progress",
    body: [
      {
        p: "A bigger [squat](/exercises/back-squat/) comes from three things: a position you can repeat, a brace that keeps your torso solid, and a plan that adds weight at a pace you can recover from. Get those right and the squat is one of the most reliable lifts to keep improving.",
      },
      { h2: "Brace like you mean it" },
      {
        p: "Take a big breath into your belly before each rep, then tense your stomach as if someone were about to poke it. Hold that through the whole rep and breathe at the top. A soft brace lets your chest fall forward, and that's where most squats fail.",
      },
      { h2: "Own your depth" },
      {
        p: "Squat as deep as you can while your back stays neutral and your heels stay down. For most people that's hip crease at or below the top of the knee. Squatting shallower to lift more weight makes the lift look bigger and your legs no stronger. If depth is hard, try [goblet squats](/exercises/goblet-squat/) to learn the position, or raise your heels slightly.",
      },
      { cta: "progress" },
      { h2: "Program it well" },
      {
        ul: [
          "**Squat two or three times a week.** One heavier day, one lighter or a variation.",
          "**Most sets at 3 to 8 reps,** finishing with 1 to 3 [reps in reserve](/guides/reps-in-reserve/).",
          "**Add weight in small steps:** 2.5 kg at a time, or reps first then weight.",
          "**Rest 3 to 5 minutes** between heavy sets. Squats are tiring.",
        ],
      },
      { h2: "Variations that help" },
      { exercises: ["front-squat", "box-squat", "bulgarian-split-squat", "leg-press", "romanian-deadlift", "plank"] },
      {
        p: "Front squats train an upright torso and hard bracing. Box squats teach consistent depth. Split squats build each leg on its own and expose a weaker side. Romanian deadlifts strengthen the hamstrings and glutes that drive you out of the bottom.",
      },
      {
        tip: "Film one set from the side every few weeks. You'll spot depth, bar path and your chest dropping far more easily than you can feel them.",
      },
      { h2: "Recover between sessions" },
      {
        p: "Heavy squats and heavy [deadlifts](/exercises/deadlift/) on back-to-back days is a common way to stall both. Give your legs about 48 hours between hard sessions, and more after a big day. Liftsmith's recovery map shows how recovered your quads, glutes and hamstrings are, and plans your next leg day around it.",
      },
    ],
  },
  {
    slug: "how-to-increase-your-deadlift",
    kind: "blog",
    title: "How to increase your deadlift safely",
    description:
      "How to pull more: set up the same way every rep, keep the bar close, choose helpful variations and progress the heaviest lift without wrecking your back.",
    date: "2026-11-10",
    tag: "Strength",
    cta: "progress",
    body: [
      {
        p: "The [deadlift](/exercises/deadlift/) lets you move more weight than any other lift, which is exactly why it rewards good habits and punishes sloppy ones. Here's how to keep it climbing without hurting your back.",
      },
      { h2: "The same setup every rep" },
      {
        ol: [
          "Bar over the middle of your foot, feet about hip width.",
          "Grip just outside your legs, arms straight.",
          "Push your hips back until your shins touch the bar. Chest up, back flat.",
          "Pull the slack out of the bar until it clicks against the plates, then push the floor away.",
          "Keep the bar dragging up your legs and stand tall. Don't lean back at the top.",
        ],
      },
      {
        p: "Reset at the bottom of every rep. Bouncing off the floor lets your back round a little more each time.",
      },
      { h2: "Program it with restraint" },
      {
        ul: [
          "**Heavy deadlifts once a week** is enough for most people. They're very tiring.",
          "**Keep most sets at 2 to 5 reps.** Form breaks down on long sets of heavy pulls.",
          "**Add weight in steps of 2.5 to 5 kg,** and hold the weight when a set gets slow.",
          "**Train the hinge a second time** with a lighter variation like the [Romanian deadlift](/exercises/romanian-deadlift/).",
        ],
      },
      { cta: "progress" },
      { h2: "Variations and accessories" },
      { exercises: ["trap-bar-deadlift", "romanian-deadlift", "hip-thrust", "barbell-row", "back-extension", "farmers-carry"] },
      {
        p: "The [trap bar deadlift](/exercises/trap-bar-deadlift/) is easier on the lower back and great for building pulling strength. Rows and carries build the upper back and grip that hold the bar in place.",
      },
      {
        tip: "Grip giving out first? Use a mixed grip or straps for your heaviest sets only, and train grip with carries. Don't let your hands cap your legs.",
      },
      { h2: "If your back is sore" },
      {
        p: "Lower back soreness after deadlifts usually means the weight jumped too fast or your back rounded on the last reps. Drop the weight, tidy the setup and build back. If it's pain rather than soreness, read [training around an injury](/blog/training-around-an-injury/) and Liftsmith's injury mode will plan around it.",
      },
    ],
  },
  {
    slug: "home-gym-on-a-budget",
    kind: "blog",
    title: "How to build a home gym on a budget",
    description:
      "What to buy first for a home gym, in order: what each piece unlocks, what to skip, and how to train well with only a few pieces of kit.",
    date: "2026-11-10",
    tag: "Home gym",
    cta: "home",
    body: [
      {
        p: "You don't need a garage full of machines to get strong at home. A few well-chosen pieces cover nearly every muscle. The trick is buying them in the order that unlocks the most training for the money.",
      },
      { h2: "Start with nothing" },
      {
        p: "Before you buy anything, you can already train hard. [Push-ups](/exercises/push-up/), [split squats](/exercises/split-squat/), [glute bridges](/exercises/glute-bridge/), [planks](/exercises/plank/) and a [towel row](/exercises/towel-row/) in a doorway make a full workout. See [strength training with no equipment](/blog/no-equipment-strength-workout/).",
      },
      { h2: "What to buy, in order" },
      {
        ol: [
          "**A pull-up bar.** Cheap, fits a doorframe, and pull-ups and [chin-ups](/exercises/chin-up/) are the hardest muscles to train without one. See [pull-up bar exercises](/equipment/pullup-bar/).",
          "**Resistance bands.** Light, cheap, and they make pull-ups easier while you build up, and add [band pull-aparts](/exercises/band-pull-apart/) and [lateral raises](/exercises/band-lateral-raise/). See [band exercises](/equipment/bands/).",
          "**Adjustable dumbbells.** The biggest upgrade. Presses, rows, squats, lunges and Romanian deadlifts all open up. See [dumbbell exercises](/equipment/dumbbells/).",
          "**An adjustable bench.** Turns floor presses into proper [bench](/exercises/db-bench-press/) and [incline presses](/exercises/db-incline-press/), and supports one-arm rows.",
          "**A barbell, plates and a squat rack.** The most expensive step, and the one that lets you keep adding weight for years.",
        ],
      },
      { cta: "home" },
      { h2: "Kettlebell or dumbbells?" },
      {
        p: "One or two [kettlebells](/equipment/kettlebells/) are a great budget alternative if space is tight: swings, goblet squats, rows and presses. Dumbbells are more flexible for presses and curls. If you'll only buy one, adjustable dumbbells usually cover more.",
      },
      { h2: "What to skip" },
      {
        ul: [
          "**Single-muscle machines.** They take space and train one thing.",
          "**Lots of fixed dumbbells.** A rack of pairs costs more than one adjustable set.",
          "**Heavy plates before small ones.** Small plates are what keep you progressing.",
        ],
      },
      { tip: "Buy used. Plates, dumbbells and racks don't wear out, and second-hand prices are often half of new." },
      { h2: "Tell Liftsmith what you own" },
      {
        p: "Add your home gym in Liftsmith, down to the exact plates and dumbbells, and every workout uses only that. Buy a new piece and add it: the plan starts using it the next day. If you also train at a commercial gym, keep both and Liftsmith can switch to the right one when you arrive.",
      },
    ],
  },
  {
    slug: "kettlebell-strength-workout",
    kind: "blog",
    title: "Kettlebell strength workouts: a full-body plan",
    description:
      "How to build strength with one or two kettlebells: the best exercises, two sample workouts, how heavy to go and how to progress when the bell feels light.",
    date: "2026-11-10",
    tag: "Home gym",
    cta: "home",
    body: [
      {
        p: "A kettlebell is one of the most useful pieces of kit you can own. One bell trains your legs, back, shoulders, arms and core, fits in a corner and works in a living room. Here's how to use it for strength, not just sweat.",
      },
      { h2: "The exercises that matter" },
      { exercises: ["kb-swing", "kb-goblet-squat", "kb-row", "kb-suitcase-carry", "kb-curl", "single-leg-rdl"] },
      {
        p: "The [swing](/exercises/kb-swing/) is the signature move: a powerful hip hinge that trains glutes and hamstrings hard. [Goblet squats](/exercises/kb-goblet-squat/) cover the legs, [rows](/exercises/kb-row/) the back, and [suitcase carries](/exercises/kb-suitcase-carry/) the core and grip.",
      },
      { h2: "Workout A" },
      {
        ul: [
          "Goblet squat: 4 sets of 8 to 12",
          "One-arm row: 3 sets of 8 to 12 each side",
          "Swing: 5 sets of 15",
          "Suitcase carry: 3 walks of 30 to 40 metres each side",
        ],
      },
      { h2: "Workout B" },
      {
        ul: [
          "Single-leg Romanian deadlift: 3 sets of 8 each side",
          "Push-up (feet on the floor or raised): 4 sets of 8 to 15",
          "Swing: 5 sets of 15",
          "Curl: 3 sets of 10 to 15",
          "Plank: 3 holds of 30 to 45 seconds",
        ],
      },
      { cta: "home" },
      { h2: "How heavy?" },
      {
        p: "Many men start with 16 kg and many women with 8 to 12 kg, but the real test is the goblet squat: choose a bell you can squat 10 times with good form and a couple of reps left. Swings can usually go heavier than squats.",
      },
      { h2: "When the bell gets light" },
      {
        ul: [
          "**Add reps,** up to about 15 to 20 on squats and rows.",
          "**Slow down:** three seconds on the way down makes any weight harder.",
          "**Go one-sided:** [split squats](/exercises/bulgarian-split-squat/) and single-leg deadlifts double the load on each leg.",
          "**Add a pause** at the bottom of squats.",
          "**Buy the next bell up.** Two bells of different weights cover most people for years.",
        ],
      },
      { tip: "Swings are a hinge, not a squat. Push your hips back, snap them forward, and let the bell float. Your arms just hold on." },
      { h2: "Kettlebell plans in Liftsmith" },
      {
        p: "Tell Liftsmith which kettlebells you own and it builds every workout from them, plus your body weight and anything else you have. It adds reps or tougher variations when a bell gets light, and tells you why it picked each one.",
      },
    ],
  },
  {
    slug: "calisthenics-progressions",
    kind: "blog",
    title: "Calisthenics progressions: from first push-up to pistol squat",
    description:
      "Step-by-step bodyweight progressions for push-ups, pull-ups, dips, squats and core, with when to move to the next step so you keep getting stronger.",
    date: "2026-11-10",
    tag: "Bodyweight",
    cta: "bodyweight",
    body: [
      {
        p: "Bodyweight training can't add plates, so you make it harder by changing the exercise. Each step in a progression is a little harder than the last. Master one, move to the next, and you can keep getting stronger for years with only a bar and the floor.",
      },
      { h2: "When to move up" },
      {
        p: "A simple rule: work in 3 sets of 5 to 8 reps. When you can do 3 clean sets of 8, move to the next step and start back at 5. For holds, work from 20 up to 60 seconds before moving on.",
      },
      { h2: "Push-ups" },
      {
        ol: [
          "[Wall push-up](/exercises/wall-push-up/)",
          "[Incline push-up](/exercises/incline-push-up/) (hands on a bench or counter)",
          "[Push-up](/exercises/push-up/)",
          "[Decline push-up](/exercises/decline-push-up/) (feet raised)",
          "[Diamond push-up](/exercises/diamond-push-up/)",
          "[Pseudo planche push-up](/exercises/pseudo-planche-push-up/)",
        ],
      },
      { h2: "Pull-ups" },
      {
        ol: [
          "[Inverted row](/exercises/inverted-row/) under a table or low bar",
          "[Scapular pull](/exercises/scapular-pull/) hanging from a bar",
          "[Negative pull-up](/exercises/negative-pull-up/): jump up, lower for 3 to 5 seconds",
          "[Band-assisted pull-up](/exercises/band-assisted-pull-up/)",
          "[Pull-up](/exercises/pull-up/) or [chin-up](/exercises/chin-up/)",
        ],
      },
      { cta: "bodyweight" },
      { h2: "Dips and shoulders" },
      {
        ol: [
          "[Bench dip](/exercises/bench-dip/)",
          "[Negative dip](/exercises/negative-dip/)",
          "[Dip](/exercises/dip/) on parallel bars",
          "[Pike push-up](/exercises/pike-push-up/) for the shoulders",
        ],
      },
      { h2: "Legs" },
      {
        ol: [
          "[Bodyweight squat](/exercises/bodyweight-squat/)",
          "[Split squat](/exercises/bw-split-squat/)",
          "[Bulgarian split squat](/exercises/bulgarian-split-squat/)",
          "[Shrimp squat](/exercises/shrimp-squat/)",
          "[Pistol squat](/exercises/pistol-squat/)",
        ],
      },
      {
        p: "For the back of the legs, go from [glute bridges](/exercises/glute-bridge/) to [single-leg hip thrusts](/exercises/single-leg-hip-thrust/) to [Nordic curls](/exercises/nordic-curl/).",
      },
      { h2: "Core" },
      {
        ol: [
          "[Dead bug](/exercises/dead-bug/)",
          "[Plank](/exercises/plank/) and [side plank](/exercises/side-plank/)",
          "[Hanging knee raise](/exercises/hanging-knee-raise/)",
        ],
      },
      { tip: "Slow negatives are the fastest way through a sticking step. Lowering yourself slowly builds strength for the full rep." },
      { h2: "Run it in Liftsmith" },
      {
        p: "**Bodyweight skills** is a free program in Liftsmith that runs these ladders for you: pull-up, squat, dip, hinge, row, push-up and core. It works in 3 sets of 5 to 8, moves you up a step after 3 sets of 8, and skips any step your space can't do.",
      },
    ],
  },
  {
    slug: "strength-training-for-women",
    kind: "blog",
    title: "Strength training for women: a practical starter guide",
    description:
      "How women can start lifting: what to train, how heavy to go, why you won't get bulky by accident, and how your cycle can (optionally) shape training.",
    date: "2026-11-10",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "Strength training builds muscle, bone and confidence, and the basics are the same for everyone: big lifts, enough effort, steady progress. But a few questions come up a lot for women starting out, so here are straight answers.",
      },
      { h2: "Will lifting make me bulky?" },
      {
        p: "Not by accident. Building a lot of muscle takes years of hard training and eating to grow. What most women notice in the first months is getting stronger, firmer and more defined. You're in control: if you like where you are, keep training and eat to maintain.",
      },
      { h2: "What to train" },
      {
        p: "The same movements as anyone else: a squat, a hinge, a push, a pull, and a carry or core exercise. Glutes respond well to plenty of work, so many women add an extra hip exercise:",
      },
      { exercises: ["goblet-squat", "romanian-deadlift", "hip-thrust", "db-bench-press", "lat-pulldown", "db-row"] },
      { cta: "plan" },
      { h2: "How heavy?" },
      {
        p: "Heavier than you think. Choose a weight where the last two reps of each set are hard but your form holds, and add weight when the top of your rep range gets easy. Women often recover a little faster between sets than men, so you may handle more sets. See [how many reps](/blog/how-many-reps-to-build-muscle/) and [reps in reserve](/guides/reps-in-reserve/).",
      },
      { h2: "Does your cycle matter?" },
      {
        p: "The research is mixed and very individual. Some women feel strongest in the first half of the cycle and flatter around their period; others notice nothing. The best guide is how you feel on the day. It's fine to push when you feel good and to go easier when you don't.",
      },
      { tip: "Iron and protein matter. If you feel unusually tired for weeks, talk to a doctor rather than training through it." },
      { h2: "Getting started in Liftsmith" },
      {
        p: "Liftsmith plans each workout from your equipment and experience, starts at weights you can do well and moves them forward as you earn it. If you want, cycle-aware readiness lets you log the first day of your period in one tap and gives your daily readiness a small nudge by phase. It's opt-in, stays on your phone and you can delete it any time. It isn't medical advice, contraception or a fertility tool.",
      },
    ],
  },
  {
    slug: "strength-training-over-40",
    kind: "blog",
    title: "Strength training over 40: lift well for decades",
    description:
      "Why lifting matters more after 40, how to adjust recovery, warm-ups and exercise choice, and a simple weekly plan that keeps you strong and healthy.",
    date: "2026-11-10",
    tag: "Beginners",
    cta: "recovery",
    body: [
      {
        p: "After about 30, most people slowly lose muscle and strength each decade unless they train. Lifting is the most effective way to slow that down, and it's never too late to start. People in their 60s, 70s and beyond gain strength from training. You just need to train a little smarter.",
      },
      { h2: "What changes after 40" },
      {
        ul: [
          "**Recovery takes longer.** You can still train hard, but you may need an extra day between hard sessions for the same muscles.",
          "**Joints need more warm-up.** Cold, heavy first sets are where aches start.",
          "**Big swings in weight hurt.** Steady small steps beat ambitious jumps.",
          "**The payoff grows.** Strength, balance and bone density matter more every decade.",
        ],
      },
      { h2: "How to adjust" },
      {
        ol: [
          "**Warm up properly:** a few minutes of easy movement, then [ramp-up sets](/blog/how-to-warm-up-for-lifting/) on your first lift.",
          "**Pick joint-friendly variations** when something nags: [trap bar deadlifts](/exercises/trap-bar-deadlift/) instead of barbell, [goblet squats](/exercises/goblet-squat/) or [leg press](/exercises/leg-press/) instead of back squats, [dumbbell presses](/exercises/db-bench-press/) instead of the barbell.",
          "**Stay a rep or two further from failure** on heavy compound lifts. Save hard sets for machines and smaller exercises.",
          "**Take a [deload week](/guides/deload-week/)** every four to six weeks.",
          "**Train balance and carries:** [split squats](/exercises/split-squat/), [step-ups](/exercises/step-up/), [farmer's carries](/exercises/farmers-carry/).",
        ],
      },
      { cta: "recovery" },
      { h2: "A simple week" },
      {
        p: "Three full body sessions on non-consecutive days, 45 to 60 minutes each: one squat or leg press, one hinge, one push, one pull, and a carry or core exercise. Walk on the other days. That's enough to get noticeably stronger in a few months.",
      },
      { tip: "Sleep is your best recovery tool. A short night is a good reason to make today an easier session, not to skip it." },
      { h2: "How Liftsmith helps" },
      {
        p: "Liftsmith's recovery map tracks how recovered each muscle is, so you don't hit the same muscles again too soon. It adds warm-up sets automatically, and its daily readiness call suggests going easy when your recent sessions and recovery say so. Tell it about a sore knee or shoulder and injury mode works around it.",
      },
    ],
  },
  {
    slug: "hrv-and-training-readiness",
    kind: "blog",
    title: "HRV, sleep and readiness: when to push and when to back off",
    description:
      "What heart rate variability, resting heart rate and sleep tell you about recovery, how to read them without overthinking, and when to train hard or easy.",
    date: "2026-11-10",
    tag: "Recovery",
    cta: "recovery",
    body: [
      {
        p: "Your watch or ring probably shows a readiness or recovery score every morning. Behind it are a few signals: heart rate variability, resting heart rate and sleep. They're useful, but only if you know what they can and can't tell you.",
      },
      { h2: "What the signals mean" },
      {
        ul: [
          "**Heart rate variability (HRV):** the small variation in time between heartbeats. Higher than your normal usually means you're well recovered; a clear drop can mean stress, illness, poor sleep or a hard training week.",
          "**Resting heart rate:** a few beats above your normal for several days often means you're run down.",
          "**Sleep:** the simplest one. Less than you need, and your strength and focus suffer the next day.",
        ],
      },
      { h2: "Compare against yourself" },
      {
        p: "HRV numbers vary hugely between people, so your number against someone else's means nothing. What matters is today against **your own** last few weeks. One low morning is noise. Several low mornings in a row, together with a high resting heart rate, is a signal.",
      },
      { cta: "recovery" },
      { h2: "What to do with it" },
      {
        ul: [
          "**Signals good, you feel good:** train as planned, or push your main lift a little.",
          "**Signals low, you feel fine:** train, but keep the first heavy lift a step lighter and see how it moves.",
          "**Signals low, you feel bad:** make it an easy day: fewer sets, lighter weights, more reps in reserve.",
          "**Low for a week:** check sleep, stress and food, and consider a [deload week](/guides/deload-week/).",
        ],
      },
      { tip: "Your logbook is a readiness signal too. If the weights feel heavy and your reps drop, that matters more than any score." },
      { h2: "How Liftsmith uses it" },
      {
        p: "Liftsmith builds a daily readiness score from your training first: how recovered your big muscles are, how many days since you last trained, whether you hit your target reps and how your sets felt. With Pro, it also reads sleep, HRV, resting heart rate and breathing rate from Health Connect or Apple Health. Today then shows a push, as planned or go easy call with the top reasons behind it, and you can always override it.",
      },
    ],
    faq: [
      [
        "What is a good HRV?",
        "There's no single good number; it depends on age, fitness and how it's measured. Compare each morning to your own average over the last few weeks.",
      ],
      [
        "Should I skip the gym if my HRV is low?",
        "Usually not. Train a little lighter instead, unless you feel ill or several signals have been low for days.",
      ],
    ],
  },
  {
    slug: "how-much-weight-should-i-lift",
    kind: "blog",
    title: "How much weight should I lift? Finding your starting weights",
    description:
      "How to pick your first weights for any exercise, the warm-up method that finds them in one session, and when to go heavier or lighter.",
    date: "2026-11-10",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "Pick too light and you waste weeks. Pick too heavy and your form falls apart. The right weight is one you can lift for your target reps with good form and a couple of reps left in the tank, and you can find it in your first session.",
      },
      { h2: "The ramp-up method" },
      {
        ol: [
          "Start with something clearly easy: the empty bar, or light dumbbells.",
          "Do 5 to 8 reps. If it felt easy, add a step of weight.",
          "Repeat, adding smaller steps as the reps slow down.",
          "Stop when a set of your target reps feels like you had **two or three reps left**. That's your working weight.",
        ],
      },
      { p: "Write it down. Next session, start your work sets there and let your progression take over." },
      { cta: "plan" },
      { h2: "Rough starting points" },
      {
        p: "Everyone is different, but these give you a sense of where to start ramping. For an untrained adult:",
      },
      {
        ul: [
          "**Squat and deadlift:** the empty bar (20 kg) to half your body weight.",
          "**Bench press:** the empty bar to a third of your body weight.",
          "**Overhead press:** the empty bar or less. Use dumbbells if the bar is too heavy.",
          "**Dumbbell rows and presses:** 5 to 15 kg each hand.",
        ],
      },
      { h2: "If you've lifted before" },
      {
        p: "Take a recent set you did (say 80 kg for 6 reps) and put it into the [one-rep max calculator](/tools/one-rep-max-calculator/). Its table tells you roughly what you can lift for any number of reps. Start about 10% below that while you get back into it.",
      },
      {
        tip: "Always leave a couple of reps in reserve on the first session of a new exercise. You'll be sore enough without testing your limits.",
      },
      { h2: "Go heavier or lighter?" },
      {
        ul: [
          "**Heavier** when you hit the top of your rep range on every set with reps to spare.",
          "**Lighter** when your form breaks, you miss reps two sessions running, or a joint complains.",
          "**Same** otherwise. Consistency is what moves you forward.",
        ],
      },
      { h2: "Let Liftsmith pick for you" },
      {
        p: "Liftsmith suggests a first weight for every exercise from your body weight, experience and any lifts you know, then adjusts from the sets you log and how hard they felt. Every target shows a short reason, so you can see why it's asking for that weight.",
      },
    ],
  },
  {
    slug: "body-recomposition",
    kind: "blog",
    title: "Body recomposition: lose fat and build muscle at once",
    description:
      "Can you lose fat and gain muscle at the same time? Who recomposition works for, how to set calories and protein, and how to tell if it's working.",
    date: "2026-11-10",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: "Body recomposition means losing fat and building muscle at the same time, so your shape changes even if the scale barely moves. It's real, it works, and it works best for some people more than others.",
      },
      { h2: "Who it works for" },
      {
        ul: [
          "**Beginners:** new muscle comes quickly, even on maintenance calories.",
          "**People returning after a break:** muscle you've had before comes back fast.",
          "**People with more fat to lose:** stored energy helps fuel new muscle.",
          "**Experienced, lean lifters:** much slower. A dedicated gaining phase then a cut usually works better.",
        ],
      },
      { h2: "How to set it up" },
      {
        ol: [
          "**Eat near maintenance,** or a small deficit of 200 to 300 calories a day. Work out your number with the [TDEE calculator](/tools/tdee-calculator/).",
          "**Eat plenty of protein:** around 1.6 to 2.2 g per kg of body weight a day. See [how much protein you need](/blog/how-much-protein-to-build-muscle/).",
          "**Lift hard and progressively** three or four times a week. The training is the signal to keep and build muscle.",
          "**Sleep 7 to 9 hours.** Short sleep tips the balance towards losing muscle.",
        ],
      },
      { cta: "tdee" },
      { h2: "How to tell it's working" },
      {
        p: "The scale is a poor guide here, because it might not move. Look at these instead:",
      },
      {
        ul: [
          "Your lifts going up while your weight stays about the same.",
          "Your waist getting smaller.",
          "Body fat readings trending down over several weeks, if you have a smart scale.",
          "Progress photos in the same light, every few weeks.",
        ],
      },
      {
        tip: "Give it 8 to 12 weeks before judging. Week-to-week changes are too small to see through normal water and food swings.",
      },
      { h2: "Tracking it in Liftsmith" },
      {
        p: "Liftsmith tracks your weight trend and, with a smart scale through Health Connect or Apple Health, your body fat and lean mass. It recalculates your daily calorie burn from your weigh-ins and the days you actually train. A coach's note flags body fat creeping up or weight dropping faster than 1% a week, and your one-rep max trends show whether your strength is keeping up. If you're losing faster than planned, read [how to keep your strength while losing fat](/blog/lifting-on-a-cut/).",
      },
    ],
  },
];
