// The link in the confirmation email. GET shows a page with a button; only the button's POST confirms,
// so mail scanners that open every link can't sign anyone up.
import { page } from "@/server/reminderEmails";
import { fields, html, limited, setup } from "@/server/reminderHttp";
import { confirm } from "@/server/reminders";

export async function GET(req: Request) {
  const f = await fields(req);
  return html(
    page("Confirm your email", "Tap the button to start getting workout reminders by email.", {
      action: "/api/reminders/confirm/",
      fields: { s: f.get("s") ?? "", t: f.get("t") ?? "" },
      button: "Confirm my email",
    }),
  );
}

export async function POST(req: Request) {
  if (await limited(req, "confirm", 30)) return html(page("Try again later", "Too many tries from this connection."), 429);
  const s = setup();
  if (!s) return html(page("Not available", "Email reminders aren't set up yet."), 503);
  const f = await fields(req);
  const r = await confirm(f.get("s") ?? "", f.get("t") ?? "", s.store, s.mail, s.env, Date.now());
  if (r === "invalid")
    return html(page("That link didn't work", "It may be old. Turn on email again in the app's Settings to get a new one."), 400);
  return html(page("You're in", "Your welcome email is on its way. Choose which emails you get in the app under Settings, Reminders."));
}
