# Admin AI helpers

Melvin, 2026-11-16: "do them all", approving five AI helpers for the admin panel, paid from $100 of Anthropic API credit that expires on 2026-12-11. Web admin panel only, English. The app and the website for lifters don't use them.

## The rule: Claude suggests, a person acts

Every helper only reads and suggests (one exception since 2026-11-16, the gym import's backfill below). Nothing Claude says is applied until a member of staff presses the button that already did that job (Remove, Dismiss, Merge, Save, Send). Report content, gym web pages and emails are things the public wrote, so each prompt wraps them in tags and says they are data, never instructions, and every answer is held to a JSON schema or shown as plain text beside a button.

## The five helpers

1. **Reports triage** (Admin › Reports). On each report about a post, comment, profile, coach review or reply, and on each reported gym page, **Suggest** asks Claude for one of the actions the tab already has (remove, dismiss or ban the author; dismiss, hide, merge or edit a gym) and a one-line reason. **Suggest for all with AI** runs it down the list. The suggestion shows its own button that does it, or Ignore. A gym merge is only suggested into a real gym from the same city (read by the `city_slug` index, at most 120), never away from a claimed gym; an edit keeps only fields that change, with opening hours put into OpenStreetMap's format, or it falls back to Dismiss. The panel sends what it already shows, so a Friends suggestion reads nothing from the database.
2. **Gym data cleanup** (Admin › Gyms › Gym list). **Fill with AI** on an unclaimed gym reads its own website (the same safe fetch as Website fill-in: public hosts only, 8 seconds, 1.5 MB) and proposes its missing address, city, postcode, phone and hours. Staff check them, clear what's wrong and press Save, which writes only into fields that are still empty (the city only when it's still wrong, then the page moves and the old address redirects), checked in the statement itself. With the City filter on one city, **Find duplicates in <city> with AI** lists pairs that look listed twice, each with **Merge** (the same merge as a reported duplicate: lifters move, the page redirects). A claimed gym is never dropped.
3. **Ask AI, in the header on every tab** (admins; Melvin, 2026-11-16: "at the top of each page there should be an ask the ai, and that just sends data about the page you're currently on to claude and it provides actionable insights on what needs to get done. maybe this should be just in the header"). It replaced Ask your data on the Overview, so there's one control for it. **Ask AI** sits in the header's top row and opens a panel under the header that asks at once: it sends the words of the tab on screen as staff read them (the element marked `data-admin-page`, up to 60,000 characters) and, on the stats tabs, the numbers the panel already loaded (left out above 120 KB, a long period), so it reads nothing more from the database. Claude answers with a line or two on what stands out and up to five things to do, most urgent first, each with its one-line why from the page and, when it's done on another tab, an **Open <tab>** button (only real tabs, `ADMIN_TABS` in `src/lib/adminTabs.ts`). A question box asks again about the same tab, and Look again re-reads it. Email addresses and long tokens are taken out on the server before it's sent (`redact`). Read-only: it never acts. **It asks only when pressed** (Melvin, 2026-11-18: switching tabs left it open and asked about the new tab): moving to another tab closes the panel, and Ask AI on the new tab asks about that one.
4. **Inbox reply drafts** (Inbox, the existing Draft with AI). Now also reads the features page (`src/content/features.ts`: what each feature does, Free or Pro, phones or everywhere) beside the FAQ and saved replies. Still only fills the reply box; a person reads, edits and sends. It never auto-sends.
5. **The digest's summary.** Two or three sentences on top of the morning digest email (it's daily, 8 AM Pacific): what changed and what's worth a look. Written from the digest's own lines, so no extra reads; left out when the helpers are off, over the cap or fail, and the digest still goes.

## Models and cost

