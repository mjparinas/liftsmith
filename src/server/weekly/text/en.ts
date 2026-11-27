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
      "61 stretches with 3D demos: a warm-up before, a cool-down after, or a stretch routine any day.",
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
      "Gyms on a full map, each on a see-through card over it, official ones first.",
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
      "Log set and +30 s from your wrist, with a buzz when rest ends. Machine taken? One tap swaps in the best lift for your gym, with its weight.",
      "Change the weight and reps with the crown or − and +, and say how an exercise felt.",
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
      "Deleted one by mistake? Undo brings it back, and every stat follows.",
    ],
    dyk: "Every exercise has its own page with its full history.",
  },
  "dyk-yours": {
    title: "Did you know? Make it read your way",
    intro: "Little things that make the app feel like yours.",
    points: [
      "Pick a language other than your phone's: there are ten.",
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
      "Pro: charts from a week to all time (tap any session for its number, with new bests marked), weekly sets per muscle against the target, and one-rep max trends.",
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
      "Wrist bar speed: no camera? Your watch measures each rep's speed, buzzes when it's time to stop and feeds today's max.",
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
      "A number on the app icon for messages, likes and follow requests waiting.",
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
      "Hands-free watch sets: start your next set and the watch ends rest, counts and logs it by itself.",
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
      "Ten languages, separate from your phone's if you like.",
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
      "Can't find a setting? Type a word into the search box at the top of Settings and it takes you straight there.",
    ],
    dyk: "On the phone apps, Settings › Version can check for updates and install one when it's ready.",
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
      "Settings › Help shows your version, and What's new beside it lists what's new, better and fixed.",
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
  "coach-reviews": {
    title: "Reviews from your clients",
    intro: "Clients who've trained with you can now rate you, and new clients can see it.",
    points: [
      "A client can leave stars and a short review after four weeks or two sessions with you.",
      "Your rating shows on your invite and in the trainer directory once you have three reviews.",
      "Next to it: how many of your clients trained in the last two weeks.",
      "Reply once to each review from Coaching › Setup, and report one that breaks the rules.",
    ],
    dyk: "Only adults can leave reviews, and one unhappy client can't sink a new coach: nothing shows until three reviews.",
  },
  widgets: {
    title: "Two new home-screen widgets",
    intro: "Beside the Today widget, two more answer a question at a glance: am I on track this week, and what's ready to train?",
    points: [
      "This week: the days you trained, the ones planned, your streak and how many more days keep it going.",
      "Recovery: which body areas are ready to train, and when the rest will be.",
      "Recovery updates itself as muscles recover, even with the app closed, without draining the battery.",
      "Each has Start, so today's workout is one tap away.",
    ],
    dyk: "Tap the Recovery widget to open the recovery map in the app.",
  },
  "coach-programs": {
    title: "Share and sell your programs",
    intro: "Turn the programs you hand out again and again into something anyone can follow, free or for a price.",
    points: [
      "Under Coaching › Programs, put your routines on the days of a week with rest days in between (Auto-arrange can do it for you), check it on the month, then add a name, a level, a goal and how many weeks.",
      "Leave the price empty for a free program, or set one once payments with Stripe are on. Paid programs are bought on the website, and the money goes to your Stripe account.",
      "Share its link anywhere. People who have it keep it, even after you take it off the list.",
      "Each listed program gets its own page on the website, and lifters who've had it two weeks can rate it.",
      "Run it in phases: Build weeks, a Deload week with fewer, lighter sets (one tap to add), and a Peak, and set reps for an exercise (say 8 to 12) or leave them on Auto.",
    ],
    dyk: "There are no weights in a program: each lifter's own progression picks them, so one program fits beginners and veterans alike. Turn on Run the days in order and each lifter gets the next day whenever they train.",
  },
  "screenshot-share": {
    title: "Take a screenshot, get a card worth sharing",
    intro: "Screenshot Liftsmith and a sheet of training cards slides up, ready to share with your invite link on them.",
    points: [
      "Pick your last month, three months, six months, year or all time.",
      "Swipe through totals, where your sets went and your best lifts.",
      "Tap the eye to hide every weight.",
      "Not today? Swipe it away, or turn it off in Settings › Your data and privacy.",
      "No screenshot needed: Share my training on Progress opens the same cards.",
    ],
    dyk: "Every link you share, from routines to gyms, now carries your invite, in a link that says invite.",
  },
  "form-cues": {
    title: "Common mistakes, and the fix",
    intro: "Every exercise and stretch now lists its two or three most common form mistakes, right beside the 3D figure.",
    points: [
      "Each one says what it looks like, what to do instead and why it matters.",
      "Find them in How to during a workout, on each exercise's page and on every stretch.",
      "Between sets, the rest timer shows one to watch on your next set, a different one each set.",
      "They're part of the app, so they work with no signal, in every language.",
    ],
    dyk: "Rather not see them on the rest timer? Turn off Form checks while resting in Settings › Workout.",
  },
  "auto-supersets": {
    title: "Supersets, built for you",
    intro: "Your adaptive workouts can now pair exercises into supersets for you, with one switch.",
    points: [
      "Turn on Pair exercises into supersets in Settings › Training › Adaptive workouts.",
      "Exercises that don't share muscles go back to back, like a press and a row, so each rests while you do the other.",
      "The rest after each round is shorter, and the time saved fits more training into the length you pick.",
      "Heavy squats and deadlifts stay on their own, and you can split any pair on Today.",
    ],
    dyk: "The same section has a Warm-up sets switch, for days you'd rather warm up your own way.",
  },
  "club-chat": {
    title: "Your club, between workouts",
    intro: "Clubs now have a chat and crew sessions, so the people you train with can talk and meet up.",
    points: [
      "Open Friends › Clubs, pick a club and tap Chat to message everyone in it.",
      "Plan a crew session with a name, a day and a time, and members tap I'm in.",
      "Everyone who's in gets a reminder an hour before.",
      "Post your workout afterwards and you show as trained, with the friends you trained with tagged.",
    ],
    dyk: "Notify me in each club's chat turns its pushes off, and a chat sends at most one an hour.",
  },
  community: {
    title: "Vote for what we build next",
    intro: "Liftsmith has a community now: suggest ideas, vote for the ones you want and report bugs.",
    points: [
      "Open Settings › Help › Community.",
      "Tap the arrow beside an idea to vote for it. The most wanted rise to the top.",
      "Report a bug with a screenshot that only you and the team see.",
      "Each post shows where it is, from Under review to Shipped, and you hear when an idea you voted for ships.",
    ],
    dyk: "The roadmap and changelog are on the website too, at getliftsmith.com/community.",
  },
  "coach-checkin-trends": {
    title: "Check-ins with weight, photos and trends",
    intro: "Your check-in forms can now ask for body weight and photos, and show how each answer is moving.",
    points: [
      "Add a Body weight question: it fills in from the client's last weigh-in and saves the new one to their log.",
      "Add up to three Photo questions, like front and side. Only you see them.",
      "Send a form every week, every 2 weeks or every 4 weeks.",
      "Each client's report shows the trend of every score, number and weight, and says when a score drops.",
    ],
    dyk: "Start from the new Progress check-in template in Coaching › Check-ins. Clients under 18 are never asked for photos.",
  },
  "coach-form-videos": {
    title: "Form videos with notes in the video",
    intro: "Clients can now film a set in the app and send it to you, and you answer right on the video.",
    points: [
      "They tap Send a form video in Coaching, pick the lift and say what to check. The app gives them five seconds to get into place and records up to a minute.",
      "You get a notification. Slow the clip to half or quarter speed, pause where it matters and add a note pinned to that second.",
      "They tap a note to jump to that moment, and can answer with a note of their own.",
      "Videos stay private to the two of you and go when either of you ends coaching.",
    ],
    dyk: "Clients under 18 can't send form videos. Sending one is free for clients.",
  },
  seasons: {
    title: "Training seasons start Monday",
    intro: "Season 1, Ember, starts on Monday: ten weeks, a track of 20 tiers, and rewards you can only earn this winter.",
    points: [
      "You climb by meeting your own weekly goal. Days past it earn nothing, so two days a week climbs as fast as five.",
      "Tiers bring season-only badges, an avatar, an accent and the Ember theme with its app icon, yours to keep.",
      "Miss a week and the next goal week pays its bonus twice. The last week counts double.",
      "Every new best has a 1 in 6 chance to drop the season's rare plates.",
      "After Ember come Tempest, Bloom, Solstice, Maple and Obsidian, back to back through 2027, each with its own look and challenges.",
    ],
    dyk: "Rather not see seasons? Turn off Training seasons in Settings › Look and feel. Your training still counts.",
  },
  "gym-classes": {
    title: "Put your class schedule on your gym's page",
    intro: "Members can see this week's classes on your gym's page, in the app and on the website.",
    points: [
      "Add each class once: its type, days, start time and length. Most need no typing at all.",
      "Add the instructor, the room and a short note, like how to book.",
      "Off for a holiday? Tap the date and the class shows as not running that day.",
      "Members add the next class to their calendar in one tap.",
    ],
    dyk: "Times are your gym's own clock, so members see 6 PM as 6 PM. Bookings stay with you.",
  },
  "physio-protocols": {
    title: "Rehab in phases, moved by pain",
    intro: "Each rehab program now has three phases, from calming the area to full use, and a plain pain rule that says when to move.",
    points: [
      "Pick the phase to start in when you assign: Calm and move, Build strength or Back to full use.",
      "After six sessions with pain 2 or less after the last three, and no flare the next day, the client's report says ready for the next phase.",
      "Pain 5 or more after two of the last three, or a flare the next day, says go back a phase.",
      "Send the next phase in one tap. It replaces the old one on their phone, so their history carries on.",
      "Clients rate how the area feels the day after rehab, which is often what tells you the most.",
    ],
    dyk: "Turn on Let them move phases on their own and their app offers the next phase when the rule says so. You still see every move.",
  },
  "gym-open-now": {
    title: "Find a gym that's open right now",
    intro: "Find gyms near you now says which gyms are open, and when they close or open next.",
    points: [
      "Open now shows the closing time, and Closes soon turns amber in the last hour.",
      "Closed gyms say when they open: later today, tomorrow or which day.",
      "Tap Open now above the list to hide the closed ones, on the map too.",
      "It's worked out on your own clock, for gyms near you.",
    ],
    dyk: "A gym's hours wrong? Report a problem on its page, or claim it and set them yourself.",
  },
  "outside-workouts": {
    title: "Your runs and matches now count in your recovery",
    intro:
      "Turn on Count workouts from other apps, and the workouts in your phone's health app shape your recovery map and tomorrow's plan.",
    points: [
      "Runs, rides, sports and classes come in each time you open the app.",
      "Each one tires the muscles it uses, more the longer it ran.",
      "Tomorrow's plan works around tired legs after a long run or match.",
      "They never count as Liftsmith workouts, and nothing counts twice.",
    ],
    dyk: "It's in Settings › Connected apps, and the list under the recovery map on Body shows what's being counted.",
  },
  "routine-library": {
    title: "Find a routine another lifter made",
    intro: "The new routine library has routines other lifters published, ready to save in a tap.",
    points: [
      "Search by words, pick a goal, or turn on Fits my gym to see only routines your gym has everything for.",
      "Save one and it lands in your routines, ready to start or change.",
      "Rate it with stars once you've saved it. Stars show from three ratings.",
      "Publish your own from its editor, with or without your name. Only exercises and sets go out, never weights or notes.",
    ],
    dyk: "Every published routine gets its own page on the website, so you can share it with anyone.",
  },
  "team-session": {
    title: "Run the whole team's lift from one tablet",
    intro: "Team sessions put one workout for your whole team on one tablet.",
    points: [
      "Start one from your team's card in Coaching and pick a routine.",
      "Athletes tap their first name and log their own sets, the weight starting where they left off.",
      "The board shows who hasn't logged a set yet, never a weight.",
      "End it and each athlete's sets are saved to their own account.",
    ],
    dyk: "No reception in the weight room? Sets wait on the tablet and go up when it's back.",
  },
  "gym-chains": {
    title: "Every location of your gym chain",
    intro: "Gyms that belong to a chain now show its logo and a link to every one of its locations.",
    points: [
      "On a chain gym's page, tap See all locations under its name.",
      "The list starts with the branches nearest where you last looked for gyms.",
      "Tap a branch to see its hours and add it with its equipment in one tap.",
      "On the website, each chain has its own page listing every branch.",
    ],
    dyk: "Train at two branches? Add both as gyms and Liftsmith plans each workout for the equipment where you are.",
  },
  pregnancy: {
    title: "Training through pregnancy and after birth",
    intro: "Pregnancy and postpartum mode changes every workout with the week, the way injury mode does.",
    points: [
      "Set it up in Settings › Body and units: pick pregnant or had my baby, then the weeks on a stepper.",
      "Loads come down as the weeks go by, and every set stops well short of failure.",
      "Later in pregnancy, nothing lying on your back or belly, no jumps and no crunches.",
      "After birth, a gradual return over about 16 weeks, two weeks longer after a C-section.",
    ],
    dyk: "It's free, it stays on your phone, and every change says why on Today.",
  },
  "gym-insights": {
    title: "See how members use your gym",
    intro: "Your gym's page in the app now shows how lifters train there, with one thing to do next.",
    points: [
      "How many lifters trained there in the last four weeks, and how that compares with the four weeks before.",
      "The busy hours, with the busiest day and time, and your quietest weekday hour to tell members about.",
      "The equipment members use most, and any in your setup nobody has touched.",
      "Open equipment problem reports come first, because lifters' plans skip that equipment until you tap Fixed.",
    ],
    dyk: "It's totals only, from lifters who count their gym visits, and it starts once five lifters have trained there. You never see who.",
  },
  "rehab-self": {
    title: "A gentle routine when something hurts",
    intro:
      "Logged an injury and you don't have a physio? A short bodyweight routine is there when you're ready, on Injuries and in a coach's note.",
    points: [
      "It shows for an injury you've already logged, once nothing else covers that area.",
      "Open it from Injuries, or from the note on Today, and add it in one tap.",
      "It's bodyweight, short enough to do at home, and it can sit beside your lifting.",
      "It never says what's wrong or what will fix it. It's a starting point, not a treatment.",
    ],
    dyk: "A program from a physio for the same area replaces it, so you aren't asked twice.",
  },
  "rehab-shape": {
    title: "Set the reps, the seconds and a cue",
    intro: "A rehab routine can now carry exactly what you want each exercise to be: the reps or the seconds, and a short cue.",
    points: [
      "In the routine builder, step the reps or the seconds on each exercise. Leave it empty and the app picks the reps.",
      "Holds start in seconds, so a timed exercise stays in time, not in reps.",
      "Add a short cue under the exercise, the one thing you want them to remember.",
      "Clients follow it as written. An older phone still opens the routine and simply leaves the cue out.",
    ],
    dyk: "The pain checks, the times a week and the three phases work the same as before.",
  },
  "campus-clubs": {
    title: "Pro for a club that keeps training",
    intro: "Run a club where people actually train, and Pro is free for you while they keep it up.",
    points: [
      "Five or more members, you included, each finish a workout in the last 14 days.",
      "One club has to reach it. Two quieter clubs don't add together.",
      "A club you only joined doesn't count. You have to be the one who started it.",
      "It stays on while the club keeps training, and it stops when that fortnight goes quiet.",
    ],
    dyk: "The club says so on its page, and the Pro screen says it comes with your account.",
  },
  "voice-amy": {
    title: "Amy speaks your sets",
    intro: "The voice coach can now use Amy, a clear English voice built into the app, or keep your phone's text-to-speech.",
    points: [
      "Turn on Voice coach in Settings › Workout, then pick Phone voice or Amy.",
      "Amy is Pro and English only. She stays offline once the app is installed.",
      "If Amy can't load, cues fall back to your phone's voice automatically.",
      "Phone voice can pick among the voices your device lists, in every app language.",
    ],
    dyk: "The free voice coach and lock-screen rest cues still use system speech when you need them.",
  },
  "coach-assign-program": {
    title: "Assign a season program to the whole roster",
    intro:
      "Put Upper/Lower or Push/Pull/Legs on your clients or school team for N weeks — athletes follow once, Today runs the right day, and a calendar shows who has lifted.",
    points: [
      "In Coaching › Programs, start from Upper/Lower or Push/Pull/Legs, set the weekdays, then Assign to… clients or a team.",
      "Athletes get a push and Follow this program once on Today. Their own progression picks the weights.",
      "On a scheduled weekday, Today shows that day's workout. Off days stay rest — no lift scheduled.",
      "Open the program calendar to see Done and Not yet for each day. School teams show first names only, never weights.",
      "Assign workouts or rest days on a month calendar. Athletes see the scheduled day on Today.",
    ],
    dyk: "You can assign the same way from a school team card or a single client's report. You can also change a day for one client from their report, and program edits still reach every other day.",
  },
  "my-team": {
    title: "Your athletes get a My team dashboard",
    intro:
      "Athletes on your school team now open My team: their team, you as their coach, the programs you assigned, team chat and a chat with you, all on one screen.",
    points: [
      "Add athletes who already coach with you straight from your team card. They get an invite and join with one tap.",
      "Athletes no longer see Programs, Athletes or Setup. My team shows them only what they need.",
      "Team chat is for the whole team and you. You can delete any message, and athletes show by first name.",
      "Assigned programs sit on My team with Follow, and the week board shows who has trained.",
      "Athletes following a program see it on Today with what's up next, and their month sits on My team.",
    ],
    dyk: "Team links now work when an athlete signs in after opening them, so nobody is left off the roster.",
  },
  "watch-today": {
    title: "Today's workout on your watch face",
    intro: "Your watch now shows what's waiting today without opening anything: the workout, how long it takes and how ready you are.",
    points: [
      "On Wear OS, add the Today's workout tile or a complication. Start on phone opens the workout on your phone.",
      "On Apple Watch, add the Liftsmith complication. A tap opens the watch app with today's call.",
      "On Garmin, the Liftsmith glance shows the same line once you've opened the app on the watch.",
      "It's the same call and reason as Today on your phone, and it updates when your plan changes.",
    ],
    dyk: "A plan from yesterday never shows as today's: after midnight the watch waits for your phone's new plan.",
  },
  "watch-alone": {
    title: "Leave your phone in the locker",
    intro: "Today's plan now rides along on your watch, so you can lift with just your wrist and save it all later.",
    points: [
      "When no workout runs on your phone, your watch shows today's workout with Start on watch (START on Garmin).",
      "Log set, +30 s, the rest buzz and changing the weight and reps all work on the wrist, with heart rate from the watch.",
      "Finish when you're done. The watch keeps the workout until your phone is near again, app open or not.",
      "Your phone then saves it as if you'd logged it there: every set, your bests, the next weights and Health.",
    ],
    dyk: "Planning stays on the phone, so Machine taken and Change the plan wait until your phone is back.",
  },
  "gym-widgets": {
    title: "Put your gym on your own website",
    intro:
      "Your gym's class schedule, equipment and a Find us on Liftsmith badge can now sit on your own website, kept up to date for you.",
    points: [
      "Open your gym in the app, tap Manage this gym’s page and find Widgets for your website.",
      "Pick the class schedule, the equipment or the badge, a light or dark look and one of ten languages, and see it as it'll show.",
      "Copy the code and paste it into an HTML or embed block on your site. Squarespace, Wix and WordPress all have one.",
      "Change a class or your equipment in the app and the widget on your site changes too.",
    ],
    dyk: "The widgets carry no scripts, cookies or tracking, and each one links to your gym's page so new members can add your gym in one tap.",
  },
  "share-stats": {
    title: "Share the numbers you're proudest of",
    intro: "Every estimated max, heaviest set and personal best now has a small share button beside it.",
    points: [
      "Find it beside your maxes and new bests on Progress, and on each exercise's page.",
      "On an exercise's page, every row of the bests table has one too, from your heaviest set to your best for 15 reps.",
      "One tap makes a card of that number with the Liftsmith logo and the website, in the app's look.",
      "Post it, send it or save it. The eye hides the weights, and your name stays off unless you add it.",
    ],
    dyk: "Your invite link can ride along on the card, so a friend who joins with it follows you back.",
  },
  "workout-generator": {
    title: "Send a friend a workout, even without the app",
    intro: "Our website now has a free workout generator that runs the same engine as your Today screen.",
    points: [
      "At getliftsmith.com/tools/workout-generator, pick equipment, minutes and what to train: full body, a split or one area.",
      "It writes sets, reps, rest and warm-ups, and says why each exercise is there.",
      "Every workout has its own link. Share it with a friend, and the same link always gives the same workout.",
      "Start this in the app opens it as a routine, ready to save or start, with your own weights filled in as you lift.",
    ],
    dyk: "Today does this for you every day, and it also knows what you lifted last time and which muscles are still recovering.",
  },
  "thirty-day": {
    title: "One move a day for 30 days",
    intro: "Twelve 30-day challenges are here, from squats and push-ups to planks and pull-ups, each at three levels.",
    points: [
      "Pick one in Tools › 30-day challenges and choose Beginner, Intermediate or Advanced.",
      "Today shows the day's number with a one-tap Done. Did more or less? Change it with − and + first.",
      "Every fourth day is a rest day, and a missed day just waits for you: no starting over.",
      "Each challenge has a page on our website with a calendar to print for the fridge.",
    ],
    dyk: "Challenge days aren't workouts, so they never change your plan, your streak or your weekly goal.",
  },
  "printable-plans": {
    title: "Print a workout on one page",
    intro: "Any program or routine now prints on one page, with boxes to fill in and a QR code back to the app.",
    points: [
      "Open one of your routines and tap Print routine. The sheet has each exercise with its sets, reps and rest, and the weight planned for you next.",
      "Write what you lift in the four session columns, one per workout.",
      "Every program page on the website has a free PDF to download, in ten languages.",
      "The QR code on your sheet adds the same routine for whoever scans it. Your weights and notes stay with you.",
    ],
    dyk: "On a phone, the print window can also save the sheet as a PDF, handy for sending to a friend.",
  },
};
