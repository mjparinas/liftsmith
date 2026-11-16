# Weekly tips emails (Melvin, 2026-11-15; built)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin, 2026-11-15: "plan out a series of emails that we can send out on a weekly basis, that doesn't already duplicate the 8 days of getting started emails … should have enough content for 1 year … all emails should be relevant and full of content", then "there should be maybe a series of 'did you know' … features that users may not know about" and "if you find that we have more than enough content, add more to that list of 52".

**Status: built** (Melvin approved the content on 2026-11-15: "execute"). The code is `src/server/weekly/`: `list.ts` is the send order and each email's tier, audience and screen; `text/<lang>.ts` holds the words in all six languages under the same ids; `send.ts` picks the next one and writes it; `reminders.ts` `schedule()` sends it from the daily job. The words that go out are the ones in `text/`; the list below is the approved plan they were written from, kept for the reasons behind each email.

**Keep it current** (rule in AGENTS.md, Email): when a brand-new feature a lifter would notice ships, append an email for it to the end of `WEEKLY` in `list.ts` with `fresh` set to the day it shipped, add its words to every `text/<lang>.ts`, take its screenshot (`ONLY=<id> node scripts/weekly-email-shots.mjs`), and add a short entry at the end of [The list](#the-list) below marked **New**. Or add a point to an existing email when it only extends one. `weekly.test.ts` fails when a language lacks an email, a line or a screenshot. New ones are sent before the rest of the queue (see "New features go first").

## Is there a year of it?

Yes, with room to spare. Without padding there are **59 emails every adult lifter can get** (52 feature emails and 7 "Did you know" round-ups), more than a year at one a week. On top of that there are **10 for people in a role** (coaches and trainers, physios, school coaches, gym owners and staff), sent only to them. That's 69 in all, and the list grows with every new feature.

Where content was thin it was merged rather than stretched: cycle-aware readiness sits in the readiness email, the smart scale lab in the weigh-ins email, Oura in the sleep and HRV part of readiness, and the 3D figure "shaped like me" with the recovery map and battery saver. Nothing here is a single switch dressed up as an email; single switches go in the "Did you know" round-ups (4 to 6 tips each) and in the "Did you know?" line at the foot of every email.

## How the series works

- **Name and switch:** "Weekly tips" (`weekly` in `messages.ts`), its own switch in Settings › Reminders › Email, **on by default** like Getting started tips, and covered by Email me (`messages.emailOff`) and the one-click unsubscribe like every email. Turning it off (or the account turning out to be under 18) cancels one already scheduled.
- **When it starts:** a week after the eighth Getting started email. With Getting started switched off, 15 days after the subscription began, as if it had run (`weeklyStart`). Nothing while Getting started is still going.
- **When each goes out:** 10:00 in the lifter's time zone, on **Tuesday** (Monday has the week email, Thursday the friends email, Sunday the recap). If Tuesday already has an email it moves to the next free weekday, up to Saturday. **One per calendar week** (Monday to Sunday), never on a day that already has an email, never in a week that already had three other emails in the seven days before it, and **none in a week with a trial-ending email**. Like the tour, it steps aside for any email planned later on its day (it's cancelled and goes on another day under the same key) and doesn't count toward the caps itself (`filler` in `reminders.ts`).
- **Never to under-18s,** like the tour and Pro offers: the series is promotional (it sells features and Pro). Teens still get every account and lifecycle email they get today.
- **Order and progress:** each subscription gets the first email in `WEEKLY` it hasn't had and that's meant for it. A lifter who joins in March starts at the top, not at whatever the calendar says. The kicker counts that person's own weekly tips ("Weekly tip · 12").
- **New features go first:** an email with `fresh` set goes before the rest of the queue (oldest first), so everyone already in the series gets it as their next one. Someone who joins later gets it first too, which is fine: it's the newest thing.
- **Who gets what** (`forAccount`, roles from `weeklyFacts` in `remindersDb.ts`): *Lifters*, everyone. *Coaches and trainers*: a coach account or anyone with a linked client (`coach_accounts`, `coach_links`), physios included. *Physios*: `coach_prefs.kind = 'physio'`. *School coaches*: an approved `school_coaches` row; they get the school email instead of the paid coaching ones. *Gym owners and staff*: an approved gym claim or a `gym_staff` row. Role emails sit in the list where they should land (C1 third, a gym email sixth, and so on), so they take the person's next weekly slot and their lifter emails move back a week. "Train with a coach, free" isn't sent to coaches, physios or school coaches. The coach plans email waits until the `coachPlans` flag is on. Accounts with no data for roles (no account linked) get the lifter emails only.
- **Pro and free:** each email is Free, Pro, Free + Pro (`both`) or Labs. Pro, Free + Pro and Labs emails end with a line for this reader, from the Pro state the phone already sends: a free lifter gets "This is part of Pro: $6.99 a month or $39.99 a year, with no ads, ever.", a Pro lifter "This is part of your Pro." and someone in a trial "This is part of the Pro trial you're on." Labs emails add that Labs are experiments. The coach plans email has no such line (it has its own prices). Free emails have none. Until billing is live the phones report everyone as Pro, so nobody sees a price. The button always goes to the email's own screen ("See what Pro adds" on the Pro email for anyone without Pro), because Pro features are never hidden and their Pro tag opens the paywall.
- **Look:** the branded template of Getting started (`brandedMail`), with a kicker, the title, one opening line, **three to five points** as a list, the Pro or Labs line, a **"Did you know?"** line with one lesser-known setting, the button, then the real screen in the reader's language. Six languages, Canadian English.
- **Screenshots:** `scripts/weekly-email-shots.mjs` trains a demo lifter for two and a half weeks in the static build (like the Play capture), then opens each email's screen in each language and saves `public/email/<lang>/w/<id>.jpg`, 600 px wide. Screens several emails share scroll to the part each one is about (`SCROLL` in the script). The weekly test fails when a picture is missing. Emails about screens that need a signed-in account (coaching, physio, school teams, Friends, invites), the gym owners' emails and the public gym pages email (the website's page, not the app) and the coach plans email go without a picture (`shot: false` in `list.ts`), because the demo lifter has no account and a sign-in screen says nothing about the feature; the desktop email is taken at desktop size, 900 px wide, and the gym finder email taps Add gym first to show its finder (`TAP` in the script).
- **Words:** no other app is ever named (the import email says "most popular lifting apps"; the test checks every language against the comparison pages' list of names), and programs keep our own names (the four-week training-max program is "Training max waves", never its trademarked name). No promises the app doesn't keep.
- **Not data-driven:** the server has no yearly totals, so W51 (the anniversary) explains the anniversary card rather than quoting numbers, and W52 is about how to keep up with what's new rather than listing it. Nothing new is sent to the server for this series.

## The list

Each entry: week, title, tier, audience, the screenshot, a two-line summary, the points, and the "Did you know?" line.

### W1 · Set up your gym the way it really is
Free · Lifters · Screen: Settings › Gyms and equipment, a gym's plates and dumbbells cards
Every weight the plan picks is one you can load, but only if the app knows your gear. Five minutes here makes every workout fit your gym exactly.
- Bars, plates, dumbbells and kettlebells as they really are, including fixed-weight dumbbells and odd plates.
- Machines and their settings, so seat heights and pins are remembered.
- More than one gym? Set up each one, and on the phones the app picks the right gym when you arrive.
- Share a gym's setup as a link, so a training partner starts with the same gear.
Did you know? Smart plate memory (Settings › Workout) shows only the plates to add or take off between sets.

### W2 · Bring your whole training history with you
Free · Lifters · Screen: Settings › Your data › Import, with an import finished
Years of lifting in another app don't have to stay there. Your history, routines and body stats come across from an export file.
- Works with the export file from most popular lifting apps, cardio included.
- Workouts you repeated by name become routines you can start today.
- Body weight, body fat and tape measurements come across too.
- Your bests, estimated maxes and the plan's starting weights use the imported history straight away.
Did you know? Settings › Your data can export every working set as a spreadsheet whenever you like.

### W3 · Teach the plan what you like
Free · Lifters · Screen: an exercise's sheet with the star and Swap
The adaptive plan learns from you. Star what you love, swap what you don't, and it adjusts which exercises it picks.
- A star makes an exercise come up far more often when it suits the day.
- A swap lowers how often that exercise is picked, fading over a few months.
- "Not available here" keeps it out at this gym only, without counting against it.
- Settings › Workout › Plan details › Picked less often lets you bring one back.
Did you know? Your favourites list is in the same place, with a button to add one by muscle.

### W4 · Today's call: push, as planned or go easy
Free + Pro · Lifters · Screen: Today, the call card with its reason
Some days you're ready for more. Today's call reads your recovery and recent sets and says how hard to go, and why.
- Built from recovery, missed reps and how hard your last sets felt; tap to override it any time.
- Tell it you're sore, tired or unwell and the workout eases off.
- Optional cycle logging lets the call take your cycle into account.
- Pro: sleep, HRV, resting heart rate and breathing rate from your phone's health app or Oura move the call up or down.
Did you know? The effort scale can be RIR or RPE (Settings › Workout › Plan details). The plan works the same either way.

### W5 · Short on time? The workout fits
Free + Pro · Lifters · Screen: Today, the length slider with the split bar
Thirty minutes still counts. Drag the length and the plan keeps what matters most.
- The slider sets the whole workout; warm-up, cardio and cool-down take their minutes out of the lifting.
- "Short on time" mid-workout trims what's left without losing the main lifts.
- Your calendar can shorten a workout to fit before your next meeting.
- Pro: bench or rack taken? The plan works around it on the spot.
Did you know? The default workout length can be "Last used", so the slider stays where you left it.

### W6 · How adaptive workouts work
Free + Pro · Lifters · Screen: Today, an adaptive workout with reasons on each exercise
No two days are the same, and they shouldn't be. Here's what goes into each workout the app builds.
- Equipment first, then injuries, recovery and what's left of your weekly sets per muscle.
- Weights and reps come from your last workouts, rounded to what you can load.
- Exercise variety (Settings › Training) sets how often exercises change.
- Free gets one adaptive workout a week beside your program; Pro plans every day.
Did you know? Muscle priorities (Plan details) give a muscle more weekly sets until you turn it off.

### W7 · Lifting is better with friends
Free · Lifters · Screen: Friends, the feed with likes and comments
Follow the people you train with and see their workouts as they happen.
- Likes, comments, replies and @mentions on every workout.
- Choose who sees each workout: everyone who follows you, or just you.
- Find friends by name or handle, or send your invite link.
- Optional: you never have to post anything.
Did you know? A friend's workout can be copied as a remix link and done yourself.

### W8 · The classic programs, built in
Free · Lifters · Screen: Programs, the list with Classic 5×5 open
Prefer a proven program to an adaptive one? The classics are free, and they fit your gym.
- Classic 5×5, novice 3×5, 5×5 plus arms and ramping 5×5.
- Weights go up by themselves when you hit your reps, and back off when you stall.
- Plates, warm-ups and the rest timer work exactly as in adaptive workouts.
- Switch program any time in Settings › Training; your history stays.
Did you know? If your gym lacks something a program needs, the app puts in a stand-in and says what it replaced.

### W9 · Warm up and cool down without thinking about it
Free · Lifters · Screen: the workout with warm-up sets shown, or the stretch part
Warming up well means heavier, safer working sets. The app plans it for you.
- Ramp-up sets worked out for each heavy lift.
- 48 stretches with 3D demos: a warm-up before, a cool-down after, or a stretch routine any day.
- A workout can run warm-up, lifting and cool-down in order, with Skip between them.
- Stretch days of 10 minutes or more keep your streak.
Did you know? Tools › Warm-up gives the warm-up sets for any weight, for lifts outside the app's plan.

### W10 · Your phone's health app, connected
Free · Lifters · Screen: Body › Health with readings from Health Connect or Apple Health
Health Connect on Android and Apple Health on iPhone link Liftsmith to the rest of your fitness, both ways.
- Weigh-ins and body fat from any scale that writes to your health app come in by themselves.
- Sleep, HRV, resting heart rate, steps and VO₂ max show on Body › Health.
- Every finished workout is saved back as a strength workout with calories and heart rate.
- Free, and it can be switched off at any time from the phone's own settings.
Did you know? On iPhone, sex, age and height can come from Apple Health, so you never type them.

### W11 · 1,000 exercises, each with a 3D demo
Free · Lifters · Screen: the exercise library with muscle chips, and a How to sheet
Not sure how to do it? Every exercise shows you.
- A 3D figure doing the movement with its own gear, with setup steps and cues.
- Search, muscle chips and a "this gym" filter.
- One-side exercises say so, and dumbbell weights are per hand.
- Strength, bodyweight, machines, bands, kettlebells and cardio.
Did you know? Five quick taps on any 3D figure starts something fun.

### W12 · Calculators for lifters
Free · Lifters · Screen: Tools, with the one-rep max calculator open
The maths of lifting, done for you, and filled in from what the app already knows.
- One-rep max from any set, and the weights for other rep counts.
- Plate calculator for your gym's own plates, with the nearest loads when it can't be exact.
- Warm-up calculator for any working weight.
- Strength level: how your lifts compare for your weight and age.
Did you know? Tools is under Progress and in Settings; both go to the same place.

### W13 · Training blocks and deloads
Pro · Lifters · Screen: Today with the block week shown, and the deload glossary
Progress comes in waves. Blocks plan the hard weeks and the lighter one that lets you keep going.
- Four-week blocks with a reps-in-reserve target that rises week by week.
- A lighter deload week before you burn out.
- When fatigue builds, a coach's note offers a deload in one tap.
- Change the number of build weeks, or start a new block today.
Did you know? "Start a new block today" is in Settings › Training › Training block.

### W14 · Training now, cheers and check-ins
Free · Lifters · Screen: Friends showing who's training now with a cheer
A little push from a friend goes a long way.
- See who's training right now.
- Send a cheer; it floats up their workout screen.
- Check in at the gym with one tap on Today, so the friends you pick know you're there.
- Notifications are yours to switch on and off.
Did you know? Ghost mode (Settings › Workout) lets you race your last session of each exercise.

### W15 · Train around an injury
Free · Lifters · Screen: Injuries, with a sore spot and its pain trend
Something hurts? Keep training without making it worse.
- Tell it what hurts and the plan leaves out what would aggravate it.
- Risky lifts get a warning before you start them.
- A 0 to 10 pain rating, tracked over time, so you can see it easing.
- Working with a physio? Their rehab can run beside your lifting.
Did you know? A sore spot can be marked healed, and the plan brings those exercises back gradually.

### W16 · Weigh-ins, body fat, tape and photos
Free + Labs · Lifters · Screen: Body and photos with the weigh-in and body fat boxes
Your body changes, not just your lifts. Track it with a few taps.
- Weight and body fat with − and + (no typing), or straight from your scale through your phone's health app.
- Nine tape measurement sites in centimetres or inches.
- Progress photos stay on your phone and never sync.
- Labs (Pro): a Bluetooth smart scale fills in the weigh-in for you to check.
Did you know? A shrinking or growing waist becomes a coach's note when you don't log body fat.

### W17 · Find a gym near you
Free · Lifters · Screen: the gym finder map with the list beneath
Travelling, moving or shopping for a gym? The finder shows what's near.
- Gyms on a map, official ones first, each with its own page.
- Equipment, hours, map and how many lifters train there.
- Add a gym that's missing.
- Add one to your gyms and the plan fits its equipment.
Did you know? Your home gym can show on your Friends profile.

### W18 · Heart rate on every set
Free · Lifters · Screen: the workout with live heart rate, and the rest screen
See how hard you're working and how well you're recovering between sets.
- Any Bluetooth heart rate strap, or your watch.
- Heart rate on the workout, the rest timer and the lock screen.
- Saved with the workout to your phone's health app.
- Tools › Heart rate zones works out your zones.
Did you know? Labs (Pro) has a rest timer that ends rest early once your heart rate is back down.

### W19 · The plateau detective
Pro · Lifters · Screen: a plateau detective coach's note with its fix
A lift that won't move has a reason. The plateau detective finds it.
- Gives the likely cause from your own sets.
- A one-tap three-week fix.
- Says the fix is running, then whether it worked.
- Several lifts stalling at once? That's fatigue, so it offers a deload instead.
Did you know? A coach's note you've read can be hidden with "Got it" until something changes.

### W20 · Build your own routines and share them
Free · Lifters · Screen: the routine builder
Got a routine you love? Build it once, share it with anyone.
- Build from the exercise browser, with no limit on routines.
- Share as a link; anyone can open it, in the app or on the web.
- Routines can carry their own warm-up and cool-down.
- Weights still come from your own history.
Did you know? On a computer, the routine builder opens wide, with rows you can drag.

### W21 · Your workout on your wrist
Free · Lifters · Screen: Play listing watch shot (Wear OS), or the rest countdown on a watch
Leave the phone in your bag. The watch runs the workout.
- Wear OS and Apple Watch apps: the set or the rest countdown.
- Heart rate from the watch's own sensor.
- Log set and +30 s from your wrist, and a buzz when rest ends.
- A Garmin watch app is coming soon.
Did you know? A gentle buzz 10 seconds before rest ends can be switched on or off in Settings › Workout.

### W22 · Challenges, clubs and leaderboards
Free · Lifters · Screen: Friends › Challenges with a weekly board
Some friendly competition keeps you showing up.
- Challenge a friend to a week of workouts or sets.
- Join a club or a gym's crew with a weekly board.
- A monthly challenge with everyone.
- Leagues match you with lifters at your level, so it stays fair.
Did you know? Streaks count weeks, and streak freezes save a week you couldn't make.

### W23 · Labs: let the camera count your reps
Labs (Pro) · Lifters · Screen: camera rep counting with the skeleton drawn
Experiments that might become features. First up: counting reps without touching the phone.
- Prop your phone up and the camera counts your reps.
- Hands-free sets: the set logs itself a few seconds after your last rep.
- Nothing leaves your phone.
- Labs are experiments: switch them on in Settings › Labs and tell us how it went.
Did you know? Settings › Send feedback goes straight to the team, with what we need to fix a bug.

### W24 · Calculators for food and body
Free · Lifters · Screen: Tools › TDEE with the result
Eating for your goal starts with your numbers.
- TDEE: your daily calories from your weight, stats and real training days.
- Macros: protein, carbs and fat for your goal.
- Body fat and FFMI from measurements.
- Interval timer for conditioning work.
Did you know? Your activity level in TDEE comes from your actual training, not a guess.

### W25 · Coach's notes from your food app
Free · Lifters (phones) · Screen: Body, the Food card with the week against targets
No food logging in Liftsmith, and you don't need it: your food app already has the numbers.
- Calories, protein, carbs and fat reach us through your phone's health app.
- Notes like "protein short three days running", against targets for your goal.
- Two weeks of food and weigh-ins measure your real maintenance calories.
- Protein-only logging counts.
Did you know? The same targets drive Tools › Macros, so the numbers always agree.

### W26 · Halfway through the year: what Pro adds
Pro · Lifters · Screen: the Pro page
Pro is for lifters who want the app to coach them every day. Here's everything it adds, and what stays free.
- Daily adaptive plans and splits, blocks, the recovery map and advanced stats.
- Health signals moving the call, the plateau detective and the goal planner.
- Labs, cloud connections and coaching up to 3 clients.
- Free keeps the logger, every program, Health Connect and Apple Health, coach's notes and reasons. $6.99 a month or $39.99 a year, no ads, ever.
Did you know? Invite a friend and you both get a month of Pro once they've finished three workouts.

### W27 · Your history, fixed and reused
Free · Lifters · Screen: Progress › workout calendar and a workout's edit sheet
History isn't just a record. Fix it, add to it and do it again.
- A month calendar of past workouts, each day named.
- Edit a set, add a note or name a workout.
- Forgot your phone? Log a past workout and it counts.
- "Do it again" repeats any workout with today's weights.
Did you know? Every exercise has its own page with its full history, from the library or History.

### W28 · Cardio, inside the workout
Free + Labs · Lifters · Screen: a cardio part with the machine chosen
Lifting and cardio in one session, without juggling apps.
- Cardio can follow the lifting, with the machine and minutes picked by tap.
- Time and distance for cardio sets; a set timer for timed work.
- A cardio and stretching day: switch the lifting off.
- Labs (Pro): Bluetooth bikes, rowers and treadmills fill in time, distance and power.
Did you know? Holds, carries and hangs get a set timer that runs on the lock screen and your watch.

### W29 · More programs: waves, tiers and bodyweight skills
Free · Lifters · Screen: Programs with Training max waves open
Past the beginner programs, there's more built in.
- Training max waves: the classic four-week wave with a top set.
- Tiered progression: heavy, medium and light work for each lift.
- Bodyweight skills: ladders from first push-up to harder moves.
- Dumbbell full body for home gyms.
Did you know? A program's weights come from your history, so switching doesn't restart you from the bar.

### W30 · What gym pages tell you
Free · Lifters · Screen: a gym page with amenities, prices and announcements
Before you go, know what's there.
- Amenities: showers, parking, 24/7 access, a women's area and more.
- Day pass, week pass and membership prices.
- Announcements from the gym: holiday hours, new equipment.
- Report broken equipment and everyone's plan works around it until it's fixed.
Did you know? Members of an official gym's club get a notification when the gym posts news.

### W31 · Stats that tell you what to do
Free + Pro · Lifters · Screen: an exercise's stats page
Numbers only matter if they change what you do next.
- Every exercise: sets, total lifted, estimated max.
- How you compare with trained lifters of your weight, age and sex.
- Pro: charts from a week to a year, weekly sets per muscle against target, one-rep max trends.
- Strength standards built from real lifters on the website, only from those who opt in.
Did you know? "Count my lifts" in Settings › Your data decides whether your lifts help build those standards.

### W32 · Labs: the camera as a coach
Labs (Pro) · Lifters · Screen: bar path replay with the path drawn
Once camera rep counting is on, it can do more.
- Bar speed: how fast the bar moves, and when it's slowed enough to stop.
- Form check: squats above parallel, cut-short reps, leaning to one side.
- Bar path replay: a rep with the bar's path drawn and one cue.
- Today's max from warm-ups: a nudge to your first working weight.
Did you know? Labs that need another lab only show once that one is on.

### W33 · Your health twin and fitness age
Free · Lifters · Screen: Body › Health with fitness age and fitness tests
Strength is one part of fitness. Here's the rest.
- Sleep, HRV, resting heart rate, steps and breathing rate in one place, with trends.
- A fitness age from your VO₂ max.
- Fitness tests: dead hang, one-leg stand and 30-second chair stand, with a timer and typical range.
- What helps, and a goal for each.
Did you know? Each test explains what it measures with the "i" next to it.

### W34 · Liftsmith outside the app
Free · Lifters (phones, and calendar on web) · Screen: the home-screen widget
Start faster, without opening anything.
- Home-screen widget: today's call, weekly goal, a coach's note, Start or Log set.
- Quick Settings tile on Android; Control Center and Siri on iPhone.
- Training days in your calendar.
- Gentle reminders on training days.
Did you know? Notifications from the rest timer have Log set and +30 s buttons that work with the app closed.

### W35 · Invite friends, both get Pro
Free · Lifters · Screen: Friends › People › Your invites
Training together beats training alone, and it earns you both Pro.
- One invite link: from Friends, the end of a workout or any share card.
- A friend who joins follows you back.
- After their third workout, you both get a month of Pro.
- Your invites shows how close each friend is.
Did you know? Share cards have an "Add my invite link" switch.

### W36 · Adaptive splits
Pro · Lifters · Screen: Today on a push day of push/pull/legs
Like a split? Keep it, and still let the plan adapt.
- Push, pull, legs or upper and lower.
- Each day still adjusts to recovery and weekly sets.
- Exercises vary within the split.
- Switch in Settings › Training.
Did you know? Days a week and training days live in Settings › Training › Schedule.

### W37 · Drop sets, rest-pause and more
Free · Lifters · Screen: the set type sheet during rest
For the days you want to push past the planned sets.
- Add a drop set or rest-pause set between sets.
- Rest, reps and sets can be set for one exercise only.
- Timed holds get a timer.
- Per-hand dumbbells and each-side moves are shown clearly.
Did you know? "Rest, reps and sets for one exercise" is in Settings › Workout › Plan details.

### W38 · Train with a coach, free
Free · Lifters (not sent to coaches) · Screen: the client's coach page
Working with a coach or personal trainer? Being their client in Liftsmith costs nothing.
- Your coach assigns routines; you do them with the app's logging.
- Message them in one tap, answer check-ins, book sessions.
- You choose what they see: each kind of data has its own switch.
- Find coaches at your gym on its page and in the trainer directory.
Did you know? Photos and gyms never go to a coach.

### W39 · Labs: log sets without touching the screen
Labs (Pro) · Lifters · Screen: the workout with voice logging listening
Chalky hands, gloves, a phone across the room. Log anyway.
- Voice: say "100 for 8" or "too easy", recognized on your phone.
- Volume button on the phone or earbuds logs the set.
- Watch rep counting from your wrist, or phone motion counting.
- Tempo coach counts each rep's lowering, hold and lift.
Did you know? No audio ever leaves your phone for voice logging.

### W40 · Make rest count
Free · Lifters · Screen: the rest screen with box breathing
Rest is part of the workout. Use it well.
- Box breathing on the rest screen, with presets or your own pattern.
- Voice coach speaks up, so you don't watch the phone.
- Music controls on Today and during the workout.
- Ghost mode: your last session's sets on the rest timer.
Did you know? The plate math game can fill the rest screen instead (Settings › Workout › Between sets).

### W41 · The goal planner
Pro · Lifters · Screen: the goal planner with a date and path
Want a 100 kg bench? Know when, and how.
- Pick a lift and a target.
- A realistic date from your own progress.
- The path there, step by step.
- Tracks you as you go.
Did you know? A lift up 5% in six weeks becomes a "what's working" coach's note.

### W42 · Your profile, your rules
Free · Lifters · Screen: a public profile page
Show off what you want, keep the rest private.
- A public page with your best lifts and workouts, optional.
- A tagline and your home gym from the gym finder.
- Block, mute and report in one tap; every report is reviewed.
- Choose who sees each workout.
Did you know? Under-18s never have public pages.

### W43 · Labs: connected gear
Labs (Pro) · Lifters · Screen: the Sonos card on the workout screen
Gadgets in the gym, working together.
- Sonos: play, pause and skip; one volume for sets, another for rest.
- Bluetooth gym machines fill in cardio sets.
- Bluetooth smart scale fills in a weigh-in.
- Heart-rate rest timer ends rest once you're recovered.
Did you know? A lab marked phones-only shows only in the Android and iPhone apps.

### W44 · Celebrate the work
Free · Lifters · Screen: the monthly recap card
Lifting is hard. Mark the wins.
- A monthly recap, ready to share.
- Your lifting anniversary: day one beside today.
- Share cards for workouts, bests and milestones.
- A new best flashes gold and can be shared from the rest screen.
Did you know? Share links show a preview card in messages and social apps.

### W45 · Make it yours
Free · Lifters · Screen: Settings › Look and feel with the theme locker
Your app, your look.
- Dark, light or match your phone.
- Earned themes and accents from your achievements.
- On the phones, an app icon in your theme's colours.
- Six languages, separate from your phone's if you like.
Did you know? The daily quote on Today can be switched off.

### W46 · Comfortable for everyone
Free · Lifters · Screen: Settings › Accessibility
Every lifter should be able to use it easily.
- Text up to 150%, or match your phone.
- Colour-blind safe colours and more contrast.
- One-handed controls under your thumb.
- Big numbers mid-set, easy to read at arm's length.
Did you know? Lean mode cuts motion and confetti in one switch.

### W47 · Liftsmith on your computer
Free · Lifters · Screen: the web app's desktop layout
Plan, review and build on a big screen.
- A sidebar, wide pages and dialogs on the web app.
- Keyboard shortcuts during a workout (L logs the set).
- A wide routine builder with drag-and-drop.
- Everything syncs with your phone.
Did you know? Log a past workout from the web, then see it on your phone.

### W48 · Your data, your control
Free · Lifters · Screen: Settings › Your data and privacy
Where your data lives and what you can do with it.
- Works offline; syncs in the background.
- Backup files and spreadsheet export any time.
- Switches for usage stats and strength standards.
- Erase this device, or sign out to wipe it.
Did you know? Your phone's cloud backup never copies Liftsmith's data; your account and backup files do.

### W49 · Your body in 3D
Free + Pro · Lifters · Screen: the 3D figure shaped like the lifter, beside the recovery map
The figures in the app can look like you.
- Shape the figure like me: from your height, weight, body fat and measurements.
- Says what's missing, with a button to add it.
- Pro: the recovery map glows on that figure.
- Battery saver for older phones and longer battery.
Did you know? Battery saver draws the figures at a lower resolution and frame rate.

### W50 · Training on the road
Free · Lifters · Screen: Today at a small hotel gym with a dumbbell-only plan
Travel, holidays and visiting family don't have to break your streak.
- Add the hotel or a visitor's gym from the gym finder, or set up a tiny gym in a minute (a pair of dumbbells is enough).
- On the phones the right gym is picked when you arrive, and the plan fits what's there.
- No gym at all? Bodyweight skills and the dumbbell full body program travel well, and a 20-minute workout still counts.
- Streak freezes cover the week you really can't train.
Did you know? Short stretch days of 10 minutes or more keep your streak too.

### W51 · Your lifting anniversary
Free · Lifters · Screen: Progress
Every year on the day of your first workout, the app looks back with you.
- Today puts day one beside today: workouts, sets and total lifted.
- It names the lift that has grown most.
- It comes with a card to share.
- It stays for a week, so you won't miss it.
Did you know? Seven quick taps on the logo at the foot of Settings shows your lifetime total in elephants.

### W52 · What's new in Liftsmith
Free · Lifters · Screen: Today
The app keeps changing. Here's how to keep up, and how to steer it.
- The Features page on the website lists every feature, with the newest at the top.
- Each new feature gets its own tip email, so you hear about it once, here.
- Labs is where new ideas land first.
- Send feedback from Settings to tell us what to build next.
Did you know? Updates arrive by themselves; the app tells you when one is ready.

## Did you know round-ups

Melvin, 2026-11-15: "a series of 'did you know' … features that users may not know about, like that toggle to reduce the resolution of the 3D models for phones that are slow or to save battery life". One switch alone is too thin for an email, so each round-up gathers four to six lesser-known settings around one theme, each with where to find it and when it helps. They go in the lifter list as weeks 53 to 59 in this plan; at build time they're spread through the year, one after every seven feature emails, so the list reads W1–W7, D1, W8–W14, D2, and so on. Each one's screenshot is the settings page it points to, with the switches visible.

### D1 · Did you know: the workout screen
Free · Lifters · Screen: Settings › Workout
Small switches that change how a workout feels.
- **Keep the screen on** during a workout, so you don't unlock between sets.
- **Start rest yourself:** turn off the automatic rest timer if you like to start it when you sit down.
- **Smart plate memory:** between sets, only the plates to add or take off.
- **Ghost mode:** race your last session of each exercise, its weights, reps and rests on the rest timer.
- **Buzz 10 seconds before rest ends,** on the phone and the watch.

### D2 · Did you know: tune the plan
Free · Lifters · Screen: Settings › Workout › Plan details
The plan has sensible defaults, and every one of them can be yours.
- **Rest between sets,** separately for big lifts and smaller ones.
- **Rep ranges and sets per exercise,** or just for one exercise.
- **Effort scale:** reps in reserve or RPE 1 to 10; the plan works the same either way.
- **Week starts on** Sunday or Monday, for streaks, quests, recaps and weekly stats.
- **Default workout length,** or keep the slider where you last left it.

### D3 · Did you know: save battery on any phone
Free · Lifters · Screen: Settings › Look and feel with Battery saver for 3D figures
An older phone or a long day away from a charger? A few switches help.
- **Battery saver for 3D figures:** the exercise demos and recovery map draw at a lower resolution and frame rate.
- **Lean mode:** no motion, bursts or confetti.
- **Nothing runs in the background** when you're not training, so the app costs nothing between workouts.
- **Works offline,** so no signal in the basement doesn't drain the battery hunting for one.
- **Sounds and Vibration** each have their own switch.

### D4 · Did you know: make it read your way
Free · Lifters · Screen: Settings › Look and feel › Language and Body and units
Little things that make the app feel like yours.
- **Language** can differ from your phone's: six to choose from.
- **Units:** kilograms or pounds, and each gym can use its own for its plates.
- **Daily quote on Today** can be switched off.
- **Run setup again** from Settings if your goal, experience or gym has changed.
- **Exercise variety:** how often the plan changes exercises.

### D5 · Did you know: privacy switches
Free · Lifters · Screen: Settings › Your data and privacy
You decide what leaves your phone.
- **Usage stats:** anonymous app usage, one switch.
- **Count my lifts:** whether your lifts help build the public strength standards (never your own numbers).
- **Who sees each workout** on Friends, set per workout.
- **Coaches see only what you switch on,** kind by kind.
- **Erase this device** or sign out to wipe it; progress photos never leave your phone.

### D6 · Did you know: hidden fun
Free · Lifters · Screen: a 3D figure mid-dance
Not everything has to be serious.
- **Five quick taps** on any 3D figure.
- **Seven quick taps** on the logo at the foot of Settings shows your lifetime total in other units.
- A couple of **weights with a joke** attached, for you to find.
- **Earned themes, accents and app icons** in the Awards locker.

### D7 · Did you know: getting help
Free · Lifters · Screen: Settings › Help
When something's unclear or broken, help is one tap away.
- **The "i" next to any training term** explains it in plain words.
- **Why?** under a target shows the rule that set it.
- **Send feedback or report a bug** from Settings; it reaches the team with what's needed to fix it.
- **The Features page** on the website lists everything the app does and what's new.

## Role emails

Sent only to people in that role, in their weekly slot (see "Who gets what"). Each one is as full as a lifter email.

### C1 · Coach your clients in Liftsmith
Pro · Coaches and trainers · Screen: Coaching › Clients
Your clients already lift with the app. Now you can see their training and plan it.
- Link clients with an invite link; they choose what you see.
- See every workout, best and missed session, on the phone or a wide screen.
- Assign routines and programs; their weights still come from their own history.
- Pro covers up to 3 clients, and being a client is always free.
Did you know? Say whether you're a personal trainer or a coach, and clients see the right word for you.

### C2 · Chat, alerts and check-ins
Pro · Coaches and trainers · Screen: Coaching › Messages
Stay close to every client without another app.
- Message each client, with their training beside the chat.
- A notification when a client trains, or goes quiet for a week.
- Weekly check-ins, an intake questionnaire or your own form; a low score or a late answer goes to the top.
- Weigh-ins, measurements and a figure shaped like them, when they share body data.
Did you know? Clients can change what they share at any time, and you'll see it.

### C3 · Booking and getting paid
Pro · Coaches and trainers · Screen: Coaching › Schedule month calendar
Run the business side where the training already is.
- Open the times you're free, once or every week; clients book in the app.
- A session in the next day shows on their Today and goes into their calendar in one tap.
- Connect your own Stripe account and set a price per session or per month; the money goes straight to you.
- Liftsmith takes nothing from what clients pay you; a failed payment shows on their report.
Did you know? You can book a client in yourself from the calendar.

### C4 · Nutrition targets for clients
Pro · Coaches and trainers · Screen: a client's nutrition targets
Set the numbers once; the app checks them every day.
- Daily calories, protein, carbs and fat for each client, with a rest-day number if you like.
- Filled in from the client's own stats in one tap.
- Their coach's notes check their food week against your targets.
- See how they're eating when they share it from their food app.
Did you know? The app never asks clients to log food; it reads what their food app already has.

### C5 · Get found by new clients
Pro · Coaches and trainers · Screen: a city's trainer directory page
New clients are already looking at your gym's page.
- List yourself at the gyms where you train clients, with a line about you.
- You show on that gym's page and in the trainer directory for its city on the website.
- A button for new clients to start training with you.
- On an official gym, the owner approves trainers first; only adults are listed.
Did you know? Your directory listing is a public page people can find by searching.

### C6 · Coach plans for a growing client list
Pro · Coaches and trainers (once coach plans are live) · Screen: the coach plans on the pricing page
More clients shouldn't mean fewer tools.
- Pro covers up to 3 clients.
- Coach: 25 clients, $19.99 a month or $199.99 a year.
- Coach Plus: no set limit, $39.99 a month or $399.99 a year.
- Every coaching tool on every plan, clients free, and no cut of client payments.
Sent only once the `coachPlans` flag is on.

### P1 · Rehab that actually gets done
Pro · Physios and rehab clinicians · Screen: assigning a rehab program
Home exercises work when they're done. Liftsmith puts yours on your client's Today.
- Assign gentle rehab programs with the times a week you want.
- Clients save them in one tap; a reminder comes on the days they're due, and they can run beside lifting.
- See how often each client keeps to it.
- Shared pain ratings and injuries, exercise by exercise, with a notification when pain runs high.
Did you know? Clients are asked about pain only for the injury your program is for.

### S1 · Free Pro for your school team
Free · Verified high school coaches · Screen: School teams with the team board
Pro is free for high school coaches and their athletes aged 13 to 18.
- Confirm a school email address to unlock it.
- Invite athletes; each gets Pro free while on the team.
- A weekly team board.
- Teen-safe defaults: body fat and public profiles stay off for under-18s, and they get no promotional email.
Did you know? You can coach the team with the same tools as any coach, at no cost.

### G1 · Make your gym page work for you
Free · Gym owners · Screen: a claimed gym's page in edit mode
Lifters are already finding your gym in the app. Make the page yours.
- Add your logo, photos, hours and equipment.
- Amenities and prices: day pass, week pass, membership.
- Post announcements; members of your club get a notification.
- Print the poster and see how many lifters scanned it and added your gym.
Did you know? Equipment problem reports come to you with a Fixed button, and plans work around the broken machine until then.

### G2 · Staff, starter programs and your club
Free · Gym owners and staff · Screen: the gym's staff and starter program settings
Share the work and give new members a head start.
- Invite managers and front-desk staff with a one-time link; each uses their own account.
- Suggest one starter program to new members; they save it in one tap with their own weights.
- Run a club with a weekly leaderboard.
- Approve trainers who list themselves at your gym.
Did you know? Your gym's page is on the website too, so people searching for gyms nearby can find it.

### C7 · Your client chat, now a messenger (**New**, 2026-11-15)
Pro · Coaches and trainers · No screenshot (coaching needs an account)
On a computer, every chat now lives in a dock at the bottom right, so clients are one click away on any page.
- Up to two chat windows beside the list, each folding down to its name.
- A sound and a count in the browser tab when a client writes.
- Set a status: with a client, training, away, do not disturb, on vacation or appear offline; online shows by itself.
- See when a client is typing and when they've seen your message, and send emoji and gym stickers.
Did you know? On Do not disturb or on vacation, chat notifications to you wait until you're back.

### C8 · Reviews from your clients (**New**, 2026-11-15)
Pro · Coaches, trainers and physios · No screen (it needs a coach's account) · `fresh`, so it goes next to coaches already in the series
Clients who've trained with you can now rate you, and new clients can see it.
- A client can leave stars and a short review after four weeks or two sessions with you.
- Your rating shows on your invite and in the trainer directory once you have three reviews.
- Next to it: how many of your clients trained in the last two weeks.
- Reply once to each review from Coaching › Setup, and report one that breaks the rules.
Did you know? Only adults can leave reviews, and nothing shows until three reviews. ([Coach reviews](coach-reviews.md))
### W60 · Two new home-screen widgets (**New**, 2026-11-15)
Free · Lifters · Screen: Body › Muscles, the recovery map the Recovery widget sums up
Beside the Today widget, two more answer a question at a glance: am I on track this week, and what's ready to train?
- This week: the days you trained, the ones planned, your streak and how many more days keep it going.
- Recovery: which body areas are ready to train, and when the rest will be.
- Recovery updates itself as muscles recover, even with the app closed, without draining the battery.
- Each has Start, so today's workout is one tap away.
Did you know? Tap the Recovery widget to open the recovery map in the app.
