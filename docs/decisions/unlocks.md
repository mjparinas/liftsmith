# Features that unlock as you train (Melvin, 2026-11-18)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin asked (2026-11-18): "the app can be pretty complex, maybe slowly unlock things as time goes on, like seasons shouldn't be available right away for new users, they should unlock it after a few lifting sessions as they get used to the app. what else can do this? how to make this better". Before this, a brand-new lifter saw the XP league, weekly quests, the season row, Awards and Friends before lifting once.

## The schedule (`UNLOCKS` in `src/lib/unlocks.ts`)

Counted in finished workouts (`stats.sessions`), so imported history counts.

| Workouts | What appears | Where |
| --- | --- | --- |
| 0 | Today's plan and Start, the workout, Body, Progress, Settings. This week shows only the weekly goal line. | |
| 1 | `awards`: XP, level and badges | the Awards tab, This week's XP line and closest badge |
| 2 | `quests`: weekly quests and the weekly league | This week on Today, Awards, quests done on Done |
| 3 | `friends`: Friends, posting a workout, the invite on Done, screenshot share cards | the Friends tab (still behind the `social` flag), Done, `ScreenshotShare` |
| 5 | `seasons`: training seasons, crates and the locker | Today's season row, Awards' Seasons card and Locker, crates on Done, the Training seasons switch |
| 8 | `more`: the monthly challenge, Adaptive workout options, Labs | Awards and Friends' month card, Settings › Training, the Labs row |

Always there from day one: Pro and the paywall, imports, Health Connect and Apple Health, connected apps, gyms, coaching, Community and feedback, accessibility, and every other setting.

## The rules

- **A moment for each unlock:** the Done screen of the workout that opens one shows a "New for you" card (`NewForYou` in `Done.tsx`): one line on why it helps and a button to where it lives. The thresholds are all different, so one workout opens one thing. An import or a head start opens things quietly; only a finished workout gets a moment (`justUnlocked`).
- **Nothing is taken away:** the highest count reached is saved on the profile (`reveal.peak`, written by Done), so deleting a workout never hides anything again. The profile syncs, so every device agrees.
- **Existing accounts keep everything:** only a first setup writes `profile.reveal` (`firstReveal` in `Onboarding.tsx`); a profile without it, from before 2026-11-18, has everything. Rerunning setup changes nothing.
- **Skip ahead:** an experienced lifter (setup's experience is intermediate or advanced) starts three workouts in (`HEAD_START`), imported history counts, and **Settings › Look and feel › Show everything** (`reveal.all`) opens everything now. The switch shows only while something is still waiting, or while it's on.
- **Experience, never money:** free and Pro lifters unlock the same way. A Pro item that appears carries its Pro tag and opens Pro as usual (the rule that Pro features are never hidden), and the paywall lists every Pro feature whatever is unlocked.
- **Links always open:** a season push, a shared link, a coach invite or a notification opens its screen whatever is unlocked. Only the entry points on Today, the tab bar, Awards, Done and Settings wait.
- **Derived, not stored:** the game still counts everything from the first workout (XP, quests, crates, season points), so the locker opens with the crates already won and the season with the points already earned.
- Pure web code (`useUnlocked` in `src/components/app/useUnlocked.ts`), so Android, iOS and the web get it together.
