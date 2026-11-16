// The weekly tips emails in English (Canadian spelling). Every other language has the same ids, the same lines and
// the same number of points (weekly.test.ts). No other app is ever named.
export interface Words {
  title: string;
  /** One or two sentences under the title. */
  intro: string;
  /** Three to five short points. */
  points: string[];
  /** The "Did you know?" line at the foot. */
  dyk: string;
}

export interface Common {
  kicker: string;
  dykLabel: string;
  cta: string;
  ctaPro: string;
  proFree: string;
  proHave: string;
  proTrial: string;
  lab: string;
  why: string;
}

export const common: Common = {
  kicker: "Weekly tip · {n}",
  dykLabel: "Did you know?",
  cta: "Open it in {brand}",
  ctaPro: "See what Pro adds",
  proFree: "This is part of Pro: {monthly} a month or {annual} a year, with no ads, ever.",
  proHave: "This is part of your Pro.",
  proTrial: "This is part of the Pro trial you're on.",
  lab: "Labs are experiments: they may change, and what you tell us shapes them.",
  why: "You're getting this because weekly tips are on for your account. You can turn them off on their own in Settings › Reminders.",
};

export const emails: Record<string, Words> = {
  "gym-setup": {
    title: "Set up your gym the way it really is",
    intro:
      "Every weight the plan picks is one you can load, but only if the app knows your gear. Five minutes here makes every workout fit your gym exactly.",
    points: [
      "Add your bars, plates, dumbbells and kettlebells as they really are, odd plates and fixed dumbbells included.",
      "Add machines and their settings, so seat heights and pin numbers are remembered.",
      "Train in more than one place? Set up each gym, and on the phones the right one is picked when you arrive.",
      "Share a gym's setup as a link, so a training partner starts with the same gear.",
    ],
    dyk: "Smart plate memory (Settings › Workout) shows only the plates to add or take off between sets.",
  },
  import: {
    title: "Bring your whole training history with you",
    intro:
      "Years of lifting in another app don't have to stay there. Your workouts, routines and body stats come across from an export file.",
    points: [
      "Works with the export file from most popular lifting apps, cardio included.",
      "Workouts you repeated by name become routines you can start today.",
      "Body weight, body fat and tape measurements come across too.",
      "Your bests, estimated maxes and the plan's starting weights use the imported history straight away.",
    ],
    dyk: "Settings › Your data can also export every working set as a spreadsheet whenever you like.",
  },
  "coach-clients": {
    title: "Coach your clients in Liftsmith",
    intro: "Your clients already lift with the app. Now you can see their training and plan it with them.",
    points: [
      "Link clients with an invite link; they choose what you see.",
      "See every workout, new best and missed session, on a phone or a wide screen.",
      "Assign routines and programs; their weights still come from their own history.",
      "Pro covers up to 3 clients, and being a client is always free.",
    ],
    dyk: "Say whether you're a personal trainer or a coach in Coaching › Setup, and clients see the right word for you.",
  },
  likes: {
    title: "Teach the plan what you like",
    intro: "The adaptive plan learns from you. Star what you love, swap what you don't, and it changes which exercises it picks.",
    points: [
      "A star makes an exercise come up far more often when it suits the day.",
      "A swap makes that exercise come up less, and the effect fades over a few months.",
      '"Not available here" keeps it out at this gym only, without counting against it.',
      "Workout preferences › Picked less often brings any of them back.",
    ],
    dyk: "Your favourites are listed on the same screen, with a button to add one by muscle.",
  },
  "todays-call": {
    title: "Today's call: push, as planned or go easy",
    intro:
      "Some days you're ready for more, some days you're not. Today's call reads your recovery and recent sets, says how hard to go, and why.",
    points: [
      "It comes from recovery, missed reps and how hard your last sets felt. Tap it to change it any time.",
      "Tell it you're sore, tired or unwell and the workout eases off.",
      "Optional cycle logging lets the call take your cycle into account.",
      "Pro: sleep, HRV, resting heart rate and breathing rate from your phone's health app or Oura move the call up or down.",
    ],
    dyk: "The effort scale can be reps in reserve or RPE (Workout preferences). The plan works the same either way.",
  },
  "gym-page": {
    title: "Make your gym's page work for you",
    intro: "Lifters are already finding your gym in the app and on the website. Make its page yours.",
    points: [
      "Add your logo, photos, hours and equipment.",
      "List amenities and prices: day pass, week pass and membership.",
      "Post announcements; members of your club get a notification.",
      "Print the poster and see how many lifters scanned it and added your gym.",
    ],
    dyk: "Broken equipment reports come to you with a Fixed button, and plans work around the machine until then.",
  },
  "short-on-time": {
    title: "Short on time? The workout fits",
    intro: "Thirty minutes still counts. Drag the length and the plan keeps what matters most.",
    points: [
      "The length slider sets the whole workout; a warm-up, cardio or cool-down takes its minutes out of the lifting.",
      '"Short on time" during a workout trims what\'s left without losing the main lifts.',
      "Your calendar can shorten a workout to fit before your next meeting.",
      "Pro: bench or rack taken? The plan works around it on the spot.",
    ],
    dyk: 'The default workout length can be "Last used", so the slider stays where you left it.',
  },
  adaptive: {
    title: "How adaptive workouts are built",
    intro: "No two days are the same, and your workouts shouldn't be either. Here's what goes into each one.",
    points: [
      "Your equipment comes first, then injuries, recovery and the sets each muscle still needs this week.",
      "Weights and reps come from your last workouts, rounded to what you can load.",
      "Exercise variety (Settings › Training) sets how often exercises change.",
      "Free lifters get one adaptive workout a week beside their program; Pro plans every day.",
    ],
    dyk: "Muscle priorities (Workout preferences) give a muscle more weekly sets until you turn it off.",
  },
  "friends-feed": {
    title: "Lifting is better with friends",
    intro: "Follow the people you train with and see their workouts as they happen.",
    points: [
      "Likes, comments, replies and @mentions on every workout.",
      "Choose who sees each of your workouts.",
      "Find friends by name or handle, or send your invite link.",
      "It's optional: you never have to post anything.",
    ],
    dyk: "A friend's workout can be sent as a remix link and done yourself, with your own weights.",
  },
  "dyk-workout": {
    title: "Did you know? The workout screen",
    intro: "Small switches that change how a workout feels, all in Settings › Workout.",
    points: [
      "Keep the screen on during a workout, so you don't unlock between sets.",
      "Turn off the automatic rest timer if you'd rather start it yourself.",
      "Ghost mode lets you race your last session of each exercise, with its weights, reps and rests on the rest timer.",
      "A gentle buzz 10 seconds before rest ends, on the phone and the watch, has its own switch.",
    ],
    dyk: "One-handed controls move the weight and rep buttons beside Log set, under your left or right thumb.",
  },
  "physio-rehab": {
    title: "Rehab that actually gets done",
    intro: "Home exercises work when they're done. Liftsmith puts yours on your client's Today.",
    points: [
      "Assign gentle rehab programs with the number of times a week you want.",
      "Clients save them in one tap, get a reminder on the days they're due, and can run them beside their lifting.",
      "See how often each client keeps to it.",
      "See the pain ratings and injuries they choose to share, exercise by exercise, with a notification when pain runs high.",
    ],
    dyk: "Clients are asked about pain only for the injury your program is for.",
  },
  "classic-programs": {
    title: "The classic programs, built in",
    intro: "Prefer a proven program to an adaptive one? The classics are free, and they fit your gym.",
    points: [
      "Classic 5×5, novice 3×5, 5×5 plus arms and ramping 5×5.",
      "Weights go up by themselves when you hit your reps, and back off when you stall.",
      "Plates, warm-ups and the rest timer work exactly as they do in adaptive workouts.",
      "Switch program any time in Settings › Training; your history stays.",
    ],
    dyk: "If your gym is missing something a program needs, the app uses a stand-in and says what it replaced.",
  },
  "warm-up": {
    title: "Warm up and cool down without thinking about it",
    intro: "Warming up well means heavier, safer working sets. The app plans it for you.",
    points: [
      "Ramp-up sets are worked out for each heavy lift.",
      "48 stretches with 3D demos: a warm-up before, a cool-down after, or a stretch routine any day.",
      "A workout can run warm-up, lifting and cool-down in order, with Skip between them.",
      "Stretch days of 10 minutes or more keep your streak.",
    ],
    dyk: "Tools › Warm-up gives the warm-up sets for any weight, for lifts outside the plan.",
  },
  "school-teams": {
    title: "Free Pro for your school team",
    intro: "Pro is free for high school coaches and for their athletes aged 13 to 18.",
    points: [
      "Confirm a school email address to unlock it.",
      "Invite your athletes; each gets Pro free while they're on the team.",
      "A weekly team board keeps everyone showing up.",
      "Teen-safe defaults: body fat and public profiles stay off for under-18s, and they get no promotional email.",
    ],
    dyk: "You coach the team with the same tools as any coach, at no cost.",
  },
  "health-apps": {
    title: "Your phone's health app, connected",
    intro: "Health Connect on Android and Apple Health on iPhone link Liftsmith to the rest of your fitness, both ways.",
    points: [
      "Weigh-ins and body fat from any scale that writes to your health app come in by themselves.",
      "Sleep, HRV, resting heart rate, steps and VO₂ max show on Body › Health.",
      "Every finished workout is saved back as a strength workout with calories and heart rate.",
      "It's free, and you can turn it off any time in the phone's own settings.",
    ],
    dyk: "On iPhone, sex, age and height can come from Apple Health, so you never type them.",
  },
  library: {
    title: "1,000 exercises, each with a 3D demo",
    intro: "Not sure how to do it? Every exercise shows you.",
    points: [
      "A 3D figure does the movement with its own gear, with setup steps and cues.",
      'Search, muscle chips and a "this gym" filter find the right one fast.',
      "One-side exercises say so, and dumbbell weights are per hand.",
      "Strength, bodyweight, machines, bands, kettlebells and cardio.",
    ],
    dyk: "Five quick taps on any 3D figure starts something fun.",
  },
  "coach-chat": {
    title: "Chat, alerts and check-ins",
    intro: "Stay close to every client without another app.",
    points: [
      "Message each client, with their training beside the chat.",
      "Get a notification when a client trains, or goes quiet for a week.",
      "Send weekly check-ins, an intake questionnaire or your own form; a low score or a late answer goes to the top.",
      "See weigh-ins, measurements and a 3D figure shaped like them when they share body data.",
    ],
    dyk: "Clients can change what they share at any time.",
  },
  "calculators-lifting": {
    title: "Calculators for lifters",
    intro: "The math of lifting, done for you, and filled in from what the app already knows.",
    points: [
      "One-rep max from any set, and the weights for other rep counts.",
      "Plate calculator for your gym's own plates, with the nearest loads when it can't be exact.",
      "Warm-up calculator for any working weight.",
      "Strength level: how your lifts compare for your weight and age.",
    ],
    dyk: "Tools is linked from Progress and from Settings.",
  },
  blocks: {
    title: "Training blocks and deloads",
    intro: "Progress comes in waves. Blocks plan the hard weeks and the lighter one that lets you keep going.",
    points: [
      "Blocks of build weeks with a reps-in-reserve target that rises week by week.",
      "A lighter deload week before you burn out.",
      "When fatigue builds, a coach's note offers a deload in one tap.",
      "Change how many build weeks you do, or start a new block today.",
    ],
    dyk: '"Start a new block today" is in Settings › Training.',
  },
  "training-now": {
    title: "Training now, cheers and check-ins",
    intro: "A little push from a friend goes a long way.",
    points: [
      "See who's training right now.",
      "Send a cheer; it floats up their workout screen.",
      "Check in at the gym with one tap on Today, so the friends you pick know you're there.",
      "Every notification has its own switch.",
    ],
    dyk: "Ghost mode (Settings › Workout) lets you race your own last session instead.",
  },
  "dyk-plan": {
    title: "Did you know? Tune the plan",
    intro: "The plan has sensible defaults, and every one of them can be yours. They're all in Workout preferences.",
    points: [
      "Rest between sets, separately for big lifts and smaller ones.",
      "Rep ranges and sets per exercise, or just for one exercise.",
      "Effort scale: reps in reserve or RPE 1 to 10.",
      "Week starts on Sunday or Monday, for streaks, quests, recaps and weekly stats.",
      "Default workout length, or keep the slider where you left it.",
    ],
    dyk: "Changes to one exercise apply from your next workout.",
  },
  "gym-staff": {
    title: "Staff, starter programs and your club",
    intro: "Share the work of running your gym's page, and give new members a head start.",
    points: [
      "Invite managers and front-desk staff with a one-time link; each uses their own account.",
      "Suggest one starter program to new members; they save it in one tap with their own weights.",
      "Run a club with a weekly leaderboard.",
      "Approve the trainers who list themselves at your gym.",
    ],
    dyk: "Your gym's page is on the website too, so people searching for a gym nearby can find it.",
  },
  injury: {
    title: "Train around an injury",
    intro: "Something hurts? Keep training without making it worse.",
    points: [
      "Tell the app what hurts and the plan leaves out what would aggravate it.",
      "Risky lifts get a warning before you start them.",
      "A 0 to 10 pain rating, tracked over time, shows you it easing.",
      "Working with a physio? Their rehab can run beside your lifting.",
    ],
    dyk: "Mark a sore spot as healed and the plan brings those exercises back.",
  },
  body: {
    title: "Weigh-ins, body fat, tape and photos",
    intro: "Your body changes, not just your lifts. Track it with a few taps.",
    points: [
      "Weight and body fat with − and +, no typing, or straight from your scale through your phone's health app.",
      "Nine tape measurement sites in centimetres or inches.",
      "Progress photos line up with your last one, and any two dates compare as a slider or side by side. They stay on your phone.",
      "Labs (Pro): a Bluetooth smart scale fills in the weigh-in for you to check.",
    ],
    dyk: "A shrinking or growing waist becomes a coach's note when you don't log body fat.",
  },
  "coach-business": {
    title: "Booking and getting paid",
    intro: "Run the business side where the training already is.",
    points: [
      "Open the times you're free, once or every week; clients book them in the app.",
      "A session in the next day shows on their Today and goes into their calendar in one tap.",
      "Connect your own Stripe account and set a price per session or per month; the money goes straight to you.",
      "On Coach and Coach Plus, Liftsmith takes nothing from what clients pay you (2% on Pro), and a failed payment shows on their report.",
    ],
    dyk: "You can book a client in yourself from the schedule.",
  },
  "gym-finder": {
    title: "Find a gym near you",
    intro: "Travelling, moving or looking for a new gym? The finder shows what's near.",
    points: [
      "Gyms on a map with a list beneath it, official ones first.",
      "Each has its own page: equipment, hours, a map and how many lifters train there.",
      "Missing one? Add it.",
      "Add a gym to yours and the plan fits its equipment.",
    ],
    dyk: "Your home gym can show on your Friends profile.",
  },
  "heart-rate": {
    title: "Heart rate on every set",
    intro: "See how hard you're working and how well you're recovering between sets.",
    points: [
      "Connect any Bluetooth heart rate strap, or your watch.",
      "Heart rate shows on the workout, the rest timer and the lock screen.",
      "It's saved with the workout to your phone's health app.",
      "Tools › Heart rate zones works out your zones.",
    ],
    dyk: "Labs (Pro) has a rest timer that ends rest early once your heart rate is back down.",
  },
  plateau: {
    title: "The plateau detective",
    intro: "A lift that won't move has a reason. The plateau detective finds it.",
    points: [
      "It gives the likely cause, from your own sets.",
      "It offers a one-tap three-week fix.",
      "It tells you the fix is running, then whether it worked.",
      "Several lifts stalling at once means fatigue, so it offers a deload instead.",
    ],
    dyk: '"Got it" hides a coach\'s note until something changes.',
  },
  routines: {
    title: "Build your own routines and share them",
    intro: "Got a routine you love? Build it once and share it with anyone.",
    points: [
      "Build from the exercise browser, with no limit on routines.",
      "Share it as a link that anyone can open, in the app or on the web.",
      "Routines can carry their own warm-up and cool-down.",
      "Weights still come from each lifter's own history.",
    ],
    dyk: "On a computer, the routine builder opens wide, with rows you can drag.",
  },
  "dyk-battery": {
    title: "Did you know? Save battery on any phone",
    intro: "An older phone, or a long day away from a charger? A few switches help.",
    points: [
      "Battery saver for 3D figures draws the exercise demos and the recovery map at a lower resolution and frame rate.",
      "Lean mode turns off motion, bursts and confetti.",
      "Nothing runs in the background when you're not training.",
      "Everything works offline, so a basement gym with no signal doesn't drain the battery.",
      "Sounds and vibration each have their own switch.",
    ],
    dyk: "Battery saver is in Settings › Look and feel.",
  },
  "coach-nutrition": {
    title: "Nutrition targets for clients",
    intro: "Set the numbers once; the app checks them every day.",
    points: [
      "Daily calories, protein, carbs and fat for each client, with a rest-day number if you like.",
      "Filled in from the client's own stats in one tap.",
      "Their coach's notes check their food week against your targets.",
      "See how they're eating when they share it from their food app.",
    ],
    dyk: "Clients never log food in Liftsmith; it reads what their food app already has.",
  },
  watches: {
    title: "Your workout on your wrist",
    intro: "Leave the phone in your bag. Your watch runs the workout.",
    points: [
      "Wear OS and Apple Watch apps show the set or the rest countdown.",
      "Heart rate comes from the watch's own sensor.",
      "Log set and +30 s from your wrist, with a buzz when rest ends.",
      "A Garmin watch app is coming soon.",
    ],
    dyk: "The lock screen shows the rest countdown, the next set and its plates too.",
  },
  challenges: {
    title: "Challenges, clubs and leaderboards",
    intro: "Some friendly competition keeps you showing up.",
    points: [
      "Challenge a friend to a week of workouts or sets.",
      "Join a club or a gym's crew with a weekly board.",
      "Take on the monthly challenge with everyone.",
      "Leagues match you with lifters at your level, so it stays fair.",
    ],
    dyk: "Streaks count weeks, and a streak freeze saves a week you couldn't make.",
  },
  "labs-camera": {
    title: "Labs: let the camera count your reps",
    intro: "Labs are experiments that might become features. First up: counting reps without touching the phone.",
    points: [
      "Prop your phone up and the camera counts your reps, with the skeleton drawn over the picture.",
      "Hands-free sets: the set logs itself a few seconds after your last rep.",
      "Nothing from the camera leaves your phone.",
      "Turn each lab on in Settings › Labs.",
    ],
    dyk: "Settings › Send feedback reaches the team directly, with what we need to fix a bug.",
  },
  "calculators-body": {
    title: "Calculators for food and body",
    intro: "Eating for your goal starts with your numbers.",
    points: [
      "TDEE: your daily calories from your weight, stats and real training days.",
      "Macros: protein, carbs and fat for your goal.",
      "Body fat and FFMI from your measurements.",
      "An interval timer for conditioning work.",
    ],
    dyk: "The activity level in TDEE comes from your actual training, not a guess.",
  },
  "coach-directory": {
    title: "Get found by new clients",
    intro: "New clients are already looking at your gym's page.",
    points: [
      "List yourself at the gyms where you train clients, with a line about you.",
      "You show on that gym's page and in the trainer directory for its city on the website.",
      "A button lets new clients start training with you.",
      "On an official gym, the owner approves trainers first; only adults are listed.",
    ],
    dyk: "Your directory listing is a public page people can find by searching.",
  },
  food: {
    title: "Coach's notes from your food app",
    intro: "No food logging in Liftsmith, and you don't need it: your food app already has the numbers.",
    points: [
      "Calories, protein, carbs and fat reach us through your phone's health app.",
      'Notes like "protein short three days running", against targets for your goal.',
      "Two weeks of food and weigh-ins measure your real maintenance calories.",
      "Logging protein alone counts.",
    ],
    dyk: "The same targets drive Tools › Macros, so the numbers always agree.",
  },
  "why-pro": {
    title: "What Pro adds",
    intro: "Pro is for lifters who want the app to coach them every day. Here's everything it adds, and what stays free.",
    points: [
      "Daily adaptive plans and splits, training blocks, the recovery map and advanced stats.",
      "Sleep and HRV moving today's call, the plateau detective and the goal planner.",
      "Labs, cloud connections, and coaching up to 3 clients.",
      "Free keeps the logger, every program, Health Connect and Apple Health, coach's notes and every reason.",
    ],
    dyk: "Invite a friend and you both get a month of Pro once they've finished three workouts.",
  },
  history: {
    title: "Your history, fixed and reused",
    intro: "History isn't just a record. Fix it, add to it and do it again.",
    points: [
      "A month calendar of past workouts, each day named.",
      "Edit a set, add a note or name a workout.",
      "Forgot your phone? Log a past workout and it counts.",
      "Do any workout again with today's weights.",
    ],
    dyk: "Every exercise has its own page with its full history.",
  },
  "dyk-yours": {
    title: "Did you know? Make it read your way",
    intro: "Little things that make the app feel like yours.",
    points: [
      "Pick a language other than your phone's: there are six.",
      "Kilograms or pounds, and each gym can use its own for its plates.",
      "The daily quote on Today can be switched off.",
      "Run setup again from Settings if your goal, experience or gym has changed.",
      "Exercise variety sets how often the plan changes exercises.",
    ],
    dyk: "Dark, light or match your phone is in Settings › Look and feel.",
  },
  cardio: {
    title: "Cardio, inside the workout",
    intro: "Lifting and cardio in one session, without juggling apps.",
    points: [
      "Cardio can follow the lifting, with the machine and minutes picked by tap.",
      "Cardio sets log time and distance, and timed work gets a set timer.",
      "On a cardio and stretching day, switch the lifting off.",
      "Labs (Pro): Bluetooth bikes, rowers and treadmills fill in time, distance and power.",
    ],
    dyk: "Holds, carries and hangs get a set timer that runs on the lock screen and your watch.",
  },
  "more-programs": {
    title: "More programs: waves, tiers and bodyweight skills",
    intro: "Past the beginner programs, there's more built in.",
    points: [
      "Training max waves: the classic four-week wave with a top set each day.",
      "Tiered progression: heavy, medium and light work for each lift.",
      "Bodyweight skills: ladders from your first push-up to harder moves.",
      "Dumbbell full body for home gyms.",
    ],
    dyk: "A program's weights come from your history, so switching doesn't start you over from the bar.",
  },
  "gym-pages": {
    title: "What gym pages tell you",
    intro: "Before you go, know what's there.",
    points: [
      "Amenities: showers, parking, 24/7 access, a women's area and more.",
      "Day pass, week pass and membership prices.",
      "Announcements from the gym: holiday hours, new equipment.",
      "Report broken equipment, and everyone's plan works around it until it's fixed.",
      "Something wrong on a gym's page, or is it closed or listed twice? Report a problem from the page, and our team fixes it.",
    ],
    dyk: "Members of an official gym's club get a notification when the gym posts news.",
  },
  "coach-plans": {
    title: "Coach plans for a growing client list",
    intro: "More clients shouldn't mean fewer tools.",
    points: [
      "Pro covers up to 3 clients.",
      "Coach covers 25 clients, for $19.99 a month or $199.99 a year.",
      "Coach Plus has no set limit, for $39.99 a month or $399.99 a year.",
      "Every coaching tool is on every plan, clients train free, and on Coach and Coach Plus Liftsmith takes nothing from what they pay you (2% on Pro).",
    ],
    dyk: "Going over your limit never unlinks a client.",
  },
  stats: {
    title: "Stats that tell you what to do",
    intro: "Numbers only matter if they change what you do next.",
    points: [
      "Every exercise shows your sets, total lifted and estimated max.",
      "See how you compare with trained lifters of your weight, age and sex.",
      "Pro: charts from a week to a year, weekly sets per muscle against the target, and one-rep max trends.",
      "The website's strength standards come from real lifters who choose to count.",
    ],
    dyk: '"Count my lifts" in Settings › Your data decides whether yours help build those standards.',
  },
  "labs-coach": {
    title: "Labs: the camera as a coach",
    intro: "Once camera rep counting is on, it can do more.",
    points: [
      "Bar speed: how fast the bar moves, and when it's slowed enough to stop.",
      "Form check: squats above parallel, cut-short reps and leaning to one side.",
      "Bar path replay: a rep with the bar's path drawn and one cue.",
      "Today's max from warm-ups: a nudge to your first working weight.",
    ],
    dyk: "A lab that needs another one only shows once that one is on.",
  },
  "health-twin": {
    title: "Your health twin and fitness age",
    intro: "Strength is one part of fitness. Here's the rest.",
    points: [
      "Sleep, HRV, resting heart rate, steps and breathing rate in one place, with your trend.",
      "A fitness age from your VO₂ max.",
      "Fitness tests: dead hang, one-leg stand and 30-second chair stand, each with a timer and a typical range.",
      "What helps, and a goal for each.",
    ],
    dyk: 'The "i" beside each test explains what it measures.',
  },
  "outside-app": {
    title: "Liftsmith outside the app",
    intro: "Start faster, without opening anything.",
    points: [
      "Home-screen widget: today's call, your weekly goal, a coach's note and Start or Log set.",
      "A Quick Settings tile on Android; Control Center and Siri on iPhone.",
      "Your training days in your calendar.",
      "Gentle reminders on training days.",
    ],
    dyk: "Log set and +30 s on the lock screen work with the app closed.",
  },
  "dyk-privacy": {
    title: "Did you know? Your privacy switches",
    intro: "You decide what leaves your phone.",
    points: [
      "Usage stats: anonymous app usage, one switch.",
      "Count my lifts: whether your lifts help build the public strength standards. Your own numbers are never shown.",
      "Who sees each workout on Friends, set per workout.",
      "Coaches see only what you switch on, kind by kind.",
      "Progress photos never leave your phone.",
    ],
    dyk: "Erase this device in Settings › Your data wipes everything stored on it.",
  },
  invite: {
    title: "Invite friends, and both get Pro",
    intro: "Training together beats training alone, and it earns you both Pro.",
    points: [
      "One invite link, from Friends, the end of a workout or any share card.",
      "A friend who joins with it follows you back.",
      "After their third workout, you both get a month of Pro.",
      "Your invites shows how close each friend is.",
    ],
    dyk: 'Share cards have an "Add my invite link" switch.',
  },
  splits: {
    title: "Adaptive splits",
    intro: "Like a split? Keep it, and still let the plan adapt.",
    points: [
      "Push, pull, legs, or upper and lower.",
      "Each day still adjusts to your recovery and weekly sets.",
      "Exercises vary within the split.",
      "Switch in Settings › Training.",
    ],
    dyk: "Days a week and which days you train are in Settings › Training › Schedule.",
  },
  "set-types": {
    title: "Drop sets, rest-pause and more",
    intro: "For the days you want to push past the planned sets.",
    points: [
      "Add a drop set or a rest-pause set between sets.",
      "Set rest, reps and sets for one exercise only.",
      "Timed holds get a timer.",
      "Per-hand dumbbells and each-side moves are shown clearly.",
    ],
    dyk: '"Rest, reps and sets for one exercise" is in Workout preferences.',
  },
  "find-coach": {
    title: "Train with a coach, free",
    intro: "Working with a coach or personal trainer? Being their client in Liftsmith costs nothing.",
    points: [
      "Your coach assigns routines; you do them with the app's logging.",
      "Message them in one tap, answer check-ins and book sessions.",
      "You choose what they see: each kind of data has its own switch.",
      "Find coaches at your gym on its page and in the trainer directory.",
    ],
    dyk: "Photos and gyms never go to a coach.",
  },
  "labs-hands-off": {
    title: "Labs: log sets without touching the screen",
    intro: "Chalky hands, gloves, a phone across the room. Log anyway.",
    points: [
      'Voice: say "100 for 8" or "too easy", recognized on your phone.',
      "The volume button on your phone or earbuds logs the set.",
      "Your watch, or the phone's own motion sensors, can count the reps.",
      "The tempo coach counts each rep's lowering, hold and lift.",
    ],
    dyk: "No audio ever leaves your phone for voice logging.",
  },
  rest: {
    title: "Make rest count",
    intro: "Rest is part of the workout. Use it well.",
    points: [
      "Box breathing on the rest screen, with presets or your own pattern.",
      "The voice coach speaks up, so you don't watch the phone.",
      "Music controls on Today and during the workout.",
      "Ghost mode shows your last session's sets on the rest timer.",
    ],
    dyk: "The plate math game can fill the rest screen instead (Settings › Workout › Between sets).",
  },
  "goal-planner": {
    title: "The goal planner",
    intro: "Want a bigger bench? Know when, and how.",
    points: [
      "Pick a lift and a target.",
      "Get a realistic date from your own progress.",
      "See the path there, step by step.",
      "It tracks you as you go.",
    ],
    dyk: "A lift up 5% in six weeks becomes a \"what's working\" coach's note.",
  },
  "dyk-fun": {
    title: "Did you know? The fun stuff",
    intro: "Not everything has to be serious.",
    points: [
      "Five quick taps on any 3D figure.",
      "Seven quick taps on the logo at the foot of Settings shows your lifetime total in other units.",
      "A couple of weights have a joke attached, for you to find.",
      "Earned themes, accents and app icons wait in the Awards locker.",
    ],
    dyk: "Weekly quests on Awards earn extra XP.",
  },
  profile: {
    title: "Your profile, your rules",
    intro: "Show off what you want, and keep the rest private.",
    points: [
      "An optional public page with your best lifts and workouts.",
      "A tagline, and your home gym from the gym finder.",
      "Block, mute and report in one tap; every report is reviewed.",
      "Choose who sees each workout.",
    ],
    dyk: "Under-18s never have public pages.",
  },
  "labs-gear": {
    title: "Labs: connected gear",
    intro: "Gadgets in the gym, working together.",
    points: [
      "Sonos: play, pause and skip, with one volume for sets and another for rest.",
      "Bluetooth gym machines fill in cardio sets.",
      "A Bluetooth smart scale fills in a weigh-in.",
      "The heart-rate rest timer ends rest once you've recovered.",
    ],
    dyk: "Some labs show only in the Android and iPhone apps, because they need the phone's hardware.",
  },
  celebrate: {
    title: "Celebrate the work",
    intro: "Lifting is hard. Mark the wins.",
    points: [
      "A monthly recap, ready to share.",
      "Your lifting anniversary puts day one beside today.",
      "Share cards for workouts, bests and milestones.",
      "A new best flashes gold and can be shared from the rest screen.",
    ],
    dyk: "Share links show a preview card in messages and social apps.",
  },
  "make-it-yours": {
    title: "Make it yours",
    intro: "Your app, your look.",
    points: [
      "Dark, light or match your phone.",
      "Earn themes and accents from your achievements.",
      "On the phones, an app icon in your theme's colours.",
      "Six languages, separate from your phone's if you like.",
    ],
    dyk: "With Appearance on light, a theme changes the accent colour only.",
  },
  accessibility: {
    title: "Comfortable for everyone",
    intro: "Every lifter should be able to use it easily.",
    points: [
      "Text up to 150%, or match your phone.",
      "Colour-blind safe colours and more contrast.",
      "One-handed controls under your thumb.",
      "Big numbers mid-set, easy to read at arm's length.",
    ],
    dyk: "Lean mode cuts motion and confetti in one switch.",
  },
  desktop: {
    title: "Liftsmith on your computer",
    intro: "Plan, review and build on a big screen.",
    points: [
      "Open the web app for a sidebar, wide pages and dialogs.",
      "Keyboard shortcuts during a workout (L logs the set).",
      "A wide routine builder with drag and drop.",
      "Everything syncs with your phone when you're signed in.",
    ],
    dyk: "Log a past workout on the web and see it on your phone.",
  },
  "your-data": {
    title: "Your data, your control",
    intro: "Where your data lives, and what you can do with it.",
    points: [
      "It works offline and syncs in the background.",
      "Save a backup file or export a spreadsheet any time.",
      "Switches for usage stats and strength standards.",
      "Erase this device, or sign out to wipe it.",
    ],
    dyk: "Your phone's cloud backup never copies Liftsmith's data; your account and backup files do.",
  },
  "dyk-help": {
    title: "Did you know? Help is one tap away",
    intro: "When something's unclear or broken, here's where to look.",
    points: [
      'The "i" next to any training term explains it in plain words.',
      "Why? under a target shows the rule that set it.",
      "Send feedback or report a bug from Settings; it reaches the team with what's needed to fix it.",
      "The Features page on the website lists everything the app does, and what's new.",
    ],
    dyk: "The version and build at the foot of Settings help us find your bug faster.",
  },
  "body-3d": {
    title: "Your body in 3D",
    intro: "The figures in the app can look like you.",
    points: [
      "Shape the figure like me builds it from your height, weight, body fat and measurements.",
      "It says what's missing, with a button to add it.",
      "Pro: the recovery map glows on that figure.",
      "Battery saver draws the figures more lightly on older phones.",
    ],
    dyk: "Shape the figure like me is on Body › Health.",
  },
  travel: {
    title: "Training on the road",
    intro: "Travel, holidays and visiting family don't have to break your streak.",
    points: [
      "Add a hotel or a friend's gym from the gym finder, or set up a tiny one in a minute: a pair of dumbbells is enough.",
      "On the phones the right gym is picked when you arrive, and the plan fits what's there.",
      "No gym at all? Bodyweight skills and dumbbell full body travel well, and 20 minutes still counts.",
      "A streak freeze covers the week you really can't train.",
    ],
    dyk: "Stretch days of 10 minutes or more keep your streak too.",
  },
  anniversary: {
    title: "Your lifting anniversary",
    intro: "Every year on the day of your first workout, the app looks back with you.",
    points: [
      "Today puts day one beside today: workouts, sets and total lifted.",
      "It names the lift that has grown most.",
      "It comes with a card to share.",
      "It stays for a week, so you won't miss it.",
    ],
    dyk: "Seven quick taps on the logo at the foot of Settings shows your lifetime total in elephants.",
  },
  "whats-new": {
    title: "What's new in Liftsmith",
    intro: "The app keeps changing. Here's how to keep up, and how to steer it.",
    points: [
      "The Features page on the website lists every feature, with the newest at the top.",
      "Each new feature gets its own tip email, so you hear about it once, here.",
      "Labs is where new ideas land first.",
      "Send feedback from Settings to tell us what to build next.",
    ],
    dyk: "Updates arrive by themselves; the app tells you when one is ready.",
  },
  "coach-dock": {
    title: "Your client chat, now a messenger",
    intro: "On a computer, every chat now lives in a dock at the bottom right, so clients are one click away on any page.",
    points: [
      "Up to two chat windows beside the list, each folding down to its name.",
      "A sound and a count in the browser tab when a client writes.",
      "Set a status: with a client, training, away, do not disturb, on vacation or appear offline; online shows by itself.",
      "See when a client is typing and when they've seen your message, and send emoji and gym stickers.",
    ],
    dyk: "On Do not disturb or on vacation, chat notifications to you wait until you're back.",
  },
};
