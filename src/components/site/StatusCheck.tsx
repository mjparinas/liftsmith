"use client";

import { useEffect, useState } from "react";

import { checkHealth, STATE_TEXT, type ServiceState } from "@/lib/status";

// The dot is a status colour token, and the title says the same in words (colour is never the only cue).
const DOT: Record<ServiceState, string> = {
  checking: "bg-faint",
  ok: "bg-good",
  degraded: "bg-warn",
  unreachable: "bg-bad",
};

/** The live result of /api/health/, checked when the page opens and again on demand. */
export function StatusCheck() {
  const [state, setState] = useState<ServiceState>("checking");
  const [at, setAt] = useState<string | null>(null);

  const done = (next: Exclude<ServiceState, "checking">) => {
    setState(next);
    setAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  };

  // Starts in "checking", so the first check only sets state once it answers.
  useEffect(() => {
    void checkHealth().then(done);
  }, []);

  const again = () => {
    setState("checking");
    void checkHealth().then(done);
  };

  const text = STATE_TEXT[state];
  return (
    <section aria-live="polite" aria-labelledby="status-h" className="card flex flex-col gap-3 p-6" data-state={state}>
      <h2 id="status-h" className="flex items-center gap-3 text-2xl font-bold">
        <span aria-hidden className={`inline-block size-4 shrink-0 rounded-full ${DOT[state]}`} />
        {text.title}
      </h2>
      <p className="text-muted">{text.body}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="press inline-flex min-h-12 items-center rounded-2xl border border-line bg-raised px-5 font-semibold"
          onClick={again}
          disabled={state === "checking"}
        >
          Check again
        </button>
        {at && <span className="text-sm text-muted">Last checked at {at}</span>}
      </div>
    </section>
  );
}
