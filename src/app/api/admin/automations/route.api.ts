// GET /api/admin/automations/: the alert and morning digest switches (staff). PUT {instant, digest} saves them
// (admins, audited). POST {action: "test"} sends a test alert to every admin now, and {action: "digest"} today's
// morning digest (admins).
import { adminEmails, audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { alertSettings, resendMailer, saveAlertSettings, sendAlert } from "@/server/alerts";
import { digestRecipients, sendDigest } from "@/server/digest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, {
    settings: await alertSettings(),
    recipients: [...adminEmails()],
    digestTo: digestRecipients(),
    canSend: resendMailer() != null,
  });
}

export async function PUT(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body || typeof body.instant !== "boolean" || typeof body.digest !== "boolean")
    return json(400, { error: "Say instant and digest: true or false." });
  await saveAlertSettings({ instant: body.instant, digest: body.digest });
  await audit(gate.staff.email, "alerts.save", null, { instant: body.instant, digest: body.digest });
  return json(200, { ok: true });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (body?.action === "digest") {
    const n = await sendDigest({ force: true });
    await audit(gate.staff.email, "alerts.digest", null, { sent: n });
    return n
      ? json(200, { ok: true })
      : json(409, { error: "Nothing was sent: email isn't set up (RESEND_API_KEY) or ADMIN_EMAILS and DIGEST_TO are empty." });
  }
  if (body?.action !== "test") return json(400, { error: "Unknown action" });
  const now = Date.now();
  const sent = await sendAlert(
    `test:${now}`,
    {
      subject: "Test alert",
      lines: [`${gate.staff.email} sent this from the Automations tab, so alerts reach you.`],
      path: "/admin/?tab=Automations",
    },
    { now },
  );
  await audit(gate.staff.email, "alerts.test", null, { sent });
  return sent ? json(200, { ok: true }) : json(409, { error: "Nothing was sent: alerts are off, or email isn't set up (RESEND_API_KEY)." });
}
