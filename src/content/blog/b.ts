import type { Article } from "../articles";

// Blog, part two: bodyweight, plates, one-rep max, recovery, soreness, protein, cutting.
export const BLOG_B: Article[] = [
  {
    slug: "no-equipment-strength-workout",
    kind: "blog",
    title: "Strength training with no equipment",
    description:
      "How to build strength at home, in a hotel or a park with no equipment: the key exercises, how to make them harder, and a simple weekly plan.",
    date: "2026-11-09",
    tag: "Bodyweight",
    cta: "bodyweight",
    body: [
      {
        p: "You can get strong with nothing but your body and the floor. The trick is the same as with weights: keep making the work harder. With no plates to add, you do it by changing the exercise.",
      },
      { h2: "The exercises" },
      {
        exercises: [
          "push-up",
          "pike-push-up",
          "towel-row",
          "bodyweight-squat",
          "split-squat",
          "single-leg-rdl",
          "glute-bridge",
          "plank",
          "side-plank",
          "dead-bug",
        ],
      },
      { h2: "Make it harder as you go" },
      { p: "When you can do about 15 to 20 good reps, move up a level:" },
      {
        ul: [
          "**Push:** [wall push-up](/exercises/wall-push-up/) → [push-up](/exercises/push-up/) → [feet-up push-up](/exercises/decline-push-up/) → [lean-forward push-up](/exercises/pseudo-planche-push-up/).",
          "**Legs:** [bodyweight squat](/exercises/bodyweight-squat/) → [split squat](/exercises/split-squat/) → [shrimp squat](/exercises/shrimp-squat/) → [one-leg squat](/exercises/pistol-squat/).",
          "**Hinge:** [glute bridge](/exercises/glute-bridge/) → [single-leg Romanian deadlift](/exercises/single-leg-rdl/) → [Nordic curl](/exercises/nordic-curl/).",
          "**Pull:** a [doorway towel row](/exercises/towel-row/), and a pull-up bar if you can fit one.",
        ],
      },
      { cta: "bodyweight" },
      { h2: "A simple plan" },
      {
        p: "Three days a week, full body: one push, one pull, one squat, one hinge and one core exercise, three sets each, stopping one or two reps short of failure. Slow lowering (three seconds down) makes easy reps count for more.",
      },
      {
        tip: "Pulling is the weak spot of bodyweight training. If you can, get a pull-up bar or a set of rings: they unlock pull-ups, chin-ups and rows.",
      },
      { h2: "A full plan from your bodyweight" },
      {
        p: 'Liftsmith\'s "Bodyweight" gym builds complete workouts for every major muscle with no equipment at all, and the bodyweight skills program walks each movement up a ladder of harder steps as you hit your reps.',
      },
    ],
  },
  {
    slug: "how-to-load-a-barbell",
    kind: "blog",
    title: "How to load a barbell: plate math made simple",
    description:
      "How to work out which plates go on each side of the bar in kg or lb, bar weights, loading order, and what to do when your plates can't make a weight.",
    date: "2026-11-09",
    tag: "Plates",
    cta: "plates",
    body: [
      {
        p: "Plate math is simple, but it's annoying between sets when you're out of breath. Here's how to do it quickly, and how to stop doing it at all.",
      },
      { h2: "The formula" },
      {
        ol: [
          "Take your target weight.",
          "Subtract the bar: 20 kg or 45 lb for a standard Olympic bar.",
          "Divide by two. That's what goes on each side.",
          "Fill each side with the heaviest plates first.",
        ],
      },
      {
        p: "**Example in kg:** 100 kg − 20 kg bar = 80 kg, so 40 kg a side: a 25 and a 15, or a 25, a 10 and a 5 if your gym has no 15s. **In lb:** 225 lb − 45 lb = 180 lb, so 90 lb a side: two 45s.",
      },
      { h2: "Bar weights" },
      {
        ul: [
          "Olympic bar: 20 kg or 45 lb.",
          "Women's Olympic bar: 15 kg or 35 lb.",
          "EZ curl bar: often 7 to 10 kg or 15 to 25 lb. Weigh yours.",
          "Trap bar: usually 20 to 30 kg or 45 to 65 lb.",
          "Smith machine: varies a lot, and some are counterbalanced. Check the label.",
        ],
      },
      { cta: "plates" },
      { h2: "Loading tips" },
      {
        ul: [
          "Heaviest plates go on first, closest to the collar.",
          "Load both sides before lifting. Always use collars on heavy sets.",
          "Between sets, keep the plates that both weights share and only change the outside ones.",
          "Smaller plates (1.25 kg, 2.5 lb) make small jumps possible. They're the most useful plates you can buy.",
        ],
      },
      { h2: "When you can't make the weight" },
      {
        p: "With a limited set of plates, some weights are impossible. Round down to the nearest weight you can make rather than up: a slightly lighter set is the safer miss. The [plate calculator](/tools/plate-calculator/) finds the nearest load either way.",
      },
      {
        tip: "Most commercial gyms have plenty of plates, but home gyms often don't. A few pairs of small plates make progression much smoother.",
      },
      { h2: "Never think about it again" },
      {
        p: 'Liftsmith only suggests weights your plates can make and draws the bar with the plates on each side for every set. During rest it shows the next set\'s plates and what to change ("take off 2.5, then add 5 each side"), so you can load while you rest.',
      },
    ],
  },
  {
    slug: "how-to-estimate-your-one-rep-max",
    kind: "blog",
    title: "How to estimate your one-rep max without testing it",
    description:
      "Estimate your one-rep max from any set: which formulas work best, why reps in reserve matter, how accurate it is, and when to test for real.",
    date: "2026-11-09",
    tag: "Strength",
    cta: "onerm",
    body: [
      {
        p: "Your one-rep max (1RM) is the heaviest weight you can lift once. Testing it is tiring and carries some risk, and most people don't need to. You can estimate it from any hard set.",
      },
      { h2: "The formulas" },
      { p: "The classic ones take weight and reps and assume you went to failure:" },
      {
        ul: [
          "**Epley:** weight × (1 + reps ÷ 30).",
          "**Brzycki:** weight × 36 ÷ (37 − reps).",
          "Others (Lombardi, Mayhew, Wathan, O'Conner) differ a little, especially at high reps.",
        ],
      },
      { p: "Example: 100 kg for 5 reps gives about 117 kg with Epley and 113 kg with Brzycki." },
      { h2: "Count the reps you had left" },
      {
        p: "The formulas assume failure. If you stopped with two reps in the tank, your set was really worth 7 reps to failure, not 5. Add your [reps in reserve](/guides/reps-in-reserve/) to your reps before using a formula, or the estimate will come out low.",
      },
      { cta: "onerm" },
      { h2: "How accurate is it?" },
      {
        ul: [
          "Most accurate from sets of 2 to 6 reps close to failure.",
          "Still useful up to about 10 reps.",
          "Unreliable past about 15 reps: endurance starts to matter more than strength.",
          "It varies by lift and by person, so treat it as a range, not a single number.",
        ],
      },
      { h2: "When to test for real" },
      {
        p: "If you compete, or just want to know, test at the end of a training block after a few lighter days, with a spotter or safety bars. Work up in small jumps: about 90% of your estimate, then 96%, then the goal only if those moved well.",
      },
      { tip: "The trend matters more than the number. If your estimated max is climbing over months, your training is working." },
      { h2: "Try it" },
      {
        p: "The free [one-rep max calculator](/tools/one-rep-max-calculator/) shows your estimate from any set with every formula's answer and a reps-to-weight table. In Liftsmith, every set you log updates the estimate for that lift, using your reported effort, weighting recent and higher-quality sets more, and charting it over time.",
      },
    ],
  },
  {
    slug: "how-long-do-muscles-take-to-recover",
    kind: "blog",
    title: "How long do muscles take to recover after lifting?",
    description:
      "How long each muscle takes to recover from a hard session, what speeds it up, and how to plan workouts so you train fresh muscles.",
    date: "2026-11-09",
    tag: "Recovery",
    cta: "recovery",
    body: [
      {
        p: "After a hard session, a muscle needs roughly **two to three days** to recover and be ready to train hard again. Small muscles bounce back faster than big ones, and how hard you pushed matters a lot.",
      },
      { h2: "Rough recovery times" },
      {
        ul: [
          "**Smaller muscles** (biceps, triceps, calves, side and rear delts, abs): about 48 hours.",
          "**Large muscles** (quads, hamstrings, glutes, back, chest): about 72 hours after a hard session.",
          "**Sets taken to failure** and lots of lowering work (like heavy Romanian deadlifts) take longer.",
          "**Sets with a few reps in reserve** recover faster.",
        ],
      },
      { h2: "What speeds recovery up" },
      {
        ul: [
          "**Sleep:** 7 to 9 hours. Nothing else comes close.",
          "**Protein:** about 1.6 g per kg of body weight a day. See [how much protein](/blog/how-much-protein-to-build-muscle/).",
          "**Enough food overall.** Recovery slows on a hard diet.",
          "**Easy movement:** walking, light cycling.",
          "**Leaving reps in the tank** on most sets.",
        ],
      },
      { cta: "recovery" },
      { h2: "Plan around it" },
      {
        p: "You don't need to wait until a muscle is perfectly fresh, but avoid training it hard while it's still very fatigued. A few ways to plan:",
      },
      {
        ul: [
          "Train each muscle twice a week with two or three days between.",
          "Put legs and back on different days if they both leave you wrecked.",
          "If a muscle is still sore and weak, train something else that day.",
        ],
      },
      {
        tip: "Soreness isn't a perfect guide. You can be recovered and still a bit sore, or not sore and still fatigued. Performance is the real test: if your reps drop, you weren't ready.",
      },
      { h2: "See it on your body" },
      {
        p: "Liftsmith tracks the fatigue every set adds to each muscle, fading over time faster for small muscles and slower for big ones, and shows it on a 3D figure: Fresh, Ready, Recovering or Fatigued. Tap a muscle to see when it's ready again. The daily plan only targets muscles that have recovered.",
      },
    ],
  },
  {
    slug: "should-you-train-when-sore",
    kind: "blog",
    title: "Should you lift when you're still sore?",
    description:
      "When it's fine to train sore muscles, when to wait, what muscle soreness actually means, and how to make the next session go better.",
    date: "2026-11-09",
    tag: "Recovery",
    cta: "recovery",
    body: [
      {
        p: "Some soreness the day or two after a workout (called DOMS, delayed-onset muscle soreness) is normal, especially after a new exercise or a long break. It doesn't mean you trained well, and it doesn't always mean you can't train again.",
      },
      { h2: "When it's fine" },
      {
        ul: [
          "Mild soreness that fades once you're warmed up.",
          "Training a different muscle group.",
          "Light, easy work on the sore muscle, which often makes it feel better.",
        ],
      },
      { h2: "When to wait" },
      {
        ul: [
          "The muscle is so sore it changes how you move.",
          "It's weak: your warm-up sets feel much heavier than usual.",
          "Soreness is still bad after three or four days.",
          "It's pain in a joint, or sharp, one-sided, or getting worse. That isn't muscle soreness, and it's worth seeing a doctor or physiotherapist.",
        ],
      },
      { cta: "recovery" },
      { h2: "Soreness isn't the goal" },
      {
        p: "You don't need to be sore to grow. Soreness mostly shows that something was new, and it fades as you repeat a program. Chasing it leads to too much volume, too close to failure, and slower progress.",
      },
      { h2: "Being less sore next time" },
      {
        ul: [
          "Add new exercises gradually: one or two sets the first week.",
          "Keep a rep or two in reserve on most sets.",
          "Don't jump volume a lot from one week to the next.",
          "Sleep and eat enough protein.",
        ],
      },
      {
        tip: "If you're always sore, your training is probably too much for your recovery right now. Cut a few sets and see if your lifts go up.",
      },
      { h2: "A plan that knows" },
      {
        p: "Liftsmith keeps track of how fatigued each muscle is from what you've logged and steers today's plan to muscles that are ready. If something hurts rather than aches, injury mode lets you skip or lighten the exercises that load it.",
      },
    ],
  },
  {
    slug: "how-much-protein-to-build-muscle",
    kind: "blog",
    title: "How much protein do you need to build muscle?",
    description:
      "How much protein a day lifters need to build muscle, how to spread it out, and simple ways to hit your number without tracking every gram.",
    date: "2026-11-09",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: "If you lift to build muscle, aim for about **1.6 grams of protein per kilogram of body weight a day** (about 0.7 g per pound). Going up to 2.2 g/kg is fine, and can help on a diet, but most people get the benefit by 1.6.",
      },
      {
        p: "That figure comes from a 2018 meta-analysis by Morton and colleagues: protein's effect on muscle gain levelled off at about 1.6 g/kg a day, with the upper end of the range near 2.2.",
      },
      { h2: "What that looks like" },
      {
        ul: [
          "60 kg person: about 95 to 130 g a day.",
          "80 kg person: about 130 to 175 g a day.",
          "100 kg person: about 160 to 220 g a day.",
        ],
      },
      { h2: "Spread it across the day" },
      {
        p: "Three or four meals with 25 to 40 g each is an easy way to get there, and spreading it out may help a little compared with one huge meal. Timing around your workout matters much less than the daily total.",
      },
      { cta: "tdee" },
      { h2: "Easy ways to get enough" },
      {
        ul: [
          "Build each meal around a protein: meat, fish, eggs, Greek yogurt, tofu, beans and lentils.",
          "Keep one easy option for busy days: a shake, cottage cheese, a tin of fish.",
          "If you're dieting, raise protein toward 2 g/kg. It helps hold on to muscle.",
        ],
      },
      { tip: "If you have kidney disease or another medical condition, check with your doctor before eating a lot more protein." },
      { h2: "Calories still matter" },
      {
        p: "Protein builds muscle, but you also need enough energy overall. The free [TDEE calculator](/tools/tdee-calculator/) works out your daily calories and gives a protein range for your weight. In Liftsmith, it updates itself from your weigh-ins and the days you actually train.",
      },
    ],
  },
  {
    slug: "lifting-on-a-cut",
    kind: "blog",
    title: "How to keep your strength while losing fat",
    description:
      "How to lift on a diet without losing muscle or strength: calorie deficit size, protein, training volume and what to expect from your lifts.",
    date: "2026-11-09",
    tag: "Nutrition",
    cta: "tdee",
    body: [
      {
        p: "When you're eating less to lose fat, the goal of training changes: keep the muscle and strength you have. Lifting heavy is the signal that tells your body to hold on to it.",
      },
      { h2: "Keep the deficit moderate" },
      {
        p: "Losing about **0.5 to 1% of your body weight a week** keeps most of your muscle. A deficit of about 500 calories a day is a good start for most people. Faster than 1% a week and strength tends to fall off quickly.",
      },
      { h2: "Keep the weights heavy" },
      {
        ul: [
          "Keep your main lifts in the same rep ranges with the same loads as long as you can.",
          "Cut volume a little if recovery suffers, rather than cutting the weight.",
          "Keep a rep or two more in reserve than usual. Grinding sets cost more on a diet.",
        ],
      },
      { cta: "tdee" },
      { h2: "Eat more protein" },
      {
        p: "Push protein toward 2 g per kg of body weight a day. It helps hold muscle and keeps you fuller. More in [how much protein](/blog/how-much-protein-to-build-muscle/).",
      },
      { h2: "What to expect" },
      {
        ul: [
          "Beginners can often still get stronger on a modest diet.",
          "Experienced lifters usually hold strength, with small drops near the end of a long diet.",
          "Higher-rep sets often drop first, because you have less energy. Heavy triples usually hold up better.",
        ],
      },
      { tip: "Weigh yourself several times a week and look at the trend, not single days. Water swings can hide a week of fat loss." },
      { h2: "A plan that watches with you" },
      {
        p: "Liftsmith logs weigh-ins (from your scale through Health Connect or Apple Health, or by hand) and warns you in a coach's note if your weight is dropping faster than 1% a week. Your workouts keep adapting to how your lifts are going, and your daily calorie estimate updates as your weight changes.",
      },
    ],
  },
];
