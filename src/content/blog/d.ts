import type { Article } from "../articles";

// Blog, part four: splits, programs, rep ranges, frequency, progression schemes, exercise choice.
export const BLOG_D: Article[] = [
  {
    slug: "push-pull-legs-split",
    kind: "blog",
    title: "Push pull legs split: a complete guide with sample days",
    description:
      "How a push pull legs split works, three or six days a week, what goes on each day, how many sets to do, and who it suits best.",
    date: "2026-11-10",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "A push pull legs split groups your training by movement. **Push** days train the muscles that press away from you, **pull** days the ones that pull towards you, and **legs** days everything below the waist. It's one of the most popular ways to organise a week because each day has a clear job and the muscles from one day rest while you train the next.",
      },
      { h2: "What goes on each day" },
      {
        ul: [
          "**Push:** [chest](/muscles/chest/), [front](/muscles/front-delts/) and [side delts](/muscles/side-delts/), [triceps](/muscles/triceps/). Presses, flyes, raises and extensions.",
          "**Pull:** [lats](/muscles/lats/), [upper back](/muscles/upper-back/), [rear delts](/muscles/rear-delts/), [biceps](/muscles/biceps/). Rows, pulldowns, pull-ups and curls.",
          "**Legs:** [quads](/muscles/quads/), [hamstrings](/muscles/hamstrings/), [glutes](/muscles/glutes/), [calves](/muscles/calves/), plus core. Squats, hinges, lunges and curls.",
        ],
      },
      { h2: "Three days or six?" },
      {
        p: "Run once through (push, pull, legs, three days a week) and every muscle is trained once a week. That works, but for growth most lifters do better hitting each muscle at least twice a week. Running the cycle twice (six days) does that, and so does a rolling rotation where you train push, pull, legs, rest and repeat, which lands each day roughly every four days.",
      },
      {
        p: "If six days is more than your life allows, a four-day [upper/lower split](/blog/upper-lower-split/) or three [full body](/blog/full-body-vs-split-workouts/) sessions give you the same twice-a-week frequency in fewer days.",
      },
      { cta: "plan" },
      { h2: "Sample push day" },
      {
        exercises: ["bench-press", "db-incline-press", "overhead-press", "lateral-raise", "cable-pushdown"],
      },
      { p: "Three or four sets of 6 to 10 reps on the presses, 10 to 15 on the raises and pushdowns." },
      { h2: "Sample pull day" },
      { exercises: ["pull-up", "barbell-row", "seated-cable-row", "face-pull", "db-curl"] },
      { p: "Swap the pull-ups for [lat pulldowns](/exercises/lat-pulldown/) if you can't yet do 5 clean reps." },
      { h2: "Sample legs day" },
      { exercises: ["back-squat", "romanian-deadlift", "walking-lunge", "lying-leg-curl", "standing-calf-raise"] },
      {
        p: "Squats and Romanian deadlifts are the heavy work. Keep the rest at 8 to 15 reps so the day doesn't take two hours.",
      },
      { h2: "Common mistakes" },
      {
        ul: [
          "**Too many exercises.** Five or six well-chosen lifts are plenty. A dozen presses on push day is junk volume by the end.",
          "**Skipping legs day.** Because it's the hardest, it's the one that slips. Put it first in the week if that keeps you honest.",
          "**Never changing the weight.** A split is just a schedule. You still need [progressive overload](/guides/progressive-overload/) on every lift.",
          "**Counting sets wrong.** Rows train the rear delts and biceps too. Count [weekly sets per muscle](/blog/how-many-sets-per-week-to-build-muscle/), not per exercise.",
        ],
      },
      { tip: "Missed a day? Don't skip ahead. Do the next day in the rotation, so no muscle group gets left out for a fortnight." },
      { h2: "Push pull legs in Liftsmith" },
      {
        p: "Pick **Push / pull / legs** in Settings › Training › Program and Liftsmith plans each day from only that day's muscles, using the equipment in your gym and skipping any muscle that isn't recovered yet. It keeps the effort targets, deload weeks, readiness calls and the workout length slider, and moves your weights and reps forward every session. The split is part of Pro; the fixed programs are free.",
      },
    ],
    faq: [
      [
        "Is push pull legs good for beginners?",
        "It can be, but most beginners progress faster on three full body sessions a week, which train every muscle more often with fewer days in the gym. Push pull legs suits people who can train five or six days a week.",
      ],
      [
        "How many sets per day on a push pull legs split?",
        "Aim for about 12 to 20 hard sets per session, split across five or six exercises, so each main muscle gets 6 to 10 sets that day.",
      ],
      [
        "Can I do push pull legs three days a week?",
        "Yes. You'll train each muscle once a week, so make each session a little bigger, or add a fourth day that repeats whichever day you most want to improve.",
      ],
    ],
  },
  {
    slug: "upper-lower-split",
    kind: "blog",
    title: "Upper lower split: the four-day plan that fits most lives",
    description:
      "How an upper/lower split works, why four days a week suits so many lifters, a sample week with heavy and lighter days, and how to progress it.",
    date: "2026-11-10",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "An upper/lower split alternates two kinds of day: one for everything above the waist, one for everything below. Four sessions a week trains every muscle twice, which is the sweet spot for most people who want to get stronger and bigger without living in the gym.",
      },
      { h2: "Why it works" },
      {
        ul: [
          "**Twice a week per muscle.** A 2016 meta-analysis by Schoenfeld, Ogborn and Krieger found training a muscle twice a week grew it more than once a week, at the same weekly sets.",
          "**Sessions stay manageable.** Half the body per day means 45 to 70 minutes, not two hours.",
          "**Recovery is built in.** Your legs rest on upper days and your upper body on lower days, so you can train on back-to-back days.",
        ],
      },
      { h2: "A sample week" },
      {
        p: "A common schedule is Monday upper, Tuesday lower, Thursday upper, Friday lower. Make the first pair heavier (fewer reps, more weight) and the second pair lighter with more reps. You get strength and size work every week.",
      },
      { h2: "Upper day" },
      { exercises: ["bench-press", "barbell-row", "overhead-press", "lat-pulldown", "lateral-raise", "hammer-curl"] },
      { h2: "Lower day" },
      { exercises: ["back-squat", "romanian-deadlift", "bulgarian-split-squat", "lying-leg-curl", "standing-calf-raise", "plank"] },
      { cta: "plan" },
      {
        p: "On the lighter days, swap the barbell lifts for variations: [dumbbell incline press](/exercises/db-incline-press/) for bench, [front squat](/exercises/front-squat/) or [leg press](/exercises/leg-press/) for back squat, [chest-supported row](/exercises/chest-supported-row/) for barbell row. Different angles, same muscles, less wear on the same joints.",
      },
      { h2: "How to progress it" },
      {
        p: "Use a rep range on every lift, for example 6 to 8 on heavy days and 10 to 12 on light days. When you hit the top of the range on every set, add a small step of weight next time and work back up. That's [double progression](/blog/linear-vs-double-progression/), and it keeps working long after adding weight every session stops.",
      },
      {
        p: "Every four to six weeks, take a lighter [deload week](/guides/deload-week/) and start the next block a little heavier than the last.",
      },
      {
        tip: "Only three days this week? Do upper, lower, then whichever you missed the least recently. Don't try to cram two days into one.",
      },
      { h2: "Upper/lower in Liftsmith" },
      {
        p: "Pick **Upper / lower** in Settings › Training › Program and Liftsmith alternates the days for you, choosing exercises your gym can do for that half of the body and leaving out muscles that haven't recovered. It runs your blocks with effort targets and a deload, and adjusts each day from your readiness. Part of Pro.",
      },
    ],
    faq: [
      [
        "Is an upper lower split good for building muscle?",
        "Yes. It trains every muscle twice a week with enough sets per session to grow, which is what most research on muscle growth points to.",
      ],
      [
        "Can I do upper lower three days a week?",
        "You can alternate upper, lower, upper one week and lower, upper, lower the next. Each muscle gets three sessions every two weeks, which still works well.",
      ],
    ],
  },
  {
    slug: "5x5-workout-for-beginners",
    kind: "blog",
    title: "The 5x5 workout: a simple plan for getting strong",
    description:
      "How the classic 5x5 workout works, the two alternating days, how much to add each session, what to do when you stall, and when to move on.",
    date: "2026-11-10",
    tag: "Beginners",
    cta: "progress",
    body: [
      {
        p: "Five sets of five reps on a few big barbell lifts, three days a week, adding a little weight every session. The 5×5 has been getting beginners strong for decades because it's simple, it's measurable and it works.",
      },
      { h2: "The two workouts" },
      { p: "You alternate two sessions, A and B, with a rest day between each (Monday, Wednesday, Friday is the classic)." },
      {
        ul: [
          "**Workout A:** [squat](/exercises/back-squat/) 5×5, [bench press](/exercises/bench-press/) 5×5, [barbell row](/exercises/barbell-row/) 5×5.",
          "**Workout B:** [squat](/exercises/back-squat/) 5×5, [overhead press](/exercises/overhead-press/) 5×5, [deadlift](/exercises/deadlift/) 1×5.",
        ],
      },
      {
        p: "You squat every session, which is why your legs get strong so fast. The deadlift is one set because it's heavy and tiring, and squats already train the same muscles.",
      },
      { h2: "How much weight to start with" },
      {
        p: "Start lighter than you think: a weight you could do for 5 sets of 5 with good form and two or three reps to spare. For many beginners that's the empty bar on presses. Starting light gives you weeks of steady progress before it gets hard. Our [one-rep max calculator](/tools/one-rep-max-calculator/) helps if you've lifted before.",
      },
      { cta: "progress" },
      { h2: "How to progress" },
      {
        ul: [
          "Add **2.5 kg (5 lb)** to each lift every time you complete all five sets of five.",
          "Add **5 kg (10 lb)** to the deadlift, since it moves the most weight.",
          "If you miss reps, keep the same weight next time.",
          "Miss the same weight three sessions running? Drop that lift by 10% and build back up. You'll pass the old weight within a couple of weeks.",
        ],
      },
      {
        tip: "Small plates make or break this plan. If your gym's smallest plate is 2.5 kg, a 5 kg jump on the press is too big. Buy a pair of 1.25 kg plates or use a smaller step.",
      },
      { h2: "Rest and warm-ups" },
      {
        p: "Rest 3 to 5 minutes between heavy sets once the weights get serious; five-rep sets need it. [Warm up](/blog/how-to-warm-up-for-lifting/) with the empty bar and two or three lighter sets before your first work set on each lift.",
      },
      { h2: "When to move on" },
      {
        p: "Most people run a 5×5 for three to six months. When you've reset the same lift twice and still stall, adding weight every session has done its job. Move to a plan that progresses weekly, like a [four-day upper/lower split](/blog/upper-lower-split/) with heavy and light days.",
      },
      { h2: "Run it in Liftsmith" },
      {
        p: "**Classic 5×5** is a free program in Liftsmith. Pick it in Settings › Training › Program and it alternates A and B days, adds the weight when you earn it, drops 10% after three misses, adds warm-up sets and shows which [plates to load](/blog/how-to-load-a-barbell/) for every set. There's also a 5×5 with arm work, a ramping version and a three-sets-of-five novice plan.",
      },
    ],
    faq: [
      [
        "Is 5x5 good for building muscle?",
        "Yes, especially for beginners. Five-rep sets on big lifts build plenty of muscle early on, though adding some higher-rep work for arms and shoulders helps once progress slows.",
      ],
      ["How long should a 5x5 workout take?", "About 45 to 75 minutes, mostly rest. Early on, with light weights, it's closer to 40."],
      [
        "Can I do 5x5 with dumbbells?",
        "You can follow the same idea with dumbbell squats, presses and rows, but dumbbells come in bigger jumps, so you'll add reps before you add weight.",
      ],
    ],
  },
  {
    slug: "how-many-days-a-week-to-lift",
    kind: "blog",
    title: "How many days a week should you lift weights?",
    description:
      "Two, three, four or more: how many days a week to strength train for your goal and schedule, and how to lay out the week so you recover.",
    date: "2026-11-10",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "The best number of training days is the one you can keep doing for a year. That said, there are real differences between two, three, four and five days, and picking the right one for your life makes progress a lot easier.",
      },
      { h2: "The short answer" },
      {
        ul: [
          "**2 days:** enough to build strength and keep muscle. Make both sessions full body.",
          "**3 days:** the sweet spot for beginners and busy people. Three full body sessions train everything three times a week.",
          "**4 days:** where most intermediate lifters land. An [upper/lower split](/blog/upper-lower-split/) fits neatly.",
          "**5 to 6 days:** for people who enjoy training and recover well. A [push pull legs split](/blog/push-pull-legs-split/) or a mix of splits.",
        ],
      },
      { h2: "What matters more than days" },
      {
        p: "Muscles respond to the weekly **sets** they get and how often they're trained, not the number of days you walk into the gym. Ten hard sets a week for your chest spread over two or three sessions will do about the same whether that's in three days or five. See [how many sets per week](/blog/how-many-sets-per-week-to-build-muscle/) for the targets.",
      },
      {
        p: "So the question is really: how many sessions do you need to fit your sets in without any one session dragging on? Fewer days means longer sessions; more days means shorter ones.",
      },
      { cta: "plan" },
      { h2: "Lay out the week for recovery" },
      {
        ul: [
          "Give each muscle about 48 hours before you train it hard again. More after heavy [deadlifts](/exercises/deadlift/) or lots of lunges.",
          "Full body days need a rest day between them. Splits can go back to back.",
          "Put your hardest day after your best night's sleep, which for many people is after a weekend.",
          "Two days off in a row once a week helps more than it costs.",
        ],
      },
      { tip: "Pick the number of days you'd still manage in your worst week, not your best. You can always add a bonus session." },
      { h2: "What if your week changes?" },
      {
        p: "Real weeks don't follow a template. If you miss a day, don't double up. Do the next session as normal and let the plan catch up. A week with one session still keeps your strength; a [break of a few weeks](/blog/getting-back-into-lifting/) costs less than you fear.",
      },
      { h2: "Let Liftsmith fit your week" },
      {
        p: "Pick your training days in Liftsmith and it plans each day from what you've actually done, not a fixed calendar. Miss a day and the next workout trains whatever is most recovered and most behind on its weekly sets. If the week's goal is at risk, a coach's note offers a short 30-minute session to keep it on track.",
      },
    ],
    faq: [
      [
        "Is lifting 3 days a week enough?",
        "Yes. Three full body sessions a week is enough for beginners and many intermediate lifters to build strength and muscle steadily for years.",
      ],
      [
        "Is it bad to lift every day?",
        "Not if you rotate muscles and keep most sessions moderate. Training the same muscles hard every day leaves no time to recover, which stalls progress.",
      ],
    ],
  },
  {
    slug: "how-many-reps-to-build-muscle",
    kind: "blog",
    title: "How many reps to build muscle or get stronger?",
    description:
      "Rep ranges explained: what 1 to 5, 6 to 12 and 15+ reps do, why effort matters more than the number, and how to pick reps for each exercise.",
    date: "2026-11-10",
    tag: "Effort",
    cta: "rir",
    body: [
      {
        p: "You've probably heard that 1 to 5 reps builds strength, 8 to 12 builds muscle and 15+ builds endurance. It's not wrong, but it's tidier than reality. The number of reps matters less than how close to failure you take each set.",
      },
      { h2: "What the research says" },
      {
        p: "A 2017 meta-analysis by Schoenfeld, Grgic, Ogborn and Krieger compared heavy and light loads. When sets were taken close to failure, muscle growth was about the same anywhere from roughly 6 to 30 reps. Strength, though, improved more with heavier loads, because lifting heavy is a skill you get better at by practising it.",
      },
      { h2: "A practical guide" },
      {
        ul: [
          "**1 to 5 reps:** best for getting stronger on a specific lift. Use it on big compound lifts like [squats](/exercises/back-squat/), [deadlifts](/exercises/deadlift/) and the [bench press](/exercises/bench-press/).",
          "**6 to 12 reps:** the most time-efficient for muscle. Heavy enough to build strength too, light enough to do plenty of sets.",
          "**12 to 20+ reps:** good for small muscles and joint-friendly exercises: [lateral raises](/exercises/lateral-raise/), [curls](/exercises/db-curl/), [face pulls](/exercises/face-pull/), [calf raises](/exercises/standing-calf-raise/).",
        ],
      },
      { cta: "rir" },
      { h2: "Effort is the real target" },
      {
        p: "A set of 12 where you could have done 25 does very little. A set of 12 where you had one or two reps left in the tank does a lot. That's why effort targets, measured as [reps in reserve](/guides/reps-in-reserve/), matter more than the number on the page. Aim to finish most work sets with 1 to 3 reps left.",
      },
      { h2: "Match reps to the exercise" },
      {
        ul: [
          "**Heavy barbell lifts:** lower reps keep your form solid. Fatigue breaks technique on a 20-rep squat long before the muscles give out.",
          "**Machines and cables:** higher reps are safe and effective, since balance isn't the limit.",
          "**Dumbbells:** the jumps between sizes are big, so use a rep range and add reps before you go up a size.",
          "**Bodyweight:** you can't add weight, so use reps and harder variations. See [strength training with no equipment](/blog/no-equipment-strength-workout/).",
        ],
      },
      { tip: "Use a mix. Heavy work on your main lift of the day, moderate reps on the next two, higher reps to finish." },
      { h2: "How Liftsmith picks reps" },
      {
        p: "Liftsmith gives each exercise a rep range that suits it: lower for heavy compounds, higher for small muscles and machines. Each set has an effort target for that week of your block, and when you beat the top of the range it adds weight next time. The reason is shown under every target, so you always know why it asked for that number.",
      },
    ],
    faq: [
      [
        "Is 3 sets of 10 good for building muscle?",
        "Yes, if the sets are hard. Three sets of 10 taken to within two or three reps of failure is a solid amount of work for a muscle in one session.",
      ],
      [
        "Do high reps build muscle?",
        "Yes. Sets of 15 to 30 build about as much muscle as heavier sets when taken close to failure. They're just more tiring and take longer.",
      ],
    ],
  },
  {
    slug: "linear-vs-double-progression",
    kind: "blog",
    title: "Linear vs double progression: when to add weight",
    description:
      "Two simple ways to add weight to the bar: what linear and double progression are, who each suits, and how to switch when one stops working.",
    date: "2026-11-10",
    tag: "Progress",
    cta: "progress",
    body: [
      {
        p: "Every strength plan comes down to one question: when do you add weight? The two simplest answers are **linear progression** and **double progression**, and knowing which to use saves you months of spinning your wheels.",
      },
      { h2: "Linear progression" },
      {
        p: "Add a fixed amount of weight every session. Squat 60 kg for 5×5 on Monday, 62.5 kg on Wednesday, 65 kg on Friday. It's the fastest way to get strong as a beginner, because your body adapts that quickly at first. The [5×5 workout](/blog/5x5-workout-for-beginners/) runs on it.",
      },
      {
        p: "The catch: it stops. Eventually a session's jump is bigger than what you can recover from, and you start missing reps. For most people that comes after three to six months on the big lifts, and much sooner on small lifts like the overhead press or curls.",
      },
      { h2: "Double progression" },
      {
        p: "Pick a rep range, say 8 to 12. Use the same weight until you hit 12 on every set. Then add the smallest step of weight and you'll be back near 8. Build back up to 12, and repeat. You progress reps first and weight second: two kinds of progress, hence the name.",
      },
      {
        ul: [
          "Session 1: 20 kg × 10, 9, 8",
          "Session 2: 20 kg × 11, 10, 9",
          "Session 3: 20 kg × 12, 12, 11",
          "Session 4: 20 kg × 12, 12, 12. Next time, add weight.",
          "Session 5: 22 kg × 9, 8, 8",
        ],
      },
      { cta: "progress" },
      { h2: "Which should you use?" },
      {
        ul: [
          "**Brand new to lifting:** linear on the big barbell lifts. Enjoy it while it lasts.",
          "**Dumbbells and machines:** double progression. The jumps between dumbbells are too big to add every session.",
          "**Small muscles:** double progression from the start. A 2.5 kg jump on a lateral raise is a huge percentage.",
          "**After the first few months:** double progression on almost everything, with weekly or block-to-block jumps on your main lifts.",
        ],
      },
      { tip: "Use the smallest plates you have. A 1 kg jump you can make every week beats a 5 kg jump you stall on for a month." },
      { h2: "When either one stalls" },
      {
        p: "Missing reps three sessions running usually means fatigue, not lost strength. Take a [deload week](/guides/deload-week/) or drop the weight 10% and build back. If one lift stalls while the rest move, read [how to break a strength plateau](/blog/how-to-break-a-strength-plateau/).",
      },
      { h2: "How Liftsmith handles it" },
      {
        p: "Liftsmith's adaptive plans use double progression with your effort feedback: hit the top of the range and it adds the smallest step your plates and dumbbells can make; miss reps and it holds or pulls back. The fixed programs, like Classic 5×5, use their own linear rules. Either way, the next session is filled in before you arrive.",
      },
    ],
  },
  {
    slug: "compound-vs-isolation-exercises",
    kind: "blog",
    title: "Compound vs isolation exercises: which do you need?",
    description:
      "What makes an exercise compound or isolation, why big lifts come first, when isolation work is worth it, and how to balance both in a workout.",
    date: "2026-11-10",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "A **compound** exercise moves several joints and trains several muscles at once, like a squat or a row. An **isolation** exercise moves one joint and targets one muscle, like a curl. Both have a place. The trick is knowing how much of each.",
      },
      { h2: "Compound lifts do the heavy lifting" },
      {
        p: "Compound lifts let you move the most weight, train the most muscle per minute and build strength that carries over to everyday life. If you only had 30 minutes, you'd spend it on these:",
      },
      { exercises: ["back-squat", "deadlift", "bench-press", "overhead-press", "barbell-row", "pull-up"] },
      { h2: "Isolation fills the gaps" },
      {
        p: "Some muscles get less from compound lifts than you'd think. The [side delts](/muscles/side-delts/) barely work in presses, the hamstrings work at only one end in squats, and the biceps are rarely the limit in rows. Isolation work targets them directly:",
      },
      { exercises: ["lateral-raise", "lying-leg-curl", "db-curl", "cable-pushdown", "standing-calf-raise", "face-pull"] },
      { cta: "plan" },
      { h2: "How to balance them" },
      {
        ol: [
          "**Start with one or two compound lifts** while you're fresh. They need the most focus and the heaviest weights.",
          "**Follow with a compound variation or accessory**, like a [dumbbell incline press](/exercises/db-incline-press/) after bench.",
          "**Finish with one to three isolation exercises** for muscles that need more work or that you want to bring up.",
        ],
      },
      {
        p: "For most people, about two-thirds compound and one-third isolation by sets is a good balance. Beginners can lean further towards compounds; if you've been lifting a few years and want a lagging muscle to grow, add more isolation for it.",
      },
      {
        tip: "Isolation exercises are kinder to sore joints. If a press bothers your shoulder, [lateral raises](/exercises/lateral-raise/) and [pushdowns](/exercises/cable-pushdown/) often don't.",
      },
      { h2: "How Liftsmith orders a workout" },
      {
        p: "Liftsmith puts compound lifts first in every plan, then fills the remaining sets each muscle needs with the exercises your gym can do. It counts a compound lift as half a set for its helper muscles, so an arm doesn't get double-counted, and adds isolation work where a muscle is behind on its weekly sets.",
      },
    ],
  },
];
