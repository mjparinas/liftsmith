// @vitest-environment jsdom
// The invite loop on screen (docs/decisions/growth.md "The invite loop"): Your invites says how close each friend is,
// and nothing about the reward when it's off or the lifter is under 18; the share sheet adds the invite link.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount } from "@/lib/auth";
import { setLocalFlag } from "@/lib/flags";
import { t } from "@/lib/i18n";
import type { InviteStatus } from "@/lib/referral";
import { levelShare, type ShareContext } from "@/lib/shareCards";
import { useSocial } from "@/lib/social";
import { useApp } from "@/lib/store";

import { YourInvites } from "./Invites";
import { ShareSheet } from "./ShareSheet";

const shared = vi.hoisted(() => ({ url: undefined as string | undefined }));
vi.mock("@/lib/shareImage", async (real) => ({
  ...(await real<typeof import("@/lib/shareImage")>()),
  shareCanvas: (_c: unknown, _n: string, _t: string, url?: string) => {
    shared.url = url;
    return Promise.resolve("native");
  },
}));
vi.mock("@/lib/social", async (real) => ({
  ...(await real<typeof import("@/lib/social")>()),
  social: (op: string) =>
    op === "invite" ? Promise.resolve({ code: "ABCDEFGH", expiresAt: Date.now() + 20 * 86_400_000 }) : Promise.reject(new Error(op)),
}));

const status = (over: Partial<InviteStatus> = {}): InviteStatus => ({
  friends: [
    { name: "Alex", handle: "alex", workouts: 1, rewarded: false },
    { name: "Robin", handle: "robin", workouts: 3, rewarded: true },
  ],
  joined: null,
  months: 1,
  perYear: 12,
  needed: 3,
  until: Date.UTC(2026, 11, 14),
  reward: true,
  ...over,
});

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];
  localStorage.clear();
  await useApp.getState().reset();
  useAccount.setState({ account: { token: "t", id: "u1", email: null, providers: [], via: "email" } as never });
  shared.url = undefined;
});
afterEach(() => {
  cleanup();
  useSocial.setState({ me: null });
});

describe("Your invites", () => {
  it("says what's left for each friend and the months earned", () => {
    render(<YourInvites status={status()} reward />);
    expect(screen.getByText(t("friends.invites.left", { count: 2, done: 1, needed: 3 }))).toBeTruthy();
    expect(screen.getByText(t("friends.invites.paid"))).toBeTruthy();
    expect(screen.getByText(/1 month of Pro from invites/)).toBeTruthy();
  });

  it("tells a new lifter how far they are from their own month", () => {
    render(<YourInvites status={status({ friends: [], joined: { name: "Sam", handle: "sam", workouts: 2, rewarded: false } })} reward />);
    expect(screen.getByText(t("friends.invites.yours", { name: "Sam", count: 1 }))).toBeTruthy();
  });

  it("leaves the reward unsaid when it's off", () => {
    render(<YourInvites status={status({ reward: false })} reward={false} />);
    expect(screen.getAllByText(t("friends.invites.joined"))).toHaveLength(2);
    expect(screen.queryByText(/Pro/)).toBeNull();
  });

  it("shows nothing before anyone has joined", () => {
    const { container } = render(<YourInvites status={status({ friends: [], joined: null })} reward />);
    expect(container.innerHTML).toBe("");
  });
});

describe("the share sheet carries the invite link", () => {
  const ctx: ShareContext = {
    unit: "kg",
    game: { level: { level: 12, title: "Iron", into: 0, span: 1, next: null }, streak: { weeks: 8 } as ShareContext["game"]["streak"] },
  };
  const item = levelShare({ level: ctx.game.level, streak: ctx.game.streak, xp: 4200, badges: { earned: 9, total: 130 } }, 40, ctx);
  const joinFriends = () => useSocial.setState({ me: { profile: { handle: "me" } as never } });

  it("adds it for a lifter in Friends, and leaves it off when switched off", async () => {
    setLocalFlag("social", true);
    joinFriends();
    render(<ShareSheet open onClose={() => {}} items={[item]} />);
    fireEvent.click(screen.getByRole("button", { name: t("card.share") }));
    await waitFor(() => expect(shared.url).toBe("https://www.getliftsmith.com/app/#/invite/ABCDEFGH"));
    fireEvent.click(screen.getByRole("switch", { name: t("card.invite") }));
    shared.url = "unset";
    fireEvent.click(screen.getByRole("button", { name: t("card.share") }));
    await waitFor(() => expect(shared.url).toBeUndefined());
  });

  it("never offers it to someone under 18", () => {
    joinFriends();
    useApp.setState({ profile: { ...useApp.getState().profile, birthYear: new Date().getFullYear() - 15 } });
    render(<ShareSheet open onClose={() => {}} items={[item]} />);
    expect(screen.queryByRole("switch", { name: t("card.invite") })).toBeNull();
  });
});
