// Two-step sign-in for the signed-in staff member (src/server/twoFactor.ts). Reachable before the second step is
// passed, since someone who hasn't set it up has no code yet; the rest of the panel is not.
// GET: the state. POST {action}: "start" {restart?} (the QR link: the unconfirmed one if setup was started before, else or with restart a new one), "confirm" {code} (turns it on, returns the
// recovery codes once), "verify" {code} (passes the second step for this sign-in), "regenerate" {code} (new
// recovery codes), "disable" {code}, and for admins "reset" {email} (for someone who lost their phone and codes).
import { audit, getStaffSession, json, notFound, roleOf, sameOrigin } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import {
  checkSecondFactor,
  confirmEnrolment,
  disableTwoFactor,
  enrolledEmails,
  markSessionPassed,
  regenerateBackupCodes,
  startEnrolment,
  twoFactorMode,
  twoFactorState,
} from "@/server/twoFactor";

export const dynamic = "force-dynamic";

const TOO_MANY = "Too many tries. Wait ten minutes and try again.";
const BAD = "That code didn't work. Check the code in your authenticator app, or use a recovery code.";

export async function GET(req: Request) {
  const s = await getStaffSession(req);
  if (!s) return notFound();
  const state = await twoFactorState(s.email);
  const others = s.ready && s.role === "admin" ? [...(await enrolledEmails())].filter((e) => e !== s.email && roleOf(e)) : [];
  return json(200, { ...state, email: s.email, role: s.role, ready: s.ready, required: twoFactorMode() === "required", others });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: "Bad origin" });
  const s = await getStaffSession(req);
  if (!s) return notFound();
  const body = await readBody(req);
  const code = typeof body?.code === "string" ? body.code.slice(0, 40) : "";
  const action = body?.action;

  if (action === "start") {
    if (s.twoFactor) return json(409, { error: "Two-step sign-in is already on." });
    return json(200, await startEnrolment(s.email, body?.restart === true));
  }

  if (action === "confirm") {
    if (s.twoFactor) return json(409, { error: "Two-step sign-in is already on." });
    const done = await confirmEnrolment(s.email, code, s.sessionHash);
    if (done.result === "limited") return json(429, { error: TOO_MANY });
    if (done.result === "bad" || !done.codes)
      return json(400, { error: "That code didn't match. Check the code in your authenticator app, or start over for a new QR code." });
    await audit(s.email, "2fa.enable", s.email);
    return json(200, { codes: done.codes });
  }

  if (action === "verify") {
    if (!s.twoFactor) return json(409, { error: "Two-step sign-in isn't on for this address." });
    const step = await checkSecondFactor(s.email, code);
    if (step === "limited") return json(429, { error: TOO_MANY });
    if (step === "bad") {
      await import("@/server/alerts").then((a) => a.reportStaffFailure(s.email, "code"));
      return json(400, { error: BAD });
    }
    await markSessionPassed(s.sessionHash);
    await audit(s.email, "2fa.verify", s.email);
    return json(200, { ok: true });
  }

  // Changing an existing setup needs the second step passed on this session, and a fresh code.
  if (!s.ready) return json(409, { error: "Enter the code from your authenticator app first." });

  if (action === "reset") {
    if (s.role !== "admin") return notFound();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email === s.email) return json(400, { error: "Pick someone else's address. To turn off your own, use a code." });
    await disableTwoFactor(email, null);
    await audit(s.email, "2fa.reset", email);
    return json(200, { ok: true });
  }

  if (action === "regenerate" || action === "disable") {
    if (!s.twoFactor) return json(409, { error: "Two-step sign-in isn't on." });
    const step = await checkSecondFactor(s.email, code);
    if (step === "limited") return json(429, { error: TOO_MANY });
    if (step === "bad") return json(400, { error: BAD });
    if (action === "regenerate") {
      await audit(s.email, "2fa.backup-codes", s.email);
      return json(200, { codes: await regenerateBackupCodes(s.email) });
    }
    await disableTwoFactor(s.email, s.sessionHash);
    await audit(s.email, "2fa.disable", s.email);
    return json(200, { ok: true });
  }

  return json(400, { error: "Unknown action" });
}
