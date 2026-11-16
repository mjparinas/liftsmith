# Progress photos: line up, compare, keep private

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin, 2026-11-15, from the list of gaps: "progress photos with side-by-side compare". Body and photos (`#/photos`, `Photos.tsx`, `src/lib/photos.ts`) already kept front, side and back photos on the phone with a wipe slider between the first and the latest. This round makes the comparison fair and flexible.

## Where photos live (Melvin, 2026-11-15)

- **Phone only.** Asked "should progress photos stay on the phone or sync to the account?", Melvin chose **phone only, plus the backup file**. Photos keep their own IndexedDB database outside the event log, so sync, analytics, coaches and feedback reports never see them, and no server stores them. Don't propose server photo sync again unless he raises it.
- **Backup file, opt-in.** Settings › Saving and backup shows **Include {n} progress photos** (an `InlineSwitch`, off every time, shown only when there are photos) above Save a backup file. With it on, the file gets a `photos` list: id, time, pose, size and the JPEG as base64 (`SavedPhoto`, `photosForBackup`). Restoring adds the photos this device doesn't have, by id (`restorePhotos`), and says how many. Anything malformed in the file is dropped (`parseSavedPhotos`: known pose, size within 1440 px, base64 only, at most 8 MB each). The file limit went from 50 MB to 300 MB to fit a few hundred photos.
- **Signing out** (which wipes the device) already warned about photos; it now offers **Save a backup with photos** before Sign out and delete photos.

## Taking a photo (`PhotoCamera.tsx`)

- **Line it up.** Add a photo opens the in-app camera (`getUserMedia`, the same path rep counting and scanning a friend's code use, so the Android and iOS web views already allow it) with **the last photo of that pose as a faint outline** (35%) over the live picture, and a switch to hide it. The front camera previews mirrored like a mirror and the outline is mirrored with it so they match; the saved photo isn't mirrored, like the phone's own camera.
- **Self-timer:** Off, 3 s or 10 s (chips, remembered on the device, 10 s by default), a big countdown with a tick and a light haptic each second.
- **Check before keeping:** Retake or Keep it. Switch camera flips front and back.
- **No camera** (denied, none, or a browser without it): one line and **Choose from my photos**, which is also always offered under the camera. The file picker no longer forces the camera (`capture` removed), so it opens the phone's chooser.
- Photos still go through `preparePhoto`: 1440 px JPEG, no EXIF, so no location.

## Comparing

- **Any two dates.** Compare starts on the first and the latest photo of the pose. Under it, Before and After each show their date with ‹ › arrows to the next older or newer photo (`stepPair`), never past each other; the arrows are disabled at the ends. One hand, no typing. The choice is per pose and resets to first and latest after a new photo.
- **Slider or Side by side** (chips, remembered on the device in `liftsmith.photoCompare`). Side by side is two 3:4 panels with the date and weight under each.
- **The weight on the day:** each photo shows the weigh-in closest to it within a week (`weightNear`), and the line under the pair says how far apart they are and the weight change between them ("8 weeks apart · −2.5 kg"). No weigh-in near a photo, no number.
- **Next photo:** the screen says when the next photo of the pose is due, four weeks after the last (`PHOTO_EVERY_DAYS`), and says it's time once it is. A line on the screen, not a coach's note: coach's notes are derived from events, and photos aren't events.

## Sharing

- **Share side by side** draws the pair as one image (1452 × 1080, two cover-cropped panels, dates and weights under them, the brand name, always dark like every share card; `drawSideBySide`) and hands it to the share sheet (`shareCanvas`). Only when the lifter taps it, never with an invite link, and **never offered to under-18s** (`isTeen`).

## Platforms

Pure web code, so Android, iOS and the web app get it together. The camera permission is already declared on both (Android `CAMERA`, iOS `NSCameraUsageDescription`, which already mentions progress photos and says they're never uploaded). On the web the photos stay in that browser.
