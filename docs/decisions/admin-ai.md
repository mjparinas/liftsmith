# Admin AI helpers

Melvin, 2026-11-16: "do them all", approving five AI helpers for the admin panel, paid from $100 of Anthropic API credit that expires on 2026-12-11. Web admin panel only, English. The app and the website for lifters don't use them.

## The rule: Claude suggests, a person acts

Every helper only reads and suggests. Nothing Claude says is applied until a member of staff presses the button that already did that job (Remove, Dismiss, Merge, Save, Send). Report content, gym web pages and emails are things the public wrote, so each prompt wraps them in tags and says they are data, never instructions, and every answer is held to a JSON schema or shown as plain text beside a button.

## The five helpers

1. **Reports triage** (Admin › Reports). On each report about a post, comment, profile, coach review or reply, and on each reported gym page, **Suggest** asks Claude for one of the actions the tab already has (remove, dismiss or ban the author; dismiss, hide, merge or edit a gym) and a one-line reason. **Suggest for all with AI** runs it down the list. The suggestion shows its own button that does it, or Ignore. A gym merge is only suggested into a real gym from the same city (read by the `city_slug` index, at most 120), never away from a claimed gym; an edit keeps only fields that change, with opening hours put into OpenStreetMap's format, or it falls back to Dismiss. The panel sends what it already shows, so a Friends suggestion reads nothing from the database.
2. **Gym data cleanup** (Admin › Gyms › Gym list). **Fill with AI** on an unclaimed gym reads its own website (the same safe fetch as Website fill-in: public hosts only, 8 seconds, 1.5 MB) and proposes its missing address, city, postcode, phone and hours. Staff check them, clear what's wrong and press Save, which writes only into fields that are still empty (the city only when it's still wrong, then the page moves and the old address redirects), checked in the statement itself. With the City filter on one city, **Find duplicates in <city> with AI** lists pairs that look listed twice, each with **Merge** (the same merge as a reported duplicate: lifters move, the page redirects). A claimed gym is never dropped.
3. **Ask your data** (Overview, admins). A question box answered from the numbers the Overview has already loaded for the chosen period, sent with the question, so it reads nothing more from the database. Read-only; it says when the numbers don't answer the question rather than guess.
4. **Inbox reply drafts** (Inbox, the existing Draft with AI). Now also reads the features page (`src/content/features.ts`: what each feature does, Free or Pro, phones or everywhere) beside the FAQ and saved replies. Still only fills the reply box; a person reads, edits and sends. It never auto-sends.
5. **The digest's summary.** Two or three sentences on top of the morning digest email (it's daily, 8 AM Pacific): what changed and what's worth a look. Written from the digest's own lines, so no extra reads; left out when the helpers are off, over the cap or fail, and the digest still goes.

## Models and cost

- **Claude Haiku 5.5** (`claude-haiku-5-5`, $0.10 in and $0.50 out per million tokens) for triage, gym cleanup, Ask your data and the digest. **Claude Sonnet 5.5** (`claude-sonnet-5-5`) for Inbox drafts, because a member of the public reads those words; it has the server-side fallback on a safety decline, which Haiku doesn't offer. The draft used Opus 5.5 before.
- Every request: low effort, the fixed instructions in a cached system block (`cache_control`), structured outputs where the answer is data, inputs cut to size (an email to 8,000 characters, a web page to 30,000, the Overview's numbers to 400 KB).
- A triage or a gym fill costs a small fraction of a cent; the $2 default cap covers thousands of requests a day.

## Switches and the cap

- **Flags › Admin AI helpers** (`aiHelpers`, on by default) is the kill switch: off stops every AI request at once, the digest included.
- **Flags › AI daily cap (US$)** (`aiDailyCap`: 0.5, 1, 2 or 4; default 2) is the most the helpers spend in a Pacific day. Once reached, every helper says so until midnight Pacific. $4 a day for the 25 days left on the credit is the $100.
- Spend is counted from each response's token usage at list prices into two `admin_settings` rows per day (`ai_spend:<day>` in millionths of a dollar, `ai_calls:<day>`), added in one statement each so parallel requests don't lose each other's. A check reads four rows by their keys. Each helper's line on the panel shows today's spend against the cap.
- Each use is in the audit log (`ai.triage`, `ai.triagePlace`, `ai.gymFill`, `ai.gymFillSave`, `ai.gymDupes`, `ai.ask`, `inbox.draft`). Only admins run helpers; support staff see the state.

## Setup

`ANTHROPIC_API_KEY` in Vercel (Production and Preview), from the Anthropic Console (Settings › API keys, in the workspace holding the credit). Without it the helpers hide their buttons and the System tab's Settings card says it's missing. A spend limit on that workspace in the Console is a second guard beside the daily cap.

## Code

`src/server/ai.ts` (the one door: status, cap, pricing, `askClaude`), `src/server/aiHelpers.ts` (the prompts and checks), `src/server/replyDraft.ts` (Inbox), `src/app/api/admin/ai/route.api.ts`, `src/components/admin/Ai.tsx` (status, suggestion box, Ask your data), `GymAi.tsx`, and the buttons in `Reports.tsx`, `GymPlaceReports.tsx` and `GymPlaces.tsx`. Tests: `src/server/ai.test.ts`.

## Privacy

What's sent: a reported post's exercise names, a comment, a profile's name, handle and tagline, a review or reply, the reporters' reasons and notes; a gym's public web page; an email someone sent us; counts from the Overview and the digest. Nothing about a lifter's training. `/privacy/` and `docs/PRIVACY_LABELS.md` name Anthropic as a service provider for drafts and report suggestions.
