"use client";

import { useState } from "react";

import { CONTACT_MAX_MESSAGE, CONTACT_TOPICS, REPLY_TIME } from "@/lib/contact";
import { CONTACT_EMAIL } from "@/lib/site";

const field = "min-h-12 w-full rounded-xl border border-line bg-raised px-3 py-2 text-base text-ink";

/** The contact page's form. It posts to /api/feedback/, which emails our inbox with the sender as Reply-To. */
export function ContactForm({ fetcher = fetch }: { fetcher?: typeof fetch }) {
  const [form, setForm] = useState({ email: "", topic: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const topic = CONTACT_TOPICS.find((t) => t.id === form.topic);
    if (!topic) return;
    setState("busy");
    setError("");
    try {
      const res = await fetcher("/api/feedback/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          at: Date.now(),
          kind: topic.kind,
          source: "contact",
          topic: topic.id,
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "Too many messages from here. Please try again in an hour." : "");
      setState("done");
    } catch (err) {
      setError(`${(err as Error).message || "That didn't send."} You can also email us at ${CONTACT_EMAIL}.`);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card flex flex-col gap-3 p-6" role="status">
        <h2 className="text-2xl font-bold">Thanks, we&apos;ve got your message</h2>
        <p className="text-muted">
          A person reads every message, and we&apos;ll reply to <strong className="text-ink">{form.email}</strong> within {REPLY_TIME}.
        </p>
        <button
          type="button"
          className="press inline-flex min-h-12 items-center self-start rounded-2xl border border-line bg-raised px-5 font-semibold"
          onClick={() => {
            setForm((f) => ({ ...f, topic: "", message: "" }));
            setState("idle");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="card flex flex-col gap-4 p-6" aria-labelledby="contact-form-h">
      <h2 id="contact-form-h" className="text-2xl font-bold">
        Send us a message
      </h2>
      <label className="flex flex-col gap-1.5 font-semibold">
        Your email
        <input
          className={field}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={form.email}
          onChange={set("email")}
        />
      </label>
      <label className="flex flex-col gap-1.5 font-semibold">
        What it&apos;s about
        <select className={field} name="topic" required value={form.topic} onChange={set("topic")}>
          <option value="" disabled>
            Pick one
          </option>
          {CONTACT_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 font-semibold">
        Message
        <textarea
          className={`${field} min-h-40`}
          name="message"
          required
          maxLength={CONTACT_MAX_MESSAGE}
          value={form.message}
          onChange={set("message")}
        />
      </label>
      <p className="text-sm text-muted">
        We only use your email to reply. Please don&apos;t send passwords. For a bug, the app&apos;s own Send feedback screen (in Settings)
        can attach your device details and a screenshot.
      </p>
      {error && (
        <p role="alert" className="font-semibold text-bad">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="press btn-primary inline-flex min-h-14 items-center self-start rounded-2xl px-8 text-lg font-semibold"
        disabled={state === "busy"}
      >
        {state === "busy" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
