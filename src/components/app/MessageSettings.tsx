"use client";
import { clockTime, list, t, weekday } from "@/lib/i18n";
import { oops } from "@/lib/juice";
import { defaultDays } from "@/lib/calendar";
import { clampTime, DEFAULT_ON, EMAIL_KINDS, KIND_INFO, PUSH_KINDS, type MessageKind } from "@/lib/messages";
import { askPush, deleteEmail, EMAIL_RE, pushAllowed, pushSupported, syncEmail } from "@/lib/reminders";
import { useApp } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { useEffect, useState } from "react";
import { Button, Section, Switch } from "./ui";

type Prefs = NonNullable<Profile["messages"]>;

const startedAt = (p: Prefs) => p.startedAt ?? Date.now();

function Toggle({ id, label, blurb, on, onChange }: { id: string; label: string; blurb: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <p id={`${id}-l`} className="text-sm">{label}</p>
        <p id={`${id}-d`} className="mt-0.5 text-xs text-muted">{blurb}</p>
      </div>
      <Switch on={on} onChange={onChange} labelledBy={`${id}-l`} describedBy={`${id}-d`} />
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

  const days = (profile.calendar?.days ?? defaultDays(profile.daysPerWeek)).map((d) => weekday(d));
  const [hh, mm] = clampTime(profile.calendar?.time ?? "18:00").split(":").map(Number);
  const time = clockTime(hh, mm);
  const pushOn = (k: MessageKind) => prefs.push[k] ?? DEFAULT_ON[k];
  const email = prefs.email;
  const emailOn = (k: MessageKind) => email?.kinds[k] ?? DEFAULT_ON[k];

  const setPush = async (k: MessageKind, v: boolean) => {
    if (v && !allowed) {
      const ok = await askPush();
      setAllowed(ok);
      if (!ok) return setStatus(t("msg.pushDenied"));
    }
    save({ push: { ...prefs.push, [k]: v } });
  };

  const setEmailKind = (k: MessageKind, v: boolean) => {
    if (!email) return;
    save({ email: { ...email, kinds: { ...email.kinds, [k]: v } } });
  };

  const start = async (resubscribe = false) => {
    const a = address.trim().toLowerCase();
    if (!EMAIL_RE.test(a)) return setStatus(t("msg.badEmail"));
    setBusy(true);
    const next: Prefs = { ...prefs, startedAt: startedAt(prefs), email: { address: a, consentAt: Date.now(), status: "pending", kinds: email?.kinds ?? {} } };
    setProfile({ messages: next });
    const s = await syncEmail({ ...profile, messages: next }, stats, { resubscribe });
    setBusy(false);
    if (!s) {
      oops();
      return setStatus(t("msg.offlineRetry"));
    }
    setProfile({ messages: { ...next, email: { ...next.email!, status: s } } });
    setStatus(s === "confirmed" ? t("msg.updated") : t("msg.check", { email: a }));
  };

  const stop = async () => {
    setBusy(true);
    const ok = await deleteEmail();
    setBusy(false);
    if (!ok) {
      oops();
      return setStatus(t("msg.offline"));
    }
    save({ email: undefined });
    setAddress("");
    setAgree(false);
    setStatus(t("msg.stopped"));
  };

  return (
    <Section title={t("msg.title")}>
      <div className="card space-y-4 p-4">
        <p className="text-xs text-muted">
          {t("msg.intro", { days: days.length ? list(days) : t("msg.noDays"), time, quietFrom: clockTime(21, 0), quietTo: clockTime(8, 0) })}
        </p>

        <div>
          <h3 className="text-sm font-semibold">{t("msg.push")}</h3>
          {native ? (
            <>
              {allowed === false && <p className="mt-1 text-xs text-warn">{t("msg.pushOff")}</p>}
              <div className="mt-1 divide-y divide-line">
                {PUSH_KINDS.map((k) => (
                  <Toggle key={k} id={`push-${k}`} label={KIND_INFO[k].label} blurb={k === "reminder" ? t("msg.reminderPush") : KIND_INFO[k].blurb} on={!!allowed && pushOn(k)} onChange={(v) => void setPush(k, v)} />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">{t("msg.webOnly")}</p>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="text-sm font-semibold">{t("msg.email")}</h3>
          {!email || email.status === "unsubscribed" ? (
            <div className="mt-2 space-y-3">
              {email?.status === "unsubscribed" && <p className="text-xs text-muted">{t("msg.unsubscribed", { email: email.address })}</p>}
              <input type="email" inputMode="email" autoComplete="email" value={address} onChange={(e) => setAddress(e.target.value)} className="card w-full px-4 py-3" placeholder="you@example.com" aria-label={t("msg.address")} />
              <label className="flex items-start gap-3 text-xs text-muted">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]" />
                <span>{t("msg.consent")}</span>
              </label>
              <Button kind="ghost" className="w-full" disabled={busy || !agree || !address.trim()} onClick={() => void start(email?.status === "unsubscribed")}>{t("msg.send")}</Button>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-xs text-muted">
                {t(email.status === "pending" ? "msg.pending" : "msg.sending", { email: email.address })}
              </p>
              {email.status === "pending" && (
                <Button kind="quiet" className="mt-2 w-full" disabled={busy} onClick={() => void start(true)}>{t("msg.resend")}</Button>
              )}
              <div className="mt-1 divide-y divide-line">
                {EMAIL_KINDS.map((k) => (
                  <Toggle key={k} id={`email-${k}`} label={KIND_INFO[k].label} blurb={k === "reminder" ? t("msg.reminderEmail") : KIND_INFO[k].blurb} on={emailOn(k)} onChange={(v) => setEmailKind(k, v)} />
                ))}
              </div>
              <Button kind="quiet" className="mt-2 w-full" disabled={busy} onClick={() => void stop()}>{t("msg.stop")}</Button>
            </div>
          )}
        </div>
        {status && <p className="text-sm text-muted" role="status">{status}</p>}
      </div>
    </Section>
  );
}
