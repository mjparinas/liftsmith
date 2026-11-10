"use client";

// Optional accounts (AGENTS.md "Accounts and sign-in"). Signing in turns on sync (sync.ts); the app works
// fully without it. Methods by platform:
// - Android: Google (Credential Manager, through our AccountSignIn plugin) and an emailed code.
// - iOS: Apple and Google (AuthenticationServices, AccountSignIn plugin) and an emailed code. Apple asks for
//   Sign in with Apple whenever Google is offered, so the two ship together.
// - Web: Google (Google Identity Services), Apple (Sign in with Apple JS) and an emailed code.
// A provider shows only when the app was built with its public client id. The server checks every token.
import { create } from "zustand";

import { isNative } from "./juice";
import { SITE_URL } from "./site";
import { ACCOUNT_KEY, emptySync, SYNC_KEY, writeSync } from "./syncOutbox";

export interface Account {
  token: string;
  id: string;
  email: string | null;
  providers: string[];
  /** How this device signed in. */
  via: Method;
}

export type Method = "google" | "apple" | "email";
export type Platform = "web" | "android" | "ios";

/** Public client ids (not secrets), set at build time. Empty means that button isn't offered. */
export const AUTH = {
  googleWeb: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  googleIos: process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  appleServices: process.env.NEXT_PUBLIC_APPLE_SERVICES_ID ?? "",
};

type Cap = { getPlatform?: () => string; Plugins?: { AccountSignIn?: SignInPlugin } };
interface SignInPlugin {
  google(o: { clientId: string; serverClientId: string; nonce: string }): Promise<{ idToken: string }>;
  apple(o: { nonce: string }): Promise<{ idToken: string; code?: string }>;
}
const cap = (): Cap | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);

export function platform(): Platform {
  if (!isNative()) return "web";
  return cap()?.getPlatform?.() === "ios" ? "ios" : "android";
}

/** Which sign-in buttons this build offers here. Email always works when the server is reachable. */
export function methods(p: Platform = platform(), cfg = AUTH): Method[] {
  const out: Method[] = [];
  if (p === "ios" || (p === "web" && cfg.appleServices)) out.push("apple");
  if ((p === "ios" && cfg.googleIos && cfg.googleWeb) || (p !== "ios" && cfg.googleWeb)) out.push("google");
  out.push("email");
  return out;
}

export const apiUrl = (path: string) => (isNative() || typeof location === "undefined" ? `${SITE_URL}${path}` : path);

export function readAccount(): Account | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

interface AccountState {
  account: Account | null;
  busy: boolean;
  error: string | null;
}

export const useAccount = create<AccountState>(() => ({
  account: typeof window === "undefined" ? null : readAccount(),
  busy: false,
  error: null,
}));

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(apiUrl(path), {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: {
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new AuthError("offline");
  }
  const body = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new AuthError(body.error ?? `HTTP ${r.status}`, r.status);
  return body;
}

function hex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A random nonce for one sign-in, and its SHA-256 (hex) that the provider puts in its token. */
export async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = hex(crypto.getRandomValues(new Uint8Array(16)));
  const hashed = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))));
  return { raw, hashed };
}

interface SessionReply {
  token: string;
  account: { id: string; email: string | null; providers: string[] };
}

/** Saves the session and starts this device's sync from scratch: everything on it is pushed once. */
function signedInAs(r: SessionReply, via: Method): Account {
  const a: Account = { token: r.token, id: r.account.id, email: r.account.email, providers: r.account.providers, via };
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  } catch {}
  writeSync(emptySync());
  useAccount.setState({ account: a, error: null });
  return a;
}

async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
  useAccount.setState({ busy: true, error: null });
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Closing the provider's own sheet isn't an error worth showing.
    if (!/cancel/i.test(msg)) useAccount.setState({ error: msg });
    throw e;
  } finally {
    useAccount.setState({ busy: false });
  }
}

export async function finishGoogle(idToken: string, nonce: string): Promise<Account> {
  return signedInAs(await api<SessionReply>("/api/auth/google/", { body: { idToken, nonce, platform: platform() } }), "google");
}

/** Native Google sign-in (the web renders Google's own button; see GoogleButton in Account.tsx). */
export function signInGoogle(): Promise<Account> {
  return withBusy(async () => {
    const plugin = cap()?.Plugins?.AccountSignIn;
    if (!plugin) throw new Error("Google sign-in isn't available here.");
    const n = await makeNonce();
    const r = await plugin.google({
      clientId: platform() === "ios" ? AUTH.googleIos : AUTH.googleWeb,
      serverClientId: AUTH.googleWeb,
      nonce: n.hashed,
    });
    return finishGoogle(r.idToken, n.raw);
  });
}

declare global {
  interface Window {
    AppleID?: {
      auth: { init(o: Record<string, unknown>): void; signIn(): Promise<{ authorization: { id_token: string; code?: string } }> };
    };
    google?: {
      accounts: { id: { initialize(o: Record<string, unknown>): void; renderButton(el: HTMLElement, o: Record<string, unknown>): void } };
    };
  }
}

export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("offline"));
    document.head.appendChild(s);
  });
}

export function signInApple(): Promise<Account> {
  return withBusy(async () => {
    const n = await makeNonce();
    let idToken: string;
    let code: string | undefined;
    const plugin = cap()?.Plugins?.AccountSignIn;
    if (platform() === "ios" && plugin) {
      ({ idToken, code } = await plugin.apple({ nonce: n.hashed }));
    } else {
      await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
      window.AppleID!.auth.init({
        clientId: AUTH.appleServices,
        scope: "email",
        redirectURI: `${location.origin}/app/`,
        usePopup: true,
        nonce: n.hashed,
      });
      const r = await window.AppleID!.auth.signIn().catch((e: { error?: string }) => {
        throw new Error(e?.error === "popup_closed_by_user" ? "cancelled" : "Apple sign-in didn't finish.");
      });
      idToken = r.authorization.id_token;
      code = r.authorization.code;
    }
    return signedInAs(
      await api<SessionReply>("/api/auth/apple/", { body: { idToken, nonce: n.raw, code, platform: platform() } }),
      "apple",
    );
  });
}

/** Emails a six-digit code. Returns a code only in local development (no email there). */
export function sendEmailCode(email: string): Promise<{ devCode?: string }> {
  return withBusy(() => api<{ devCode?: string }>("/api/auth/email/", { body: { email } }));
}

export function verifyEmailCode(email: string, code: string): Promise<Account> {
  return withBusy(async () =>
    signedInAs(await api<SessionReply>("/api/auth/email/verify/", { body: { email, code, platform: platform() } }), "email"),
  );
}

/** Signs this device out. Everything stays on the device; it just stops syncing. */
export async function signOut(): Promise<void> {
  const a = readAccount();
  forgetAccount();
  if (a) await api("/api/auth/logout/", { body: {}, token: a.token }).catch(() => null);
}

/** Drops the session and sync state on this device only (also used by "Erase this device"). */
export function forgetAccount() {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(SYNC_KEY);
  } catch {}
  useAccount.setState({ account: null, error: null });
}

/** Deletes the account and everything synced to it. This device keeps its own copy. */
export function deleteAccount(): Promise<void> {
  return withBusy(async () => {
    const a = readAccount();
    if (!a) return;
    await api("/api/account/", { method: "DELETE", token: a.token });
    forgetAccount();
  });
}
