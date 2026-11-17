import type { Article } from "../articles";

// Blog: features that shipped without a post (Melvin, 2026-11-17: "do all of this"): Garmin, the ten languages
// and the language picker, the coach chat dock, and a round-up of the week's smaller changes (#562 to #572).
// Only what ships today, and no other app named (seo.test.ts). Garmin Connect's direct link is still waiting on
// Garmin's approval (docs/decisions/connected-apps.md), so the Garmin post is about what works today.
export const BLOG_NEW_FEATURES: Article[] = [
  {
    slug: "garmin-and-liftsmith",
    kind: "blog",
    title: "Using a Garmin with Liftsmith: what works today",
    description:
      "Your Garmin's sleep, steps, heart rate and weigh-ins can reach Liftsmith through Health Connect or Apple Health. Here's how to set it up, and what's next.",
    date: "2026-11-17",
    tag: "Tracking",
    cta: "health",
    body: [
      {
        p: "Garmin watches are some of the best sleep and recovery trackers around, and a lot of lifters already wear one. The question we hear most is simple: can Liftsmith use what my Garmin knows? Yes, today, through your phone's health app. Here's how it works, what comes across, and what we're building next.",
      },
      { h2: "The route that works today: your phone's health app" },
      {
        p: "Garmin Connect can share your data with **Health Connect** on Android and **Apple Health** on iPhone. Liftsmith reads from both. Once sharing is on, the readings Garmin sends there reach Liftsmith on their own, with no extra app or account.",
      },
      {
        ol: [
          "In the Garmin Connect app, open its settings and turn on sharing with Health Connect (Android) or Apple Health (iPhone). Pick what to share: sleep, steps, heart rate and weight are the ones Liftsmith uses most.",
          "In Liftsmith, open **Settings › Connected apps** and connect Health Connect or Apple Health. Allow the readings you want to use.",
          "Tap **Sync now** on that card to pull in the last few weeks. After that, Liftsmith checks again whenever you open the app.",
        ],
      },
      { cta: "health" },
      { h2: "What Liftsmith does with it" },
      {
        ul: [
          "**Body › Health** shows last night's sleep, your week of sleep, resting heart rate, HRV, steps and VO2 max when your watch records them, each against your own normal from the last 30 days, with a line on what it means and what to do.",
          "**Today's call** (Pro) moves with them: a short night or a resting heart rate well above your normal nudges the plan toward an easier day, and a good night lets you push.",
          "**Weigh-ins** from an Index scale or typed into Garmin Connect arrive as weigh-ins, so your weight trend, calorie targets and coach's notes stay current without typing.",
          "**Steps** feed your daily calorie burn once there are five days of them in a week.",
        ],
      },
      {
        tip: "If a tile on Body › Health says nothing came through, check that Garmin Connect is sharing that reading. Health Connect and Apple Health only pass on what the source app sends.",
      },
      { h2: "What's next" },
      {
        p: "A direct **Garmin Connect** link is built and waiting on Garmin's developer approval. It will bring sleep, HRV, resting heart rate, steps and Index scale weigh-ins straight from Garmin, plus your runs, rides and indoor rows as cardio workouts. Until Garmin says yes, it shows **Coming soon** in Settings › Connected apps. A Liftsmith app for Garmin watches, with the live workout on your wrist, is on its way too.",
      },
      {
        p: "Until then, the health app route gives Liftsmith everything it needs to plan around how you slept. You don't lose anything by setting it up now: when the direct link opens, your history stays where it is.",
      },
    ],
    faq: [
      [
        "Do I need Pro to see my Garmin data?",
        "No. Body › Health is free. Pro lets your sleep, HRV and resting heart rate move today's call.",
      ],
      [
        "Will my Liftsmith workouts show up in Garmin Connect?",
        "Liftsmith saves every workout to Health Connect or Apple Health. Whether Garmin Connect reads workouts from there depends on Garmin.",
      ],
    ],
  },
  {
    slug: "liftsmith-in-ten-languages",
    kind: "blog",
    title: "Liftsmith now speaks ten languages, and you pick which",
    description:
      "Liftsmith is in English, Spanish, French, German, Italian, Japanese, Portuguese, Korean, Polish and Turkish. Choose yours before setup, on any device.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "A training app only helps if you can read it between sets without thinking. So Liftsmith now comes in **ten languages**: English, Spanish, French, German, Italian, Japanese, Brazilian Portuguese, Korean, Polish and Turkish. And you no longer have to accept whatever language your phone or browser happens to use.",
      },
      { h2: "Pick it before the first question" },
      {
        p: "The welcome screen has a **language button** in the top corner: a globe and the language showing now, written in that language. Tap it and choose before setup asks you anything, so nobody answers questions about their training in a language they can't read. You can change it any time in **Settings › Look and feel › Language**.",
      },
      {
        ul: [
          "**Match my phone** (in the Android and iPhone apps) or **Match my browser** (on the web) follows your device, which is how it starts.",
          "**Pick one** of the ten and the app stays in it, whatever the phone says. Handy if your phone is in one language and you train in another.",
          "Your choice **syncs** with your account, so a new phone or the web app opens in the language you picked.",
        ],
      },
      { cta: "plan" },
      { h2: "The website carries it over" },
      {
        p: "If you read our website in another language, or pick one from the switcher at the bottom of any page, the web app remembers it. Open the app from there for the first time and it starts in the language you were already reading.",
      },
      { h2: "What's translated" },
      {
        p: "Everything you see while you train: every screen, every coach's note and the reason behind each recommendation, the glossary that explains terms like reps in reserve, exercise names and form cues, and the lock-screen workout card. Reasons are built from whole sentences in each language, never English pieces glued together, so they read naturally.",
      },
      {
        p: "Numbers follow your region too. Weights, dates and decimals use the format you'd expect, and you can still pick kilograms or pounds on their own in Settings.",
      },
      {
        tip: "Training with a friend who speaks another language? Shared routines and workout links open in each person's own language.",
      },
    ],
    faq: [
      [
        "Does changing the language change my units?",
        "No. Kilograms or pounds is its own setting, so you can use any language with either.",
      ],
      [
        "Can I use a different language on the web and on my phone?",
        "Pick Match my phone or Match my browser on each device and each follows its own setting. Pick a language and it follows you everywhere.",
      ],
    ],
  },
  {
    slug: "coach-chat-dock-statuses-and-stickers",
    kind: "blog",
    title: "Coach chat on desktop: a chat dock, statuses and gym stickers",
    description:
      "Coaches and clients can chat from a dock in the corner of the web app, set a status like With a client or On vacation, and send gym-themed stickers.",
    date: "2026-11-17",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Coaches spend a lot of the day at a desk: writing programs, checking in on clients, answering questions. Switching to a chat screen every time a client writes breaks that flow. So the Liftsmith web app now has a **chat dock** in the bottom corner, like the chat on a social site, and everyone in coaching can set a **status** so the other side knows when to expect an answer.",
      },
      { h2: "The chat dock" },
      {
        ul: [
          "A **Messages** bar sits at the bottom right with your unread count. Open it to see everyone you can message, unread first, each with a status dot and a preview of the last message.",
          "Click a name and a chat window opens beside the list. Keep **two open at once**; fold one down to its title bar and it stays out of the way until the next message.",
          "A new message plays a soft sound once and shows the unread count in the browser tab's title, so you notice it while you're working in another tab.",
          "The dock is hidden while you're doing a workout. On phones, chat has its own screen and a push notification instead.",
        ],
      },
      { cta: "coach" },
      { h2: "Statuses that set expectations" },
      {
        p: 'Pick a status from the button at the top of the dock or on Messages, on any device: **Automatic** (Online while you have coaching open, then Offline with when you were last active), **With a client**, **Training**, **Away**, **Do not disturb**, **On vacation** or **Appear offline**. With a client, Training, Away and Do not disturb can last one, two or four hours, or until you change them. On vacation takes the day you\'re back and shows it: "On vacation, back Fri, Nov 21".',
      },
      {
        p: "**Do not disturb** and **On vacation** hold chat notifications, so a client's message waits in the chat instead of buzzing your phone, and the client sees a note above the send box saying so. Clients can set a status too, which helps when they're travelling.",
      },
      { h2: "Emoji and gym stickers" },
      {
        p: "The message box has one smile button that opens a tray with emoji, gym ones first, and **12 stickers** drawn for Liftsmith: New PR!, Let's go!, Light weight!, On fire, So proud!, Morning!, Hmm…, Rest day, Hydrate!, Protein!, Form check? and Deload. One tap sends a sticker, in the reader's own language. Small things, but a \"So proud!\" after a client's first pull-up lands better than a thumbs up.",
      },
      {
        tip: "Set On vacation before you go, with the day you're back. Clients see it next to your name, and nobody wonders why you haven't answered.",
      },
    ],
    faq: [
      [
        "Do clients need to pay for chat?",
        "No. Being someone's client in Liftsmith is free. Coaching clients is part of Pro and the coach plans.",
      ],
      ["Who can see my status?", "Only the coaches and clients you're linked with."],
    ],
  },
  {
    slug: "new-this-week-stretch-countdown-and-more",
    kind: "blog",
    title: "New this week: a stretch countdown, smoother figures and more",
    description:
      "A get-ready countdown between stretches, a screen that stays on, smoother 3D figures, 5 lb machine steps and plainer cues for timed sets and cardio.",
    date: "2026-11-17",
    tag: "Training",
    cta: "stretch",
    body: [
      {
        p: "Most weeks bring one big feature and a lot of small fixes that make the app nicer to use. This week's small things came from lifters and from our own sessions, and together they change how a few parts of the app feel. Here's the round-up.",
      },
      { h2: "Stretching" },
      {
        ul: [
          "**A get-ready countdown** before each stretch and each side, so you have time to get into position. It's 5 seconds to start; choose Off, 3 or 10 in **Settings › Workout › Get ready time**, or tap Start now to skip it.",
          "**The screen stays on** for the whole routine, so your phone doesn't lock while you're on the floor. The same goes for workouts, fitness tests and the interval timer.",
          "**One-side stretches show the side named**, and the figure mirrors for the other side, so you can copy it without working out left from right.",
        ],
      },
      { cta: "stretch" },
      { h2: "The 3D figures" },
      {
        ul: [
          "**Drag to turn, with a fling.** Every 3D figure now turns smoothly under your finger, and a quick swipe keeps it spinning with a little friction. A vertical swipe still scrolls the page.",
          "**Fewer controls on the how-to figure.** It plays at its own pace, with the muscles it works right underneath, and keeps moving during rest.",
          "**Jumps leave the floor.** Ankle hops, pogo jumps, jump rope and jumping jacks now actually jump.",
        ],
      },
      { h2: "In the workout" },
      {
        ul: [
          "**Machine and cable stacks step by 5 lb or 2.5 kg**, for the − and + buttons and for the plan's next weight. Lat pulldowns no longer jump 10 lb at a time.",
          '**Timed sets and cardio get their own cues.** A side plank no longer tells you to "leave 2 reps in the tank": holds say to stop a few seconds before your form slips, and cardio says a pace you could still talk at.',
          "**The rest card** has two simple toggles, Breathe and Plate math. Tap one again to hide it.",
          "**Loaded over bodyweight.** When your gym has dumbbells, the plan picks the dumbbell reverse lunge over the bodyweight one, unless you starred the bodyweight move.",
        ],
      },
      { h2: "Sonos" },
      {
        p: "If you use the Sonos lab, the music card now names **line-in, TV and AirPlay** when they're playing, instead of saying nothing is, and hides skip buttons when they can't do anything.",
      },
      {
        tip: "Ten seconds of get-ready time works well if your phone is on a shelf across the room. Five is plenty if it's on the floor beside you.",
      },
    ],
  },
];
