// GET /u/<handle>/ (rewritten here): a public profile's page. Plain HTML with no scripts and its own strict CSP
// (publicProfile.ts). Anything that isn't a public profile gets the same noindex "isn't public" page. Server build only.
import { GONE_HEADERS, handleFrom, langFrom, PROFILE_HEADERS, profileHtml, publicProfile, unitFrom } from "@/server/publicProfile";
import { withPageInvite } from "@/server/siteFrame";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = await publicProfile(handleFrom(req)).catch(() => null);
  return new Response(withPageInvite(profileHtml(p, langFrom(req), unitFrom(req)), req), {
    status: p ? 200 : 404,
    headers: p ? PROFILE_HEADERS : GONE_HEADERS,
  });
}
