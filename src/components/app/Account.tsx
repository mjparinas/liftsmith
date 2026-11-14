"use client";

// Optional account: sign in to back up and sync (auth.ts, sync.ts). `AccountPanel` is the sign-in and status
// block, used on the Account screen (#/account), in Settings and on the welcome screen before
// setup ("I already have an account").
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import { track } from "@/lib/analytics";
import {
  AUTH,
  AuthError,
  deleteAccount,
  finishGoogle,
  loadScript,
  makeNonce,
  methods,
  platform,
  sendEmailCode,
  signInApple,
  signInGoogle,
  useAccount,
  verifyEmailCode,
  type Method,
} from "@/lib/auth";
import { backupJson, saveFile, stamp } from "@/lib/exportData";
import { currentLang, currentTag, relative, subscribeLang, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { listPhotos } from "@/lib/photos";
import { signOutDevice } from "@/lib/signOutDevice";
import { SITE_URL } from "@/lib/site";
import { useApp } from "@/lib/store";
import { syncNow } from "@/lib/sync";
import { readSync } from "@/lib/syncOutbox";
import { useNow } from "@/lib/useNow";
import { readEnded, restartApp } from "@/lib/wipe";

import { CoachBadge } from "./CoachHome";
import { go, historyDepth } from "./router";
import { ShareLinks } from "./ShareLinks";
import { Button, ScreenHeader, Section } from "./ui";

function ago(ms: number): string {
  const s = Math.round((ms - Date.now()) / 1000);
  if (s > -60) return t("account.justNow");
  if (s > -3600) return relative(Math.round(s / 60), "minute");
  if (s > -86400) return relative(Math.round(s / 3600), "hour");
  return relative(Math.round(s / 86400), "day");
}

function message(e: unknown): string {
  if (e instanceof AuthError && e.message === "offline") return t("account.offline");
  if (e instanceof AuthError && e.status === 503) return t("account.notReady");
  return e instanceof Error && e.message ? e.message : t("account.failed");
}

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 17 20" aria-hidden fill="currentColor">
    <path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.2 3-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.4-1-2.4-4zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" />
  </svg>
);

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path
      fill="#EA4335"
      d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"
    />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path
      fill="#34A853"
      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"
    />
  </svg>
);

/** The locale Google's button takes: the app's language, with the region when the lifter's own tag is in that language. */
export function googleLocale(lang: string, tag: string): string {
  return tag.toLowerCase().startsWith(`${lang}-`) ? tag : lang;
}

/** Google's own button on the web (Google Identity Services draws it and returns the ID token). */
function GoogleWebButton({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  // Google draws its words in the browser's language unless told otherwise, so an English app in a Spanish-speaking
  // browser (or an incognito window guessing from the address) showed "Continuar con Google". It follows the app's
  // language instead, and redraws when Settings › Language changes it.
  const locale = useSyncExternalStore(
    subscribeLang,
    () => googleLocale(currentLang(), currentTag()),
    () => "en",
  );
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        await loadScript("https://accounts.google.com/gsi/client");
        const n = await makeNonce();
        if (!live || !box.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: AUTH.googleWeb,
          nonce: n.hashed,
          use_fedcm_for_button: true,
          callback: (r: { credential?: string }) => {
            if (!r.credential) return;
            useAccount.setState({ busy: true });
            finishGoogle(r.credential, n.raw)
              .then(onDone, (e) => onError(message(e)))
              .finally(() => useAccount.setState({ busy: false }));
          },
        });
        window.google.accounts.id.renderButton(box.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          locale,
          width: Math.min(box.current.clientWidth || 320, 400),
        });
      } catch {
        if (live) onError(t("account.offline"));
      }
    })();
    return () => {
      live = false;
    };
  }, [onDone, onError, locale]);
  // Google's button is an iframe with a light colour scheme; on a page with a dark one Chrome paints an opaque white
  // box behind it. Giving its box the same light scheme keeps the corners clear.
  return <div ref={box} className="flex min-h-11 w-full justify-center [color-scheme:light]" />;
}

