"use client";

import { useState } from "react";

import { SCREEN_TITLE } from "@/components/titles";
import { track } from "@/lib/analytics";
import { diagnostics } from "@/lib/diag";
import { buildFeedback, MAX_MESSAGE, sendFeedback, shrinkImage, type FeedbackKind } from "@/lib/feedback";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";

import { go } from "./router";
import { Button, Chip, ScreenHeader, Section } from "./ui";

const KINDS: FeedbackKind[] = ["bug", "idea", "other"];

/** Send feedback or report a bug (Settings › Send feedback, #/feedback). Works offline: reports wait in a queue. */
export function Feedback() {
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [shot, setShot] = useState<string | undefined>();
  const [includeDiag, setIncludeDiag] = useState(true);
  const [showDiag, setShowDiag] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "queued">("idle");
  const placeholder = t(`fb.${kind}.hint`);

  const submit = async () => {
    setState("sending");
    const ok = await sendFeedback(buildFeedback({ kind, message, email, screenshot: shot, includeDiag }));
    track("feedback_sent", { kind });
    haptic("success");
    setState(ok ? "sent" : "queued");
  };

  if (state === "sent" || state === "queued") {
    return (
      <div className="pb-24 pt-10 text-center">
        <p className="text-4xl" aria-hidden>
          {state === "sent" ? "✓" : "⏳"}
        </p>
        <h1 className={`mt-3 ${SCREEN_TITLE}`}>{state === "sent" ? t("fb.sent") : t("fb.queued")}</h1>
        <p className="mt-2 text-muted">{email ? t("fb.replyEmail") : t("fb.read")}</p>
        <Button className="mt-6" onClick={() => go("settings")}>
          {t("fb.backSettings")}
        </Button>
      </div>
    );
  }

  const d = diagnostics();
  return (
    <div className="pb-24">
      <ScreenHeader back={{ label: t("train.back"), onClick: () => go("settings") }} title={t("fb.title")} />
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("fb.kind")}>
        {KINDS.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {t(`fb.${k}`)}
          </Chip>
        ))}
      </div>
      <Section title={t("fb.message")}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
          rows={6}
          placeholder={placeholder}
          aria-label={t("fb.message")}
          className="card w-full resize-y px-4 py-3"
        />
      </Section>
      <Section title={t("fb.email")}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("fb.emailHint")}
          aria-label={t("fb.emailLabel")}
          className="card w-full px-4 py-3"
        />
      </Section>
      <Section title={t("fb.shot")}>
        {shot ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt={t("fb.shotAlt")} className="h-24 rounded-xl border border-line" />
            <Button kind="quiet" onClick={() => setShot(undefined)}>
              {t("fb.remove")}
            </Button>
          </div>
        ) : (
          <label className="press card flex min-h-11 cursor-pointer items-center justify-center px-4 py-3 text-sm font-semibold">
            {t("fb.attach")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setShot(await shrinkImage(f));
              }}
            />
          </label>
        )}
      </Section>
      <Section title={t("fb.device")}>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={includeDiag}
            onChange={(e) => setIncludeDiag(e.target.checked)}
            className="size-5 accent-[var(--color-accent)]"
          />
          <span>{t("fb.include")}</span>
        </label>
        <button type="button" onClick={() => setShowDiag(!showDiag)} className="press mt-1 min-h-11 text-sm text-muted underline">
          {showDiag ? t("fb.hide") : t("fb.see")}
        </button>
        {showDiag && (
          <pre className="card mt-2 overflow-x-auto whitespace-pre-wrap p-3 text-xs text-muted">{`App ${d.version} on ${d.platform}\n${d.screen} · ${d.language} · ${d.timeZone}\n${d.userAgent}\n${d.errors.length ? d.errors.join("\n") : t("fb.noErrors")}`}</pre>
        )}
        <p className="mt-2 text-xs text-faint">{t("fb.never")}</p>
      </Section>
      <Button className="mt-6 w-full py-4 text-lg" disabled={!message.trim() || state === "sending"} onClick={submit}>
        {state === "sending" ? t("fb.sending") : t("fb.send")}
      </Button>
    </div>
  );
}
