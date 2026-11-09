"use client";
import { track } from "@/lib/analytics";
import { diagnostics } from "@/lib/diag";
import { buildFeedback, MAX_MESSAGE, sendFeedback, shrinkImage, type FeedbackKind } from "@/lib/feedback";
import { haptic } from "@/lib/juice";
import { useState } from "react";
import { go } from "./router";
import { Button, Chip, Section } from "./ui";

const KINDS: [FeedbackKind, string, string][] = [
  ["bug", "Report a bug", "What happened, and what did you expect?"],
  ["idea", "Suggest an idea", "What would make Liftsmith better for you?"],
  ["other", "Something else", "Tell us anything."],
];

/** Send feedback or report a bug (Settings › Send feedback, #/feedback). Works offline: reports wait in a queue. */
export function Feedback() {
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [shot, setShot] = useState<string | undefined>();
  const [includeDiag, setIncludeDiag] = useState(true);
  const [showDiag, setShowDiag] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "queued">("idle");
  const placeholder = KINDS.find((k) => k[0] === kind)![2];

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
        <p className="text-4xl" aria-hidden>{state === "sent" ? "✓" : "⏳"}</p>
        <h1 className="mt-3 text-2xl font-bold">{state === "sent" ? "Thanks, it's on its way" : "Saved, it'll send when you're online"}</h1>
        <p className="mt-2 text-muted">{email ? "We read every report and may reply by email." : "We read every report."}</p>
        <Button className="mt-6" onClick={() => go("settings")}>Back to settings</Button>
      </div>
    );
  }

  const d = diagnostics();
  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("settings")} className="press -ml-2 pt-2 text-muted">‹ Settings</button>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">Send feedback</h1>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Kind of feedback">
        {KINDS.map(([k, label]) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{label}</Chip>)}
      </div>
      <Section title="Message">
        <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))} rows={6} placeholder={placeholder} aria-label="Message" className="card w-full resize-y px-4 py-3" />
      </Section>
      <Section title="Your email (optional)">
        <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="So we can reply" aria-label="Your email" className="card w-full px-4 py-3" />
      </Section>
      <Section title="Screenshot (optional)">
        {shot ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt="Attached screenshot" className="h-24 rounded-xl border border-line" />
            <Button kind="quiet" onClick={() => setShot(undefined)}>Remove</Button>
          </div>
        ) : (
          <label className="press card flex min-h-11 cursor-pointer items-center justify-center px-4 py-3 text-sm font-semibold">
            Attach a screenshot
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setShot(await shrinkImage(f)); }} />
          </label>
        )}
      </Section>
      <Section title="Device details">
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={includeDiag} onChange={(e) => setIncludeDiag(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
          <span>Include app version, device and recent errors</span>
        </label>
        <button type="button" onClick={() => setShowDiag(!showDiag)} className="press mt-1 min-h-11 text-sm text-muted underline">{showDiag ? "Hide" : "See"} what&apos;s included</button>
        {showDiag && (
          <pre className="card mt-2 overflow-x-auto whitespace-pre-wrap p-3 text-xs text-muted">{`App ${d.version} on ${d.platform}\n${d.screen} · ${d.language} · ${d.timeZone}\n${d.userAgent}\n${d.errors.length ? d.errors.join("\n") : "No recent errors"}`}</pre>
        )}
        <p className="mt-2 text-xs text-faint">Never your workouts, health data or name.</p>
      </Section>
      <Button className="mt-6 w-full py-4 text-lg" disabled={!message.trim() || state === "sending"} onClick={submit}>{state === "sending" ? "Sending…" : "Send"}</Button>
    </div>
  );
}