function EmailSignIn({ onDone }: { onDone: () => void }) {
  const busy = useAccount((s) => s.busy);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = async () => {
    setError(null);
    try {
      const r = await sendEmailCode(email.trim());
      setSent(true);
      if (r.devCode) setCode(r.devCode);
    } catch (e) {
      oops();
      setError(message(e));
    }
  };
  const verify = async () => {
    setError(null);
    try {
      await verifyEmailCode(email.trim(), code.trim());
      onDone();
    } catch (e) {
      oops();
      setError(message(e));
    }
  };
  const canSend = !busy && email.includes("@");
  const canVerify = !busy && (code.length === 6 || code.length >= 12);
  // Real forms, so Enter in the email or code box sends it, like the button.
  const onSubmit = (go: boolean, act: () => Promise<void>) => (e: FormEvent) => {
    e.preventDefault();
    if (go) void act();
  };
  return (
    <div className="space-y-2">
      {!sent ? (
        <form className="space-y-2" onSubmit={onSubmit(canSend, send)}>
          <label htmlFor="acct-email" className="block text-sm text-muted">
            {t("account.email.label")}
          </label>
          <input
            id="acct-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="card w-full px-4 py-3"
          />
          <Button className="w-full" disabled={!canSend} submit>
            {t("account.email.send")}
          </Button>
        </form>
      ) : (
        <form className="space-y-2" onSubmit={onSubmit(canVerify, verify)}>
          <p className="text-sm text-muted">{t("account.email.sent", { email: email.trim() })}</p>
          <label htmlFor="acct-code" className="block text-sm text-muted">
            {t("account.email.code")}
          </label>
          <input
            id="acct-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={16}
            value={code}
            // Six digits from the email; the store review account's fixed code is 12 to 16 (src/server/review.ts).
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 16))}
            className={`card display w-full px-4 py-3 text-center ${code.length > 6 ? "text-xl tracking-wider" : "text-2xl tracking-[0.4em]"}`}
          />
          <Button className="w-full" disabled={!canVerify} submit>
            {t("account.email.verify")}
          </Button>
          <Button
            kind="quiet"
            className="w-full"
            onClick={() => {
              setSent(false);
              setCode("");
            }}
          >
            {t("account.email.again")}
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function SignedOut() {
  const busy = useAccount((s) => s.busy);
  const [email, setEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = (m: Method) => () => {
    haptic("success");
    track("feature", { name: "account_signin", detail: m });
    void syncNow();
  };
  const run = (m: Method, fn: () => Promise<unknown>) => async () => {
    setError(null);
    try {
      await fn();
      done(m)();
    } catch (e) {
      if (/cancel/i.test(e instanceof Error ? e.message : "")) return;
      oops();
      setError(message(e));
    }
  };
  const list = methods();
  const web = platform() === "web";
  const onGoogleWeb = done("google");
  const onGoogleErr = (m: string) => setError(m);
  return (
    <div className="space-y-2">
      {list.includes("apple") && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("apple", signInApple)()}
          className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-4 font-semibold text-white ring-1 ring-white/20 disabled:opacity-60"
        >
          <AppleLogo />
          {t("account.apple")}
        </button>
      )}
      {list.includes("google") &&
        (web ? (
          <GoogleWebButton onDone={onGoogleWeb} onError={onGoogleErr} />
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("google", signInGoogle)()}
            className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-4 font-semibold text-[#1f1f1f] ring-1 ring-black/10 disabled:opacity-60"
          >
            <GoogleLogo />
            {t("account.google")}
          </button>
        ))}
      {email ? (
        <EmailSignIn onDone={done("email")} />
      ) : (
        <Button kind="ghost" className="w-full" onClick={() => setEmail(true)}>
          {t("account.emailButton")}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
      <p className="pt-1 text-xs text-faint">{t("account.emailNote")}</p>
      <p className="text-xs text-faint">
        {t("account.agree")}{" "}
        <a className="text-accent underline" href={`${SITE_URL}/terms/`} target="_blank" rel="noreferrer">
          {t("account.terms")}
        </a>
        {" · "}
        <a className="text-accent underline" href={`${SITE_URL}/privacy/`} target="_blank" rel="noreferrer">
          {t("account.privacy")}
        </a>
      </p>
    </div>
  );
}

function SignedIn() {
  const account = useAccount((s) => s.account)!;
  const busy = useAccount((s) => s.busy);
  // Redraws "last synced" every 30 s while on screen (useNow stops while the app is hidden).
  useNow(30_000);
  const [, tick] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Signing out wipes this device (signOutDevice.ts): it saves what's waiting first, and asks when photos would go
  // (they never leave the device) or when something couldn't be saved.
  const [leaving, setLeaving] = useState<"idle" | "saving" | { waiting: number; photos: number }>("idle");
  const leave = async (force: boolean, photosOk: boolean) => {
    if (!photosOk) {
      const photos = (await listPhotos().catch(() => [])).length;
      if (photos) return setLeaving({ waiting: 0, photos });
    }
    setLeaving("saving");
    const r = await signOutDevice({ force });
    if (!r.ok) {
      oops();
      setLeaving({ waiting: r.waiting, photos: 0 });
    }
  };
  const s = readSync();
  const waiting = s.out.length + s.del.length;
  const via = t(`account.via.${account.via}`);
  return (
    <div className="space-y-3">
      <p className="text-sm">{account.email ? t("account.as", { email: account.email, via }) : t("account.asNoEmail", { via })}</p>
      <p className="text-sm text-muted" aria-live="polite">
        {busy
          ? t("account.syncing")
          : s.lastError === "full"
            ? t("account.syncFull")
            : s.lastError
              ? t("account.syncError")
              : waiting
                ? t("account.waiting", { count: waiting })
                : s.lastSync
                  ? t("account.synced", { when: ago(s.lastSync) })
                  : t("account.notSynced")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button kind="ghost" disabled={busy} onClick={() => void syncNow().then(() => tick((n) => n + 1))}>
          {t("account.syncNow")}
        </Button>
        <Button kind="ghost" disabled={leaving !== "idle"} onClick={() => void leave(false, false)}>
          {leaving === "saving" ? t("account.signingOut") : t("account.signOut")}
        </Button>
      </div>
      <p className="text-xs text-faint">{t("account.signOutNote")}</p>
      {typeof leaving === "object" && (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-warn">
            {leaving.photos
              ? t("account.signOut.photos", { count: leaving.photos })
              : t("account.signOut.unsynced", { count: leaving.waiting })}
          </p>
          {leaving.photos ? (
            <Button kind="danger" className="w-full" onClick={() => void leave(false, true)}>
              {t("account.signOut.photosConfirm")}
            </Button>
          ) : (
            <>
              <Button kind="ghost" className="w-full" onClick={() => void leave(false, true)}>
                {t("account.signOut.retry")}
              </Button>
              <Button kind="ghost" className="w-full" onClick={() => void backup()}>
                {t("account.signOut.backup")}
              </Button>
              <Button kind="danger" className="w-full" onClick={() => void leave(true, true)}>
                {t("account.signOut.anyway")}
              </Button>
            </>
          )}
          <Button kind="quiet" className="w-full" onClick={() => setLeaving("idle")}>
            {t("settings.cancel")}
          </Button>
        </div>
      )}
      {confirm ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">{t("account.delete.warn")}</p>
          {/* A web subscription (Stripe) ends with the account; a store one doesn't, it's the store's (stripe.ts forgetStripe). */}
          {account.sub?.store === "web" && <p className="text-sm text-warn">{t("account.delete.webSub")}</p>}
          <Button
            kind="danger"
            className="w-full"
            disabled={busy}
            onClick={() =>
              void deleteAccount().then(
                () => track("feature", { name: "account_delete" }),
                (e) => setError(message(e)),
              )
            }
          >
            {t("account.delete.confirm")}
          </Button>
          <Button kind="quiet" className="w-full" onClick={() => setConfirm(false)}>
            {t("settings.cancel")}
          </Button>
        </div>
      ) : (
        <Button kind="quiet" className="w-full text-bad" onClick={() => setConfirm(true)}>
          {t("account.delete")}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

/** Downloads a backup file of everything on this device (the same file as Settings › Saving and backup). */
function backup() {
  const { profile, gyms, events } = useApp.getState();
  track("feature", { name: "backup", detail: "signOut" });
  return saveFile(`liftsmith-backup-${stamp()}.json`, "application/json", backupJson(profile, gyms, events));
}

/** The server ended the session while changes here hadn't reached the account (sync.ts): sign in again, save, or erase. */
function Ended({ waiting }: { waiting: number }) {
  return (
    <div className="space-y-2" role="status">
      <p className="text-sm text-warn">{t("account.ended", { count: waiting })}</p>
      <Button kind="ghost" className="w-full" onClick={() => void backup()}>
        {t("account.signOut.backup")}
      </Button>
      <Button
        kind="danger"
        className="w-full"
        onClick={() =>
          void useApp
            .getState()
            .wipeLocal()
            .then(() => restartApp())
        }
      >
        {t("account.ended.erase")}
      </Button>
    </div>
  );
}

/** Sign in, or the signed-in account and its sync status. */
export function AccountPanel() {
  const account = useAccount((s) => s.account);
  const lost = useAccount((s) => s.error === "signedOut");
  const ended = account ? 0 : readEnded();
  return (
    <div className="space-y-3">
      {ended > 0 && <Ended waiting={ended} />}
      {lost && !account && !ended && (
        <p role="status" className="text-sm text-warn">
          {t("account.lost")}
        </p>
      )}
      {account ? <SignedIn /> : <SignedOut />}
    </div>
  );
}

/** Your name, optional: used to greet you. It lives here with the rest of who you are (moved from Settings, 2026-11-10). */
function NameField() {
  const { profile, setProfile } = useApp();
  return (
    <input
      value={profile.name}
      onChange={(e) => setProfile({ name: e.target.value })}
      className="card w-full px-4 py-3"
      placeholder={t("settings.optional")}
      aria-label={t("settings.name")}
      autoComplete="given-name"
    />
  );
}

/** Settings › Account (#/account). */
export function Account() {
  const account = useAccount((s) => s.account);
  // Opened from outside the app (the website's "Sign in" link): signing in here goes on to Today (Melvin, 2026-11-11).
  const was = useRef(!!account);
  useEffect(() => {
    const before = was.current;
    was.current = !!account;
    if (account && !before && historyDepth() === 0) go("today");
  }, [account]);
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("settings.back"), onClick: () => go("settings") }} title={t("account.title")} />
      <p className="mt-2 text-muted">{account ? t("account.leadIn") : t("account.lead")}</p>
      <Section title={account ? t("account.yours") : t("account.signIn")} icon="lock">
        <AccountPanel />
      </Section>
      <Section title={t("settings.name")}>
        <NameField />
        {/* "Coached by Sam" by the lifter's name: an account that joined a coach says so (Melvin, 2026-11-13). */}
        <CoachBadge className="mt-2" />
      </Section>
      {account && (
        <Section title={t("link.yours")} icon="link">
          <ShareLinks />
        </Section>
      )}
      <Section title={t("account.what")} icon="info">
        <p className="text-sm text-muted">{t("account.what.body")}</p>
      </Section>
    </div>
  );
}
