# Printable plans: programs, public routines and a lifter's own routine on one page

Melvin, 2026-11-27 (traffic idea 5: "do them all, put effort into them"): every program and routine page on the website gets a well-designed one-page printable version with the app link and a QR code, for "printable workout plan" searches, and lifters print their own routines from the app on every platform. Free, no ads.

## One sheet, three places

- **One renderer** (`src/lib/printSheet.ts`): `printSheetHtml(sheet)` draws a `PrintSheet` (title, summary, facts, how to run it, a credit, days of rows with sets × reps and rest, optional next weights and superset marks, four sessions to write in, a QR code with the address printed under it) as plain HTML and CSS (`PRINT_CSS`). The website pages, the routine pages the server draws and the app all print the same sheet, so they never drift. The words come in the sheet (`PrintWords`), from `prt.*` (`src/locales/text/prt.ts`, all ten languages).
- **Programs** (`/programs/<id>/print/` and `/<lang>/programs/<id>/print/`, `ProgramPrint.tsx`): the program page's own workouts (`ProgramView.tsx`), linked from the program page as "Print this program (free PDF)" and listed in the sitemap in every language. The QR code goes back to the program page with `?from=print`.
- **Public routines** (`/routines/<slug>-<id>/print/`, `routinePrintHtml` in `libraryPage.ts`): server-drawn like the routine page, `noindex` (the routine page is the one to rank), with `PRINT_PAGE_CSP` (`SHARE_PAGE_CSP` plus `script-src 'self'` for `/print.js` only).
- **A lifter's own routine** (Print routine in the routine editor, `PrintRoutine` in `Routines.tsx`, `routinePrintSheet` in `routinePrint.ts`): each exercise with its sets and reps (a coach's range as "8–10", holds in seconds), the weight the app plans next at the lifter's gym (`target`, the same as the workout's, none for bodyweight, holds or cardio), the rest (`restFor`), supersets, and a QR code with the routine's share link carrying the lifter's invite (`withInvite`), so a friend who scans it can add the same routine. Nothing personal goes in the code: only the exercises and sets, plus the invite. Shown only for a routine that can be shared.

## Always one page

- Paper is Letter in English (Canada and the US read it most) and A4 in every other language. The sheet lays itself out tighter as it grows (`density`: roomy, normal, tight; fewer write-in rows, three log columns past 22 rows, the Notes box only when roomy).
- **Measured, not guessed**: estimating the height from row counts left some sheets a few millimetres over a page, so the real sheet is measured laid out like paper (`.ps-measure`, `measureSheet`) and scaled with `--ps-zoom` to fit 252 mm (`PAGE_MM`), never below 0.75 (`zoomFor`). On the website `public/print.js` does it before the print window opens (`beforeprint` and the Print button, `[data-print]`); it changes nothing on the page before then, because React hydrates that page. The app measures in its hidden frame.
- Print always uses light colours (`color-scheme: light`), whatever the site's theme, and the URL under the QR code turns off ligatures so "5x5" isn't printed as "5×5".

## Printing on each platform

- **Web app**: a hidden frame holding only the sheet (`printSheet` in `src/lib/print.ts`), so the app around it never reaches the paper; the browser's print window has Save as PDF.
- **Android**: the `Print` plugin (`PrintPlugin.java`) loads the sheet in an offscreen WebView and hands its print adapter to `PrintManager`; a web view's own `window.print()` does nothing in the app.
- **iOS**: the `Print` plugin (`PrintPlugin` in `DelightPlugins.swift`) loads it in a WKWebView and hands its print formatter to `UIPrintInteractionController` (from the middle of the screen on iPad).
- Both phones' print screens also save or share a PDF. No platform delta.

## Ready PDFs

- `node scripts/program-pdfs.mjs` (after `npm run build:static`; it serves `out/` itself, or pass a base URL) draws `public/pdf/<lang>/liftsmith-<id>.pdf` for every program in every language, fails if any comes out longer than one page, and saves each sheet's fingerprint (`sheetHash`, the print page's `data-sheet-hash`) in `public/pdf/manifest.json`. Only stale or missing PDFs are drawn again (`--all` for every one).
- **A change to a program, its words or the sheet's design reruns the script in the same change**: `programPrint.test.tsx` fails when a sheet's fingerprint differs from the manifest or a PDF is missing.
- `--email` also draws the weekly tips email's picture (`public/email/<lang>/w/printable-plans.jpg`, `art: "print"`) from the dumbbell full body's sheet, because its credit names no other program or app.

## Also

- Features page `printable-plans` (Free), blog post `printable-workout-plans`, weekly email `printable-plans` and What's new `printRoutine` (0.32.0).
- Analytics: `routine_print` when a lifter prints from the app.
