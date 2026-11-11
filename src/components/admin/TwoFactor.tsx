"use client";

// Two-step sign-in for the admin panel (ported from Gradelings' TwoFactor.tsx; src/server/twoFactor.ts): the
// screen staff see after the emailed link until they pass the second step (set it up, or enter the code), and
// the card on the System tab for recovery codes, turning it off and, for admins, resetting someone else's.
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { QrCode } from "./QrCode";

export interface TwoFactorInfo {
  enabled: boolean;
  enabledAt: number | null;
  backupCodesLeft: number;
  email: string;
  role: "admin" | "support";
  ready: boolean;
  required: boolean;
  others: string[];
}

const primary = "press rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50";
const quiet = "press rounded-lg border border-line px-4 py-2 disabled:opacity-50";
const field = "card mt-1 w-full px-3 py-2 font-mono tracking-widest";

/** A form's onSubmit that runs `act` instead of reloading the page, so Enter in a code box submits it. */
const submitWith = (act: () => Promise<void>) => (e: FormEvent) => {
  e.preventDefault();
  void act();
};

async function post(
  body: Record<string, unknown>,
): Promise<{ error?: string; codes?: string[]; secret?: string; uri?: string; ok?: boolean }> {
  const r = await fetch("/api/admin/2fa/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? j : { error: j.error ?? "That didn't work." };
}

export async function loadTwoFactor(): Promise<TwoFactorInfo | null> {
  const r = await fetch("/api/admin/2fa/").catch(() => null);
  return r?.ok ? ((await r.json()) as TwoFactorInfo) : null;
}

function CodeField({ id, value, set, label }: { id: string; value: string; set: (v: string) => void; label: string }) {
  return (
    <label htmlFor={id} className="block text-sm">
      {label}
      <input
        id={id}
        inputMode="text"
        autoComplete="one-time-code"
        value={value}
        maxLength={20}
        onChange={(e) => set(e.target.value)}
        className={field}
      />
    </label>
  );
}

/** The recovery codes, shown once. */
export function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };
  return (
    <div>
      <h2 className="text-lg font-bold">Save your recovery codes</h2>
      <p className="mt-1 text-sm text-muted">
        If you lose your phone, each code signs you in once instead of an authenticator code. They&apos;re shown only now. Keep them
        somewhere safe, such as a password manager.
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 font-mono" aria-label="Recovery codes">
        {codes.map((c) => (
          <li key={c} className="card px-3 py-2">
            {c}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className={quiet} onClick={() => void copyCodes()}>
          Copy codes
        </button>
        <p role="status" className="text-muted">
          {copy === "copied" ? "Copied." : copy === "failed" ? "Couldn't copy. Select the codes and copy them by hand." : ""}
        </p>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5 size-5" checked={saved} onChange={(e) => setSaved(e.target.checked)} />I have saved these
        codes somewhere safe.
      </label>
      <button type="button" disabled={!saved} className={`mt-3 ${primary}`} onClick={onDone}>
        Continue
      </button>
    </div>
  );
}

/** Setting up an authenticator app: QR code, the key to type instead, then a code to confirm. */
function Setup({ onCodes }: { onCodes: (codes: string[]) => void }) {
  const [pending, setPending] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  // Carries on with a setup started before (the entry already in the app still works); "Start over" makes a new one.
  const start = async (restart = false) => {
    const j = await post({ action: "start", restart });
    if (j.error || !j.secret || !j.uri) return setMsg(j.error ?? "That didn't work.");
    setPending({ secret: j.secret, uri: j.uri });
    setMsg(null);
  };
  const confirm = async () => {
    const j = await post({ action: "confirm", code });
    if (j.error || !j.codes) return setMsg(j.error ?? "That didn't work.");
    onCodes(j.codes);
  };
  if (!pending)
    return (
      <div>
        <button type="button" className={primary} onClick={() => void start()}>
          Set up an authenticator app
        </button>
        {msg && (
          <p role="status" className="mt-2 text-sm text-bad">
            {msg}
          </p>
        )}
      </div>
    );
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Scan this with an authenticator app (Google Authenticator, 1Password, Authy and others), then enter the 6-digit code it shows.
        Already added it? Enter the code from its “Liftsmith admin” entry.
      </p>
      <QrCode text={pending.uri} label="QR code for your authenticator app" className="size-48 rounded-lg" />
      <p className="text-xs text-muted">
        Can&apos;t scan? Enter this key instead:{" "}
        <span className="font-mono break-all text-ink">{pending.secret.match(/.{1,4}/g)?.join(" ")}</span>
      </p>
      <form className="space-y-3" onSubmit={submitWith(confirm)}>
        <CodeField id="tf-confirm" value={code} set={setCode} label="Code from the app" />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={primary}>
            Turn on two-step sign-in
          </button>
          <button type="button" className={quiet} onClick={() => void start(true)}>
            Start over
          </button>
        </div>
      </form>
      {msg && (
        <p role="status" className="text-sm text-bad">
          {msg}
        </p>
      )}
    </div>
  );
}

/** What staff see after the emailed link until the second step is passed. */
export function TwoFactorGate({ info }: { info: TwoFactorInfo }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const done = () => location.reload();
  const verify = async () => {
    const j = await post({ action: "verify", code });
    if (j.error) return setMsg(j.error);
    done();
  };
  const signOut = async () => {
    await fetch("/api/admin/logout/", { method: "POST" });
    location.reload();
  };
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-2xl font-bold">Two-step sign-in</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {info.email}.</p>
      <div className="card mt-5 p-5">
        {codes ? (
          <RecoveryCodes codes={codes} onDone={done} />
        ) : info.enabled ? (
          <form className="space-y-3" onSubmit={submitWith(verify)}>
            <p className="text-sm">Enter the 6-digit code from your authenticator app, or one of your recovery codes.</p>
            <CodeField id="tf-verify" value={code} set={setCode} label="Code" />
            <button type="submit" className={primary}>
              Continue
            </button>
            {msg && (
              <p role="status" className="text-sm text-bad">
                {msg}
              </p>
            )}
            <p className="text-xs text-muted">
              Lost your phone and your recovery codes? Another admin can reset two-step for you on the System tab.
            </p>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">
              The admin panel shows lifters&apos; emails and can delete accounts, so every staff sign-in needs a code from an authenticator
              app as well as the emailed link. Set it up once; after that you&apos;ll enter a code each time you sign in.
            </p>
            <Setup onCodes={setCodes} />
          </div>
        )}
      </div>
      <button type="button" className="mt-4 text-sm text-muted underline" onClick={() => void signOut()}>
        Sign out
      </button>
    </main>
  );
}

