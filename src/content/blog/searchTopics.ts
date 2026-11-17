import type { Article } from "../articles";

// Blog: search topics the blog didn't cover yet (Melvin, 2026-11-17: "training with your menstrual cycle,
// menopause strength training, and lifting on GLP-1 medication, plus more"). Health claims stay plain and
// cautious, with "ask your doctor" where it matters; no disease, death or "live longer" claims next to fitness age
// (docs/decisions/fitness-age.md). App claims stay to what ships, and no other app is named (seo.test.ts).
export const BLOG_SEARCH_TOPICS: Article[] = [
  {
    slug: "training-with-your-menstrual-cycle",
    kind: "blog",
    title: "Training with your menstrual cycle: what the research says",
    description:
      "Should you lift differently in each phase of your cycle? What the evidence actually shows, how to train by feel, and when to adjust your week.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Cycle syncing is everywhere: heavy lifting in the first half of your cycle, gentle walks and yoga in the second, a different plan for each phase. It sounds tidy. The research is messier, and the honest answer is more useful: your cycle can affect how you feel in training, but how much, and when, is personal.",
      },
      { h2: "The phases, briefly" },
      {
        ul: [
          "**Period (menstrual phase):** roughly days 1 to 5. Hormones are at their lowest. Some people feel flat or crampy, others feel fine.",
          "**Follicular phase:** from the period to ovulation. Estrogen rises. Many people feel energetic here.",
          "**Ovulation:** around the middle of the cycle.",
          "**Luteal phase:** after ovulation to the next period. Progesterone rises, body temperature goes up a little, and the last few days can bring tiredness, bloating or poor sleep.",
        ],
      },
      { h2: "What the evidence shows" },
      {
        p: "Large reviews of the research find that strength and performance change **little, if at all, on average** across the cycle, and that differences between people are much bigger than differences between phases. Studies that planned more hard training in the follicular phase found small benefits in some groups, but they're few and small. There isn't good evidence that you need a separate program for each phase.",
      },
      {
        p: "What is clear is that **symptoms matter**. Cramps, heavy bleeding, poor sleep and low energy all affect a session, whatever phase you're in. That's a reason to adjust a day, not to rebuild your plan.",
      },
      { cta: "plan" },
      { h2: "How to train with your cycle in practice" },
      {
        ol: [
          "**Keep your normal plan.** Lifting through your whole cycle is safe and builds the same muscle and strength.",
          "**Adjust by feel on the day.** On a rough day, keep the weights and do fewer sets, or leave an extra rep or two in reserve. On a great day, push.",
          "**Track it for a few months.** Note how sessions felt alongside your cycle. Patterns that are real for you will show up; ones that aren't won't.",
          "**Look after the basics.** Sleep, enough food and enough iron matter more in the days you feel worst.",
        ],
      },
      { h2: "How Liftsmith handles it" },
      {
        p: "Liftsmith has an optional **cycle-aware readiness** setting. You log the first day of a period with one tap, and it estimates your phase from your own cycle length. It nudges today's call a little: a touch easier in period days and the late luteal phase, a touch harder in the follicular phase. The effect is small on purpose, because the evidence is mixed, and you can always override it. Everything you log stays on your phone, is never used for analytics, and turning it off deletes it.",
      },
      {
        tip: "If your period is very heavy or painful, or you've stopped having periods while training hard, see a doctor. Both are worth checking, and neither is something to train through.",
      },
    ],
    faq: [
      [
        "Should I avoid heavy lifting on my period?",
        "No, unless you feel unwell. Lifting heavy on your period is safe. Go by how you feel on the day.",
      ],
      [
        "Does hormonal birth control change this?",
        "It usually evens out the hormone swings, so phases matter even less. Training by feel works the same way.",
      ],
    ],
  },
  {
    slug: "strength-training-through-menopause",
    kind: "blog",
    title: "Strength training through menopause: why lifting matters more now",
    description:
      "Around menopause, muscle and bone get harder to keep. Here's why lifting helps, how heavy to go, and a simple twice-a-week plan to start with.",
    date: "2026-11-17",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "Perimenopause and menopause bring a lot of change: sleep, mood, hot flushes, weight moving to the middle. Less talked about is what happens to muscle and bone. As estrogen falls, both become harder to keep, and the years around menopause are when many women lose bone density fastest. Strength training is one of the best tools there is for this, and it's never too late to start.",
      },
      { h2: "Why lifting helps" },
      {
        ul: [
          "**Muscle:** lifting is the strongest signal your body gets to build and keep muscle, which also helps with blood sugar and everyday strength.",
          "**Bone:** bone responds to load. Research in postmenopausal women with low bone density found that supervised, progressively heavy lifting improved bone density and was safe.",
          "**Body composition:** lifting helps keep muscle while weight shifts, so the scale matters less than what it's made of.",
          "**Sleep and mood:** regular exercise helps both, and many women say lifting makes them feel strong at a time their body feels unfamiliar.",
        ],
      },
      { h2: "How heavy?" },
      {
        p: "Heavier than you might think. Light weights for lots of reps are fine for starting out, but bone and muscle respond best to loads that feel challenging in **5 to 10 reps**, built up gradually over weeks. Work up to sets where you have one to three reps left in the tank. Start light, learn the movement, and add weight every week or two.",
      },
      { cta: "plan" },
      { h2: "A simple plan: twice a week" },
      {
        p: "Two full-body sessions a week, on non-consecutive days, is enough to make real progress. Each session, pick one exercise from each pattern and do 2 to 3 sets:",
      },
      { exercises: ["goblet-squat", "romanian-deadlift", "db-bench-press", "db-row", "farmers-carry"] },
      {
        ul: [
          "**Squat:** goblet squat or leg press.",
          "**Hinge:** Romanian deadlift or hip thrust.",
          "**Push:** dumbbell bench press or push-up.",
          "**Pull:** dumbbell row or lat pulldown.",
          "**Carry:** farmer's carry, for grip, posture and the whole body.",
        ],
      },
      {
        p: "If you can, add a little impact on other days: brisk walking, stair climbing or small hops, as your joints allow. Balance work, like standing on one leg while you brush your teeth, helps too.",
      },
      { h2: "Plan around how you feel" },
      {
        p: "Poor sleep and hot flushes can make some days harder. That's a reason to adjust the day, not skip the week. Liftsmith's **today's call** reads how you slept from Health Connect or Apple Health (Pro) and makes the session easier when you need it. The **one-leg stand** and **chair stand** tests on Body › Health give you a monthly check on balance and leg strength.",
      },
      {
        tip: "Talk to your doctor about a bone density scan if you haven't had one. It's a useful starting point, and a good reason to keep lifting.",
      },
    ],
    faq: [
      [
        "Is it safe to start lifting after menopause?",
        "For most women, yes. Start light, learn good form and build up. Check with your doctor first if you have a health condition or a past fracture.",
      ],
      ["Will lifting make me bulky?", "No. It builds firm, strong muscle slowly. Bulk takes years of eating and training for it."],
    ],
  },
  {
    slug: "lifting-on-glp-1-medication",
    kind: "blog",
    title: "Lifting on GLP-1 medication: keep your muscle while you lose weight",
    description:
      "Weight loss medications can take muscle with the fat. Strength training and enough protein help you keep it. A simple plan for lifting on a GLP-1.",
    date: "2026-11-17",
    tag: "Nutrition",
    cta: "measure",
    body: [
      {
        p: "GLP-1 medications, such as semaglutide and tirzepatide, have changed weight loss for millions of people. They make you less hungry, so you eat less and lose weight, often quickly. But fast weight loss doesn't only come from fat. In the studies, a meaningful share of the weight lost was lean mass, which includes muscle. Keeping that muscle is the difference between being lighter and being lighter and strong.",
      },
      { h2: "Why muscle matters here" },
      {
        ul: [
          "**Strength for daily life:** carrying shopping, climbing stairs, getting up off the floor.",
          "**Metabolism:** muscle helps manage blood sugar and uses energy even at rest.",
          "**After the medication:** if you stop, having kept your muscle makes it easier to hold on to your progress.",
        ],
      },
      { h2: "The two things that help most" },
      {
        p: "**1. Lift weights two to three times a week.** Resistance training is the signal that tells your body to keep muscle while you're eating less. Full-body sessions with compound lifts are ideal: a squat, a hinge, a push, a pull and a carry, 2 to 3 sets each, ending sets with one to three reps left in the tank.",
      },
      {
        p: "**2. Eat enough protein, even when you're not hungry.** Low appetite makes this hard. Aim for roughly **1.2 to 1.6 grams per kilogram** of body weight a day, or what your doctor or dietitian suggests, spread over meals. Protein first on the plate, then the rest. Yogurt, eggs, milk, fish, tofu and protein shakes are easy when appetite is low.",
      },
      { cta: "measure" },
      { h2: "A starting plan" },
      { exercises: ["goblet-squat", "romanian-deadlift", "push-up", "db-row", "farmers-carry"] },
      {
        ul: [
          "**Weeks 1 to 2:** learn the movements with light weights, 2 sets of 10 to 12.",
          "**Weeks 3 to 8:** add weight when you hit the top of your rep range. Move to 3 sets of 8 to 10.",
          "**Every week:** walk most days, and keep your water up, especially if the medication upsets your stomach.",
        ],
      },
      { h2: "Watch more than the scale" },
      {
        p: "On a GLP-1, the scale moves fast and doesn't say what you're losing. Track **body fat**, **tape measurements** and **your lifts** too. If your weight is dropping fast and your strength is dropping with it, eat more protein and keep lifting. Liftsmith logs weigh-ins, body fat and measurements in a few taps, reads them from a smart scale through Health Connect or Apple Health, and adds a coach's note when your weight is falling faster than 1% a week.",
      },
      {
        tip: "Train on the days you feel best on the medication. Many people feel least nauseous a few days after their dose: plan your harder sessions there.",
      },
    ],
    faq: [
      [
        "Should I talk to my doctor before lifting on a GLP-1?",
        "Yes, especially if you're new to exercise or have other health conditions. Lifting is usually encouraged.",
      ],
      [
        "Can I build muscle on a GLP-1?",
        "Beginners often can, even while losing fat, as long as they lift and eat enough protein. Keeping muscle is a good result too.",
      ],
    ],
  },
  {
    slug: "vo2-max-for-lifters",
    kind: "blog",
    title: "VO2 max for lifters: what it is and how to raise it",
    description:
      "VO2 max is how much oxygen your body can use. What your watch's number means, why it matters for lifters, and two kinds of cardio that raise it.",
    date: "2026-11-17",
    tag: "Heart rate",
    cta: "health",
    body: [
      {
        p: "VO2 max has gone from a lab number to something on everyone's watch. It's one of the best single measures of cardio fitness, and it responds well to training. For lifters, it's also the part of fitness that's easiest to neglect. Here's what it is, how good your watch's estimate is, and how to raise it without giving up any strength.",
      },
      { h2: "What VO2 max is" },
      {
        p: "VO2 max is the most oxygen your body can take in and use during all-out effort, measured in millilitres per kilogram of body weight per minute. A higher number means your heart, lungs and muscles can do more work aerobically. It naturally falls with age, but training slows that a lot, and fit older adults often beat untrained younger ones.",
      },
      { h2: "How good is your watch's number?" },
      {
        p: "Lab tests measure your breathing on a treadmill or bike. Watches estimate it from your heart rate against your pace, usually on outdoor runs or brisk walks. The estimate can be off by several points for any one person, but the **trend over months** is useful: if it's climbing, your fitness is.",
      },
      { cta: "health" },
      { h2: "How to raise it" },
      {
        p: "Two kinds of cardio work best together:",
      },
      {
        ul: [
          "**Hard intervals, once or twice a week.** A classic is 4 rounds of 4 minutes hard (breathing heavily, a few words at a time), with 3 minutes easy between. On a bike, rower or hill, they're easy on the joints.",
          "**Easy cardio, most of the rest.** Long, conversational sessions build the base the intervals sit on. See [zone 2 cardio for lifters](/blog/zone-2-cardio-for-lifters/).",
        ],
      },
      { exercises: ["rower-intervals", "bike-sprint", "incline-walk"] },
      {
        p: "Does it hurt your lifting? Not in sensible amounts. Keep hard intervals away from heavy leg days, or do them after lifting, and strength keeps climbing. More in [cardio and strength training](/blog/cardio-and-strength-training/).",
      },
      { h2: "Fitness age in Liftsmith" },
      {
        p: "If your watch records VO2 max, **Body › Health** shows your **fitness age**: the age at which a typical healthy person of your sex has your VO2 max, from a large published study. It says how it's worked out, what moves it (hard cardio twice a week) and how many strength days you've done this week. Liftsmith can add a cardio part to any workout, so the intervals fit into a session you're already doing.",
      },
      {
        tip: "Use the same route and conditions for the walks or runs your watch estimates from. Hills, heat and wind all move the number.",
      },
    ],
    faq: [
      ["What's a good VO2 max?", "It depends on age and sex. Compare with your own number over time rather than with other people."],
      ["Can lifting alone raise VO2 max?", "A little, for beginners and with short rests, but cardio raises it much more."],
    ],
  },
  {
    slug: "how-many-calories-should-i-eat",
    kind: "blog",
    title: "How many calories should I eat? Finding your number",
    description:
      "Work out your maintenance calories, pick a deficit or surplus that fits your goal, and adjust from your weigh-ins. Simple steps, no guesswork.",
    date: "2026-11-17",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: "Every diet, whatever it calls itself, works by changing how much you eat compared with how much you burn. So the most useful number in nutrition is your **maintenance**: the calories that keep your weight steady. Find that, and losing fat, building muscle or holding steady is a matter of small, steady changes.",
      },
      { h2: "Step 1: estimate your maintenance" },
      {
        p: "Your **total daily energy expenditure** (TDEE) is what you burn in a day: your body's basic needs, plus digestion, plus everything you do, from training to walking to fidgeting. Our free [TDEE calculator](/tools/tdee-calculator/) estimates it from your age, sex, height, weight and activity. It's a starting point, usually within a couple of hundred calories of the truth.",
      },
      { h2: "Step 2: pick a target for your goal" },
      {
        ul: [
          "**Lose fat:** eat about 300 to 500 calories under maintenance, aiming to lose 0.5 to 1% of your body weight a week. Faster than that tends to cost muscle and energy.",
          "**Build muscle:** eat about 200 to 300 calories over maintenance, aiming to gain around 0.25 to 0.5% a week. More just adds fat. See [how to lean bulk](/blog/lean-bulk/).",
          "**Recomposition:** eat around maintenance with plenty of protein, and lift. It works best for beginners and returning lifters. See [body recomposition](/blog/body-recomposition/).",
        ],
      },
      { cta: "tdee" },
      { h2: "Step 3: set your protein" },
      {
        p: "Whatever your goal, protein does the most work: about 1.6 grams per kilogram of body weight a day suits most lifters, a little more in a deficit. Our [macro calculator](/tools/macro-calculator/) splits your calories into protein, carbs and fat. More in [how much protein you need](/blog/how-much-protein-to-build-muscle/).",
      },
      { h2: "Step 4: let your weigh-ins correct it" },
      {
        p: "A calculator can't know your exact metabolism. Your weigh-ins can. Weigh in a few times a week, look at the trend over two to three weeks, and adjust by 100 to 200 calories if it isn't moving the way you want. Daily weight jumps around with water and salt, so the trend is what counts.",
      },
      {
        p: "Liftsmith does this for you. Your daily calorie burn updates as your weight and training change, and if a food app writes to Health Connect or Apple Health, Liftsmith measures your real maintenance from what you ate and how your weight moved, once there are two weeks of both. Coach's notes speak up when you're eating too little to build muscle, or losing weight faster than 1% a week.",
      },
      {
        tip: "Weigh in first thing in the morning, after the bathroom and before you eat. Same time, same conditions, cleaner trend.",
      },
    ],
    faq: [
      [
        "Is 1,200 calories a day enough?",
        "For most adults, especially those who train, it's too little to keep muscle and energy. Work from your own maintenance instead.",
      ],
      [
        "Do I need to count calories forever?",
        "No. A few weeks of tracking teaches you what your portions look like. Many people then keep an eye on their weight trend instead.",
      ],
    ],
  },
  {
    slug: "body-fat-percentage-explained",
    kind: "blog",
    title: "Body fat percentage: what's typical, and how to measure it",
    description:
      "What body fat percentage means, typical ranges for men and women, how accurate scales, calipers and tape methods are, and how to track it over time.",
    date: "2026-11-17",
    tag: "Nutrition",
    cta: "measure",
    body: [
      {
        p: "Two people can weigh the same and look completely different. The difference is what the weight is made of. **Body fat percentage** is the share of your weight that's fat, and for lifters it's a far better guide than weight alone: it tells you whether you're building muscle, losing fat or both.",
      },
      { h2: "Typical ranges" },
      {
        p: "There's no single healthy number, and ranges differ between sources. As a rough guide for adults:",
      },
      {
        ul: [
          "**Men:** around 10 to 20% is common for people who train. Visible abs usually show somewhere around 10 to 12%.",
          "**Women:** around 18 to 28% is common for people who train. Women naturally carry more essential fat, so their numbers run about 8 to 10 points higher than men's.",
          "Numbers drift up a little with age. Very low body fat is hard to hold and isn't healthier.",
        ],
      },
      { h2: "How to measure it" },
      {
        ul: [
          "**Smart scales** pass a tiny current through your body. Easy and great for trends, but readings move with hydration, so measure at the same time each day.",
          "**Skinfold calipers** pinch fat at a few sites. Accurate in skilled hands, less so in your own.",
          "**Tape measurements** use your waist, neck and hips in a formula. Cheap, consistent and surprisingly useful. Try our [body fat calculator](/tools/body-fat-calculator/).",
          "**DEXA scans** are the most precise common option, but cost money and aren't worth doing often.",
        ],
      },
      {
        p: "No home method is exact. The trick is to **pick one and stick with it**, at the same time of day and in the same conditions. The trend is what you act on.",
      },
      { cta: "measure" },
      { h2: "Body fat and muscle together" },
      {
        p: "Body fat percentage also tells you your **lean mass**: everything that isn't fat. If your weight stays the same but your body fat drops, you've built muscle. The [FFMI calculator](/tools/ffmi-calculator/) turns lean mass into a muscularity score that accounts for height.",
      },
      { h2: "Tracking it in Liftsmith" },
      {
        p: "Under every weigh-in there's an optional body fat box, in 0.1 steps from your last reading, so a number from your scale or calipers is a few taps away. Smart scales that write to Health Connect or Apple Health fill it in on their own. Body › Health shows your lean mass and body fat trend over about six weeks, and if body fat creeps up while you're trying to lose it, a coach's note says what to change. No body fat data? Your waist measurement does the same job.",
      },
      {
        tip: "Measure body fat no more than once a week, and judge it over a month. Day to day, it's mostly water.",
      },
    ],
    faq: [
      [
        "Is BMI the same as body fat?",
        "No. BMI only uses height and weight, so a muscular lifter can read as overweight. Body fat is a better guide for people who train.",
      ],
    ],
  },
  {
    slug: "wilks-and-dots-scores-explained",
    kind: "blog",
    title: "Wilks and DOTS scores explained: compare lifters of any size",
    description:
      "Wilks and DOTS turn your squat, bench and deadlift into one score that accounts for body weight. How they work, what's a good score, and which to use.",
    date: "2026-11-17",
    tag: "Strength",
    cta: "onerm",
    body: [
      {
        p: "Who's stronger: a 60 kg lifter with a 400 kg total, or a 100 kg lifter with a 550 kg total? Heavier lifters lift more, but not in a straight line, so raw numbers can't say. **Wilks** and **DOTS** scores solve this. Each turns a lift or a total into one number that accounts for body weight, so lifters of any size can be compared.",
      },
      { h2: "How they work" },
      {
        p: "Both multiply what you lifted by a factor worked out from your body weight and sex. The factor comes from a curve fitted to real competition results: it's bigger for lighter lifters and smaller for heavier ones, so the score reflects how strong you are for your size.",
      },
      {
        ul: [
          "**Wilks** has been used in powerlifting for decades. It was updated in 2020 because the original curve favoured some weight classes.",
          "**DOTS** is a newer formula built on more recent results, and many federations now use it for best-lifter awards.",
        ],
      },
      { h2: "Try them" },
      {
        p: "Enter your body weight and your total (squat, bench and deadlift added together) in our free [DOTS calculator](/tools/dots-calculator/) or [Wilks calculator](/tools/wilks-calculator/). You can use a single lift too, though the scores were designed for totals.",
      },
      { cta: "onerm" },
      { h2: "What's a good score?" },
      {
        p: "Rough guides for DOTS on a total, for drug-free lifters: around 250 to 350 is a solid, well-trained recreational lifter, 350 to 450 is competitive at a local meet, and 450-plus is national level and beyond. Treat these loosely: your own progress is a better measure than anyone else's number.",
      },
      { h2: "Which should you use?" },
      {
        p: "Use whichever your federation or friends use, so the comparison is fair. For your own tracking, pick one and stick with it. Both reward the same thing: getting stronger without getting much heavier.",
      },
      { h2: "You don't need to max out" },
      {
        p: "You don't need to test a one-rep max to get a score. Liftsmith estimates your max from every set you log, using the same formula as our [one-rep max calculator](/tools/one-rep-max-calculator/), and Progress shows your strength score and how it's trending. For a comparison with real people of your age, sex and body weight, see our [strength standards](/tools/strength-standards/).",
      },
      {
        tip: "Both scores use your body weight on the day. If you weigh in heavier than usual, your score drops even if your lifts don't. Compare scores from similar weigh-ins.",
      },
    ],
    faq: [
      [
        "Can women and men be compared with these?",
        "Each formula has separate curves for women and men, so the scores can be compared, which is how best-lifter awards work.",
      ],
    ],
  },
  {
    slug: "strength-training-over-50-and-60",
    kind: "blog",
    title: "Strength training over 50 and 60: a safe, simple start",
    description:
      "It's never too late to get stronger. How often to lift after 50 or 60, which exercises to start with, how heavy to go, and how to stay steady on your feet.",
    date: "2026-11-17",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "From around middle age, we slowly lose muscle and strength each decade, and the loss speeds up later. The good news: muscle responds to training at any age. People in their 60s, 70s and beyond gain strength quickly when they start lifting, and it shows up where it counts: stairs, getting up from a chair, carrying the groceries, staying steady on your feet.",
      },
      { h2: "How often" },
      {
        p: "Two or three full-body sessions a week, with a day off between, is ideal. Health guidelines recommend strength training on at least two days a week for all adults. Each session can take 30 to 45 minutes.",
      },
      { h2: "What to do" },
      {
        p: "Pick one exercise from each of these, 2 to 3 sets of 8 to 12 reps:",
      },
      { exercises: ["box-squat", "glute-bridge", "db-bench-press", "seated-cable-row", "farmers-carry", "step-up"] },
      {
        ul: [
          "**Sit to stand:** a box squat to a bench or chair builds exactly the strength you use every day.",
          "**Hips:** glute bridges or Romanian deadlifts.",
          "**Push:** a dumbbell press, or push-ups against a bench.",
          "**Pull:** a cable or machine row.",
          "**Carry:** farmer's carries for grip and posture.",
          "**Step:** step-ups for balance and single-leg strength.",
        ],
      },
      { cta: "plan" },
      { h2: "How heavy" },
      {
        p: "Start light enough to learn each movement with good control, then build up. Within a few weeks, most sets should feel challenging by the last two or three reps. Lifting meaningful weight is what builds muscle and bone; very light weights for lots of reps help less. Move the weight up with control, and a little faster as you get stronger, because speed and power fade with age even faster than strength.",
      },
      { h2: "Balance and recovery" },
      {
        ul: [
          "**Balance:** stand on one leg while you brush your teeth, or hold the back of a chair at first.",
          "**Recovery:** it can take a little longer. Sore for days means too much too soon: do fewer sets next time.",
          "**Joints:** a little discomfort that eases as you warm up is common. Sharp pain isn't. Swap the exercise for one that doesn't hurt.",
        ],
      },
      { h2: "How Liftsmith helps" },
      {
        p: "Liftsmith plans every session from your equipment and experience, starts new lifters on lighter weights, and moves them up only when you've earned it. **Injury mode** works around a sore knee or shoulder, and Body › Health has **fitness tests** for balance (one-leg stand) and leg strength (30-second chair stand) with a monthly retest, so you can see yourself improve. See also [strength training over 40](/blog/strength-training-over-40/).",
      },
      {
        tip: "Check with your doctor before starting if you have a heart condition, high blood pressure or a joint replacement. Most people get a clear go-ahead.",
      },
    ],
    faq: [
      ["Am I too old to start lifting at 70?", "No. Strength gains in your 70s and 80s are well documented. Start light and build up."],
      [
        "Machines or free weights?",
        "Both work. Machines are easy to learn and feel steady; dumbbells add balance. Use what you're comfortable with.",
      ],
    ],
  },
  {
    slug: "how-to-do-your-first-pull-up",
    kind: "blog",
    title: "How to do your first pull-up: a step-by-step plan",
    description:
      "Can't do a pull-up yet? Build up with dead hangs, scapular pulls, rows, negatives and band-assisted reps. A plan that gets most people there in weeks.",
    date: "2026-11-17",
    tag: "Bodyweight",
    cta: "bodyweight",
    body: [
      {
        p: "The first pull-up is one of the best moments in training. It's also a wall a lot of people hit, because there's no lighter version of your own body weight. The way through is to build each part of the pull-up separately: grip, shoulder blades, pulling strength and control on the way down.",
      },
      { h2: "The building blocks" },
      { exercises: ["dead-hang", "scapular-pull-up", "inverted-row", "negative-pull-up", "band-assisted-pull-up", "pull-up"] },
      {
        ol: [
          "**Dead hang:** hang from the bar with straight arms. Build up to 30 seconds. This is grip and shoulder strength.",
          "**Scapular pull-ups:** from a hang, pull your shoulder blades down and back without bending your arms, then lower. This is how every pull-up starts.",
          "**Inverted rows:** under a bar or rings, body straight, pull your chest to the bar. Walk your feet forward to make it harder.",
          "**Negatives:** jump or step to the top, chin over the bar, and lower yourself as slowly as you can. Aim for 3 to 5 seconds.",
          "**Band-assisted pull-ups:** a band under your feet or knees takes some of your weight. Use thinner bands as you get stronger.",
        ],
      },
      { cta: "bodyweight" },
      { h2: "A six-week plan" },
      {
        p: "Three times a week, on non-consecutive days, after a short warm-up:",
      },
      {
        ul: [
          "**Weeks 1 and 2:** dead hang 3 × as long as you can, scapular pull-ups 3 × 8, inverted rows 3 × 8 to 12.",
          "**Weeks 3 and 4:** negatives 3 × 3 (slow), band-assisted pull-ups 3 × 5 to 8, inverted rows with feet further forward.",
          "**Weeks 5 and 6:** negatives 4 × 3, band-assisted with a lighter band, then try one full pull-up at the start of each session, when you're fresh.",
        ],
      },
      {
        p: "Not there after six weeks? Keep going. People who are newer to training or heavier take longer, and losing a little body fat helps too. Lat pulldowns are a great addition if your gym has them.",
      },
      { h2: "Form tips" },
      {
        ul: [
          "Start each rep from a full hang with your shoulder blades pulled down.",
          "Think about pulling your elbows to your ribs, not your chin to the bar.",
          "Keep your legs still: swinging turns it into a different exercise.",
          "Chin-ups, with palms facing you, are usually a little easier. They're a fine first goal too.",
        ],
      },
      { h2: "How Liftsmith helps" },
      {
        p: "Tell Liftsmith you have a pull-up bar and it builds pulling work into your plan, with harder variations as you get stronger. The **dead hang test** on Body › Health tracks your grip each month. More ideas in [calisthenics progressions](/blog/calisthenics-progressions/).",
      },
      {
        tip: "Do your pull-up practice first in the session, while you're fresh. A few quality attempts beat a lot of tired ones.",
      },
    ],
  },
  {
    slug: "gym-anxiety-and-gym-etiquette",
    kind: "blog",
    title: "Gym anxiety: how to feel at home in the gym, and the etiquette",
    description:
      "Nervous about the gym? Practical ways to beat gym anxiety, the unwritten rules everyone follows, and how to walk in knowing exactly what to do.",
    date: "2026-11-17",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "Gym anxiety is common. Walking into a room full of equipment you don't know, surrounded by people who seem to know exactly what they're doing, is uncomfortable. Here's the secret most regulars won't tell you: almost nobody is watching you, most of them felt the same way once, and the feeling fades fast with a plan and a few visits.",
      },
      { h2: "Walk in with a plan" },
      {
        p: "Most gym anxiety is really uncertainty: not knowing what to do next. Fix that before you leave home. Know your exercises, the order, and roughly what weight to use. A plan on your phone also gives you something to look at between sets.",
      },
      { cta: "plan" },
      { h2: "Make it easier on yourself" },
      {
        ul: [
          "**Go at quiet times:** mid-morning, early afternoon or late evening. Ask the front desk when it's quietest.",
          "**Start with machines and dumbbells:** they're simple to learn and usually in their own area.",
          "**Learn one area at a time:** the dumbbells one week, the cable machines the next.",
          "**Bring headphones**, and a friend if you can.",
          "**Ask staff to show you a machine.** That's what they're there for.",
          "**Have a back-up** for each exercise, so a busy machine isn't a problem.",
        ],
      },
      { h2: "The unwritten rules" },
      {
        ul: [
          "**Re-rack your weights.** Plates back on the tree, dumbbells back in their place.",
          "**Wipe down** benches and handles after you use them.",
          "**Share.** If someone's waiting, offer to alternate sets.",
          "**Don't camp.** Scrolling on a bench for ten minutes between sets holds it up for everyone.",
          "**Give people space**, especially in front of the mirror and dumbbell rack.",
          "**Don't give unasked-for advice.** And if someone gives it to you, a polite thanks is enough.",
          "**Ask before you take** a bench or plates that look free. A water bottle or towel usually means it's in use.",
        ],
      },
      { h2: "How Liftsmith helps" },
      {
        p: "Liftsmith tells you exactly what to do: every exercise, set, rep and weight, picked for the equipment your gym has. Each exercise has a 3D demo, setup steps and common mistakes. If a machine is taken, swap it in one tap for one that works the same muscles. And when you're short on time, slide the length down and the plan fits. Start with [your first week at the gym](/blog/first-week-at-the-gym/).",
      },
      {
        tip: "Give it five visits before you judge how it feels. The third is usually when the gym starts to feel like yours.",
      },
    ],
  },
  {
    slug: "zone-2-cardio-for-lifters",
    kind: "blog",
    title: "Zone 2 cardio for lifters: what it is and how much you need",
    description:
      "Zone 2 is easy, conversational cardio. Why it's popular, how to find your zone, how much to do, and how to fit it in without losing strength.",
    date: "2026-11-17",
    tag: "Heart rate",
    cta: "heart",
    body: [
      {
        p: "Zone 2 has become one of the most talked-about ideas in fitness. Strip away the hype and it's simple: steady cardio easy enough that you could hold a conversation. It's also one of the easiest ways for lifters to build fitness without getting in the way of strength.",
      },
      { h2: "What zone 2 is" },
      {
        p: "Heart rate zones split effort into bands, usually five. Zone 2 is the second: roughly **60 to 70% of your maximum heart rate**. It feels easy to moderate. You're breathing more than at rest but can speak in full sentences. Find your numbers with our [heart rate zone calculator](/tools/heart-rate-zone-calculator/).",
      },
      {
        p: "No heart rate monitor? Use the **talk test**: if you can talk in full sentences but wouldn't want to sing, you're about right. If you can only get out a few words, slow down.",
      },
      { h2: "Why it's worth doing" },
      {
        ul: [
          "It builds your **aerobic base**: a stronger heart and muscles better at using oxygen and fat for fuel.",
          "It helps you **recover between sets** and between sessions.",
          "It's **low stress**, so it doesn't eat into your recovery for lifting the way hard intervals can.",
          "It's easy to stick with. Walking, cycling, rowing or an incline treadmill all count.",
        ],
      },
      { cta: "heart" },
      { h2: "How much?" },
      {
        p: "General guidelines suggest about 150 minutes of moderate activity a week. For a lifter, two or three sessions of 30 to 45 minutes is a great target, plus brisk walking on other days. Even one session a week helps if that's all that fits. More is better up to a point, but past a few hours a week it starts competing with your recovery.",
      },
      { exercises: ["incline-walk", "stationary-bike", "rowing-machine", "rucking"] },
      { h2: "Fitting it around lifting" },
      {
        ul: [
          "**After lifting**, or on separate days, so your lifting stays fresh.",
          "**Bike or row** on days after heavy legs: they're easier on tired legs than running.",
          "**Don't forget intervals.** Zone 2 builds the base; one session of harder intervals a week raises your top end. See [VO2 max for lifters](/blog/vo2-max-for-lifters/).",
        ],
      },
      { h2: "How Liftsmith helps" },
      {
        p: "Pair a Bluetooth heart rate strap or watch and Liftsmith shows your live heart rate and zone through every set. Add a cardio part to any workout and it's counted in the workout's length, with the set timer counting up against last time. In Labs, Bluetooth gym machines fill in time, distance and power on their own.",
      },
      {
        tip: "Nose breathing is a handy check: if you can breathe comfortably through your nose, you're probably in zone 2.",
      },
    ],
    faq: [
      [
        "Does zone 2 burn more fat?",
        "It uses a higher share of fat for fuel, but total calories burned is what matters for fat loss. Harder cardio burns more per minute.",
      ],
    ],
  },
  {
    slug: "muscle-memory-after-a-break",
    kind: "blog",
    title: "Muscle memory: how fast you get your gains back after a break",
    description:
      "Took weeks or months off? Muscle and strength come back much faster than they took to build. Why muscle memory works and how to return safely.",
    date: "2026-11-17",
    tag: "Comebacks",
    cta: "comeback",
    body: [
      {
        p: "Time off happens: injuries, a new baby, a busy year, a long holiday. The worry is that all that work is gone. It isn't. Muscle memory is real, and it means getting back to where you were takes a fraction of the time it took to get there the first time.",
      },
      { h2: "What you lose, and how fast" },
      {
        ul: [
          "**1 to 3 weeks off:** very little. You may feel flat, but strength and muscle are mostly intact. Many lifters come back stronger after a short break.",
          "**A month or two:** some strength and size fade, but much of what you lose is skill and the feel of heavy weight.",
          "**Several months or more:** bigger losses, but they still come back quickly once you return.",
        ],
      },
      { h2: "Why muscle memory works" },
      {
        p: "Two things help. First, your **nervous system** keeps the skill of a lift: the pattern, the bracing, the timing. Second, there's good evidence that muscle fibres keep extra **nuclei** gained from training even after the muscle shrinks, which helps them grow back faster when training starts again. Either way, people who've trained before regain size and strength faster than they built it.",
      },
      { cta: "comeback" },
      { h2: "How to come back" },
      {
        ol: [
          "**Start lighter than you think.** About 50 to 70% of your old working weights in the first week, depending on how long you were away.",
          "**Fewer sets at first.** Half your usual volume in week one, building back over two to four weeks.",
          "**Expect soreness.** The first sessions back will make you sore. That fades fast.",
          "**Add weight quickly.** As long as reps feel smooth, you can add weight much faster than a beginner.",
          "**Look after the basics.** Sleep and protein do a lot of the rebuilding.",
        ],
      },
      { exercises: ["back-squat", "bench-press", "romanian-deadlift", "barbell-row"] },
      { h2: "How Liftsmith handles a comeback" },
      {
        p: "Liftsmith reads how long you've been away and eases your first sessions back, lighter and shorter, then builds up from your old numbers as you show you're ready. Your history and personal bests are all still there, so you can see yourself closing the gap. More in [getting back into lifting](/blog/getting-back-into-lifting/).",
      },
      {
        tip: "Don't test your old max in week one. Give it a month of training first: the number will be closer, and the risk much lower.",
      },
    ],
    faq: [["Can I lose muscle in one week off?", "Not meaningfully. A week off is often good for recovery."]],
  },
];
