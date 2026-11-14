"use client";

import { useEffect, useState } from "react";

import { useAccount } from "@/lib/auth";
import { trainingDays } from "@/lib/calendar";
import { clockTime, list, t, weekday } from "@/lib/i18n";
import { oops } from "@/lib/juice";
import { clampTime, DEFAULT_ON, EMAIL_KINDS, PUSH_KINDS, type MessageKind } from "@/lib/messages";
import { askPush, deleteEmail, pushAllowed, pushSupported, syncEmail } from "@/lib/reminders";
import { useApp } from "@/lib/store";
import type { Profile } from "@/lib/types";

import { go } from "./router";
import { Button, Section, Switch } from "./ui";

type Prefs = NonNullable<Profile["messages"]>;

const startedAt = (p: Prefs) => p.startedAt ?? Date.now();

function Toggle({
  id,
  label,
  blurb,
  on,
  onChange,
}: {
  id: string;
  label: string;
  blurb: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <p id={`${id}-l`} className="text-sm">
          {label}
        </p>
        <p id={`${id}-d`} className="mt-0.5 text-xs text-muted">
          {blurb}
        </p>
      </div>
      <Switch on={on} onChange={onChange} labelledBy={`${id}-l`} describedBy={`${id}-d`} />
    </div>
  );
}

/**
 * Settings › Reminders. Push and email each have a switch per kind of message (messages.ts). Push is
 * local to the phone. Email is one switch that sends to the signed-in account's address (already verified,
 * so nothing to type or confirm); signed out, the switch opens sign-in. Every email has an unsubscribe link.
 */
export function MessageSettings() {
  const { profile, stats, setProfile } = useApp();
  const prefs: Prefs = profile.messages ?? { push: {} };
  const save = (p: Partial<Prefs>) => setProfile({ messages: { ...prefs, startedAt: startedAt(prefs), ...p } });
  const native = pushSupported();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  // Email goes to the signed-in account's address, which sign-in already verified: nothing to type.
  const accountEmail = useAccount((x) => x.account?.email?.trim().toLowerCase() || null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (native) void pushAllowed().then(setAllowed);
  }, [native]);

  const days = trainingDays(profile).map((d) => weekday(d));
  const [hh, mm] = clampTime(profile.calendar?.time ?? "18:00")
    .split(":")
    .map(Number);
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

  const emailing = !!email && email.status !== "unsubscribed";

  const start = async (resubscribe: boolean) => {
    // Signed out there's no address we know, so the switch opens sign-in instead of asking for one.
    if (!accountEmail) return go("account");
    setBusy(true);
    setStatus(null);
    // Turning the switch on, next to the line that says what's sent and where, is the consent.
    const next: Prefs = {
      ...prefs,
      startedAt: startedAt(prefs),
      email: { address: accountEmail, consentAt: Date.now(), status: "pending", kinds: email?.kinds ?? {} },
      emailOff: undefined,
    };
    setProfile({ messages: next });
    const s = await syncEmail({ ...profile, messages: next }, stats, { resubscribe });
    setBusy(false);
    if (!s) {
      oops();
      return setStatus(t("msg.offlineRetry"));
    }
    setProfile({ messages: { ...next, email: { ...next.email!, status: s } } });
    if (s === "pending") setStatus(t("msg.check", { email: accountEmail }));
  };

  /** An older subscription still waiting for its confirmation link (typed before email followed the account). */
  const resend = async () => {
    if (!email) return;
    setBusy(true);
    const s = await syncEmail(profile, stats, { resubscribe: true });
    setBusy(false);
    if (!s) {
      oops();
      return setStatus(t("msg.offlineRetry"));
    }
    setProfile({ messages: { ...prefs, email: { ...email, status: s } } });
    setStatus(s === "pending" ? t("msg.check", { email: email.address }) : null);
  };

  const stop = async () => {
    setBusy(true);
    const ok = await deleteEmail();
    setBusy(false);
    if (!ok) {
      oops();
      return setStatus(t("msg.offline"));
    }
    // Remembered on the profile (it syncs), so email stays off on every device instead of coming back on by default.
    save({ email: undefined, emailOff: true });
    setStatus(t("msg.stopped"));
  };

  return (
    <Section title={t("msg.title")}>
      <div className="card space-y-4 p-4">
        <p className="text-xs text-muted">
          {t("msg.intro", {
            days: days.length ? list(days) : t("msg.noDays"),
            time,
            quietFrom: clockTime(21, 0),
            quietTo: clockTime(8, 0),
          })}
        </p>

        <div>
          <h3 className="text-sm font-semibold">{t("msg.push")}</h3>
          {native ? (
            <>
              {allowed === false && <p className="mt-1 text-xs text-warn">{t("msg.pushOff")}</p>}
              <div className="mt-1 divide-y divide-line">
                {PUSH_KINDS.map((k) => (
                  <Toggle
                    key={k}
                    id={`push-${k}`}
                    label={t(`msgKind.${k}`)}
                    blurb={t(k === "reminder" ? "msg.reminderPush" : `msgKind.${k}.blurb`)}
                    on={!!allowed && pushOn(k)}
                    onChange={(v) => void setPush(k, v)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">{t("msg.webOnly")}</p>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="text-sm font-semibold">{t("msg.email")}</h3>
          <Toggle
            id="email-on"
            label={t("msg.emailMe")}
            blurb={
              emailing
                ? t(email.status === "pending" ? "msg.pending" : "msg.sending", { email: email.address })
                : accountEmail
                  ? t("msg.emailTo", { email: accountEmail })
                  : t("msg.signInFirst")
            }
            on={emailing}
            onChange={(v) => {
              if (busy) return;
              void (v ? start(!!email) : stop());
            }}
          />
          {emailing && (
            <>
              {email.status === "pending" && (
                <Button kind="quiet" className="w-full" disabled={busy} onClick={() => void resend()}>
                  {t("msg.resend")}
                </Button>
              )}
              <div className="mt-1 divide-y divide-line border-t border-line">
                {EMAIL_KINDS.map((k) => (
                  <Toggle
                    key={k}
                    id={`email-${k}`}
                    label={t(`msgKind.${k}`)}
                    blurb={t(k === "reminder" ? "msg.reminderEmail" : `msgKind.${k}.blurb`)}
                    on={emailOn(k)}
                    onChange={(v) => setEmailKind(k, v)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {status && (
          <p className="text-sm text-muted" role="status">
            {status}
          </p>
        )}
      </div>
    </Section>
  );
}
