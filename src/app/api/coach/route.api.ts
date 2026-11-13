// Trainer mode (src/server/coach.ts). Signed in only. Server build only.
// GET: your invite, clients and coaches; GET ?client=<id>: that client's training, if they're your client.
// POST { action }: "invite" (a fresh code), "cancel" (no code), "preview" and "join" (a client entering a
// code), "unlink" (either side ends it, with `id`), "assign" (a coach gives a client a routine: `client`, `name`,
// `code`), "unassign" (with the plan's `id`), "setup" (what the coach's new clients start setup with: `setup`) and
// "note" (the coach's note to a client: `client`, `text`; empty text clears it), "send" (a chat message to the other
// side: `id`, `text`), "targets" (a coach's daily calories and protein for a client: `client`, `kcal`, `protein`;
// both empty clears them), "share" (a client shares body data with a coach or stops: `id`, `on`), "alerts" (a coach's
// alerts on or off: `on`), "role" (personal trainer or coach: `role`) and "pushToken" (this phone's push token, for coaching pushes without Friends).
// Booking (coachBooking.ts): "slots" (open times: `slot` with start, minutes, place, weeks and maybe client),
// "book" (a client: `id`) and "cancelSlot" (either side: `id`), each with `label`, the time as the phone shows it, for
// the push. The overview adds the coach's `slots` and the client's `sessions` (booked and open); a client's view adds
// `slots`.
// GET ?chat=<id>[&before=<ms>]: the messages with that person, which marks them read.
// Check-ins (coachForms.ts): "form" (save a form: `form`), "deleteForm" (`id`), "sendForm" (`client`, `id`),
// "repeatForm" (`client`, `id`, or no `id` to stop) and "answer" (the client: `id`, `answers`); GET ?checkin=<id> is
// one of the client's to fill in. The overview adds the coach's `forms` and the client's waiting `checkins`, and a
// client's view adds `checkins`, `repeat` and the coach's `forms`.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { accountInfo } from "@/server/accounts";
import {
  assignPlan,
  cancelInvite,
  clientView,
  isAccountId,
  joinCoach,
  makeInvite,
  messages,
  overview,
  previewInvite,
  removePlan,
  roleOf,
  saveSetup,
  sendMessage,
  setAlerts,
  setNote,
  setRole,
  setShare,
  setTargets,
  unlink,
} from "@/server/coach";
import { addSlots, book, cancelSlot, clientSlots, coachSlots, slotsWith } from "@/server/coachBooking";
import {
  answerCheckin,
  checkinFor,
  checkinsOf,
  deleteForm,
  forms,
  pendingCheckins,
  saveForm,
  sendForm,
  setRepeat,
} from "@/server/coachForms";
import {
  checkoutFor,
  clientPrices,
  dashboardUrl,
  endPair,
  onboardUrl,
  payAccount,
  payConfig,
  paymentsOf,
  refreshAccount,
  setPrice,
  stopMonthly,
} from "@/server/coachPay";
import { rateLimit } from "@/server/db";
import { saveToken } from "@/server/push";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const q = new URL(req.url).searchParams;
  const chat = q.get("chat");
  if (chat !== null) {
    const r = await messages(s.accountId, chat, q.has("before") ? Number(q.get("before")) : undefined);
    return "error" in r ? reply(req, 404, r) : reply(req, 200, r);
  }
  const checkin = q.get("checkin");
  if (checkin !== null) {
    const c = await checkinFor(s.accountId, checkin);
    return c ? reply(req, 200, { checkin: c }) : reply(req, 404, { error: "gone" });
  }
  const client = q.get("client");
  if (client === null) {
    const [o, mine, pending, slots, sessions] = await Promise.all([
      overview(s.accountId),
      forms(s.accountId),
      pendingCheckins(s.accountId),
      coachSlots(s.accountId),
      clientSlots(s.accountId),
    ]);
    // Payments show only once Stripe Connect is set up on the server (coachPay.ts).
    const pay = payConfig() ? { account: await payAccount(s.accountId), prices: await clientPrices(s.accountId) } : null;
    return reply(req, 200, { ...o, forms: mine, checkins: pending, slots, sessions, pay });
  }
  if (!isAccountId(client)) return reply(req, 400, { error: "Bad request." });
  const view = await clientView(s.accountId, client);
  if (!view) return reply(req, 404, { error: "gone" });
  const [mine, sent, slots] = await Promise.all([forms(s.accountId), checkinsOf(s.accountId, client), slotsWith(s.accountId, client)]);
  const pay = payConfig() ? { account: await payAccount(s.accountId), ...(await paymentsOf(s.accountId, client)) } : null;
  return reply(req, 200, { ...view, ...sent, forms: mine, slots, pay, role: await roleOf(s.accountId) });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req)) as
    | {
        action?: unknown;
        code?: unknown;
        id?: unknown;
        client?: unknown;
        name?: unknown;
        setup?: unknown;
        text?: unknown;
        via?: unknown;
        on?: unknown;
        token?: unknown;
        platform?: unknown;
        lang?: unknown;
        kcal?: unknown;
        protein?: unknown;
        form?: unknown;
        answers?: unknown;
        role?: unknown;
        slot?: Record<string, unknown>;
        label?: unknown;
        amount?: unknown;
        kind?: unknown;
      }
    | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  switch (body.action) {
    case "invite":
      return reply(req, 200, { invite: await makeInvite(s.accountId, Date.now(), undefined, body.via) });
    case "cancel":
      await cancelInvite(s.accountId);
      return reply(req, 200, { ok: true });
    case "preview":
    case "join": {
      const r = body.action === "join" ? await joinCoach(s.accountId, body.code) : await previewInvite(s.accountId, body.code);
      if ("error" in r) return reply(req, r.error === "slow" ? 429 : r.error === "unknown" ? 404 : 409, r);
      return reply(req, 200, r);
    }
    case "assign": {
      const r = await assignPlan(s.accountId, body.client, body.name, body.code);
      if ("error" in r) return reply(req, r.error === "notClient" ? 404 : r.error === "full" ? 409 : 400, r);
      return reply(req, 200, { plan: r });
    }
    case "setup":
      return reply(req, 200, { setup: await saveSetup(s.accountId, body.setup) });
    case "note": {
      const r = await setNote(s.accountId, body.client, body.text);
      if (r && "error" in r) return reply(req, 404, r);
      return reply(req, 200, { note: r });
    }
    case "targets": {
      const r = await setTargets(s.accountId, body.client, body.kcal, body.protein);
      if (r && "error" in r) return reply(req, 404, r);
      return reply(req, 200, { targets: r });
    }
    case "form": {
      const r = await saveForm(s.accountId, body.form);
      if ("error" in r) return reply(req, r.error === "full" ? 409 : 400, r);
      return reply(req, 200, { form: r });
    }
    case "deleteForm":
      await deleteForm(s.accountId, body.id);
      return reply(req, 200, { ok: true });
    case "sendForm":
    case "repeatForm": {
      const r =
        body.action === "sendForm"
          ? await sendForm(s.accountId, body.client, body.id)
          : await setRepeat(s.accountId, body.client, body.id ?? null);
      if (r && "error" in r) return reply(req, r.error === "notClient" ? 404 : 400, r);
      return reply(req, 200, body.action === "sendForm" ? { checkin: r } : { repeat: r });
    }
    case "answer": {
      const r = await answerCheckin(s.accountId, body.id, body.answers);
      if ("error" in r) return reply(req, r.error === "unknown" ? 404 : r.error === "answered" ? 409 : 400, r);
      return reply(req, 200, { checkin: r });
    }
    case "send": {
      const r = await sendMessage(s.accountId, body.id, body.text);
      if ("error" in r) return reply(req, r.error === "slow" ? 429 : r.error === "empty" ? 400 : 404, r);
      return reply(req, 200, { message: r });
    }
    case "share": {
      const r = await setShare(s.accountId, body.id, body.on);
      if (typeof r === "object") return reply(req, 404, r);
      return reply(req, 200, { on: r });
    }
    case "slots": {
      const r = await addSlots(s.accountId, body.slot && typeof body.slot === "object" ? body.slot : {});
      if ("error" in r)
        return reply(req, r.error === "notClient" ? 404 : r.error === "full" ? 409 : 400, r.error === "full" ? { error: "slotsFull" } : r);
      return reply(req, 200, { slots: r });
    }
    case "book": {
      const r = await book(s.accountId, body.id, body.label);
      // Booked by someone else a moment ago, or removed: either way, pick another time.
      if ("error" in r) return reply(req, 409, { error: "taken" });
      return reply(req, 200, { slot: r });
    }
    case "cancelSlot": {
      const r = await cancelSlot(s.accountId, body.id, body.label);
      return "error" in r ? reply(req, 409, { error: "taken" }) : reply(req, 200, r);
    }
    case "payOnboard":
    case "payRefresh":
    case "payDashboard":
    case "payCheckout":
    case "payStop": {
      const cfg = payConfig();
      if (!cfg) return reply(req, 503, { error: "Payments aren't set up yet." });
      if (!(await rateLimit(`coachpay:${s.accountId}`, 60, 3_600_000).catch(() => true))) return reply(req, 429, { error: "slow" });
      try {
        if (body.action === "payOnboard") {
          const a = await accountInfo(s.accountId);
          return reply(req, 200, { url: await onboardUrl(cfg, s.accountId, a?.email ?? null) });
        }
        if (body.action === "payRefresh") return reply(req, 200, { account: await refreshAccount(cfg, s.accountId) });
        if (body.action === "payDashboard") return reply(req, 200, { url: await dashboardUrl(cfg, s.accountId) });
        if (body.action === "payStop") return reply(req, 200, { ok: await stopMonthly(cfg, s.accountId, body.id) });
        const r = await checkoutFor(cfg, s.accountId, body.id);
        return typeof r === "string" ? reply(req, 200, { url: r }) : reply(req, 409, r);
      } catch {
        return reply(req, 502, { error: "stripe" });
      }
    }
    case "price": {
      const r = await setPrice(s.accountId, body.client, body.amount, body.kind);
      if (r && "error" in r) return reply(req, r.error === "notClient" ? 404 : 400, r);
      return reply(req, 200, { price: r });
    }
    case "role":
      return reply(req, 200, { role: await setRole(s.accountId, body.role) });
    case "alerts":
      return reply(req, 200, { on: await setAlerts(s.accountId, body.on) });
    case "pushToken": {
      const str = (x: unknown) => (typeof x === "string" ? x : "");
      return (await saveToken(s.accountId, str(body.token), str(body.platform), str(body.lang)))
        ? reply(req, 200, { ok: true })
        : reply(req, 400, { error: "token" });
    }
    case "unassign":
      await removePlan(s.accountId, body.id);
      return reply(req, 200, { ok: true });
    case "unlink":
      if (!isAccountId(body.id)) return reply(req, 400, { error: "Bad request." });
      // A monthly plan between them ends first, so nobody keeps paying (coachPay.ts).
      await endPair(s.accountId, body.id).catch(() => null);
      await endPair(body.id, s.accountId).catch(() => null);
      await unlink(s.accountId, body.id);
      return reply(req, 200, { ok: true });
    default:
      return reply(req, 400, { error: "Bad request." });
  }
}
