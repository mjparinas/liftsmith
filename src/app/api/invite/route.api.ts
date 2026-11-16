// GET /invite/<code>/ (rewritten here): a lifter's invite link (Melvin, 2026-11-15: "it should have invite in the URL
// so people can see what it does"). It sends the browser on to the app's invite screen, /app/#/invite/<code>, which
// shows who sent it, offers the Play Store with the code as the install referrer, and waits for Friends. A code that
// can't be one goes to the app's front door. No database read, so it's quick and safe to share anywhere. Server build
// only (next.config.ts); in the Android app, App Links open the invite screen directly (appLinks.ts).
import { cleanInvite, inviteAppPath } from "@/lib/inviteLink";
import { APP_PATH } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const code = cleanInvite(new URL(req.url).searchParams.get("code"));
  return new Response(null, {
    status: 307,
    headers: { Location: code ? inviteAppPath(code) : APP_PATH, "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" },
  });
}
