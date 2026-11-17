import type { Article } from "../articles";

// Blog: older features that no post explained yet (Melvin, 2026-11-17: Labs (voice logging, gym machines, Sonos),
// the health twin and fitness tests, the set timer, Friends, editing past workouts, the goal planner,
// accessibility, the desktop web app and calendar sync). Facts from each feature's decision record.
// Only what ships today, and no other app named (seo.test.ts).
export const BLOG_FEATURE_GUIDES: Article[] = [
  {
    slug: "log-sets-with-your-voice",
    kind: "blog",
    title: 'Log a set with your voice: say "100 for 8"',
    description:
      "Voice set logging in Liftsmith Labs: tap once, say the weight and reps or how it felt, and the set is logged. Recognized on your phone, never recorded.",
    date: "2026-11-17",
    tag: "Tracking",
    cta: "labs",
    body: [
      {
        p: "Sometimes the set didn't go as planned. You got 7 instead of 8, or you went up a plate, and now you're standing there with chalky hands poking at steppers. **Voice set logging**, one of the experiments in Liftsmith Labs, lets you say it instead.",
      },
      { h2: "How it works" },
      {
        p: 'Turn it on in **Settings › Labs › Voice set logging**. A **Say a set** button appears above Log set during your workout. Tap it, speak, and it stops listening as soon as you stop talking. The line under the button says what it heard and what it did, "Heard 100 for 8. Logged 100 kg × 8.", so a mishearing is obvious straight away, and Undo is right there.',
      },
      {
        ul: [
          '**A set:** "100 for 8", "100 kilos for 8 reps", "8 reps at 100", or just "8". It logs straight away, the same as Log set. Weight is in your gym\'s unit.',
          '**Weight only:** "90 kilos" changes the next set without logging it.',
          '**How it felt:** "too easy", "about right" or "too hard" answers the how-did-it-feel question, which sets next time\'s weight. "100 for 8, too easy" does both at once.',
          '**Fix a mistake:** "undo" or "scratch that" takes back the last set. "Log it" or "done" logs the set as it stands.',
        ],
      },
      { cta: "labs" },
      { h2: "Private by design" },
      {
        p: "Speech is recognized **on your phone**. The audio never leaves it and nothing is recorded or stored: only the set it logs is saved, like any set. The microphone is open only between your tap and the end of your sentence, never in the background. A phone without on-device recognition says so rather than sending your voice to a server.",
      },
      {
        ul: [
          "**Android:** Android 12 and newer with on-device speech recognition.",
          "**iPhone:** on-device speech recognition, with your music ducked while it listens.",
          "**Web app:** Chrome with on-device speech, installing the language pack on first use.",
        ],
      },
      { h2: "Why it's in Labs" },
      {
        p: 'Gyms are loud. It understands plenty of ways of saying a set, including numbers as words and "for" heard as "4", but real-gym accuracy with music and clanging plates is still being tested. That\'s what Labs is for: features that work and are worth trying, before they\'re ready for everyone. Labs is part of Pro.',
      },
      {
        tip: 'Say the weight first, then the reps: "100 for 8" is the phrase it understands best.',
      },
    ],
    faq: [
      ["Does it listen all the time?", "No. It only listens after you tap Say a set, and stops when you stop talking or after 8 seconds."],
      ["Do I have to use it?", "No. Log set still logs your set as planned in one tap. Voice is an extra way in."],
    ],
  },
  {
    slug: "connect-bluetooth-gym-machines",
    kind: "blog",
    title: "Connect a bike, rower or treadmill and log cardio automatically",
    description:
      "Liftsmith Labs connects Bluetooth gym machines that use the standard fitness machine service and fills in your cardio set's time, distance and power.",
    date: "2026-11-17",
    tag: "Tracking",
    cta: "plan",
    body: [
      {
        p: "Rowing, riding or running at the end of a session is easy to do and annoying to log: remember the time, the distance, maybe the watts, then dial them in. Most newer gym machines already know all of that, and many share it over Bluetooth. **Bluetooth gym machines**, an experiment in Liftsmith Labs, reads it for you.",
      },
      { h2: "What it connects to" },
      {
        p: "Any machine that shares the standard Bluetooth **Fitness Machine Service**: most newer exercise bikes, rowers, treadmills and cross trainers, and smart bike trainers. When you connect, the picker lists only machines that use it, so you won't see your headphones in the list.",
      },
      { h2: "How it works in a workout" },
      {
        ol: [
          "Turn it on in **Settings › Labs › Bluetooth gym machines**.",
          "On a cardio exercise, a card above the set offers **Connect machine**. Pick your machine.",
          "Start the machine. The card says the machine is filling in this set and shows your average power as you go.",
          "Tap **Log set** as usual. Time and, for distance cardio, distance are already in the set. Average power is saved with it and shows in History.",
        ],
      },
      { cta: "plan" },
      {
        p: "Nothing new is asked of you during the set: one tap still logs it, and the steppers still work if the machine is switched off. Each set after the first counts from your last Log set, so intervals on a rower log as separate sets without restarting the machine. If the connection drops, it reconnects to the same machine on its own.",
      },
      { h2: "What it doesn't do" },
      {
        ul: [
          "It **reads only**. Liftsmith never changes a machine's resistance, speed or incline.",
          "It ignores the machine while a strength exercise is on screen, so walking past a treadmill with your phone doesn't add a run.",
          "Machines that don't share the standard service, including many older gym models, won't show up.",
        ],
      },
      { h2: "Where it works" },
      {
        p: "In the Android and iPhone apps through the phone's own Bluetooth, and in the web app on Chrome, which supports Web Bluetooth. Labs is part of Pro.",
      },
      {
        tip: "Most machines only advertise over Bluetooth once they're switched on and awake. Start pedalling or rowing for a second, then tap Connect machine.",
      },
    ],
  },
  {
    slug: "sonos-music-that-follows-your-workout",
    kind: "blog",
    title: "Sonos in your home gym: music that follows your workout",
    description:
      "Control a Sonos speaker from the Liftsmith workout screen, and let the volume go up for sets and down for rest, with a favourite at the start.",
    date: "2026-11-17",
    tag: "Home gym",
    cta: "home",
    body: [
      {
        p: "If your home gym has a Sonos speaker, you know the routine: rack the bar, find the Sonos app, turn it down to hear the rest timer, turn it back up, lose your place. **Sonos**, an experiment in Liftsmith Labs, puts the music on the workout screen and can run the volume for you.",
      },
      { h2: "Set it up once" },
      {
        ol: [
          "Turn it on in **Settings › Labs › Sonos**.",
          "In **Settings › Connected apps › Sonos**, connect your Sonos account. This uses a Liftsmith account, so you'll be asked to sign in if you aren't.",
          "Pick a speaker, or a group of speakers playing together.",
        ],
      },
      { h2: "On the workout screen" },
      {
        p: "A Sonos card sits under your set or rest card: album art, the song, which speaker, previous, play or pause, next, and a speaker icon with a volume slider. Line-in, TV and AirPlay show by name when they're playing. Nothing on the card is needed to log a set, and it goes away when the workout ends.",
      },
      { cta: "home" },
      { h2: "Let the music follow your workout" },
      {
        p: "**Follow my workout** is on by default:",
      },
      {
        ul: [
          "**Set volume** when the workout starts and whenever rest ends, so the music comes up as you lift.",
          "**Rest volume** when rest starts, quieter, so you hear the timer and can catch your breath. Rest is never louder than sets.",
          "**A Sonos favourite** to start the workout with, if you pick one. Otherwise it just presses play.",
          "**Pause when the workout ends**, so the music doesn't keep going after you've left the room.",
        ],
      },
      {
        p: "Both volumes are sliders in the card's settings. Skipping rest turns the music back up straight away.",
      },
      { h2: "How it works, and why it's in Labs" },
      {
        p: "Liftsmith talks to Sonos through Sonos's own cloud service, so it works the same in the Android and iPhone apps and the web app, from anywhere your phone has internet. The cost is a short delay on each command. It's in Labs because it's new and still being tried on more speaker setups. Labs is part of Pro.",
      },
      {
        tip: "Make a Sonos favourite of your training playlist and pick it in the card's settings. One tap on Start and the right music starts at the right volume.",
      },
    ],
    faq: [
      [
        "Does Liftsmith store my Sonos data?",
        "No. Your speakers, favourites and what's playing are read from Sonos when needed and never stored.",
      ],
      [
        "Can I use it with music on my phone instead?",
        "Yes. Without Sonos, the workout screen has controls for the music playing on your phone (on iPhone, Apple Music).",
      ],
    ],
  },
  {
    slug: "health-twin-fitness-age-and-fitness-tests",
    kind: "blog",
    title: "Your health twin: fitness age, fitness tests and what to do",
    description:
      "Body › Health in Liftsmith: sleep, HRV and steps against your own normal, a fitness age from VO2 max, and three simple fitness tests to retest monthly.",
    date: "2026-11-17",
    tag: "Tracking",
    cta: "health",
    body: [
      {
        p: "Your phone and watch collect a lot of health numbers, and most apps show them as charts you scroll past. **Body › Health** in Liftsmith does something different: every number says what it means for you and what to do about it, measured against your own normal, not against other people.",
      },
      { h2: "The health twin" },
      {
        p: "A 3D figure sits at the top with your readings around it: weight trend, lean mass and body fat, daily calorie burn and protein target, steps, sleep, HRV, resting heart rate, overnight breathing rate, VO2 max, and how fast your heart rate drops in the first minute of rest during a workout. Each has a label in plain words and a line on what to do.",
      },
      {
        p: "Tap one to see the last 30 days against your own normal: the 30 days before today, once there are at least seven readings. A short night matters when it's short for you. Readings come from Health Connect or Apple Health, and with Pro, sleep, HRV and resting heart rate also move today's call.",
      },
      { cta: "health" },
      { h2: "Fitness age" },
      {
        p: "If your watch estimates VO2 max, Health shows your **fitness age**: the age at which a typical healthy person of your sex has your VO2 max, from a large published study of healthy adults. It comes with how it's worked out, what moves it (hard cardio twice a week) and this week's strength-training days against the guideline of two or more. It's a fitness number to train, not a medical one.",
      },
      { h2: "Three fitness tests" },
      {
        p: "Under fitness age sit three quick tests, each with a timer, a typical range from a published study where one exists, what helps and a goal for next time:",
      },
      {
        ul: [
          "**Dead hang** (grip and shoulders): hang from a bar for as long as you can. Grip strength is well worth tracking, and the hang is a simple way to watch it.",
          "**One-leg stand** (balance): eyes open, then try eyes closed. It stops itself at 45 seconds.",
          "**30-second chair stand** (leg strength): stand up and sit down as many times as you can.",
        ],
      },
      { exercises: ["dead-hang"] },
      {
        p: "Each test asks for a retest every four weeks, because fitness changes slowly. Results are labelled Above typical, Typical or Room to build, never in red, and always with something to do next.",
      },
      {
        tip: "Do the tests on a rest day, at the same time of day each month, so the numbers are comparable.",
      },
    ],
    faq: [
      [
        "Is the health twin free?",
        "Yes. Body › Health, fitness age and the fitness tests are all free. Pro adds the muscle recovery map and lets health readings move today's call.",
      ],
      [
        "Is this medical advice?",
        "No. It's general wellness information to help you train. Stop a test if anything hurts, and see a doctor about anything that worries you.",
      ],
    ],
  },
  {
    slug: "set-timer-for-planks-carries-and-cardio",
    kind: "blog",
    title: "A set timer for planks, carries and hangs that logs itself",
    description:
      "Tap Start timer on any timed exercise: a 5-second lead-in, a countdown and the set logs itself when it ends. It counts on your lock screen and watch too.",
    date: "2026-11-17",
    tag: "Training",
    cta: "log",
    body: [
      {
        p: "Planks, side planks, dead hangs, wall sits and carries are measured in seconds, not reps. Timing them used to mean a second clock and then dialling in the seconds. Now every timed exercise in Liftsmith has its own **set timer**, free, with nothing to set up.",
      },
      { h2: "One tap for a whole hold" },
      {
        ol: [
          "On a timed exercise, tap **Start timer · 0:40** above Log set.",
          'A **5-second lead-in** ("Get set") gives you time to get into position, with a tick on the last three seconds.',
          "The set counts down in a big clock, with a bar.",
          "When it runs out, **the set logs itself** and your rest timer starts. A plank is one tap, not two.",
        ],
      },
      {
        p: "Stopping early? Tap **Log set** while it runs and it saves the seconds you actually held. Undo takes it back like any set.",
      },
      { exercises: ["plank", "side-plank", "farmers-carry"] },
      { cta: "log" },
      { h2: "Each side, and cardio" },
      {
        ul: [
          "**One-side holds** like the side plank count the first side, give you 5 seconds to switch, then count the second.",
          "**Cardio counts up** instead: your target is last time's, to repeat or beat. It chimes once as you pass it and keeps going until you log.",
          '**The voice coach**, when it\'s on, says "Ten seconds" on longer holds and "Switch sides".',
        ],
      },
      { h2: "On your lock screen and wrist" },
      {
        p: "The timer keeps running on the clock, not on the screen, so you can lock your phone or switch apps mid-hold. The lock-screen workout card on Android and the Live Activity on iPhone count it down, and so do the Wear OS and Apple Watch apps, with a buzz as each part ends. When a hold finishes in the background, it logs at the moment it ended.",
      },
      { h2: "How the plan uses it" },
      {
        p: "Timed exercises progress in time, not reps: hold the full time with good form and next time's target time goes up. The cue under the target says to stop a few seconds before your form slips, which is the timed version of leaving reps in the tank.",
      },
      {
        tip: "Prop your phone where you can see it before you start the lead-in. Five seconds is enough to get down into a plank, not to find a good angle.",
      },
    ],
    faq: [["Is the set timer part of Pro?", "No. It's free on every timed exercise, in the Android and iPhone apps and the web app."]],
  },
  {
    slug: "friends-feed-challenges-and-clubs",
    kind: "blog",
    title: "Train with friends: the feed, challenges, clubs and the board",
    description:
      "Liftsmith Friends is private by default: post workouts to the people you choose, cheer them on, start a challenge or a gym club, and see the weekly board.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Lifters stay consistent when someone's paying attention. **Friends** in Liftsmith is a tab for exactly that: see your friends' workouts, cheer them on, and compete a little, without turning your training into a public show.",
      },
      { h2: "Private by default" },
      {
        ul: [
          "Friends is **opt in**. Sign in, pick a handle, and you're in. Nothing about you shows until you join.",
          "**Follow requests need your approval**, unless you choose to let anyone follow.",
          "**Nothing is posted until you tap Post** on the Done screen, or turn on Post every workout.",
          "Each post goes to **Followers**, **Friends** (people you both follow) or **Only me**, and you can hide the weights.",
          "There's no public directory. People find you by your exact handle, your profile link or your invite.",
        ],
      },
      { cta: "plan" },
      { h2: "The feed" },
      {
        p: "Posts show the workout: time, sets, volume, new bests, the muscles worked and each exercise, with an optional caption. Like and comment, tag the friends you trained with, and tap **Do this workout** to save a friend's session as a routine and try it yourself.",
      },
      { h2: "The board and friend challenges" },
      {
        ul: [
          "**Friends › Board** ranks you and everyone you follow for this week or last week, by workouts, sets, minutes or volume.",
          "**Start a challenge** with friends: pick one measure and a length, and everyone who joins scores from the workouts they post. Only totals are shown, never anyone's sets.",
          "Coach's notes tell you when a challenge is slipping away, so you can do something about it before Sunday.",
        ],
      },
      { h2: "Clubs for your gym crew" },
      {
        p: "A **club** is a group anyone with its link or code can join, even people who don't follow each other: your gym's early crew, a run club that lifts, a team. Each club has a weekly board. The person who starts it can remove members, make a new link or delete it.",
      },
      { h2: "Safe by design" },
      {
        p: "Block, mute and report are on every person and post, names and comments go through a filter, and lifters under 18 get safer defaults. Read more in [How we keep Friends safe](/blog/keeping-friends-safe/).",
      },
      {
        tip: "A challenge on workouts, not volume, keeps it fair between a new lifter and a strong one. Everyone can win the week by showing up.",
      },
    ],
    faq: [
      ["Is Friends free?", "Yes. Friends, the feed, challenges and clubs are free. You need a free account to join."],
      ["Can my friends see my body weight?", "No. Body weight, body fat, measurements and health data are never on posts."],
    ],
  },
  {
    slug: "edit-past-workouts-and-log-a-missed-one",
    kind: "blog",
    title: "Fix a past workout, log a missed one, or do one again",
    description:
      "Forgot to log a set, typed the wrong weight, or trained without your phone? Edit any past workout, log one after the fact, or repeat it with one tap.",
    date: "2026-11-17",
    tag: "Tracking",
    cta: "log",
    body: [
      {
        p: "Your training history is what your next workout is built from: the weights, the reps, how hard it felt. So when a set is wrong, or a whole session is missing because your phone died, it's worth fixing. Liftsmith lets you edit any finished workout, add one after the fact, and repeat one you liked.",
      },
      { h2: "Edit a finished workout" },
      {
        p: "Open **Progress › History**, pick the workout and tap the pencil beside Share. One sheet holds everything:",
      },
      {
        ul: [
          '**The name and a note**, like "Bad sleep, kept it light".',
          "**Every set**: tap one to change its weight and reps with the usual steppers, or take it out.",
          "**Delete this workout**, which asks once.",
        ],
      },
      {
        p: "Your bests, stats, streak and next targets update straight away, on every device you're signed in on. Copies outside the app stay as they were: a workout already saved to Health Connect or Apple Health, a post on the Friends feed or a share link.",
      },
      { cta: "log" },
      { h2: "Log a workout you did without the app" },
      {
        p: "Trained at a hotel gym with a flat phone? **Log a past workout** adds it after the fact, without typing a date: pick Today, Yesterday, 2 days ago or Earlier, set the start time with − and +, then add the exercises and sets. It counts for your streak, your weekly goal and your progression like any workout.",
      },
      { h2: "Do it again" },
      {
        p: "Had a session you loved? **Do this again** on any workout in History makes it Today's plan: the same exercises and set counts in the same order, with supersets kept. Weights come from where you are now, so it's the same workout, moved forward.",
      },
      { h2: "Every exercise has its own page" },
      {
        p: "Tap **All exercises** on Progress and pick one to see what's next for it, which way it's going, your totals and estimated max, every session, and how you compare with lifters like you.",
      },
      {
        tip: "Use the workout note for anything you'll want to know in a month: a new grip, a sore elbow, a different bench. Notes stay with the workout in History.",
      },
    ],
    faq: [["Is editing history free?", "Yes. Editing, deleting, logging a past workout and Do this again are all free."]],
  },
  {
    slug: "goal-planner-realistic-lifting-goals",
    kind: "blog",
    title: "Set a lifting goal with an honest date: the goal planner",
    description:
      "Pick a lift, a target one-rep max and a date. Liftsmith's goal planner forecasts where you'll likely be, says if it's realistic, and plans your test day.",
    date: "2026-11-17",
    tag: "Strength",
    cta: "onerm",
    body: [
      {
        p: '"Bench 100 kg by March" is a great goal, until March arrives and you\'re nowhere near. Most goals fail on the date, not the effort: strength comes slower than we hope, and slower still as we get stronger. The **goal planner** in Liftsmith gives you an honest answer before you start.',
      },
      { h2: "How it works" },
      {
        ol: [
          "On **Progress**, tap **+ Add goal** in Goals.",
          "Pick a lift you've logged, the one-rep max you want and the date.",
          "Liftsmith forecasts where you'll likely be by then, with a range, and tells you plainly how it looks.",
        ],
      },
      { h2: "An honest forecast" },
      {
        p: "The forecast blends two things. One is **typical gains for your experience**: newer lifters gain a few percent a month, experienced lifters far less, and gains slow as the months go on. The other is **your own recent rate**, from the sets you've logged. Neither is trustworthy alone: a great month overstates your trend, and averages ignore you. Together they're realistic.",
      },
      {
        p: 'Each goal gets one of five answers: **Very likely**, **On track**, **A stretch**, **Not realistic yet** or **Reached**. When the date isn\'t realistic, it says what is ("the likely number by then is 92.5 kg") and when your target is more likely. No false hope, and no giving up on a goal that just needs more time.',
      },
      { cta: "onerm" },
      { h2: "A plan for test day" },
      {
        p: "Two weeks out, the goal turns into a test-day plan:",
      },
      {
        ul: [
          "**The week before:** keep training as planned, then go lighter in the last week: about half the sets at your usual weights, nothing to failure, and rest the two days before.",
          "**Three attempts** worked out from your forecast: an opener you can make on a bad day, a second around your current best, and a third at your goal or close to it, all on weights your plates can make.",
          "**I lifted it** marks the goal done when you get there.",
        ],
      },
      { h2: "Your estimated max, every session" },
      {
        p: "You don't need to test a max to track it. Liftsmith estimates your one-rep max from every set you log, the same way as our [one-rep max calculator](/tools/one-rep-max-calculator/), and the goal moves with it. The goal planner is part of Pro.",
      },
      {
        tip: "Set the date a little later than you'd like. A goal that's On track all the way to test day is far more fun than one that's a stretch every week.",
      },
    ],
    faq: [["Can I set more than one goal?", "Yes. Add a goal for each lift you care about. Each gets its own forecast and test-day plan."]],
  },
  {
    slug: "accessible-workout-app",
    kind: "blog",
    title: "A workout app for everyone: text size, colours and one hand",
    description:
      "Liftsmith follows your phone's text size, has colour-blind safe colours, more contrast, Lean mode, one-handed controls and big numbers for logging mid-set.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "A gym is a hard place to use a phone: sweaty hands, bright lights, tired eyes, one hand on a dumbbell. Everything in Liftsmith is built to be usable there by anyone, and checked against the WCAG 2.2 AA accessibility standard on every screen. Here's what you can change in **Settings › Look and feel › Accessibility**, and what's always on.",
      },
      { h2: "Text you can read" },
      {
        ul: [
          "**Text size** follows your phone's own setting by default, or pick Default, Large, Larger or Largest (up to 150%). Every word in the app grows with it, and layouts wrap instead of running off the screen.",
          "**Contrast:** More contrast makes secondary text and borders stronger and removes glows and gradients. It can follow your phone's setting too.",
          "**Dark, light or match your phone** in Appearance.",
        ],
      },
      { h2: "Colours that work for everyone" },
      {
        p: "**Colour-blind safe** colours swap the recovery map and status colours for blue, light blue, orange and pink, which stay apart for the common kinds of colour blindness. Colour is never the only cue anyway: the recovery map adds dots and stripes, picked chips show a tick, and every band has a label and a percentage.",
      },
      { cta: "plan" },
      { h2: "Less motion, sound and buzzing" },
      {
        p: "**Lean mode** cuts animations, bursts and confetti, and the app follows your phone's reduce motion setting. Sounds and vibration each have their own switch.",
      },
      { h2: "One-handed and big numbers" },
      {
        ul: [
          "**One-handed controls** (Settings › Workout): pick right or left hand, and the weight and rep buttons move into a dock beside Log set, under your thumb.",
          "**Big numbers**: during a set, the weight and reps get much bigger, Log set gets taller, and everything else waits until rest.",
          "Every − and + can be **held to repeat**, slowly at first, then faster, so big changes don't need dozens of taps.",
        ],
      },
      { h2: "Screen readers and keyboards" },
      {
        p: "Screens are built for screen readers and keyboards, and checked automatically on every change. The rest timer is announced when it starts, at ten seconds and when it's over, not every second. A whole workout can be started and logged without a pointer, and on the web app's desktop layout, L logs a set. Read more on our [accessibility page](/accessibility/).",
      },
      {
        tip: "Try Big numbers with one-handed controls on your next workout, even if you don't think you need them. Logging with your thumb while holding a dumbbell is a different experience.",
      },
    ],
    faq: [
      ["Are these features free?", "Yes. Every accessibility setting is free."],
      ["Something's hard to use. Who do I tell?", "Send us feedback from Settings, or email hello@getliftsmith.com."],
    ],
  },
  {
    slug: "liftsmith-on-your-computer",
    kind: "blog",
    title: "Liftsmith on your computer: plan at your desk, lift with your phone",
    description:
      "The Liftsmith web app has a desktop layout: a sidebar, wide pages, a routine builder with drag and drop, keyboard shortcuts and coach chat in a dock.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Most people lift with a phone and plan at a desk. Writing a routine, looking back over three months of progress or checking in on clients is easier on a big screen with a mouse. So the Liftsmith web app has a **desktop layout**: open it on a computer and it becomes a proper desktop app, with the same account, history and settings as your phone.",
      },
      { h2: "What changes on a big screen" },
      {
        ul: [
          "**A sidebar** replaces the bottom tabs: Today, Body, Progress, Friends and Awards, plus Programs, Tools, Coaching (if you coach or have a coach) and Settings.",
          "**Wide pages** use the space: Today shows your plan beside your call and coach's notes, Body keeps the recovery map in view while you scroll the muscle list, and Progress flows into two columns in the same order as on your phone.",
          "**Dialogs** open in the middle of the screen instead of sliding up from the bottom.",
        ],
      },
      { cta: "plan" },
      { h2: "Build routines with a mouse" },
      {
        p: "On a computer, the **routine builder** opens wide: your routine on the left and the exercise browser always open on the right, so each exercise goes in with one click. **Drag rows** to reorder them, supersets stay linked, and the arrow buttons still work from the keyboard.",
      },
      { h2: "Log a workout from the keyboard" },
      {
        p: "If you train with a laptop nearby, the live workout stays a focused, phone-width panel in the middle of the screen, and the keyboard works: **L** logs the set (ending rest first), **↑** and **↓** change the reps, and **Shift** with the arrows changes the weight. It's also the quickest way to add a workout you did without the app, with **Log a past workout**.",
      },
      { h2: "For coaches" },
      {
        p: "Coaching gets the most from the big screen: clients in a grid of cards, each client's report in two columns, a month calendar for sessions and a **chat dock** in the corner, with statuses and an unread count in the browser tab. More in [coach chat on desktop](/blog/coach-chat-dock-statuses-and-stickers/).",
      },
      { h2: "What stays on your phone" },
      {
        p: "Some things need a phone: the lock-screen rest timer, watch apps, Health Connect and Apple Health, haptics and the camera labs. The desktop layout leaves those out, and everything you do on either syncs to the other.",
      },
      {
        tip: "Plan the week's routines on Sunday at your desk, then open the app at the gym. Everything's already there.",
      },
    ],
    faq: [
      ["Do I need to install anything?", "No. Open the web app in your browser and sign in with the same account you use on your phone."],
      ["Does it work on a tablet?", "Tablets use the phone layout for now, which suits touch screens."],
    ],
  },
  {
    slug: "add-workouts-to-your-calendar",
    kind: "blog",
    title: "Put your workouts in your calendar, and fit them around it",
    description:
      "Pick your training days and a time and Liftsmith adds them to your calendar. Turn on Fit workouts around my calendar and it shortens a workout to fit.",
    date: "2026-11-17",
    tag: "Training",
    cta: "time",
    body: [
      {
        p: "A workout that has a time in your calendar is far more likely to happen than one you'll get to later. Liftsmith can put your training days in your calendar, and, if you like, read when you're busy and shorten a workout to fit the time you really have.",
      },
      { h2: "Add your training days" },
      {
        ol: [
          "Open **Settings › Training › Schedule**.",
          "Pick your training weekdays. They also set your days-a-week goal.",
          "Set a time on the clock dial: tap or drag round the face for the hour, then the minutes.",
          "Tap **Add to my calendar**.",
        ],
      },
      {
        p: "Liftsmith adds one weekly repeating event, as long as your usual workout, to your main calendar. Change your days or time and tap **Update**, or **Remove** to take it out. On Android it picks your Google account's main calendar over a phone-only one, so it shows up where you look. The web app gives you a calendar file to open in any calendar app.",
      },
      { cta: "time" },
      { h2: "Fit workouts around my calendar" },
      {
        p: 'This one is a separate switch in the Android and iPhone apps. When it\'s on, Today checks your calendar for the next three hours. If a meeting starts before your planned workout could finish, it offers a shorter one that fits: "Busy at 7:00 pm · Fit a 30-minute workout". One tap and the plan shrinks to fit.',
      },
      { h2: "Private" },
      {
        p: "Liftsmith only reads the **start and end times** of your events. Titles, places, people and notes are never read. All-day events, events marked free and Liftsmith's own event are ignored, and nothing leaves your phone.",
      },
      { h2: "A short workout beats no workout" },
      {
        p: "Thirty focused minutes keeps your streak and your progress moving. For more on making short sessions count, see [30-minute workouts that still build strength](/blog/30-minute-strength-workout/).",
      },
      {
        tip: "Schedule your workouts for the time you usually train, not the time you wish you did. A realistic calendar is one you'll keep.",
      },
    ],
    faq: [["Is the calendar free?", "Yes. Adding workouts to your calendar and fitting them around it are free."]],
  },
];
