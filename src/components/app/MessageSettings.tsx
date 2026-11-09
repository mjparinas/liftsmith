"use client";
import { WEEKDAYS, defaultDays } from "@/lib/calendar";
import { clampTime, DEFAULT_ON, EMAIL_KINDS, KIND_INFO, PUSH_KINDS, type MessageKind } from "@/lib/messages";
import { askPush, deleteEmail, EMAIL_RE, pushAllowed, pushSupported, syncEmail } from "@/lib/reminders";
import { useApp } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { useEffect, useState } from "react";
import { Button, Section } from "./ui";

type Prefs = NonNullable<Profile["messages"]>;

const startedAt = (p: Prefs) => p.startedAt ?? Date.now();

function Toggle({ id, label, blurb, on, onChange }: { id: string; label: string; blurb: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <p id={`${id}-l`} className="text-sm">{label}</p>
        <p id={`${id}-d`} className="mt-0.5 text-xs text-muted">{blurb}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`${id}-l`}
        aria-describedby={`${id}-d`}
        onClick={() => onChange(!on)}
        className={`press relative h-8 w-14 shrink-0 rounded-full border transition-colors ${on ? "border-accent bg-accent" : "border-line bg-surface"}`}
      >
        <span aria-hidden className={`absolute top-1 h-5.5 w-5.5 rounded-full bg-white transition-all ${on ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}

/**
 * Settings › Reminders. Push and email each have a switch per kind of message (messages.ts). Push is
 * local to the phone; email is double opt-in and every email has an unsubscribe link.
 */
export function MessageSettings() {
  const { profile, stats, setProfile } = useApp();
  const prefs: Prefs = profile.messages ?? { push: {} };
  const save = (p: Partial<Prefs>) => setProfile({ messages: { ...prefs, startedAt: startedAt(prefs), ...p } });
  const native = pushSupported();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [address, setAddress] = useState(prefs.email?.address ?? "");
  const [agree, setAgree] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (native) void pushAllowed().then(setAllowed);
  }, [native]);

  const days = (profile.calendar?.days ?? defaultDays(profile.daysPerWeek)).map((d) => WEEKDAYS[d]).join(", ");
  const [hh, mm] = clampTime(profile.calendar?.time ?? "18:00").split(":").map(Number);
  const time = new Date(2000, 0, 1, hh, mm).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const pushOn = (k: MessageKind) => prefs.push[k] ?? DEFAULT_ON[k];
  const email = prefs.email;
  const emailOn = (k: MessageKind) => email?.kinds[k] ?? DEFAULT_ON[k];

  const setPush = async (k: MessageKind, v: boolean) => {
    if (v && !allowed) {
      const ok = await askPush();
      setAllowed(ok);
      if (!ok) return setStatus("Notifications are off for Liftsmith. You can allow them in your phone's settings.");
    }
    save({ push: { ...prefs.push, [k]: v } });
  };

  const setEmailKind = (k: MessageKind, v: boolean) => {
    if (!email) return;
    save({ email: { ...email, kinds: { ...email.kinds, [k]: v } } });
  };

  const start = async (resubscribe = false) => {
    const a = address.trim().toLowerCase();
    if (!EMAIL_RE.test(a)) return setStatus("That email address doesn't look right.");
    setBusy(true);
    const next: Prefs = { ...prefs, startedAt: startedAt(prefs), email: { address: a, consentAt: Date.now(), status: "pending", kinds: email?.kinds ?? {} } };
    setProfile({ messages: next });
    const s = await syncEmail({ ...profile, messages: next }, stats, { resubscribe });
    setBusy(false);
    if (!s) return setStatus("Couldn't reach the server. We'll try again when you're online.");
    setProfile({ messages: { ...next, email: { ...next.email!, status: s } } });
    setStatus(s === "confirmed" ? "Email updated." : `Check ${a} for a confirmation link. Nothing is sent until you tap it.`);
  };

  const stop = async () => {
    setBusy(true);
    const ok = await deleteEmail();
    setBusy(false);
    if (!ok) return setStatus("Couldn't reach the server. Try again when you're online.");
    save({ email: undefined });
    setAddress("");
    setAgree(false);
    setStatus("Email stopped, and your address is deleted from our server.");
  };

  return (
    <Section title="Reminders">
      <div className="card space-y-4 p-4">
        <p className="text-xs text-muted">
          Reminders follow your training days ({days || "none picked"}) at {time}. Change them under Calendar. Nothing is sent between 9 pm and 8 am, and never more than one a day.
        </p>

        <div>
          <h3 className="text-sm font-semibold">Phone notifications</h3>
          {native ? (
            <>
              {allowed === false && <p className="mt-1 text-xs text-warn">Notifications are off for Liftsmith. Turning one on asks again, or allow them in your phone&apos;s settings.</p>}
              <div className="mt-1 divide-y divide-line">
                {PUSH_KINDS.map((k) => (
                  <Toggle key={k} id={`push-${k}`} label={KIND_INFO[k].label} blurb={k === "reminder" ? "On your training days at your workout time." : KIND_INFO[k].blurb} on={!!allowed && pushOn(k)} onChange={(v) => void setPush(k, v)} />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">Phone notifications are in the Android and iPhone apps. On the web, use email reminders below.</p>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="text-sm font-semibold">Email</h3>
          {!email || email.status === "unsubscribed" ? (
            <div className="mt-2 space-y-3">
              {email?.status === "unsubscribed" && <p className="text-xs text-muted">You unsubscribed from {email.address}. Turn email on again below.</p>}
              <input type="email" inputMode="email" autoComplete="email" value={address} onChange={(e) => setAddress(e.target.value)} className="card w-full px-4 py-3" placeholder="you@example.com" aria-label="Email address" />
              <label className="flex items-start gap-3 text-xs text-muted">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]" />
                <span>Email me workout reminders and progress notes from Liftsmith. I can unsubscribe at any time. Offers stay off unless I turn them on.</span>
              </label>
              <Button kind="ghost" className="w-full" disabled={busy || !agree || !address.trim()} onClick={() => void start(email?.status === "unsubscribed")}>Send confirmation email</Button>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-xs text-muted">
                {email.status === "pending" ? `Waiting for you to confirm ${email.address}. ` : `Sending to ${email.address}. `}
                Every email has an unsubscribe link.
              </p>
              {email.status === "pending" && (
                <Button kind="quiet" className="mt-2 w-full" disabled={busy} onClick={() => void start(true)}>Resend confirmation</Button>
              )}
              <div className="mt-1 divide-y divide-line">
                {EMAIL_KINDS.map((k) => (
                  <Toggle key={k} id={`email-${k}`} label={KIND_INFO[k].label} blurb={k === "reminder" ? "One email on Monday with your training week." : KIND_INFO[k].blurb} on={emailOn(k)} onChange={(v) => setEmailKind(k, v)} />
                ))}
              </div>
              <Button kind="quiet" className="mt-2 w-full" disabled={busy} onClick={() => void stop()}>Stop all email and delete my address</Button>
            </div>
          )}
        </div>
        {status && <p className="text-sm text-muted" role="status">{status}</p>}
      </div>
    </Section>
  );
}