- **Claude Haiku 5.5** (`claude-haiku-5-5`, $0.10 in and $0.50 out per million tokens) for triage, gym cleanup, Ask AI and the digest. **Claude Sonnet 5.5** (`claude-sonnet-5-5`) for Inbox drafts, because a member of the public reads those words; it has the server-side fallback on a safety decline, which Haiku doesn't offer. The draft used Opus 5.5 before.
- Every request: low effort, the fixed instructions in a cached system block (`cache_control`), structured outputs where the answer is data, inputs cut to size (an email to 8,000 characters, a web page to 30,000, the Overview's numbers to 400 KB).
- A triage or a gym fill costs a small fraction of a cent; the $2 default cap covers thousands of requests a day.

## Switches and the cap

- **Flags › Admin AI helpers** (`aiHelpers`, on by default) is the kill switch: off stops every AI request at once, the digest included.
- **Flags › AI daily cap (US$)** (`aiDailyCap`: 0.5, 1, 2 or 4; default 2) is the most the helpers spend in a Pacific day. Once reached, every helper says so until midnight Pacific. $4 a day for the 25 days left on the credit is the $100.
- Spend is counted from each response's token usage at list prices into two `admin_settings` rows per day (`ai_spend:<day>` in millionths of a dollar, `ai_calls:<day>`), added in one statement each so parallel requests don't lose each other's. A check reads four rows by their keys. Each helper's line on the panel shows today's spend against the cap.
- Each use is in the audit log (`ai.triage`, `ai.triagePlace`, `ai.gymFill`, `ai.gymFillSave`, `ai.gymDupes`, `ai.page`, `inbox.draft`). Only admins run helpers; support staff see the state.

## Setup

`ANTHROPIC_API_KEY` in Vercel (Production and Preview), from the Anthropic Console (Settings › API keys, in the workspace holding the credit). Without it the helpers hide their buttons and the System tab's Settings card says it's missing. A spend limit on that workspace in the Console is a second guard beside the daily cap.

## Code

`src/server/ai.ts` (the one door: status, cap, pricing, `askClaude`), `src/server/aiHelpers.ts` (the prompts and checks), `src/server/replyDraft.ts` (Inbox), `src/app/api/admin/ai/route.api.ts`, `src/components/admin/Ai.tsx` (status, suggestion box, Ask AI's button and panel), `src/lib/adminTabs.ts`, `GymAi.tsx`, and the buttons in `Reports.tsx`, `GymPlaceReports.tsx` and `GymPlaces.tsx`. Tests: `src/server/ai.test.ts`, `src/components/admin/AskAi.test.tsx`, `AskAiTabs.test.tsx`.

## Privacy

What's sent: a reported post's exercise names, a comment, a profile's name, handle and tagline, a review or reply, the reporters' reasons and notes; a gym's public web page; an email someone sent us; counts from the Overview and the digest; the words of the admin tab open when staff press Ask AI, with email addresses taken out. Nothing about a lifter's training. `/privacy/` and `docs/PRIVACY_LABELS.md` name Anthropic as a service provider for drafts and report suggestions.

## The import's AI backfill (2026-11-16)

Melvin, 2026-11-16: the gym import should "use AI to backfill the rest of the data" when reading a gym's website with plain code fails, as part of one button. This is the one place Claude's answer is written without a person pressing a button, so it is held tighter than the helpers (`src/server/gymAutoFill.ts`, task `gymAuto`):

- **Only unclaimed, visible gyms, only empty fields.** The update keeps any value already there (`CASE WHEN field = '' …`) and requires `claimed_by = ''`; the city is replaced only when the current one is a postcode, a number or missing, and the gym then moves like any city fix.
- **Every answer is checked in code** (`checkedFill`): an address must look like a street and is tidied; a postcode must fit the country; a phone has 7 to 15 digits; hours must parse and are rewritten in the map's form; an email must be on the gym's own domain; Instagram and Facebook must be real profile links on those sites. Anything else is dropped.
- **Same door, cap and switch**: through `askClaude` (Haiku, page wrapped as data, answer held to a schema), behind `aiHelpers` and counted against `aiDailyCap`. When either stops it, or the key is missing or refused, the step ends with a note on the job and the next daily run carries on; other errors stamp that gym and move on.
- **Its own switch**: the AI step switch on Admin › Gyms › Import (flag `gymImportAi`, on by default) turns only this step off; the other helpers keep running.
- **Asked once per gym per 180 days** (`ai_at`, index `gym_places_ai`), 12 gyms a batch, 4 at a time.

## The AI fix-up pass (2026-11-19)

The second place Claude's answer is written without a person pressing a button (Melvin, 2026-11-19), held to the same checks: a button on Admin › Gyms › Import runs Claude once ever over every unclaimed gym with a website (`src/server/gymAiFix.ts`, task `gymFix`). It fills empty fields and, unlike the backfill, corrects a filled phone, hours, email, Instagram, Facebook or street address when the gym's own page clearly says otherwise (a street only when the page puts it in the gym's own city). Pages that say the gym closed or isn't one become reports for staff rather than hiding anything, every change is listed with its old value and Undo, and it pauses at `aiDailyCap` until midnight Pacific and carries on by itself. Details in [Gyms](gyms.md) "AI fix-up pass".

