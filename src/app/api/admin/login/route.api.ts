// POST /api/admin/login/ {email}: emails a one-time sign-in link to an admin. GET ?token=: signs in from it.
import { adminEmails, finishSignIn, json, notFound, sameOrigin, startSignIn, supportEmails } from "@/server/adminAuth";

const off = () => !adminEmails().size && !supportEmails().size;

export async function POST(req: Request) {
  if (off()) return notFound();
  if (!sameOrigin(req)) return json(403, { error: "Bad origin" });
  let email = "";
  try {
    const raw = await req.text();
    if (raw.length > 1000) return json(413, { error: "Too large" });
    email = String((JSON.parse(raw) as { email?: unknown }).email ?? "");
  } catch {
    return json(400, { error: "Not JSON" });
  }
  if (!email.includes("@") || email.length > 254) return json(400, { error: "Enter an email address." });
  return startSignIn(req, email);
}

export async function GET(req: Request) {
  if (off()) return notFound();
  return finishSignIn(req);
}
