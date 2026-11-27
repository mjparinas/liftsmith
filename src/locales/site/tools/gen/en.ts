import type { GenUi, ToolPageText } from "../types";

// The workout generator's English words (docs/decisions/workout-generator.md). The other languages have the same
// parts in this folder; the English page itself is src/app/tools/workout-generator/page.tsx.

export const GEN_PAGE_EN: ToolPageText = {
  title: "Workout generator: a free workout for your equipment and time",
  description:
    "Pick your equipment, how long you have and what to train, and get a free workout with sets, reps, rest and a short reason for every exercise. No sign-up, and every workout has its own link.",
  name: "Workout generator",
  intro:
    "Tell it what you have and how long you've got, and it writes the workout: exercises your equipment can do, big lifts first, with sets, reps, rest and why each one is there.",
  sticky: "A new workout every day, made for you",
  mid: {
    title: "Tomorrow's workout follows today's",
    body: "Here, every workout starts from scratch. {app} remembers what you lifted, which muscles are still recovering and how many sets each one has had this week, so every day's workout follows the last and the weights go up when you're ready.",
    button: "Plan my workouts",
  },
  end: {
    title: "Walk in knowing what to do",
    body: "{app} writes a workout like this one every day from your gym, your recovery and your training block, then gets out of the way while you lift.",
  },
  faq: [
    [
      "How does the workout generator work?",
      "It runs the same engine that plans workouts in the {app} app. It keeps only the exercises your equipment can do, aims them at what you picked to train, puts the big compound lifts first while you're fresh, and fits the sets, rests and warm-up sets into the minutes you have.",
    ],
    [
      "Is it free? Do I need an account?",
      "It's free, with no sign-up. Your picks (equipment, minutes, focus, goal and experience) are sent to build the workout and nothing is kept. They're all in the link, so the same link always gives the same workout.",
    ],
    [
      "How heavy should I go?",
      "Each exercise says how many reps to leave in the tank. Pick a weight you could lift that many more times when the set ends with good form. If the last rep was easy, go up a little next set. The app learns your real numbers from your first workout and plans every weight after that.",
    ],
    [
      "What do the reps in the tank mean?",
      "Reps in reserve: how many more good reps you could have done when you stop. A new block starts a few reps short of failure, so you can practise the lifts and recover well, and gets closer to failure over the following weeks.",
    ],
    [
      "Why is my workout shorter than the time I picked?",
      "With little equipment and a small area to train, there are only so many exercises worth doing. Rather than pad it out, the generator says so. Add equipment, pick a bigger area, or use the time for a second round.",
    ],
    [
      "Can I save the workout or follow it in the app?",
      "Yes. Share this workout copies its link. Start this in the app opens it in {app} as a routine, where your own weights fill in as you lift, the rest timer runs on its own and every set is saved.",
    ],
  ],
  more: {
    heading: "How the workout is put together",
    paragraphs: [
      "The generator starts from every exercise in the {app} library that your equipment allows. If you picked an area, only exercises whose main muscles are all in it stay in. The big muscles get the first picks, and the first pick for each is a compound lift that trains several muscles at once; smaller lifts follow in a second round while there's time left.",
      "Sets and reps follow your goal. For muscle, compound lifts sit in a 6 to 10 rep range and smaller lifts in 10 to 15; for strength the reps are lower and the rests longer; for general fitness they sit in the middle. Holds and carries are timed in seconds instead. Main lifts get warm-up sets, and any time left over goes to an extra set on the first exercises.",
      "Pair exercises into supersets does what the app's automatic supersets do: two exercises for different muscles, done back to back, so each muscle rests while the other works and more fits in the same time.",
    ],
  },
  reading: [
    { href: "/blog/how-to-build-a-workout-routine/", label: "how to build a workout routine" },
    { href: "/blog/how-long-to-rest-between-sets/", label: "how long to rest between sets" },
    { href: "/tools/warm-up-calculator/", label: "the warm-up calculator" },
  ],
};

export const GEN_EN: GenUi = {
  equipment: "Equipment",
  kits: { commercial: "Full gym", home: "Home gym", dumbbells: "Dumbbells only", bodyweight: "No equipment" },
  custom: "Choose equipment",
  customHint: "Tap what you have. The workout uses only these.",
  minutes: "Time",
  minutesValue: "{n} min",
  focus: "What to train",
  goal: "Goal",
  goals: { muscle: "Build muscle", strength: "Get stronger", general: "Stay fit" },
  level: "Experience",
  levels: { new: "New to lifting", intermediate: "Some experience", advanced: "Experienced" },
  pairs: "Pair exercises into supersets",
  pairsHint: "Two exercises for different muscles back to back, with less rest, so more fits in.",
  make: "Make my workout",
  another: "Another workout",
  working: "Writing your workout…",
  error: "The workout couldn't be made just now. Check your connection and try again.",
  nothing: "Nothing fits that equipment and area. Add some equipment or pick another area to train.",
  about: "About {n} min",
  short: "About {n} minutes is all this equipment allows for this area. Add equipment or pick a bigger area for more.",
  order: "Big lifts first while you're fresh, smaller ones after. Each exercise says why it's there.",
  setsReps: "{sets} × {reps}",
  setsSecs: "{sets} × {secs} s",
  rest: "Rest {time}",
  tank: "Reps in the tank: {n}",
  holdForm: "Stop when your form slips",
  warmups: "Warm-up sets first: {n}",
  superset: "Superset {letter}",
  whyFirst: "{muscle}: a compound lift first, while you're fresh",
  whyCompound: "{muscle}: a compound lift that trains several muscles at once",
  whyIsolation: "{muscle}: a smaller lift to finish the muscle off",
  whyBodyweight: "{muscle}: a bodyweight compound, no load needed",
  whyHold: "{muscle}: a hold or carry, timed in seconds",
  repsMuscle: "{lo} to {hi} reps build muscle: start at {reps}, add reps as it gets easier",
  repsStrength: "Heavier sets of {lo} to {hi} reps build strength",
  repsGeneral: "{lo} to {hi} reps, the middle ground for all-round fitness",
  repsBodyweight: "{lo} to {hi} reps: start at {reps} and add reps before anything else",
  repsHold: "{lo} to {hi} seconds: start at {reps} and hold a little longer each time",
  mainSets: "{sets} sets for a main lift, with the time to do them",
  moreSets: "{sets} sets, using the time you have",
  pair: "Back to back with {other}: different muscles, so the rest is shorter",
  share: "Share this workout",
  copied: "Link copied",
  start: "Start this in the app",
  startHint: "Opens in {app} as a routine. Your own weights fill in as you lift.",
  example: "An example to start with. Change any choice above.",
  see: "See your workout",
};
