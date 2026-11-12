// GET /api/connect/<service>/callback/: the service sends the lifter back here after they allow Liftsmith.
// The website goes back to the Connected apps page; the phone apps get a page with a button back into the
// app (liftsmith://connected), which refreshes the page when it comes to the front. Server build only.
import { CLOUD_NAME, isCloud } from "@/lib/cloud";
import { SITE_URL } from "@/lib/site";
import { callback } from "@/server/connect";

type Ctx = { params: Promise<{ provider: string }> };

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(title: string, line: string, back: string | null): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;color:#e8edf5;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}a{display:inline-block;margin-top:20px;padding:14px 24px;border-radius:16px;background:#4c8dff;color:#06101f;font-weight:700;text-decoration:none}</style></head>
<body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(line)}</p>${back ? `<a href="${escapeHtml(back)}">Back to Liftsmith</a>` : ""}</main></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (!isCloud(provider)) return new Response("Not found", { status: 404 });
  const q = new URL(req.url).searchParams;
  const name = CLOUD_NAME[provider];
  // The lifter pressed Cancel (or Deny) on the service's page.
  if (q.get("error"))
    return page(`${name} not connected`, "Nothing was shared. You can connect it any time from Connected apps.", "liftsmith://connected");
  const r = await callback(provider, q.get("state") ?? "", q.get("code") ?? "").catch(() => null);
  if (!r)
    return page(
      `${name} didn't connect`,
      "That link has expired or was already used. Go back to Liftsmith and try again.",
      "liftsmith://connected",
    );
  if (r.platform === "web") return Response.redirect(`${SITE_URL}/app/#/connections/${provider}`, 302);
  return page(`${name} is connected`, "You can close this page and go back to Liftsmith.", "liftsmith://connected");
}
