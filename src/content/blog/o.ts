import type { Article } from "../articles";

// Blog, part fifteen: school teams (Melvin, 2026-11-13: "dont forget to add blog posts for this";
// docs/decisions/school-teams.md). The announcement, a guide for high school coaches, and one for teenagers and their
// parents about starting to lift. Only what ships, and no other app named (seo.test.ts).
export const BLOG_O: Article[] = [
  {
    slug: "liftsmith-free-for-high-school-teams",
    kind: "blog",
    title: "Liftsmith is free for high school teams",
    description:
      "High school coaches who confirm a school email get Pro free, and so do their athletes aged 13 to 18, with teen-safe defaults built in.",
    date: "2026-11-12",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Starting today, Liftsmith Pro is free for high school coaches and for the athletes on their teams. A coach confirms an email address from their school, makes a team, and sends the team's code. Every athlete aged 13 to 18 who joins gets Pro for as long as they're on the team, with nothing to buy and no card to enter.",
      },
      {
        p: "We think the best time to learn how to train is before anyone is selling you shortcuts. A teenager who learns to warm up, add weight slowly and rest when they need it has a habit for life, and a coach is the person most likely to teach it.",
      },
      { h2: "How it works for coaches" },
      {
        ol: [
          "Open **Settings › Coaching** and, under **School teams**, tap **Confirm my school**. Enter the school's name and the email address your school or district gave you.",
          "Type in the six-digit code we email you. Addresses at a school domain we already know are confirmed straight away. Anything else is checked by a person, usually within two days.",
          "Make a team (up to five), then **Send invite**. The link opens Liftsmith with the team's code filled in, or athletes can type the code.",
        ],
      },
      {
        p: "Athletes who join show up under **Your clients**, so you get the same reports every coach gets: who hasn't trained this week, who's missing reps three workouts running, and whose lifts have stalled, each with one thing to do. You can send routines, leave a note and message each athlete. Read [how to track your clients' workouts](/blog/how-to-track-client-workouts/) for the habits that make it work.",
      },
      { cta: "coach" },
      { h2: "How it works for athletes" },
      {
        p: "An athlete enters the team code, says how old they are, and sees exactly what joining shares before they agree. Their coach sees their workouts: exercises, sets, weights and reps, how long they trained and how hard it felt. Never their heart rate, body weight, body fat, measurements, health readings, injuries, notes or photos.",
      },
      {
        p: "Each team also gets a **team board** for the week: teammates see each other's first name and how many workouts and sets they did in the last seven days. Not weights, not body numbers, and never on a public page. It's there to get the whole team in the gym, not to rank who's strongest.",
      },
      { h2: "Built for teenagers on purpose" },
      {
        ul: [
          "**Nobody under 13.** Setup won't finish for an age under 13, and teams only take ages 13 to 18.",
          "**Body fat and body shape start off** for anyone under 18. The body fat box, the 3D figure shaped like you and sharing body data with a coach all stay hidden until the athlete turns them on in Body › Health. Training works the same either way.",
          "**No public profile under 18.** In Friends, a teen's profile can't be made public, and they aren't suggested to strangers unless they choose to be.",
          "**Pro ends when it should.** It lasts a school year, then the coach confirms their address again. An athlete past high school age keeps their account and history, and moves to the free plan.",
        ],
      },
      { h2: "Why not a student discount?" },
      {
        p: "Most teenagers don't have an email address we can check, so a self-serve \"I'm in high school\" button would be open to anyone. Going through coaches keeps it honest, and it puts a responsible adult next to every athlete who uses it. If you coach a club team instead of a school team, [coaching in Liftsmith](/coaches/) works the same way, and being someone's client is always free.",
      },
      {
        p: "School teams are on Android, iPhone and the web app, in all six of the app's languages. The [features page](/features/) has the full list of what's free.",
      },
    ],
    faq: [
      [
        "Does the coach pay anything?",
        "No. A high school coach with a confirmed school address gets Pro free, and so does every athlete aged 13 to 18 on their teams.",
      ],
      [
        "Can a student sign up without a coach?",
        "They can use Liftsmith's free plan from age 13. Free Pro for students comes through a school coach's team.",
      ],
      [
        "What if my school email isn't recognized?",
        "It goes to a person on our team, who checks it against the school's website, usually within two days.",
      ],
    ],
  },
  {
    slug: "strength-training-for-high-school-athletes",
    kind: "blog",
    title: "Strength training for high school athletes: a coach's guide",
    description:
      "How to run a high school strength program that's safe, keeps a whole team training, and fits around the season: lifts, sets, progress and tracking.",
    date: "2026-11-12",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "A good high school strength program isn't a smaller version of an adult one. It's built around learning to move well, getting stronger slowly, and fitting around practice, games and exams. Here's how to set one up so a whole team keeps training, not only the three athletes who already love the weight room.",
      },
      { h2: "Teach the movement before the weight" },
      {
        p: "Most injuries in young lifters come from load added before the pattern is there, not from lifting itself. Spend the first weeks on a short list of movements with light weights, and only add load when each rep looks the same as the last.",
      },
      { exercises: ["goblet-squat", "romanian-deadlift", "push-up", "db-row", "plank"] },
      {
        p: "Start every session with a real warm-up. Five minutes of easy movement and a few light sets of the first lift do more for a team than any stretching routine. [How to warm up for lifting](/blog/how-to-warm-up-for-lifting/) has a version that takes ten minutes.",
      },
      { h2: "Sets, reps and how hard" },
      {
        ul: [
          "**Two or three workouts a week** is plenty in season, three or four in the off season.",
          "**Two to four sets of 6 to 12 reps** for most lifts. Heavy singles aren't needed to get strong at this age.",
          "**Stop two or three reps before failure.** Teach athletes what that feels like. It keeps form honest and recovery quick. [Reps in reserve](/guides/reps-in-reserve/) explains it in plain words.",
          "**Add weight in small steps**, only when every rep of every set was clean. [Progressive overload](/guides/progressive-overload/) is the whole idea in one page.",
        ],
      },
      { cta: "coach" },
      { h2: "Fit it around the season" },
      {
        p: "In season, keep the weights and cut the sets: two short sessions a week hold most of the strength built in the off season. Before a big game or a tournament weekend, go lighter. After a hard stretch of games, take an easy week. A planned easy week isn't lost time, it's when the work from the weeks before turns into strength. See [what a deload week is](/guides/deload-week/).",
      },
      { h2: "Keep everyone training" },
      {
        p: "The hardest part of a team program is the athletes who drift. A few things help:",
      },
      {
        ul: [
          "**Look at who hasn't trained, not who lifts the most.** A weekly check of who missed is worth more than a leaderboard of maxes.",
          "**Count workouts, not weights,** when you make it a team thing. Everyone can win at showing up.",
          '**Give one thing to do,** not a list. "Do your Tuesday session before practice" works better than a lecture.',
        ],
      },
      {
        p: "That's how Liftsmith's school teams are built. Your athletes' workouts come to you as a report that leads with who needs attention, and the team board counts workouts and sets in the last seven days, never weights. It's free for high school coaches who confirm a school email, and for their athletes aged 13 to 18. [Read how it works](/blog/liftsmith-free-for-high-school-teams/).",
      },
      { h2: "Keep body numbers out of the weight room" },
      {
        p: "Teenagers' bodies change fast, and comparing body weight or body fat across a team does more harm than good. Track what they can control: sessions done, sets done and the weight on the bar going up over months. Liftsmith keeps body fat and body shape switched off for under 18s unless they turn them on, and a coach never sees an athlete's body data through a team.",
      },
    ],
    faq: [
      [
        "At what age can teenagers start lifting weights?",
        "Strength training with good coaching is widely considered safe for young people once they can follow instructions. Liftsmith is for ages 13 and up.",
      ],
      [
        "Should high school athletes test their one-rep max?",
        "It isn't needed. A weight they can lift for 5 to 8 clean reps tells you as much, with far less risk.",
      ],
    ],
  },
  {
    slug: "lifting-weights-as-a-teenager",
    kind: "blog",
    title: "Lifting weights as a teenager: how to start safely",
    description:
      "For teens starting at the gym and the parents asking about it: is lifting safe, what to do first, how often to train and what to ignore online.",
    date: "2026-11-12",
    tag: "Beginners",
    cta: "plan",
    body: [
      {
        p: "If you're a teenager thinking about lifting weights, or a parent wondering whether it's a good idea, the short answer is yes, done the right way. Strength training builds stronger muscles, bones and tendons, makes sports safer, and is one of the few habits you can keep for the rest of your life. Here's how to start without getting hurt or wasting your time.",
      },
      { h2: "Is it safe?" },
      {
        p: "The old worry that lifting stunts growth isn't backed up by research. What causes injuries is the same at every age: too much weight too soon, sloppy form, and skipping rest. Learn the movements with light weights first, and if you can, get a coach, a teacher or a trainer to watch you lift.",
      },
      { h2: "Your first month" },
      {
        ul: [
          "**Train two or three times a week**, with a rest day between.",
          "**Pick five or six movements**: a squat, a hinge, a push, a pull and something for your core.",
          "**Do two or three sets of 8 to 12 reps**, and stop each set when you could still do two or three more with good form.",
          "**Warm up every time.** A few easy minutes and a couple of light sets first. See [how to warm up for lifting](/blog/how-to-warm-up-for-lifting/).",
        ],
      },
      { exercises: ["goblet-squat", "romanian-deadlift", "push-up", "db-row", "plank"] },
      { cta: "plan" },
      { h2: "Get stronger slowly" },
      {
        p: "Add a little weight only when every rep of every set looked good last time. Small steps, week after week, beat big jumps. That's all [progressive overload](/guides/progressive-overload/) means. If you want a ready plan, [this beginner gym plan](/blog/beginner-gym-workout-plan/) is a good place to start.",
      },
      { h2: "What to ignore" },
      {
        ul: [
          '**Supplements and "stacks".** You don\'t need them. Eat regular meals with some protein, drink water and sleep.',
          "**Comparing your body to anyone else's.** Bodies change a lot during your teens. Track what you did in the gym, not what the mirror says.",
          "**Maxing out.** Testing the heaviest weight you can lift once is how most beginners get hurt. It tells you nothing a set of 5 doesn't.",
        ],
      },
      {
        p: "Liftsmith is for ages 13 and up. For anyone under 18, body fat and body shape stay switched off unless you turn them on, and your Friends profile can't be public. If your school coach runs a team in Liftsmith, joining it gives you Pro free while you're on it. [Here's how school teams work](/blog/liftsmith-free-for-high-school-teams/).",
      },
    ],
    faq: [
      [
        "Does lifting weights stunt your growth?",
        "No. That idea isn't supported by research. Injuries come from poor form and too much weight too soon, which is why starting light matters.",
      ],
      ["How often should a teenager lift?", "Two or three times a week is enough to get stronger, with a rest day between sessions."],
      ["Do teenagers need protein shakes?", "No. Regular meals with some protein in each cover what a growing lifter needs."],
    ],
  },
];
