# Pinterest pins and short clips from the 3D figures

Melvin, 2026-11-27 (traffic idea 4 of 6, thread "Find new ways to grow traffic": "do them all, put effort into them"). Every exercise's 3D demo becomes a tall Pinterest pin and a 15-second vertical clip, each with three form cues and the exercise page's address, and the pins post themselves through Pinterest's API. Organic only: no ads, no ad spend, no other app's name. Melvin's time: about 10 minutes a week on the admin Pins tab, plus a one-off Pinterest setup.

## What gets made

- **One exercise, two pins.** A 1000×1500 JPEG pin (2:3, the shape Pinterest shows best) and a 1080×1920, 15-second, 30 fps H.264 clip with no sound (also good for Shorts, Reels and TikTok: the Pins tab has Download on every clip). Both: the Liftsmith mark, "FORM CHECK", the exercise name, the 3D figure with the working muscles lit, three numbered cues and "Free 3D demo and common mistakes" over the page's address.
- **The clip moves.** The rep plays at its own pace while the camera sweeps ±26° around the three-quarter view; cue 1 comes in at 1.2 s, cue 2 at 4.2 s, cue 3 at 7.2 s and the address at 11 s. Its cover (Pinterest's still for a video pin) is the frame at 13 s, with everything on screen. Text sits above the bottom 120 px, where short-video apps put their buttons.
- **The words are ours and match the page.** Title "<Exercise>: 3 form cues", the exercise's English setup and cues from `exercises.ts`. Most exercises have two cues; the third is then the fix for its first common mistake (`formFaults.ts`, the line the page shows under "Common mistakes"). Description and alt text are under Pinterest's limits (100, 500, 500). Canadian English, no other app named. `pinContent()` in `src/lib/pinContent.ts`.
- **Links carry UTM tags** (`utm_source=pinterest&utm_medium=social&utm_campaign=pin` or `pin-clip`), so the admin Traffic tab shows what pins bring.
- **Boards per muscle group**, made on Pinterest the first time a pin needs one: Chest, Back, Shoulder, Arm, Core, Glute and Leg exercises, and Cardio and conditioning (from the exercise's first primary muscle).
- **Order:** well-known lifts first (`STAPLE`, then `COMMON` from pick weights), then the rest in library order: over 1,000 exercises, so years of pins at two a day.

## How it runs

- **The maker** is `scripts/pins.mjs` on the build-only `/pin-studio/` page (`PinStudio.tsx`, kept out of every normal build by the `.stills.tsx` extension like `/stills/`). It draws the figure with `figureClip` (`src/components/demo/clip.ts`: the live demo's mesh, camera and scenes, kept open so each frame is one draw), sets every frame from the script's clock (no CSS animation), screenshots it and pipes the frames to ffmpeg. About 50 seconds an exercise. Locally: `STILLS=1 npm run build:static && node scripts/pins.mjs bench-press deadlift` writes to `e2e-shots/pins/`.
- **The weekly workflow** (`.github/workflows/pins.yml`, Mondays 14:00 UTC, or Actions › Pins › Run workflow with a count) runs it with `--upload` in the Playwright container (ffmpeg and the Inter font installed): it asks the server which exercises have pins, makes the next ten, uploads the files straight to the public Blob store with one-path upload tokens, and hands them to the queue. It makes fewer once three weeks of pins are waiting, so the queue never piles up.
- **No secret to set up.** The workflow proves who it is with GitHub's OIDC token (`id-token: write`); `/api/pins/studio/` takes only tokens GitHub signed for our audience from this repo's `pins.yml` on `main` or `staging`, run by schedule or by hand, never a pull request or a fork (`githubOidc.ts`). Files go only under `pins/<exercise>/` in our own store (`okUpload`).
- **The queue** is the `pins` table (two rows per exercise, `pins.ts`): waiting for a look → queued → posted, or skipped or failed. An exercise made again replaces its unposted pins and their files; posted ones stay.
- **Posting** is the `pins` schedule (Vercel Schedules, :20 every two hours): it finishes videos Pinterest has processed, then posts one pin when fewer than the day's number went out in the last 24 hours and the last one went up at least 24 h ÷ pins-a-day ago (less 15 minutes), so pins spread through the day. It takes turns between images and clips, oldest first. Safe to run twice: the hour is claimed once, each pin is claimed in one statement before it's sent, and a pin left mid-send is marked failed with "check Pinterest before trying again" instead of being sent twice. A busy Pinterest (429 or 5xx) gets two more tries on later runs; anything else waits for Try again.
- **Images** post with `media_source: image_url` (the public Blob address). **Clips** register a video upload (`POST /v5/media`), upload the file to the address Pinterest gives, then post with `video_id` and the cover once Pinterest says it's processed (a few looks in the same run, then later runs; failed after six hours).

## The admin Pins tab (web admin, English)

Under Work, beside Gyms. Shows the Pinterest link (Connect Pinterest / Disconnect, who it's connected as and until when), the posting settings (pins a day 1 to 5, default 2; Pause posting; **Look before they post**, on by default, Melvin's weekly look; post the clips as video pins; Sandbox), how many days the queue lasts, and the pins by state (Waiting for a look, Queued, Failed, Posted) with Approve all, and on each: a preview (the clip plays), Approve, Post now, Edit (title and description), Skip, Try again, Download and Open on Pinterest. Changes are admins only and audited.

## Pinterest setup (Melvin, once)

1. A free Pinterest **business** account for Liftsmith (faceless, like the other channels).
2. An app on developers.pinterest.com with the redirect address `https://www.getliftsmith.com/api/admin/pins/callback/`, and scopes boards and pins read and write plus user accounts read (`SCOPES`).
3. `PINTEREST_APP_ID` and `PINTEREST_APP_SECRET` in Vercel (Production and Preview), then **Connect Pinterest** on the Pins tab. Tokens are kept sealed with the app secret (`seal` from `connect.ts`) and refreshed when under three days are left; the sign-in lasts a year, and the tab says until when.
4. **Trial access first.** A new Pinterest app starts on Trial: its pins are only visible to its owner, and its writes belong in Pinterest's sandbox, which takes no video pins. Turn **Sandbox** on, connect, and Post now one image pin while screen-recording the Connect and Post now steps: that recording is what Pinterest asks for to grant **Standard** access. Once granted, turn Sandbox off, connect again, and the queue posts for real.

## Not done

- No ads, no promoted pins, no group boards, no hashtags (Pinterest no longer favours them).
- No music or voice on clips (licensing, and Pinterest autoplays muted).
- No other languages yet: Pinterest search is mostly English, and the pages it links to are English. A language's own boards can come later from the same studio.
