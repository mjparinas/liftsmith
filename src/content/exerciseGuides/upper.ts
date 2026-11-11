import type { ExerciseGuide } from "../exerciseGuides";

// Chest, shoulders, back and arms: the 25 most searched upper-body exercises.
export const UPPER_GUIDES: Record<string, ExerciseGuide> = {
  "bench-press": {
    intro:
      "The bench press is the main upper-body strength lift. It trains the chest, front shoulders and triceps, takes a lot of weight, and is one of the easiest lifts to track progress on.",
    mistakes: [
      ["Flat, loose shoulders", "Pull your shoulder blades back and down before you unrack, and keep them pinned the whole set."],
      ["Elbows flared straight out", "Tuck them to about 45 to 70 degrees from your body. It's stronger and easier on the shoulders."],
      ["Bouncing the bar off the chest", "Touch lightly on the lower chest, then press. A short pause teaches control."],
      ["Feet floating", "Plant your feet and push through the floor to keep your body tight."],
    ],
    sets: [
      "**Strength:** 3 to 5 sets of 3 to 6, resting 3 to 5 minutes.",
      "**Muscle:** 3 to 4 sets of 6 to 10, resting 2 to 3 minutes.",
      "**New to it:** 3 sets of 8, adding a little weight each session.",
    ],
    variations: [
      ["db-bench-press", "More range and each side works on its own."],
      ["incline-bench-press", "More upper chest and front shoulder."],
      ["close-grip-bench", "Shifts the work toward the triceps."],
      ["spoto-press", "Pauses just above the chest to build control."],
    ],
    faq: [
      ["Do I need a spotter?", "For heavy sets, use a spotter or a rack with safety arms set just below chest height."],
      [
        "How wide should my grip be?",
        "Most people press best with forearms vertical at the bottom, usually a little wider than shoulder width.",
      ],
      ["Should I arch my back?", "A small arch from pulling your shoulder blades back is normal. Keep your glutes on the bench."],
    ],
  },
  "incline-bench-press": {
    intro:
      "The incline bench press presses a barbell on a bench set to about 30 degrees. It shifts more of the work to the upper chest and front shoulders than the flat bench.",
    mistakes: [
      ["Bench too steep", "Around 30 degrees is plenty. Steeper and it turns into a shoulder press."],
      ["Bar path too low", "Lower the bar to your upper chest, just below the collarbones."],
      ["Shoulders rolling forward", "Keep your shoulder blades back and down, like on the flat bench."],
    ],
    sets: ["**Strength:** 3 to 4 sets of 4 to 6.", "**Muscle:** 3 sets of 6 to 12."],
    variations: [
      ["db-incline-press", "Dumbbells: more range, easier on the shoulders."],
      ["smith-incline-press", "A fixed path to push hard safely."],
      ["bench-press", "Flat: more weight overall."],
    ],
    faq: [
      ["What angle for the incline bench?", "About 30 degrees. Many adjustable benches have a notch close to that."],
      [
        "Do I need both flat and incline?",
        "Not necessarily, but doing both trains the chest from two angles. Many plans use one as the main lift and the other as a second press.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "The dumbbell bench press presses two dumbbells lying on a flat bench. Each arm works on its own and the dumbbells can travel lower than a bar, so it's great for chest size and evening out sides.",
    mistakes: [
      ["Getting into position badly", "Sit with the dumbbells on your thighs, then lie back and kick them up with your knees."],
      ["Dumbbells drifting too wide", "Lower them to the sides of your chest with elbows at about 45 degrees."],
      ["Clanking at the top", "Press up and slightly in, stopping just before the dumbbells touch."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 6 to 12.", "**At home:** 3 sets of 10 to 20 with a slow lowering if your dumbbells are light."],
    variations: [
      ["db-incline-press", "Upper chest focus."],
      ["db-floor-press", "No bench needed; shorter range."],
      ["db-neutral-press", "Palms facing: easier on the shoulders."],
    ],
    faq: [
      ["Dumbbell or barbell bench?", "The barbell lets you lift more; dumbbells give more range and even out sides. Both build the chest."],
      [
        "How do I put the dumbbells down safely?",
        "Bring them to your chest, then lower them to your thighs as you sit up. Don't drop them out to the sides.",
      ],
    ],
  },
  "db-incline-press": {
    intro:
      "The incline dumbbell press presses two dumbbells on a bench set at an angle. It's one of the best upper chest exercises and kinder to the shoulders than an incline barbell.",
    mistakes: [
      ["Too steep an incline", "Use about 30 degrees to keep the chest in charge."],
      ["Shortening the range", "Let the dumbbells come down to chest level for a full stretch, under control."],
      ["Arching off the bench", "Keep your hips down and your upper back pressed into the pad."],
    ],
    sets: ["**Muscle:** 3 sets of 8 to 12."],
    variations: [
      ["db-low-incline-press", "A lower angle, between flat and incline."],
      ["incline-bench-press", "The barbell version for heavier loads."],
      ["incline-machine-press", "A machine to push hard without balancing."],
    ],
    faq: [
      ["Does the incline press build upper chest?", "Yes. An incline shifts more of the work to the upper fibres of the chest."],
      ["How heavy compared with the flat press?", "Usually 10 to 20% less than your flat dumbbell press."],
    ],
  },
  "push-up": {
    intro:
      "The push-up presses your body up from the floor. It trains the chest, shoulders and triceps anywhere, and with harder versions it can take you a long way.",
    mistakes: [
      ["Hips sagging", "Squeeze your glutes and brace your abs, so your body stays in one line."],
      ["Elbows flared out", "Keep your elbows at about 45 degrees from your body."],
      ["Half reps", "Lower until your chest is a fist's height from the floor, then press all the way up."],
    ],
    sets: [
      "**Muscle:** 3 sets, stopping one or two reps short of failure.",
      "**Too easy?** Raise your feet, slow the lowering, or add a backpack.",
    ],
    variations: [
      ["incline-push-up", "Hands on a bench: easier, the first step."],
      ["decline-push-up", "Feet raised: harder, more upper chest."],
      ["archer-push-up", "Shifts the work to one arm."],
      ["deficit-push-up", "Hands on blocks for a deeper stretch."],
    ],
    faq: [
      [
        "How many push-ups should I do?",
        "As many good reps as you can minus one or two, for 3 sets. Make them harder once you pass about 20.",
      ],
      [
        "Do push-ups build muscle?",
        "Yes, as long as the sets are hard. Use harder versions as you get stronger. See [calisthenics progressions](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro:
      "The dip lowers and presses your body between two parallel bars. It's one of the best bodyweight exercises for the chest and triceps.",
    mistakes: [
      ["Going too deep", "Lower until your upper arms are about parallel to the floor, or less if your shoulders complain."],
      ["Shrugging up", "Keep your shoulders pressed down, away from your ears."],
      ["Swinging", "Cross your ankles and keep your body still."],
    ],
    sets: ["**Muscle:** 3 sets of 6 to 12.", "**Too easy?** Add weight with a belt or a dumbbell between your feet."],
    variations: [
      ["negative-dip", "Slow lowering only, the first step."],
      ["band-assisted-dip", "A band takes some of your weight."],
      ["ring-dip", "Much harder: the rings move."],
    ],
    faq: [
      ["Chest or triceps?", "Lean forward for more chest; stay upright for more triceps."],
      ["Are dips bad for your shoulders?", "Not for most people, if you control the depth. Stop short of the range that hurts."],
    ],
  },
  "cable-fly": {
    intro:
      "The cable fly brings your hands together in a hugging arc against two cables. It isolates the chest and keeps tension on it through the whole rep, especially in the stretch.",
    mistakes: [
      ["Turning it into a press", "Keep a fixed, slight bend in the elbows. Move only at the shoulders."],
      ["Too heavy", "Pick a weight you can control through the full stretch."],
      ["Rolling the shoulders forward", "Keep your chest up and shoulder blades back."],
    ],
    sets: ["**Muscle:** 2 to 3 sets of 10 to 15, after your presses."],
    variations: [
      ["low-cable-fly", "From low to high: upper chest."],
      ["pec-deck", "A machine with a fixed path."],
      ["db-fly", "Dumbbells, no cable needed."],
    ],
    faq: [
      ["High or low cable fly?", "High to low works more lower chest; low to high works more upper chest. Both are good."],
      ["Cable fly or dumbbell fly?", "Cables keep tension at the top of the rep; dumbbells are heaviest in the stretch. Either works."],
    ],
  },
  "overhead-press": {
    intro:
      "The overhead press presses a barbell from your shoulders to over your head while standing. It builds the shoulders and triceps, and the whole body has to brace to hold it.",
    mistakes: [
      ["Leaning way back", "Squeeze your glutes and brace, so your body stays stacked."],
      ["Bar going around your face", "Pull your chin back, press straight up, then move your head through once the bar passes."],
      ["Flared elbows at the start", "Start with your elbows slightly in front of the bar."],
    ],
    sets: ["**Strength:** 3 to 5 sets of 3 to 6.", "**Muscle:** 3 sets of 6 to 10."],
    variations: [
      ["db-shoulder-press", "Seated, with dumbbells: easier on the lower back."],
      ["push-press", "A little leg drive to move heavier weights."],
      ["landmine-press", "An angled press for cranky shoulders."],
    ],
    faq: [
      [
        "Why does my overhead press stall so often?",
        "It's a smaller lift, so jumps are relatively big. Use small plates or add reps before weight. See [linear vs double progression](/blog/linear-vs-double-progression/).",
      ],
      ["Standing or seated?", "Standing trains the trunk too; seated lets the shoulders push more. Both work."],
    ],
  },
  "db-shoulder-press": {
    intro:
      "The dumbbell shoulder press presses two dumbbells overhead, usually seated with back support. It builds the front and side shoulders with less lower-back strain than a standing barbell press.",
    mistakes: [
      ["Bench fully upright", "Set it just short of vertical so your back is supported."],
      ["Lowering too little", "Bring the dumbbells to about ear or chin height."],
      ["Banging the dumbbells together", "Press up and slightly in, stopping before they touch."],
    ],
    sets: ["**Muscle:** 3 sets of 6 to 12."],
    variations: [
      ["db-arnold-press", "Rotating palms for more front shoulder."],
      ["machine-shoulder-press", "A fixed path to push hard safely."],
      ["overhead-press", "Barbell, standing."],
    ],
    faq: [
      ["Seated or standing?", "Seated lets you press more; standing trains balance and the trunk."],
      ["Palms forward or facing in?", "Facing in a little is easier on many people's shoulders. Use what feels best."],
    ],
  },
  "lateral-raise": {
    intro:
      "The lateral raise lifts two dumbbells out to your sides. It isolates the side shoulders, which give the shoulders width, and presses don't train them much.",
    mistakes: [
      ["Swinging the weight up", "Use a weight you can raise without leaning or shrugging."],
      ["Shrugging", "Think of pushing the dumbbells out, away from you, not up."],
      ["Going too heavy", "Light weights for 12 to 20 good reps beat heavy, swung reps."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 12 to 20, two or three times a week."],
    variations: [
      ["cable-lateral-raise", "Constant tension, one arm at a time."],
      ["lean-away-lateral-raise", "Holding a post for a longer range."],
      ["machine-lateral-raise", "A fixed path, easy to push to failure."],
    ],
    faq: [
      ["How heavy should lateral raises be?", "Light. Most people use 4 to 10 kg dumbbells for good reps."],
      ["How high should I raise?", "To about shoulder height. Higher brings in the traps."],
    ],
  },
  "face-pull": {
    intro:
      "The face pull pulls a rope on a high cable toward your face, hands apart. It trains the rear shoulders and upper back, which balance out pressing and help posture.",
    mistakes: [
      ["Pulling with the lower back", "Stand tall and brace; lean back only slightly."],
      ["Hands too low", "Pull to your forehead or eyes, hands finishing beside your ears."],
      ["Too heavy", "Use a weight you can pause at the end of each rep."],
    ],
    sets: ["**Muscle and shoulder health:** 2 to 3 sets of 12 to 20."],
    variations: [
      ["band-face-pull", "With a band, at home."],
      ["rear-delt-fly", "Dumbbells, bent over."],
      ["reverse-pec-deck", "A machine with a fixed path."],
    ],
    faq: [
      [
        "Are face pulls good for shoulders?",
        "They train the rear shoulders and upper back, which balance out pressing. Many lifters do them in every upper-body session.",
      ],
      ["Rope or bar?", "A rope lets your hands pull apart at the end, which trains the rear shoulders more."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "The rear delt fly bends forward and raises two dumbbells out to your sides. It isolates the rear shoulders, which most pressing and even rowing don't train much.",
    mistakes: [
      ["Rowing it", "Keep a slight, fixed elbow bend and move at the shoulders."],
      ["Squeezing the shoulder blades", "Let the shoulders do it; the shoulder blades stay fairly still."],
      ["Too heavy", "Very light weights with control work best."],
    ],
    sets: ["**Muscle:** 3 sets of 12 to 20."],
    variations: [
      ["reverse-pec-deck", "A machine, easier to keep strict."],
      ["cable-rear-delt-fly", "Cables for constant tension."],
      ["face-pull", "A pull that also trains the upper back."],
    ],
    faq: [
      ["Seated or standing?", "Seated with your chest on your knees, or chest down on an incline bench, makes it easier to stay strict."],
      ["Why train rear delts?", "They round out the shoulders and balance all the pressing most programs do."],
    ],
  },
  "pull-up": {
    intro:
      "The pull-up hangs from a bar with palms facing away and pulls your chin over it. It's the classic bodyweight back exercise, training the lats, upper back and biceps.",
    mistakes: [
      ["Kipping or swinging", "Start each rep from a still hang."],
      ["Half reps", "Go from straight arms to chin over the bar."],
      ["Shrugging at the top", "Pull your shoulders down and back as you pull."],
    ],
    sets: [
      "**Muscle:** 3 to 4 sets, stopping one or two reps short of failure.",
      "**Too easy?** Add weight with a belt or a dumbbell between your feet.",
    ],
    variations: [
      ["negative-pull-up", "Jump up and lower slowly, the first step."],
      ["band-assisted-pull-up", "A band takes some of your weight."],
      ["chin-up", "Palms facing you: a little easier, more biceps."],
      ["neutral-grip-pull-up", "Palms facing each other, easy on the elbows."],
    ],
    faq: [
      [
        "How do I do my first pull-up?",
        "Slow negatives, band-assisted reps and lat pulldowns, three times a week. Most people get the first one in a couple of months.",
      ],
      ["Pull-up or lat pulldown?", "Both train the lats. Pull-ups also work the trunk; pulldowns let you set any weight."],
    ],
  },
  "chin-up": {
    intro:
      "The chin-up hangs from a bar with palms facing you and pulls your chin over it. It trains the lats and works the biceps harder than a pull-up, and most people can do a few more.",
    mistakes: [
      ["Not reaching full hang", "Straighten your arms at the bottom of each rep."],
      ["Leading with the chin", "Pull your chest toward the bar instead of reaching with your neck."],
      ["Swinging", "Keep your legs still and your trunk tight."],
    ],
    sets: ["**Muscle:** 3 to 4 sets, stopping one or two reps short of failure."],
    variations: [
      ["pull-up", "Palms away: more upper back."],
      ["reverse-grip-pulldown", "The same grip on a machine."],
      ["negative-pull-up", "Slow lowering to build up to it."],
    ],
    faq: [
      ["Chin-up or pull-up?", "Chin-ups use the biceps more and are a little easier; pull-ups use more upper back. Both build the lats."],
      ["How wide should my grip be?", "About shoulder width."],
    ],
  },
  "lat-pulldown": {
    intro:
      "The lat pulldown pulls a bar down to your upper chest from a high cable. It trains the lats like a pull-up but lets you choose the weight, so anyone can do it.",
    mistakes: [
      ["Leaning way back", "Lean back only slightly and keep your chest up."],
      ["Pulling with your arms", "Think of driving your elbows down to your sides."],
      ["Pulling behind your neck", "Pull to your upper chest."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 8 to 12."],
    variations: [
      ["close-grip-pulldown", "A narrow handle, a longer range."],
      ["one-arm-cable-pulldown", "One side at a time."],
      ["pull-up", "Your own body weight."],
    ],
    faq: [
      ["Wide or close grip?", "Both work the lats. A medium grip, a little wider than shoulders, suits most people."],
      ["Can pulldowns help me do a pull-up?", "Yes, especially with slow negatives. See [back workout](/blog/back-workout/)."],
    ],
  },
  "barbell-row": {
    intro:
      "The barbell row bends forward and rows a bar to your belly. It builds the whole upper back, lats and rear shoulders, and lets you use heavy loads.",
    mistakes: [
      ["Standing up as you row", "Hold your torso at a fixed angle, about 30 to 45 degrees from the floor."],
      ["Jerking the weight", "Pull smoothly and lower under control."],
      ["Rounding the lower back", "Brace and keep a flat back. Lighten the bar if it rounds."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 6 to 12.", "**Strength:** 3 sets of 5 to 8."],
    variations: [
      ["pendlay-row", "From the floor each rep, flat back."],
      ["chest-supported-row", "No lower-back strain at all."],
      ["db-row", "One arm at a time with support."],
    ],
    faq: [
      ["Overhand or underhand grip?", "Overhand works more upper back; underhand works more lats and biceps. Both are fine."],
      ["Why does rowing hurt my lower back?", "Your torso is unsupported. Use less weight, or switch to a chest-supported row."],
    ],
  },
  "db-row": {
    intro:
      "The one-arm dumbbell row braces a hand and knee on a bench and rows a dumbbell to your hip. It trains the lats and upper back one side at a time, with your back supported.",
    mistakes: [
      ["Twisting to lift", "Keep your shoulders and hips square to the floor."],
      ["Pulling to the chest", "Pull toward your hip to work the lats."],
      ["Short range", "Let the dumbbell hang all the way down for a stretch each rep."],
    ],
    sets: ["**Muscle:** 3 sets of 8 to 12 per arm."],
    variations: [
      ["db-chest-supported-row", "Both arms, chest on an incline bench."],
      ["kb-row", "With a kettlebell."],
      ["seal-row", "Lying on a high bench: very strict."],
    ],
    faq: [
      ["Do I need a bench?", "A bench is easiest. Without one, brace a hand on a sturdy chair or your knee."],
      ["How heavy should dumbbell rows be?", "Heavy enough that the last couple of reps are hard without twisting."],
    ],
  },
  "seated-cable-row": {
    intro:
      "The seated cable row pulls a handle toward your belly from a low cable while seated. It trains the upper back and lats with steady tension and no lower-back load.",
    mistakes: [
      ["Rocking back and forth", "Keep your torso still, leaning back only slightly at the end."],
      ["Shrugging", "Pull your shoulder blades back and down, not up."],
      ["Rushing the return", "Let your arms straighten under control and feel the stretch."],
    ],
    sets: ["**Muscle:** 3 to 4 sets of 8 to 15."],
    variations: [
      ["cable-row-wide", "A wide bar: more upper back."],
      ["single-arm-cable-row", "One side at a time."],
      ["machine-row", "A chest-supported machine."],
    ],
    faq: [
      ["Which handle is best?", "A close V handle works more lats; a wide bar works more upper back. Use both over time."],
      ["Should I lean forward?", "A little at the start for a stretch, then sit tall as you pull."],
    ],
  },
  "barbell-curl": {
    intro:
      "The barbell curl curls a bar up from your thighs to your shoulders. It's the classic biceps exercise and lets you use the most weight of any curl.",
    mistakes: [
      ["Swinging with your back", "Stand tall with your elbows at your sides. Lighten the bar if you need to swing."],
      ["Elbows drifting forward", "Keep them close to your body the whole rep."],
      ["Dropping the bar", "Lower it under control for two or three seconds."],
    ],
    sets: ["**Muscle:** 2 to 4 sets of 8 to 12."],
    variations: [
      ["ez-curl", "An angled bar that's easier on the wrists."],
      ["db-curl", "Each arm on its own."],
      ["drag-curl", "Pulls the bar up your body for more biceps peak."],
    ],
    faq: [
      ["Straight bar or EZ bar?", "The EZ bar is easier on the wrists. The straight bar works the biceps slightly more."],
      [
        "How many curls should I do?",
        "About 6 to 12 hard sets of biceps work a week, counting chin-ups and rows. See [arm workout](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "The dumbbell curl curls a dumbbell in each hand. Each arm works on its own and you can turn your palms up as you lift, which works the biceps fully.",
    mistakes: [
      ["Swinging", "Keep your elbows by your sides and your body still."],
      ["Turning too late", "Start with palms in and turn them up as you curl."],
      ["Short range", "Straighten your arms fully at the bottom."],
    ],
    sets: ["**Muscle:** 2 to 4 sets of 8 to 15."],
    variations: [
      ["incline-db-curl", "On an incline bench for a long stretch."],
      ["hammer-curl", "Palms in: more forearm and brachialis."],
      ["db-preacher-curl", "Arm on a pad for strict reps."],
    ],
    faq: [
      ["Alternating or both arms at once?", "Either. Alternating lets you focus on each arm; both at once saves time."],
      ["Standing or seated?", "Seated makes it harder to swing."],
    ],
  },
  "hammer-curl": {
    intro:
      "The hammer curl curls dumbbells with your palms facing each other. It works the brachialis and forearm muscles more than a regular curl, which adds thickness to the arm.",
    mistakes: [
      ["Swinging the weight", "Stand tall and keep your elbows still."],
      ["Rotating the palms", "Keep palms facing each other the whole rep."],
      ["Rushing", "Lower under control."],
    ],
    sets: ["**Muscle:** 2 to 3 sets of 8 to 15."],
    variations: [
      ["rope-hammer-curl", "On a cable with a rope."],
      ["incline-hammer-curl", "On an incline bench for a stretch."],
      ["reverse-curl", "Palms down for the forearms."],
    ],
    faq: [
      ["Hammer curl or regular curl?", "Do both: regular curls for the biceps, hammer curls for the brachialis and forearms."],
      ["Across the body or straight?", "Both work. Across the body is a common variation that some people find more comfortable."],
    ],
  },
  "cable-pushdown": {
    intro:
      "The cable pushdown pushes a bar or rope down from a high cable. It isolates the triceps and is easy to learn, easy on the elbows and easy to progress.",
    mistakes: [
      ["Elbows moving", "Pin your elbows to your sides; only your forearms move."],
      ["Leaning over the weight", "Stand tall with a slight forward lean, not hunched over."],
      ["Short range", "Lock out fully at the bottom and let your forearms come up past parallel."],
    ],
    sets: ["**Muscle:** 2 to 4 sets of 10 to 15."],
    variations: [
      ["rope-pushdown", "A rope lets your hands spread at the bottom."],
      ["cable-overhead-extension", "Overhead: the long head of the triceps."],
      ["reverse-grip-pushdown", "Palms up, a different feel."],
    ],
    faq: [
      ["Rope or bar?", "A bar lets you lift more; a rope lets your hands spread. Use either."],
      [
        "Do I need overhead triceps work too?",
        "Adding an overhead extension trains the long head of the triceps in a stretch, which may build more muscle.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "The skull crusher lowers an EZ bar toward your forehead while lying on a bench, then extends your arms. It trains all three heads of the triceps with a good stretch.",
    mistakes: [
      ["Elbows flaring", "Keep them pointing up toward the ceiling, about shoulder width."],
      ["Lowering to your forehead", "Lower toward the top of your head or just behind it, for more stretch and less risk."],
      ["Too heavy", "Pick a weight you can control all the way down."],
    ],
    sets: ["**Muscle:** 2 to 3 sets of 8 to 12."],
    variations: [
      ["db-skull-crusher", "Dumbbells, easier on the wrists."],
      ["incline-skull-crusher", "On an incline for a longer stretch."],
      ["jm-press", "Between a skull crusher and a close-grip press."],
    ],
    faq: [
      [
        "Are skull crushers bad for elbows?",
        "They can bother some elbows. Lower the weight, try dumbbells, or switch to cable work if they hurt.",
      ],
      ["EZ bar or straight bar?", "The EZ bar is easier on the wrists."],
    ],
  },
  "close-grip-bench": {
    intro:
      "The close-grip bench press is a bench press with your hands about shoulder width. It moves more of the work to the triceps while still letting you lift heavy.",
    mistakes: [
      ["Grip too narrow", "About shoulder width. Hands touching hurts the wrists."],
      ["Elbows flaring", "Keep them tucked close to your sides."],
      ["Touching too high", "Lower to your lower chest."],
    ],
    sets: ["**Strength:** 3 to 4 sets of 5 to 8.", "**Muscle:** 3 sets of 8 to 12."],
    variations: [
      ["bench-press", "A wider grip, more chest."],
      ["db-close-press", "Dumbbells pressed together."],
      ["diamond-push-up", "The bodyweight version."],
    ],
    faq: [
      ["Is it a chest or triceps exercise?", "Both, with more triceps than a regular bench press."],
      ["How much less than my bench?", "Usually about 10 to 15% less."],
    ],
  },
  "preacher-curl": {
    intro:
      "The preacher curl rests your upper arms on an angled pad and curls an EZ bar. The pad stops you swinging and loads the biceps hard at the bottom, in the stretch.",
    mistakes: [
      ["Not reaching full stretch", "Lower until your arms are nearly straight, under control."],
      ["Lifting your elbows off the pad", "Keep your upper arms flat on the pad."],
      ["Dropping into the bottom", "Slow down the last part of the lowering, where the stretch is."],
    ],
    sets: ["**Muscle:** 2 to 3 sets of 8 to 12."],
    variations: [
      ["db-preacher-curl", "One arm at a time with a dumbbell."],
      ["machine-preacher-curl", "A fixed path, easy to push hard."],
      ["cable-preacher-curl", "Tension at the top too."],
    ],
    faq: [
      ["Is the preacher curl better than a standing curl?", "It's stricter and loads the stretched position more. Both build the biceps."],
      ["Why does it hurt at the bottom?", "Go lighter and slow down. Stop short of full lockout if your elbows complain."],
    ],
  },
};
