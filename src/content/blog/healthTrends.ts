import type { Article } from "../articles";

// Blog: the health trends people are searching for (Melvin, 2026-11-17: "capitalize on all the latest health
// trends ... at the end of the day, nothing beats eating right, exercise, and sleeping enough"). Each post says
// plainly what the trend gets right, what's hype, and comes back to food, training and sleep. Health claims stay
// cautious, with no disease, death or "live longer" claims (docs/decisions/fitness-age.md). App claims stay to
// what ships, and no other app is named (seo.test.ts).
export const BLOG_HEALTH_TRENDS: Article[] = [
  {
    slug: "rucking-for-lifters",
    kind: "blog",
    title: "Rucking: why walking with a weighted pack is everywhere",
    description:
      "Rucking is brisk walking with a weighted backpack. What it does, how heavy to start, how to fit it around lifting, and what it can't replace.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Rucking has gone from a military training staple to one of the most popular ways to get fit. It's simple: put weight in a backpack and go for a brisk walk. No gym, no running, no special skill. It's also a genuinely good fit for lifters who want more conditioning without the pounding of running.",
      },
      { h2: "What rucking does" },
      {
        ul: [
          "**Cardio without the impact:** a loaded walk raises your heart rate far more than an unloaded one, while your feet never leave the ground.",
          "**Strength endurance:** your back, hips, legs and core work to carry the load for a long time, like a very long farmer's carry.",
          "**Calories:** carrying extra weight burns more than walking alone, and it's easy to do for an hour.",
          "**Time outside:** daylight and fresh air are good for mood and sleep.",
        ],
      },
      { h2: "How to start" },
      {
        ol: [
          "**Weight:** start with about 5 to 10% of your body weight, or 5 to 10 kg. Books, water bottles or a weight plate wrapped in a towel all work.",
          "**Pack:** a sturdy backpack with padded straps. Keep the weight high and close to your back.",
          "**Distance:** 20 to 30 minutes on flat ground at a brisk pace.",
          "**Build slowly:** add time before weight. Increase the load by a couple of kilos every week or two, up to about 15 to 20% of body weight.",
          "**Shoes:** your normal walking shoes are fine.",
        ],
      },
      { exercises: ["rucking", "farmers-carry", "incline-walk"] },
      { cta: "plan" },
      { h2: "Fitting it around lifting" },
      {
        p: "Rucking is easy to recover from, so it fits on rest days or after an upper-body session. Two or three rucks a week is plenty. Keep it away from the day before heavy squats or deadlifts at first, because your back and legs will feel it. In Liftsmith, rucking is a cardio exercise you can add to any workout, timed with the set timer and counted in the workout's length.",
      },
      { h2: "What it can't do" },
      {
        p: "Rucking won't build much muscle or maximal strength on its own, and it isn't a substitute for lifting. It also won't push your top-end fitness the way hard intervals do. Think of it as a great second habit, not the whole plan.",
      },
      { h2: "The basics still win" },
      {
        p: "Rucking is a fun way to move more. But the results people get from it come from the same place as always: eating well, training regularly and sleeping enough. A ruck is one more way to tick the middle box.",
      },
      {
        tip: "Stand tall and take short, quick steps. Leaning forward under the pack is the fastest way to a sore back.",
      },
    ],
    faq: [["Is rucking bad for your back?", "Not with a sensible weight, a good pack and good posture. Start light and build up slowly."]],
  },
  {
    slug: "fibremaxxing",
    kind: "blog",
    title: "Fibremaxxing: is eating more fibre worth the hype?",
    description:
      "The fibremaxxing trend is about eating far more fibre. Why most people need more, how much to aim for, how to add it without discomfort, and what lifters gain.",
    date: "2026-11-17",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: 'After years of protein getting all the attention, fibre is having its moment. "Fibremaxxing", packing as much fibre as possible into every meal, is all over social media. Unlike a lot of food trends, this one points in the right direction: most adults eat well under the recommended amount.',
      },
      { h2: "Why fibre matters" },
      {
        ul: [
          "**Fullness:** fibre keeps you full for longer, which makes eating in a calorie deficit much easier.",
          "**Digestion:** it keeps things regular and feeds the helpful bacteria in your gut.",
          "**Steadier energy:** fibre slows how quickly carbs are absorbed, so energy rises and falls more gently.",
          "**Heart health:** diets high in fibre are linked with healthier cholesterol levels.",
        ],
      },
      { h2: "How much?" },
      {
        p: 'Health guidelines suggest about **25 grams a day for women and 38 for men**, or roughly 14 grams per 1,000 calories. Many people eat about half that. You don\'t need to "max" anything: getting to the recommended amount is the win.',
      },
      { cta: "tdee" },
      { h2: "Easy ways to add it" },
      {
        ul: [
          "**Beans, lentils and chickpeas:** a cup has about 12 to 16 grams, plus protein. Great for lifters.",
          "**Oats** for breakfast, with berries.",
          "**Whole grains** instead of white: whole wheat bread and pasta, brown rice, barley.",
          "**Vegetables** at two meals a day.",
          "**Fruit with the skin on**: pears, apples, raspberries.",
          "**Nuts and seeds:** chia, flax and almonds.",
        ],
      },
      { h2: "Go slowly" },
      {
        p: "Jumping from 15 grams to 50 overnight is a recipe for bloating and gas. Add about 5 grams a day each week, drink more water as you go, and your gut adjusts. Pre-workout meals are the one place to keep fibre lower: a big bowl of beans an hour before squats is a mistake you only make once.",
      },
      { h2: "Fibre for lifters" },
      {
        p: "If you're cutting, fibre is one of your best tools: high-fibre foods are filling and low in calories, which makes hunger much easier to manage. If you're bulking, don't let fibre crowd out the calories and protein you need. Liftsmith's [macro calculator](/tools/macro-calculator/) sets your protein, carbs and fat from your goal, and fibre fits inside the carbs.",
      },
      { h2: "The basics still win" },
      {
        p: "Fibre is one part of eating well, not a shortcut around it. A diet built on whole foods, enough protein, regular training and good sleep will always beat one perfect nutrient.",
      },
      {
        tip: "Add one food, not ten: a daily bowl of oats or a can of beans a day closes most of the gap on its own.",
      },
    ],
    faq: [
      [
        "Should I take a fibre supplement?",
        "Food first, because it brings vitamins and minerals too. A supplement can help if you can't reach your target with food. Ask your doctor if you have a digestive condition.",
      ],
    ],
  },
  {
    slug: "how-many-steps-a-day",
    kind: "blog",
    title: "How many steps a day do you really need? Beyond 10,000",
    description:
      "Is 10,000 steps a day the magic number? What research says about steps, why interval walking is trending, and how lifters can use steps to recover.",
    date: "2026-11-17",
    tag: "Training",
    cta: "health",
    body: [
      {
        p: "Ten thousand steps a day is one of the best-known health goals, but it started as a marketing slogan for a pedometer, not a scientific finding. Research since has looked properly at step counts, and the answer is encouraging: you probably need fewer than you think to get most of the benefit, and more is still good.",
      },
      { h2: "What the research says" },
      {
        ul: [
          "Benefits climb steeply from a low base. Going from 2,000 to 5,000 steps a day helps a lot.",
          "For most adults, benefits keep growing up to around **7,000 to 10,000 steps a day**, then level off. Older adults hit the plateau a little earlier.",
          "Pace helps: a brisk walk adds more than a stroll.",
          "The best number is a bit more than what you do now.",
        ],
      },
      { h2: "The interval walking trend" },
      {
        p: "Interval walking, made popular by research from Japan, alternates **3 minutes of brisk walking with 3 minutes of easy walking**, for about 30 minutes, several times a week. The brisk part should feel like hard effort, about the pace where talking gets difficult. Studies found it improved fitness and leg strength more than walking at one steady pace. It's free, easy on the joints and a great step up from regular walks.",
      },
      { exercises: ["brisk-walk", "incline-walk", "treadmill-walk"] },
      { cta: "health" },
      { h2: "Steps for lifters" },
      {
        ul: [
          "**Recovery:** an easy walk the day after hard leg training helps you feel less stiff.",
          "**Fat loss:** walking burns calories without eating into recovery, so a step goal is one of the easiest levers on a cut.",
          "**Consistency:** steps keep you active on rest days, without the urge to train hard.",
        ],
      },
      {
        p: "Liftsmith reads your steps from Health Connect or Apple Health and shows them on Body › Health against your own normal. Once there are five days of steps in a week, they feed your daily calorie burn, so your calorie targets reflect how much you actually move.",
      },
      { h2: "The basics still win" },
      {
        p: "Steps are a great habit, but they're one piece. Walking more, lifting a few times a week, eating well and sleeping enough together do far more than any single number on your watch.",
      },
      {
        tip: "Add steps to things you already do: a walk after dinner, a phone call on your feet, the long way to the car. A 10-minute walk after meals adds about 1,000 steps each time.",
      },
    ],
  },
  {
    slug: "walking-pad-at-your-desk",
    kind: "blog",
    title: "Walking pads: is a desk treadmill worth it?",
    description:
      "Walking pads let you walk while you work. What they're good for, how many calories they burn, how to use one well, and what they don't replace.",
    date: "2026-11-17",
    tag: "Home gym",
    cta: "home",
    body: [
      {
        p: "Walking pads, small flat treadmills that slide under a standing desk, have become one of the most popular pieces of home fitness gear. The appeal is obvious: if you sit for eight hours a day, why not walk for some of them? They're genuinely useful, as long as you know what they can and can't do.",
      },
      { h2: "What a walking pad is good for" },
      {
        ul: [
          "**Less sitting:** long stretches of sitting are worth breaking up, and a walking pad makes it easy.",
          "**Steps:** an hour at a slow pace adds around 4,000 to 6,000 steps.",
          "**Calories:** slow walking burns roughly 100 to 200 extra calories an hour, depending on your size and pace. That adds up over a week.",
          "**Recovery:** gentle movement on rest days helps you feel less stiff after hard training.",
        ],
      },
      { h2: "How to use one well" },
      {
        ol: [
          "**Go slow while you work:** about 2 to 3.5 km/h. Faster than that and typing gets sloppy.",
          "**Do easy tasks on it:** email, calls and reading are easy. Deep work is usually better seated.",
          "**Build up:** start with 20 to 30 minutes a few times a day, not five hours on day one.",
          "**Set up your desk:** screen at eye level, elbows at about 90 degrees.",
          "**Wear proper shoes**, not socks or slippers.",
        ],
      },
      { cta: "home" },
      { h2: "What it doesn't replace" },
      {
        p: "Slow desk walking is light activity. It's great for daily movement, but it won't build strength or raise your fitness much on its own. You still need lifting two to three times a week for muscle and strength, and some harder cardio for your heart and lungs. Think of a walking pad as the floor of your activity, not the ceiling.",
      },
      { h2: "Your home gym, planned" },
      {
        p: "If you're building a home setup, tell Liftsmith what you own, down to the dumbbells, and every workout uses only that. Your walking pad steps come in from Health Connect or Apple Health and count toward your daily calorie burn. For more on kitting out a home gym, see [how to build a home gym on a budget](/blog/home-gym-on-a-budget/).",
      },
      { h2: "The basics still win" },
      {
        p: "A walking pad is a smart way to move more, but the fundamentals haven't changed: eat well, train regularly and get enough sleep. Gear helps you stick to them; it doesn't replace them.",
      },
      {
        tip: "Walk during the first meeting of your day. Starting the day moving makes it much easier to keep moving.",
      },
    ],
  },
  {
    slug: "longevity-training",
    kind: "blog",
    title: "Training for longevity: stay strong, fit and steady for decades",
    description:
      "The longevity trend boils down to four things you can train: strength, cardio fitness, balance and muscle. A simple weekly plan for ageing well.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Longevity is one of the biggest trends in health right now, with podcasts, books and expensive clinics all promising to help you age well. Strip away the supplements and gadgets and the advice from the people who study it most comes down to training four things: **strength, cardio fitness, balance and muscle**. All four are trainable, at any age.",
      },
      { h2: "1. Strength" },
      {
        p: "Strength is what lets you carry, climb, lift and get up off the floor. It fades with age, but lifting slows that dramatically. Train every major muscle at least twice a week, with sets that get challenging near the end. Grip strength is a useful simple check: it tends to follow overall strength.",
      },
      { exercises: ["goblet-squat", "romanian-deadlift", "db-bench-press", "db-row", "farmers-carry", "dead-hang"] },
      { h2: "2. Cardio fitness" },
      {
        p: "Your VO2 max, how much oxygen your body can use, is one of the strongest measures of fitness, and it responds to training. Most of your cardio should be easy, plus one session of hard intervals a week. See [zone 2 cardio](/blog/zone-2-cardio-for-lifters/) and [VO2 max for lifters](/blog/vo2-max-for-lifters/).",
      },
      { cta: "plan" },
      { h2: "3. Balance" },
      {
        p: "Balance quietly fades unless you use it. Single-leg work like step-ups, split squats and single-leg Romanian deadlifts trains it while you lift. Standing on one leg while you brush your teeth helps too.",
      },
      { h2: "4. Muscle" },
      {
        p: "Muscle is your body's reserve: for strength, for blood sugar, for recovering from illness or injury. Building it in your 30s, 40s and 50s gives you more to keep later. That takes lifting plus enough protein, about 1.6 grams per kilogram of body weight a day.",
      },
      { h2: "A simple weekly plan" },
      {
        ul: [
          "**Two to three full-body strength sessions**, 45 minutes each.",
          "**Two easy cardio sessions**, 30 to 45 minutes: walking, cycling, rowing or rucking.",
          "**One interval session**: 4 rounds of 4 minutes hard, 3 minutes easy.",
          "**Daily walking**, plus a minute of balance work.",
        ],
      },
      { h2: "Track what matters" },
      {
        p: "Liftsmith's **Body › Health** shows your fitness age from your watch's VO2 max, and three **fitness tests**, the dead hang for grip, the one-leg stand for balance and the chair stand for leg strength, with a retest every four weeks. Progress shows your strength trend. These are fitness numbers to train, not medical ones.",
      },
      { h2: "The basics still win" },
      {
        p: "No supplement, cold plunge or test kit comes close to the basics: eating well, training regularly and sleeping enough. Longevity isn't a product. It's those three habits, kept up for years.",
      },
      {
        tip: "Pick the habit you're weakest at and fix that first. For most lifters, it's cardio. For most runners, it's strength.",
      },
    ],
  },
  {
    slug: "cold-plunge-and-sauna-for-lifters",
    kind: "blog",
    title: "Cold plunges and saunas: do they help lifters?",
    description:
      "Ice baths and saunas are everywhere. What they're good for, why a cold plunge right after lifting may slow muscle growth, and how to use them well.",
    date: "2026-11-17",
    tag: "Recovery",
    cta: "recovery",
    body: [
      {
        p: 'Cold plunges and saunas have gone from niche to mainstream, with "contrast therapy" studios opening in many cities. Many people love how they feel. For lifters, the research has a twist worth knowing: the timing matters, and a cold plunge in the wrong place can work against your training.',
      },
      { h2: "Cold plunges" },
      {
        ul: [
          "**What people like:** a strong wake-up, a mood boost, and feeling less sore after hard sessions.",
          "**What the research says:** cold water can reduce how sore you feel for a day or two after hard exercise.",
          "**The catch:** studies have found that regular cold water immersion **right after lifting** can blunt muscle and strength gains over time, likely by damping the signals that drive muscle growth.",
        ],
      },
      {
        p: "So: if building muscle is your goal, keep cold plunges **away from lifting**, at least a few hours after, or on rest days. Right after a hard conditioning session or a game, when you need to feel fresh soon, is a better use.",
      },
      { cta: "recovery" },
      { h2: "Saunas" },
      {
        ul: [
          "**What people like:** relaxation, warmth and a calm, quiet space. Many people sleep better after an evening sauna.",
          "**What the research says:** regular sauna use is linked with feeling relaxed and with some heart-related benefits in research, though most studies come from places where saunas are part of daily life.",
          "**For lifters:** saunas don't seem to blunt muscle growth the way cold can, so after training is fine. Drink plenty of water, because you lose a lot through sweat.",
        ],
      },
      { h2: "Using them safely" },
      {
        ul: [
          "Start short: 1 to 3 minutes in cold water around 10 to 15 °C, or 10 to 15 minutes in a sauna.",
          "Skip both after drinking alcohol, and don't plunge alone.",
          "Check with your doctor first if you have a heart condition or high blood pressure, or you're pregnant.",
        ],
      },
      { h2: "What actually drives recovery" },
      {
        p: "Muscles recover through sleep, food and time. Liftsmith's **recovery map** (Pro) shows how recovered each muscle is from what you've lifted, and plans around the ones that need rest. More in [how long muscles take to recover](/blog/how-long-do-muscles-take-to-recover/).",
      },
      { h2: "The basics still win" },
      {
        p: "Cold and heat can feel great, and if they help you relax and keep training, enjoy them. But they're extras. Nothing in a tub or a hot room beats eating well, training consistently and sleeping enough.",
      },
      {
        tip: "Want both? Sauna after lifting, cold plunge on rest days. You get the feeling without the trade-off.",
      },
    ],
  },
  {
    slug: "sleepmaxxing-for-lifters",
    kind: "blog",
    title: "Sleepmaxxing: which sleep trends help, and which are hype",
    description:
      "Mouth taping, magnesium, sleep trackers and sleepy-girl mocktails: what the evidence says, and the simple habits that do the most for lifters' sleep.",
    date: "2026-11-17",
    tag: "Recovery",
    cta: "health",
    body: [
      {
        p: 'Sleep has become a trend of its own. "Sleepmaxxing" covers everything from mouth tape and magnesium drinks to blackout gear and sleep trackers. The idea behind it is right: sleep is when you recover, and most people don\'t get enough. But the gadgets and hacks matter far less than a few plain habits.',
      },
      { h2: "The trends, honestly" },
      {
        ul: [
          "**Sleep trackers:** useful for spotting patterns, like short nights before hard days. Not precise about sleep stages. Watch the trend, not one night's score.",
          "**Magnesium:** may help if you're low in it. Evidence for better sleep in people with normal levels is weak. Food first: nuts, seeds, beans and leafy greens.",
          "**Mouth taping:** very little evidence that it helps, and it isn't safe if you have trouble breathing through your nose. Ask a doctor about snoring instead.",
          "**Tart cherry and other bedtime drinks:** small studies, small effects. A calm routine before bed probably does as much.",
          "**Blackout and cool rooms:** these help. Dark and cool, around 16 to 19 °C, is the best-supported change you can make.",
        ],
      },
      { cta: "health" },
      { h2: "What does the most" },
      {
        ol: [
          "**Get enough hours:** most adults need 7 to 9. Lifters in hard training often need the top of that range.",
          "**Keep a regular schedule**, weekends included. Wake time matters most.",
          "**Morning light:** a few minutes outside soon after waking helps set your body clock.",
          "**Caffeine cut-off:** none in the 8 hours before bed. Pre-workout drinks count.",
          "**Train earlier if you can:** a hard evening session can make it harder to fall asleep.",
          "**Wind down:** dim lights and screens for the last half hour.",
        ],
      },
      { h2: "Sleep and lifting" },
      {
        p: "Poor sleep makes weights feel heavier and recovery slower, and over weeks it makes muscle harder to build and fat harder to lose. More in [sleep and muscle growth](/blog/sleep-and-muscle-growth/). Liftsmith reads your sleep from Health Connect or Apple Health and shows it on Body › Health against your own normal. With Pro, a short night makes today's call easier, so a bad night doesn't turn into a bad week.",
      },
      { h2: "The basics still win" },
      {
        p: "You can't buy your way to good sleep. Regular hours, a dark, cool room and no late caffeine do more than any gadget, and good sleep, good food and regular training together beat any one of them alone.",
      },
      {
        tip: "Pick a wake-up time and keep it for two weeks, even after a late night. It's the single best fix for sleep that feels broken.",
      },
    ],
  },
  {
    slug: "creatine-for-women-and-the-brain",
    kind: "blog",
    title: "Creatine for women, and for your brain: what's new",
    description:
      "Creatine isn't just for bodybuilders. What research says about creatine for women, older adults and the brain, how much to take, and what it won't do.",
    date: "2026-11-17",
    tag: "Nutrition",
    cta: "progress",
    body: [
      {
        p: "Creatine is one of the most researched supplements there is, and for years it was seen as a bodybuilder's powder. Now it's one of the fastest-growing supplements among women and older adults, and researchers are studying what it does for the brain as well as muscle. Here's what's known, and what's still hype.",
      },
      { h2: "What creatine does" },
      {
        p: "Creatine helps your muscles make energy quickly for short, hard efforts like a set of squats. Taking it raises the stores in your muscles, which lets you do a little more work in training, which over months means more strength and muscle. It's found in meat and fish, but supplements are the practical way to fill up. More in [creatine for lifters](/blog/creatine-for-lifters/).",
      },
      { h2: "Creatine for women" },
      {
        ul: [
          "Women tend to have lower creatine stores than men, partly from eating less meat, so they may benefit at least as much.",
          "Research shows it helps women gain strength and muscle with training, at every age studied.",
          "It doesn't make you bulky. Any early gain on the scale is mostly water held in the muscle.",
          "After menopause, combined with lifting, it may help keep muscle and strength.",
        ],
      },
      { cta: "progress" },
      { h2: "Creatine and the brain" },
      {
        p: "Your brain uses creatine for energy too. Early research suggests it may help thinking and memory in some situations, such as during sleep loss or in older adults, and in people who eat little meat. The studies are small and mixed, so it's promising rather than proven. Don't take it for your brain alone and expect a big change.",
      },
      { h2: "How to take it" },
      {
        ul: [
          "**Creatine monohydrate**, 3 to 5 grams a day, every day. The cheapest form is also the best-studied.",
          "**Timing doesn't matter much.** Take it whenever you'll remember.",
          "**No loading phase needed.** It just takes three to four weeks to fill up instead of one.",
          "**Drink normally.** No need for extra water beyond what you usually drink.",
        ],
      },
      { h2: "What it won't do" },
      {
        p: "Creatine won't replace training. It helps you do a little more in each session, so it only pays off if you're lifting regularly and progressing. Liftsmith adds a rep or a step of weight when you've earned it, so you'll see the difference in your numbers.",
      },
      { h2: "The basics still win" },
      {
        p: "Creatine is a small, well-supported extra. The big wins are still eating enough protein and food, training consistently and sleeping enough. Get those right, and creatine is the cherry on top.",
      },
      {
        tip: "Ask your doctor before starting if you have kidney problems or take regular medication. For healthy adults, creatine is considered safe at normal doses.",
      },
    ],
  },
  {
    slug: "hybrid-training",
    kind: "blog",
    title: "Hybrid training: how to get strong and fit at the same time",
    description:
      "Hybrid athletes lift heavy and run far. How to combine strength training and endurance without one ruining the other, with a sample week.",
    date: "2026-11-17",
    tag: "Programming",
    cta: "plan",
    body: [
      {
        p: "Hybrid training, being strong and fit at the same time, has become one of the most popular goals in fitness, helped along by mixed fitness races and athletes who squat heavy on Monday and run a half marathon on Sunday. The old idea that cardio kills gains has mostly been retired. You can do both. You just need to plan it.",
      },
      { h2: "Does cardio hurt strength?" },
      {
        p: 'A little, at high volumes. Research on "concurrent training" finds that lots of endurance work can slightly slow gains in muscle size and power, mostly in the legs, and mostly when the running volume is high. For most people training both a few times a week, the effect is small, and the fitness gains are big.',
      },
      { h2: "Rules for doing both" },
      {
        ol: [
          "**Pick a priority** for each block of training: strength, endurance or balanced. Your priority gets your best days.",
          "**Separate hard leg days from hard cardio days** by at least 6 to 24 hours.",
          "**Most cardio easy:** keep about 80% conversational and the rest hard. See [zone 2 cardio](/blog/zone-2-cardio-for-lifters/).",
          "**Lift first** if you do both in one session and strength is your priority.",
          "**Use low-impact cardio** like cycling and rowing to save your legs.",
          "**Eat more:** doing both burns a lot. Under-eating is the most common reason hybrid training stalls.",
        ],
      },
      { cta: "plan" },
      { h2: "A sample week" },
      {
        ul: [
          "**Monday:** lower body strength.",
          "**Tuesday:** easy run or ride, 40 minutes.",
          "**Wednesday:** upper body strength.",
          "**Thursday:** intervals, such as 5 × 3 minutes hard with 2 minutes easy.",
          "**Friday:** full body strength, lighter.",
          "**Saturday:** long easy run, ride or ruck.",
          "**Sunday:** rest.",
        ],
      },
      { exercises: ["back-squat", "romanian-deadlift", "bench-press", "pull-up", "rowing-machine", "treadmill-run"] },
      { h2: "How Liftsmith helps" },
      {
        p: "Liftsmith plans each lifting session around how recovered your muscles are, and cardio parts go in the same workout as your lifting, with the set timer counting up against last time. For runners who mainly want to lift, see [strength training for runners](/blog/strength-training-for-runners/).",
      },
      { h2: "The basics still win" },
      {
        p: "Training for two things means recovery matters twice as much. Hybrid athletes who last aren't the ones with the cleverest plan: they're the ones who eat enough, sleep enough and stay consistent.",
      },
      {
        tip: "Start by adding one cardio session to your lifting week, or one lifting session to your running week. Add the next only once the first feels easy.",
      },
    ],
  },
  {
    slug: "high-protein-everything",
    kind: "blog",
    title: "High-protein everything: do you need protein bars and shakes?",
    description:
      "Protein coffee, protein snacks, protein pancakes: protein is in everything now. How much you actually need, when powders help, and what to watch on the label.",
    date: "2026-11-17",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: "Walk down any grocery aisle and protein is everywhere: protein cereal, protein chips, protein coffee, protein water. Protein deserves its reputation, especially for people who lift. But a lot of high-protein products are expensive snacks with a protein label, and most people can hit their target with plain food.",
      },
      { h2: "How much do you need?" },
      {
        p: "For people who lift, research points to about **1.6 grams per kilogram of body weight a day** to build the most muscle, a little more when you're eating less to lose fat. That's about 110 to 130 grams for a 75 kg person. More than about 2.2 grams per kilogram doesn't seem to add muscle. Details in [how much protein to build muscle](/blog/how-much-protein-to-build-muscle/).",
      },
      { h2: "Food first" },
      {
        ul: [
          "**A palm-sized portion** of meat, fish or tofu is about 25 to 35 grams.",
          "**Greek yogurt or cottage cheese:** about 15 to 25 grams a cup.",
          "**Eggs:** about 6 grams each.",
          "**Beans and lentils:** about 15 grams a cup, plus fibre.",
          "**Milk:** about 8 grams a cup.",
        ],
      },
      {
        p: "Spread it out: 25 to 40 grams at each of three or four meals works better than one huge dinner.",
      },
      { cta: "tdee" },
      { h2: "When powders and bars help" },
      {
        ul: [
          "**Protein powder** is just food in powder form. It's handy when you're busy, low on appetite or short of your target. Whey is cheap and well studied; plant blends work well too.",
          "**Protein bars** are convenient, but many are close to a candy bar in calories. Check for at least 15 to 20 grams of protein and fewer calories than you'd expect.",
          "**Protein coffee, chips and cereal** are fine if you enjoy them. They're rarely a cheap or efficient way to get protein.",
        ],
      },
      { h2: "What to watch on the label" },
      {
        ul: [
          "**Protein per 100 calories:** 10 grams or more is a good protein food. Under 5 is a snack with marketing.",
          '**Sugar and calories:** a "high protein" muffin is still a muffin.',
          "**Third-party testing** on powders, if you compete in tested sport.",
        ],
      },
      { h2: "Hitting your number with Liftsmith" },
      {
        p: "Liftsmith sets your protein target from your weight and goal, the same number as our [macro calculator](/tools/macro-calculator/). If a food app writes to Health Connect or Apple Health, a coach's note tells you when you've been short of protein three logged days in a row, with how much to add.",
      },
      { h2: "The basics still win" },
      {
        p: "Protein matters, but it's one part of the picture. Eating mostly whole foods, training regularly and sleeping enough will do more for your body than any product with protein on the front.",
      },
      {
        tip: "Start each meal with the protein on your plate. It fills you up, and you'll rarely miss your target.",
      },
    ],
  },
];
