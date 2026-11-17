# Training seasons (Melvin, 2026-11-17)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin asked (2026-11-17): "games like diablo have this concept of a season, where i guess you have different abilities that you can unlock or unique equipment … maybe different badges, colour schemes, icons, that you can only unlock in there", then "this should be applicable to both serious lifters and casual ones", "what else can we add to make it more exciting, gamified, and highly engaging", and "if this makes the UI way too cluttered, consider an opt-out toggle". An original design: no game's names, art or terms beyond the plain word "season".

## The rules (`src/lib/seasons.ts`)

- **Length:** 8 to 12 of the lifter's calendar weeks (Monday or Sunday, like every weekly number). Season 1, **Ember**, runs 10 weeks from Monday 23 November 2026 (`DEFAULT_SEASONS`).
- **Track:** 20 tiers of 400 points. Past tier 20, a **prestige star** every 1,000 points, for the lifters who keep going.
- **Points come from the lifter's own weekly goal, never past it** (the casual-and-serious rule). Each week the goal days share 600 points (`round(600 × days / goal)`, days capped at the goal), meeting the goal adds 200, each finished weekly quest 50. Days past the goal earn nothing, so two days a week climbs as fast as five and nobody gains by overtraining or training sore (the same line as streaks: [Engagement and juice](engagement-and-juice.md)). Stand-alone stretch days don't count, like the weekly goal.
- **Catch-up:** the first goal week after a missed (finished) week pays the goal bonus twice. Modest on purpose: missing a week still costs more than it gives back.
- **Finale:** the season's last week counts double. Still capped by the goal, so there's no reason to add days.
- **Season challenges** (500 each): meet the goal in 60% of the weeks (6 of 10), set 5 new bests (`stats.prs`, the one e1RM formula), try 8 exercises never done before the season.
- **Rare drop:** each new best during the season has a 1 in 6 chance (seeded by season, exercise and time, so every device agrees) to drop the kit's rare item. The odds are shown plainly, like crate odds.
- Meeting the goal about eight weeks in ten (with that week's "train your days" quest and the goal-weeks challenge) reaches tier 20; about five in ten lands near tier 12. `seasons.test.ts` checks both.
- **Derived, never stored**, like every game rule: `seasonState()` reads the event log, so every device agrees after sync and nothing new syncs.

## Rewards

- A **kit** is a reward set that ships with the app (`KITS`), because its app icons are native files. Each kit is used by one season only.
- Ember: tier 2 avatar (Ember), 5 bronze badge, 7 accent (Ember), 10 silver, 12 theme and app icon (Ember), 15 gold, 20 platinum. Rare drop: Ember plates (a plate finish).
- **Free track plus Pro bonus** (Melvin picked it on the decision card, 2026-11-17): every tier and its rewards are free. A Pro bonus row adds tier 6 avatar (Ember star), tier 14 accent (Ember gold) and tier 20 theme and icon (Ember gold). The Pro row counts when the lifter had Pro in any month the season touches (a `pro` event, `store.notePro`), so a lifter who goes Pro late in the season gets the Pro rewards for tiers already reached. Pro rewards are shown, never hidden, with a Pro tag that opens Pro.
- **Season-only and kept:** a reward can only be earned while its season runs and stays owned afterwards (derived from the season's window, forever). Once a season has ended, its rewards that weren't earned leave the Locker and the theme and icon pickers (`stillOpen`, `themeShown`); owned ones stay.
- Season items are never in crates or level rewards (`Cosmetic.season`, kept out of `cratePool`), so every crate already opened still holds what it held.
- Season badges are their own thing (kit name and tier, a flame medal in the tier's colour), shown on the Season screen and the Seasons card on Awards. They aren't achievements: no XP, so a season doesn't change levels.
- **Fresh start:** each season starts at tier 0 with a new kit. Levels, badges, streaks, leagues and the Locker carry on.

## Where it shows (light on purpose)

- **Today:** one row at the foot of the This week card (kit name, tier and days left, a thin bar), only while a season is running or starts within two weeks, or ended within two weeks. It opens the Season screen.
- **Awards:** a Seasons card under the monthly challenge (the season, one tap to its screen, and every season badge earned).
- **Season screen** (`#/season`, `Season.tsx`): tier, points and prestige; this week's points with why ("2 of 3 days, 400 points; 1 more day meets your goal (+200 bonus). Days past your goal add nothing"), the catch-up and finale notes; the free track and the Pro bonus row; challenges; the rare drop; Share my season once it ends (the recap card: tier, points, workouts, new bests, best week; the invite rides along through the share sheet like every card, never for under 18s).
- **Turn it off** (Melvin: "consider an opt-out toggle"): **Settings › Look and feel › Training seasons** (`profile.delight.seasons`, on by default, syncs with the profile). Off hides the Today row, the Awards card and unowned season items; points still count, and owned rewards stay usable.

## Teen-safe

- No ranking against strangers, no season pushes or emails of their own (nothing season-specific is sent to anyone yet; the weekly tips email that announces seasons never goes to under-18s), and the recap card follows the share rules (no invite link for under-18s). Points reward meeting a goal, never more days.

## Admin

- **Admin › Seasons** (`src/components/admin/Seasons.tsx`, `/api/admin/seasons/`): the schedule, with each season's reward set, first day (a Monday) and length, and "Add the next season" when the build has an unused kit. Saved as the `seasons` admin setting (`src/server/seasons.ts`), merged over the built-in season 1. A season that has started can't move, change length or kit, or be removed (`changeProblem`), so nobody's tier or rewards change after the fact. Admins edit; support staff see it.
- The app reads `GET /api/seasons/` on open and on return to the foreground (`remoteSeasons.ts`) and keeps it on the device (`liftsmith.seasons`, not personal, so not in `wipe.ts`), like flags. Offline or before the first answer, the built-in schedule.
- A new season needs a new kit in an app release (rewards, Locker items, a theme, icons drawn with `ONLY=<name> node scripts/make-icons.mjs`, the Android alias and iOS alternate icon), then the admin schedules it.

## Platforms

- Pure web code for the track, rewards and screens, so Android, iOS and the web get it together. The season app icons are native on both phones (Android launcher aliases `.IconEmber` and `.IconEmbergold`, iOS `AppIcon-ember` and `AppIcon-embergold`); the web gets the theme (browsers can't change a home-screen icon, [Platform deltas](platform-deltas.md) "Earned app icons"). `seasons.test.ts` checks every theme icon exists on both phones.

## Ideas for later (sent to Melvin, not built)

- Crew vs crew: Friends groups pooling season points.
- The season tier next to a name on Friends, and a friends-only season board.
