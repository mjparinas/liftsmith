// The public status page's reading of /api/health/ (200 with { ok: true } when the server and its database answer).
// Kept apart from the component so it's tested without a browser.

export type ServiceState = "checking" | "ok" | "degraded" | "unreachable";

export async function checkHealth(fetcher: typeof fetch = fetch): Promise<Exclude<ServiceState, "checking">> {
  try {
    const res = await fetcher("/api/health/", { cache: "no-store" });
    const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return res.ok && body?.ok === true ? "ok" : "degraded";
  } catch {
    return "unreachable";
  }
}

export const STATE_TEXT: Record<ServiceState, { title: string; body: string }> = {
  checking: { title: "Checking…", body: "Asking our servers how they are." },
  ok: { title: "Everything is working", body: "The website, sign-in and syncing are all answering normally." },
  degraded: {
    title: "We're having trouble",
    body: "Our servers are answering, but something isn't right. We've been alerted and are working on it. Your workouts are saved on your phone in the meantime and sync once we're back.",
  },
  unreachable: {
    title: "We can't reach our servers",
    body: "If the rest of the internet works for you, the problem is probably ours, and we're working on it. The app keeps working offline, and your workouts sync once we're back.",
  },
};