/** The System tab's card: this address's two-step state and, for admins, resetting someone else's. */
export function TwoFactorCard() {
  const [info, setInfo] = useState<TwoFactorInfo | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const reload = useCallback(() => void loadTwoFactor().then(setInfo), []);
  useEffect(reload, [reload]);
  if (!info) return null;
  const act = async (action: "regenerate" | "disable") => {
    const j = await post({ action, code });
    setCode("");
    if (j.error) return setMsg(j.error);
    setMsg(action === "disable" ? "Two-step sign-in is off." : null);
    if (j.codes) setCodes(j.codes);
    if (action === "disable") {
      if (info.required) location.reload();
      else reload();
    }
  };
  const reset = async (email: string) => {
    const j = await post({ action: "reset", email });
    setMsg(j.error ?? `Two-step sign-in reset for ${email}. They set it up again at their next sign-in.`);
    reload();
  };
  return (
    <section className="card p-4">
      <h2 className="font-semibold">Two-step sign-in</h2>
      {codes ? (
        <div className="mt-3">
          <RecoveryCodes
            codes={codes}
            onDone={() => {
              setCodes(null);
              reload();
            }}
          />
        </div>
      ) : info.enabled ? (
        <>
          <p className="mt-0.5 text-sm text-muted">
            On for {info.email}. {info.backupCodesLeft} of 8 recovery codes left.
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2 text-sm">
            <div className="w-44">
              <CodeField id="tf-card" value={code} set={setCode} label="Code from the app" />
            </div>
            <button type="button" className={quiet} onClick={() => void act("regenerate")}>
              New recovery codes
            </button>
            <button type="button" className={quiet} onClick={() => void act("disable")}>
              Turn off
            </button>
          </div>
        </>
      ) : (
        <div className="mt-2">
          <p className="mb-2 text-sm text-muted">Off for {info.email}. Staff without it can still sign in while ADMIN_2FA is optional.</p>
          <Setup onCodes={setCodes} />
        </div>
      )}
      {info.role === "admin" && info.others.length > 0 && (
        <div className="mt-4 text-sm">
          <h3 className="font-semibold">Others with two-step on</h3>
          <p className="text-xs text-muted">
            Reset only for someone who lost their phone and their recovery codes. It signs them out everywhere.
          </p>
          <ul className="mt-2 space-y-1">
            {info.others.map((e) => (
              <li key={e} className="flex flex-wrap items-center gap-2">
                <span>{e}</span>
                <button type="button" className="press rounded-lg border border-line px-2 py-1 text-xs" onClick={() => void reset(e)}>
                  Reset
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {msg && (
        <p role="status" className="mt-2 text-sm text-muted">
          {msg}
        </p>
      )}
    </section>
  );
}
