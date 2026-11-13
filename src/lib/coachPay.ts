// Client payments through Stripe Connect, on the phone (Melvin, 2026-11-13; server: src/server/coachPay.ts). Types,
// calls and the words around money. Paying always happens on Stripe's own pages in the browser, on every platform.
import { api, AuthError, readAccount } from "./auth";
import { openOutside } from "./connections";
import { num } from "./i18n";

export type PriceKind = "session" | "month";
export interface PayAccount {
  ready: boolean;
  currency: string;
}
export interface Price {
  coachId: string;
  clientId: string;
  amount: number;
  currency: string;
  kind: PriceKind;
  at: number;
}
export interface Subscription {
  status: string;
  until: number | null;
  ending: boolean;
}
export interface Payment {
  id: string;
  coachId: string;
  clientId: string;
  amount: number;
  currency: string;
  kind: PriceKind;
  at: number;
}
/** On the overview: the coach's own Stripe account, and the prices this lifter's coaches set them. */
export interface OverviewPay {
  account: PayAccount | null;
  prices: (Price & { sub: Subscription | null })[];
}
/** On a client's report. */
export interface ClientPay {
  account: PayAccount | null;
  price: Price | null;
  sub: Subscription | null;
  payments: Payment[];
}

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}
const post = <T>(body: Record<string, unknown>) => api<T>("/api/coach/", { token: token(), body });

/** An amount in the app's language: "$60", "60,00 $". */
export const money = (amount: number, currency: string) => {
  try {
    return num(amount, { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 });
  } catch {
    return `${amount} ${currency.toUpperCase()}`;
  }
};

/** A monthly plan that's paying (or retrying a card). */
export const subscribed = (s: Subscription | null) => !!s && ["active", "trialing", "past_due"].includes(s.status);

export async function startPayments(): Promise<void> {
  openOutside((await post<{ url: string }>({ action: "payOnboard" })).url);
}
export const refreshPayments = async () => (await post<{ account: PayAccount | null }>({ action: "payRefresh" })).account;
export async function openStripe(): Promise<void> {
  const r = await post<{ url: string | null }>({ action: "payDashboard" });
  if (r.url) openOutside(r.url);
}
export const savePrice = async (client: string, amount: number | null, kind: PriceKind) =>
  (await post<{ price: Price | null }>({ action: "price", client, amount, kind })).price;
export async function pay(coach: string): Promise<void> {
  openOutside((await post<{ url: string }>({ action: "payCheckout", id: coach })).url);
}
export const stopMonthly = async (other: string) => void (await post({ action: "payStop", id: other }));
