import type { ExerciseGuide } from "../exerciseGuides";

// Legs, hips and core: the 25 most searched lower-body and core exercises.
export const LOWER_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "The back squat is the classic lower-body strength lift. It trains the quads, glutes and adductors hard, lets you load a lot of weight and progress for years, and builds a strong trunk along the way.",
    mistakes: [
      ["Knees caving in on the way up", "Push your knees out over your toes the whole rep, and lighten the bar until you can."],
      [
        "Cutting depth as the weight goes up",
        "Squat to the same depth every rep, at least hip crease level with the knee if your hips allow it.",
      ],
      [
        "Losing your brace at the bottom",
        "Take a big breath into your belly before each rep and hold it until you're past the hardest part.",
      ],
      ["Heels lifting", "Keep your weight over the middle of your foot. Raised-heel shoes or a slightly wider stance can help."],
    ],
    sets: [
      "**Strength:** 3 to 5 sets of 3 to 6, resting 3 to 5 minutes.",
      "**Muscle:** 3 to 4 sets of 6 to 10, resting 2 to 3 minutes.",
      "**New to it:** 3 sets of 8 with a weight you could lift 10 to 12 times, adding a little each session.",
    ],
    variations: [
      ["front-squat", "More upright, more quads, easier on the lower back."],
      ["box-squat", "Teaches you to sit back and hit the same depth every rep."],
      ["pause-squat", "Builds strength out of the bottom, where most people stall."],
      ["goblet-squat", "The best way to learn the pattern before loading a bar."],
    ],
    faq: [
      [
        "How deep should I squat?",
        "As deep as you can while keeping your back position and heels down. For most people that's at or just below parallel.",
      ],
      [
        "High bar or low bar?",
        "High bar sits on top of the shoulders and stays more upright; low bar sits lower and lets you lift a little more. Both work.",
      ],
      [
        "Do I need a belt?",
        "Not to start. Learn to brace without one first; a belt can help on heavy sets later. See [lifting belt](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "The front squat holds the bar on the front of your shoulders, which keeps your torso upright and puts more of the work on the quads. It's easier on the lower back than a back squat and a great teacher of good squat posture.",
    mistakes: [
      ["Elbows dropping", "Drive your elbows up and forward the whole rep. If the bar rolls, your elbows came down first."],
      [
        "Holding the bar with your hands",
        "The bar rests on your shoulders; your fingers only keep it in place. Use a cross-arm grip or straps if your wrists are tight.",
      ],
      [
        "Rounding the upper back",
        "Keep your chest tall and brace hard. Lighter weight with a tall chest beats heavier weight folding over.",
      ],
    ],
    sets: ["**Strength:** 3 to 5 sets of 3 to 5.", "**Muscle:** 3 sets of 6 to 10."],
    variations: [
      ["goblet-squat", "Same upright position with a dumbbell, easier to learn."],
      ["back-squat", "Lets you lift more weight overall."],
      ["db-front-squat", "No rack needed and no wrist stretch."],
    ],
    faq: [
      [
        "Is the front squat better than the back squat?",
        "Neither is better. The front squat leans on the quads and is kinder to the back; the back squat lets you lift more.",
      ],
      [
        "Why does the front squat hurt my wrists?",
        "Tight wrists and lats. Keep only two or three fingers under the bar, or use a cross-arm grip.",
      ],
    ],
  },
  "goblet-squat": {
    intro:
      "The goblet squat holds one dumbbell or kettlebell at your chest. The weight in front makes it easy to stay upright and sit deep, so it's the best way to learn to squat and a great leg exercise at home.",
    mistakes: [
      ["Letting the weight pull you forward", "Hold the weight against your chest and keep your elbows tucked in under it."],
      ["Squatting too shallow", "Sit between your heels, aiming to brush your elbows past your knees at the bottom."],
      ["Rushing the reps", "Lower for two or three seconds. It makes a light weight much harder."],
    ],
    sets: ["**Muscle:** 3 sets of 8 to 15.", "**At home with light weights:** 3 sets of 15 to 20, with a slow lowering."],
    variations: [
      ["kb-goblet-squat", "The same move with a kettlebell held by the horns."],
      ["db-goblet-squat-heels", "Heels raised for more quads and a deeper squat."],
      ["back-squat", "The next step once the dumbbells run out."],
    ],
    faq: [
      [
        "Is the goblet squat good for building legs?",
        "Yes, until the heaviest dumbbell you have gets easy. Then slow down the reps, pause at the bottom, or move to a barbell squat.",
      ],
      ["Dumbbell or kettlebell?", "Either. Hold a dumbbell vertically by one end, or a kettlebell by the horns."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "The Bulgarian split squat puts your back foot on a bench so the front leg does almost all the work. It builds the quads and glutes one leg at a time with a fraction of a back squat's load, which makes it kind to the lower back.",
    mistakes: [
      [
        "Front foot too close to the bench",
        "Step out far enough that your front shin stays roughly upright and your knee can bend freely at the bottom.",
      ],
      ["Pushing off the back foot", "The back foot is only for balance. Keep most of your weight on the front heel and midfoot."],
      ["Losing balance", "Hold onto something with one hand, or use a lower bench, until you're steady."],
    ],
    sets: [
      "**Muscle:** 3 sets of 8 to 12 per leg, starting with your weaker side.",
      "**At home:** 3 sets of 12 to 20 per leg with body weight or light dumbbells.",
    ],
    variations: [
      ["split-squat", "Both feet on the floor: easier to balance."],
      ["front-foot-elevated-split-squat", "A deeper stretch for the front leg."],
      ["barbell-bulgarian-split-squat", "More load once dumbbells get awkward to hold."],
    ],
    faq: [
      [
        "Quads or glutes?",
        "Both. A more upright torso and shorter stance lean on the quads; leaning forward with a longer stance works the glutes more.",
      ],
      [
        "Why is it so hard?",
        "One leg is doing the work of two, and balance adds to it. Start light; you'll be surprised how quickly the weight climbs.",
      ],
    ],
  },
  "leg-press": {
    intro:
      "The leg press trains the quads and glutes without loading your spine or needing balance, so you can push your legs hard and safely, even when your back or technique would limit a squat.",
    mistakes: [
      ["Lower back lifting off the pad", "Only go as deep as you can keep your hips and lower back on the seat."],
      ["Locking the knees hard at the top", "Stop just short of locking out, then go straight into the next rep."],
      [
        "Cutting the range short to use more weight",
        "A full, controlled range with less weight builds more muscle than half reps with a full stack.",
      ],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 8 to 15.", "**As a finisher:** 1 to 2 sets of 15 to 25 after squats."],
    variations: [
      ["narrow-leg-press", "Feet lower and closer: more quads."],
      ["wide-leg-press", "Feet higher and wider: more glutes and adductors."],
      ["single-leg-press", "One leg at a time to even out differences."],
    ],
    faq: [
      [
        "Is the leg press as good as squats?",
        "For building leg muscle, it's close. Squats train balance and the trunk too; the leg press lets you push the legs harder with less fatigue.",
      ],
      ["Where should my feet go?", "Mid-platform, about shoulder width, is a good default. Move them up for glutes, down for quads."],
    ],
  },
  "hack-squat": {
    intro:
      "The hack squat machine guides you through a squat on a sled, keeping your back supported. It's one of the best quad builders because you can go deep and push hard without balancing a bar.",
    mistakes: [
      ["Feet too high on the platform", "Place your feet in the middle or slightly lower for more quad work, with heels flat."],
      ["Bouncing out of the bottom", "Control the lowering and pause briefly before driving up."],
      ["Partial reps", "Go as deep as your hips allow without your lower back peeling off the pad."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 6 to 12.", "**Strength:** 3 sets of 5 to 8, after your main squat."],
    variations: [
      ["pendulum-squat", "A similar machine with a deeper arc."],
      ["leg-press", "No load on the shoulders at all."],
      ["back-squat", "Free weight, trains balance and the trunk."],
    ],
    faq: [
      [
        "Is the hack squat bad for your knees?",
        "No. Knees travelling forward over the toes is normal. Build up the weight gradually and keep it pain-free.",
      ],
      [
        "Hack squat or leg press?",
        "The hack squat usually hits the quads a bit harder; the leg press is easier on the shoulders and back. Both are good.",
      ],
    ],
  },
  deadlift: {
    intro:
      "The deadlift picks a loaded bar up off the floor. It trains the whole back of the body, glutes, hamstrings, back and grip, and is usually the lift where people can handle the most weight.",
    mistakes: [
      [
        "Bar drifting away from the legs",
        "Keep the bar touching your shins and thighs all the way up. Start with it over the middle of your foot.",
      ],
      ["Rounding the lower back", "Brace hard before you pull, and lower the weight if your back can't hold position."],
      [
        "Yanking the bar off the floor",
        "Pull the slack out first: tighten up until the bar clicks against the plates, then push the floor away.",
      ],
      ["Leaning way back at the top", "Finish by standing tall with your glutes squeezed. There's no need to lean back."],
    ],
    sets: [
      "**Strength:** 2 to 4 sets of 2 to 5, resting 3 to 5 minutes.",
      "**Muscle:** 3 sets of 5 to 8. The deadlift is tiring, so most people do it once a week.",
    ],
    variations: [
      ["trap-bar-deadlift", "Easier to learn, more upright, kinder to the back."],
      ["sumo-deadlift", "A wide stance that suits some builds better."],
      ["romanian-deadlift", "Starts from the top and loads the hamstrings more."],
      ["paused-deadlift", "Builds control just off the floor."],
    ],
    faq: [
      [
        "How often should I deadlift?",
        "Once a week is enough for most people, with a lighter hinge like a Romanian deadlift on another day.",
      ],
      [
        "Is it okay to drop the bar at the top?",
        "Lower it under control. Dropping it from the top is hard on the plates and the floor, and skips half the rep.",
      ],
      [
        "Should I use straps?",
        "On your heaviest sets, if your grip gives out first. Train grip with your warm-up sets. See [grip strength](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "The sumo deadlift uses a wide stance with your hands inside your knees. It shortens the distance the bar travels and lets you stay more upright, putting more of the work on the hips, quads and adductors.",
    mistakes: [
      ["Stance too wide", "Go only as wide as lets your shins stay roughly vertical and your knees track over your toes."],
      ["Hips shooting up first", "Push your knees out and the floor apart, so your hips and chest rise together."],
      ["Starting with soft arms", "Pull the slack out of the bar before it leaves the floor."],
    ],
    sets: ["**Strength:** 3 to 5 sets of 2 to 5.", "**Muscle:** 3 sets of 5 to 8."],
    variations: [
      ["deadlift", "The conventional stance, more hamstrings and back."],
      ["kb-sumo-deadlift", "A light way to learn the stance."],
      ["trap-bar-deadlift", "Upright like sumo, simpler to set up."],
    ],
    faq: [
      ["Is sumo cheating?", "No. It's a recognized style in powerlifting. Pick the stance that suits your body and lets you lift well."],
      ["Sumo or conventional?", "Try both for a few weeks. People with longer legs and shorter arms often prefer sumo."],
    ],
  },
  "romanian-deadlift": {
    intro:
      "The Romanian deadlift starts standing and lowers the bar by pushing your hips back with nearly straight legs. It's one of the best hamstring and glute builders because it loads them through a long stretch.",
    mistakes: [
      ["Bending the knees too much", "Keep a soft bend that doesn't change. If your knees bend more as you lower, it turns into a squat."],
      ["Going too low", "Lower only as far as your hips keep moving back and your back stays flat, usually mid-shin."],
      ["Bar away from the legs", "Slide it down your thighs. The closer it stays, the easier it is on your lower back."],
    ],
    sets: ["**Muscle:** 3 sets of 6 to 12, with a slow lowering.", "**After deadlifts:** 2 to 3 sets of 8 to 10, lighter."],
    variations: [
      ["db-rdl", "Dumbbells, great at home."],
      ["single-leg-rdl", "One leg: balance and less weight needed."],
      ["stiff-leg-deadlift", "Starts from the floor each rep."],
    ],
    faq: [
      [
        "Romanian deadlift vs deadlift?",
        "The Romanian starts from the top and loads the hamstrings more; the deadlift starts from the floor and lets you lift more.",
      ],
      [
        "Where should I feel it?",
        "In the back of your thighs and glutes. If you feel it mostly in your lower back, lighten the weight and push your hips further back.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "The trap bar deadlift stands you inside a hexagonal bar with handles at your sides. You can stay more upright, which takes stress off the lower back and makes it the easiest deadlift to learn and load heavy.",
    mistakes: [
      ["Squatting it", "It's still a hinge. Push your hips back to reach the handles, then drive the floor away."],
      ["Off-centre in the bar", "Stand so the handles line up with the middle of your foot."],
      ["Losing tension at the bottom", "Reset between reps or touch-and-go lightly; don't bounce the plates."],
    ],
    sets: ["**Strength:** 3 to 5 sets of 3 to 5.", "**Muscle or sport:** 3 sets of 5 to 8."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Raised handles: a shorter range for beginners or tall lifters."],
      ["deadlift", "The straight bar, more back and hamstrings."],
      ["trap-bar-rdl", "A hamstring-focused version."],
    ],
    faq: [
      ["Is the trap bar deadlift easier?", "Most people find it easier to learn and can lift a bit more on it, because it's more upright."],
      ["Does it work the same muscles?", "Mostly. It uses a little more quad and a little less lower back than a straight-bar deadlift."],
    ],
  },
  "hip-thrust": {
    intro:
      "The hip thrust leans your upper back on a bench and drives a loaded bar up with your hips. It puts more load on the glutes at full hip extension than almost any other exercise.",
    mistakes: [
      ["Arching the lower back at the top", "Tuck your chin and keep your ribs down; finish by squeezing your glutes, not by arching."],
      [
        "Feet in the wrong place",
        "At the top, your shins should be about vertical. Too close and the quads take over; too far and the hamstrings do.",
      ],
      ["Rushing the top", "Hold the top for a second each rep."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 8 to 12.", "**Strength:** 3 sets of 5 to 8 with a pause at the top."],
    variations: [
      ["glute-bridge", "From the floor: easier to set up, shorter range."],
      ["db-hip-thrust", "One dumbbell on the hips, good at home."],
      ["single-leg-hip-thrust", "One leg at a time, no load needed."],
    ],
    faq: [
      ["Do I need a pad?", "A bar pad or a folded mat makes heavier sets much more comfortable."],
      [
        "Hip thrust or squat for glutes?",
        "Both. Squats work the glutes in a deep stretch; hip thrusts work them hardest at the top. See [glute workout](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "The glute bridge lifts your hips off the floor with your back flat on the ground. It's a simple glute exercise you can do anywhere, and a good way to learn to use your glutes before hip thrusts.",
    mistakes: [
      ["Pushing through your toes", "Drive through your heels to keep the work on the glutes."],
      ["Arching your back to get higher", "Stop when your hips and thighs make a straight line. Squeeze your glutes there."],
      ["Racing through reps", "Pause for one to two seconds at the top."],
    ],
    sets: [
      "**At home:** 3 sets of 15 to 25, with a pause at the top.",
      "**Loaded:** 3 sets of 10 to 15 with a dumbbell or bar on your hips.",
    ],
    variations: [
      ["single-leg-glute-bridge", "Twice the work for each side."],
      ["hip-thrust", "Back on a bench for a longer range and heavier loads."],
      ["marching-glute-bridge", "Adds core and hip stability."],
    ],
    faq: [
      ["Glute bridge or hip thrust?", "The bridge is easier and needs nothing; the hip thrust has a longer range and takes more weight."],
      ["Why do I feel it in my hamstrings?", "Move your feet a little closer to your hips and push through your heels."],
    ],
  },
  "walking-lunge": {
    intro:
      "Walking lunges step forward into a lunge, again and again. They train the quads and glutes one leg at a time, challenge your balance and get your heart rate up.",
    mistakes: [
      ["Steps too short", "Take a long enough step that both knees bend to about 90 degrees at the bottom."],
      ["Front knee caving in", "Keep the front knee in line with your toes."],
      ["Slamming the back knee", "Lower under control until the back knee nearly touches the floor."],
    ],
    sets: ["**Muscle:** 3 sets of 10 to 12 steps per leg.", "**Conditioning:** 2 to 3 sets of 20 to 30 total steps, with short rests."],
    variations: [
      ["reverse-lunge", "Stepping back is easier on the knees and balance."],
      ["barbell-walking-lunge", "More load once dumbbells get heavy to hold."],
      ["bulgarian-split-squat", "Stays in one place and isolates each leg more."],
    ],
    faq: [
      [
        "Walking lunges or reverse lunges?",
        "Reverse lunges are easier to control and kinder to the knees; walking lunges add balance and conditioning.",
      ],
      ["How much room do I need?", "About 10 metres for a set. If you don't have room, turn around or switch to reverse lunges."],
    ],
  },
  "reverse-lunge": {
    intro:
      "The reverse lunge steps backward into a lunge. Stepping back keeps your weight over your front foot, which makes it easier to balance and kinder to the knees than a forward lunge.",
    mistakes: [
      ["Stepping too narrow", "Step back as if on train tracks, not a tightrope, so you stay balanced."],
      ["Pushing off the back foot", "Drive up through the front heel; the back leg just helps balance."],
      ["Leaning forward a lot", "Stay fairly tall, with a slight forward lean for more glutes."],
    ],
    sets: ["**Bodyweight:** 3 sets of 12 to 20 per leg.", "**Loaded:** 3 sets of 8 to 12 per leg with dumbbells."],
    variations: [
      ["db-reverse-lunge", "Dumbbells for more load."],
      ["deficit-reverse-lunge", "Front foot on a step for a deeper range."],
      ["walking-lunge", "Adds balance and conditioning."],
    ],
    faq: [
      [
        "Are reverse lunges good for bad knees?",
        "They're usually the most comfortable lunge for sensitive knees. Keep the range pain-free.",
      ],
      ["Alternate legs or do one side at a time?", "Either. One side at a time is harder and keeps the reps even."],
    ],
  },
  "leg-extension": {
    intro:
      "The leg extension machine straightens your knee against resistance. It isolates the quads, including the part of the quad that squats don't train much, and is easy to push close to failure safely.",
    mistakes: [
      ["Knee not lined up with the pivot", "Adjust the seat so your knee joint lines up with the machine's axis."],
      ["Swinging the weight up", "Lift with control and pause briefly at the top."],
      ["Lifting your hips off the seat", "Hold the handles and keep your hips down."],
    ],
    sets: ["**Muscle:** 2 to 3 sets of 10 to 15, after your squats or presses.", "**Finisher:** 1 set of 15 to 20 to near failure."],
    variations: [
      ["single-leg-extension", "One leg at a time to even out differences."],
      ["sissy-squat", "A bodyweight quad isolation."],
      ["leg-press", "A compound quad exercise."],
    ],
    faq: [
      [
        "Are leg extensions bad for your knees?",
        "Not with a sensible weight. They're often used in knee rehab. Stop if you feel joint pain.",
      ],
      [
        "Do I need leg extensions if I squat?",
        "Not strictly, but they add quad work without much fatigue, and train the rectus femoris, which squats don't stretch much.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "The lying leg curl bends your knees against a pad while you lie face down. It isolates the hamstrings, which hinges like the deadlift train mainly at the hip.",
    mistakes: [
      ["Hips lifting off the bench", "Press your hips into the pad and keep them there."],
      ["Using momentum", "Curl smoothly and lower slowly, two or three seconds."],
      ["Short range", "Lower until your legs are almost straight before the next rep."],
    ],
    sets: ["**Muscle:** 3 sets of 8 to 15."],
    variations: [
      ["seated-leg-curl", "Hips bent, so the hamstrings work from a longer stretch."],
      ["nordic-curl", "Bodyweight and very hard; great for sprinters."],
      ["slider-leg-curl", "At home with a towel or sliders."],
    ],
    faq: [
      [
        "Lying or seated leg curl?",
        "The seated version stretches the hamstrings more and may build a bit more muscle. Use whichever your gym has.",
      ],
      [
        "Do I need leg curls if I deadlift?",
        "They train the knee-bending side of the hamstrings, which deadlifts don't. One curl exercise a week helps.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "The seated leg curl bends your knees against a pad while you sit. Sitting puts the hamstrings in a long stretch, which makes it one of the best hamstring exercises for muscle.",
    mistakes: [
      ["Thigh pad too loose", "Lock the thigh pad down firmly so your legs can't lift."],
      ["Leaning back to cheat", "Sit tall or lean slightly forward to keep the stretch."],
      ["Rushing the lowering", "Control it for two or three seconds."],
    ],
    sets: ["**Muscle:** 3 sets of 8 to 15."],
    variations: [
      ["lying-leg-curl", "Hips straight, if the seated machine is busy."],
      ["single-leg-curl", "One leg at a time."],
      ["romanian-deadlift", "Trains the hamstrings at the hip instead of the knee."],
    ],
    faq: [
      [
        "Is the seated leg curl better than lying?",
        "It works the hamstrings from a longer stretch, which may build a bit more muscle. Both are good.",
      ],
      [
        "How heavy should leg curls be?",
        "Heavy enough that the last couple of reps in each set are hard, while you still control the lowering.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "The standing calf raise rises up onto your toes against resistance, with straight knees. It trains the larger calf muscle, the gastrocnemius, best.",
    mistakes: [
      ["Bouncing at the bottom", "Pause for a second in the stretch at the bottom of every rep."],
      ["Half reps", "Go from a deep stretch to as high on your toes as you can."],
      ["Bending the knees", "Keep your knees straight but not locked so the calves do the lifting."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 8 to 15, slow, two or three times a week."],
    variations: [
      ["seated-calf-raise", "Bent knees, for the soleus underneath."],
      ["single-leg-calf-raise", "At home on a step, one leg at a time."],
      ["calf-press", "On the leg press machine."],
    ],
    faq: [
      [
        "Why won't my calves grow?",
        "Most people bounce through short reps. Use a full range with a pause in the stretch, and train them more often. See [calf workout](/blog/calf-workout/).",
      ],
      ["Standing or seated calf raises?", "Both. Standing works the gastrocnemius more; seated works the soleus."],
    ],
  },
  plank: {
    intro:
      "The plank holds your body in a straight line on your forearms and toes. It trains your abs and trunk to resist bending, which carries over to bracing under a heavy bar.",
    mistakes: [
      ["Hips sagging", "Squeeze your glutes and pull your ribs toward your hips."],
      ["Hips piked high", "Lower them until your body is one straight line from head to heels."],
      ["Holding for minutes", "Once you can hold 60 seconds, make it harder rather than longer."],
    ],
    sets: ["**Core:** 2 to 3 holds of 20 to 60 seconds, two or three times a week."],
    variations: [
      ["side-plank", "Trains the obliques and the sides of the hips."],
      ["long-lever-plank", "Elbows further forward: much harder."],
      ["ab-wheel", "A moving version once planks get easy."],
    ],
    faq: [
      ["How long should I hold a plank?", "20 to 60 seconds with perfect form. Past that, a harder version does more."],
      ["Do planks burn belly fat?", "No exercise burns fat from one spot. See [how to lose belly fat](/blog/how-to-lose-belly-fat/)."],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "The hanging leg raise hangs from a bar and lifts your legs. It's one of the hardest ab exercises, training the lower abs and hip flexors, plus your grip.",
    mistakes: [
      ["Swinging", "Start from a still hang and lower slowly. Pause at the bottom if you start to swing."],
      ["Only lifting the legs", "Curl your pelvis up at the top so your abs do the work, not just your hip flexors."],
      ["Grip giving out first", "Use ab straps, or train grip separately."],
    ],
    sets: ["**Core:** 3 sets of 6 to 15."],
    variations: [
      ["hanging-knee-raise", "Bent knees: the easier first step."],
      ["parallel-bar-knee-raise", "On dip bars, no grip needed."],
      ["lying-leg-raise", "On the floor, easier still."],
    ],
    faq: [
      ["How do I stop swinging?", "Lower slowly, pause at the bottom, and keep your shoulders active."],
      ["Too hard?", "Start with hanging knee raises, and move to straight legs when you can do 3 sets of 12."],
    ],
  },
  "ab-wheel": {
    intro:
      "The ab wheel rolls out in front of you and back. It's one of the most demanding ab exercises, training them to stop your back from arching while your arms reach overhead.",
    mistakes: [
      ["Lower back sagging", "Only roll as far as you can keep your back from arching. Tuck your pelvis and squeeze your glutes."],
      ["Hips leading the way back", "Pull back with your abs and arms together, not by sticking your hips up."],
      ["Going too far too soon", "Roll to a wall or a short distance first, then go further each week."],
    ],
    sets: ["**Core:** 3 sets of 5 to 12 from your knees, then standing once you're strong."],
    variations: [
      ["plank", "The static version to build up to it."],
      ["plank-reach", "A gentler way to train the same skill."],
      ["dead-bug", "On your back, for learning to keep the lower back down."],
    ],
    faq: [
      [
        "Is the ab wheel bad for your back?",
        "Not if you stay in the range where your back doesn't arch. Shorten the rollout if you feel it in your lower back.",
      ],
      ["Knees or standing?", "From your knees for most people. Standing rollouts are an advanced goal."],
    ],
  },
  "kb-swing": {
    intro:
      "The kettlebell swing snaps your hips forward to swing a kettlebell to chest height. It trains the glutes and hamstrings explosively and doubles as conditioning.",
    mistakes: [
      ["Squatting the swing", "It's a hinge: push your hips back, with only a little knee bend."],
      ["Lifting with your arms", "Your hips send the bell up; your arms just hold on."],
      ["Leaning back at the top", "Finish standing tall with your glutes and abs tight, like a plank."],
    ],
    sets: ["**Power:** 5 to 10 sets of 10, resting as needed.", "**Conditioning:** 10 to 20 swings every minute for 10 minutes."],
    variations: [
      ["kb-single-swing", "One hand: adds a twist your trunk must resist."],
      ["db-swing", "With a dumbbell if you don't have a kettlebell."],
      ["kb-deadlift", "Learn the hinge before you swing."],
    ],
    faq: [
      [
        "How heavy should my kettlebell be?",
        "Heavy enough that the swing is snappy, not slow. Many women start at 12 kg and many men at 16 to 20 kg.",
      ],
      ["How high should I swing?", "To about chest height. Higher doesn't add much."],
    ],
  },
  "farmers-carry": {
    intro:
      "The farmer's carry picks up two heavy weights and walks. It trains grip, traps, core and posture all at once, and carries straight into everyday life.",
    mistakes: [
      ["Leaning or twisting", "Walk tall, shoulders back and down, with short, quick steps."],
      ["Weights too light", "It should be hard to finish the distance. Grip is meant to be the limit."],
      ["Picking up with a round back", "Deadlift the weights up and set them down the same way."],
    ],
    sets: ["**Strength:** 3 to 5 trips of 20 to 40 metres, resting 1 to 2 minutes."],
    variations: [
      ["db-suitcase-carry", "One side only: trains the obliques."],
      ["trap-bar-carry", "Heavier loads in one bar."],
      ["kb-rack-carry", "Bells at your shoulders, for the upper back."],
    ],
    faq: [
      ["How heavy for farmer's carries?", "Start around a quarter of your body weight in each hand and build up."],
      ["How far should I walk?", "20 to 40 metres a trip, or 30 to 60 seconds."],
    ],
  },
  "good-morning": {
    intro:
      "The good morning holds a bar on your back and hinges forward at the hips. It strengthens the hamstrings, glutes and lower back, and teaches a strong hip hinge.",
    mistakes: [
      ["Going too heavy", "Start light. This lift is hard on the lower back if form breaks."],
      ["Rounding the back", "Keep your back flat and chest proud; lower only as far as you can hold that."],
      ["Bending the knees too much", "Keep a soft knee bend and push your hips straight back."],
    ],
    sets: ["**Muscle:** 3 sets of 8 to 12, light."],
    variations: [
      ["romanian-deadlift", "The same hinge with the weight in your hands."],
      ["band-good-morning", "Light and good for learning."],
      ["seated-good-morning", "Seated: mostly the lower back."],
    ],
    faq: [
      ["Are good mornings dangerous?", "Not with sensible weights and good form. Start light and add weight slowly."],
      ["How deep should I go?", "Until your torso is roughly parallel to the floor, or less if your back starts to round."],
    ],
  },
  "step-up": {
    intro:
      "The step-up drives you up onto a box or bench with one leg. It builds the quads and glutes one side at a time and carries straight into stairs, hiking and sport.",
    mistakes: [
      ["Pushing off the back foot", "Keep the back foot light; let the front leg lift you."],
      ["Box too high", "Start with a box at about knee height or a little lower."],
      ["Dropping down", "Lower yourself slowly. The way down trains the leg too."],
    ],
    sets: ["**Muscle:** 3 sets of 8 to 12 per leg.", "**Bodyweight:** 3 sets of 15 to 20 per leg."],
    variations: [
      ["db-step-up", "Dumbbells for more load."],
      ["db-lateral-step-up", "Step up from the side, for the glutes."],
      ["box-step-down", "Slow step-downs for knee control."],
    ],
    faq: [
      ["How high should the box be?", "Knee height or lower. Higher boxes work the glutes more but are harder to control."],
      ["Step-ups or lunges?", "Both work the same muscles. Step-ups are easier to balance; lunges have a longer range."],
    ],
  },
};
