// Unsubscribe from every reminder email. GET (the footer link) shows a page with a button; POST is the
// button and also RFC 8058 one-click unsubscribe from mail apps (List-Unsubscribe-Post).
import { page } from "@/server/reminderEmails";
import { unsubscribe } from "@/server/reminders";
import { fields, html, setup } from "@/server/reminderHttp";

export async function GET(req: Request) {
  const f = await fields(req);
  return html(page("Unsubscribe", "Stop all reminder emails? You can turn them back on in the app any time.", { action: "/api/reminders/unsubscribe/", fields: { s: f.get("s") ?? "", t: f.get("t") ?? "" }, button: "Unsubscribe" }));
}

export async function POST(req: Request) {
  const s = setup();
  if (!s) return html(page("Not available", "Email reminders aren't set up yet."), 503);
  const f = await fields(req);
  const ok = await unsubscribe(f.get("s") ?? "", f.get("t") ?? "", s.store, s.mail, s.env, Date.now());
  if (!ok) return html(page("That link didn't work", "Turn email off in the app under Settings, Reminders, or reply to any email and we'll remove you."), 400);
  return html(page("You're unsubscribed", "You won't get any more reminder emails. To turn them back on, use Settings in the app."));
}
