// @vitest-environment jsdom
// Awards › Share › Create link › Copy link: a "Link copied" toast floats over the sheet, then goes away.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useAccount } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { levelShare, type ShareContext } from "@/lib/shareCards";
import { useApp } from "@/lib/store";
import { clearToast, TOAST_MS } from "@/lib/toast";

import { ShareSheet } from "./ShareSheet";
import { Toaster } from "./Toaster";

const copied = vi.hoisted(() => ({ ok: true }));
vi.mock("@/lib/shareLinks", async (real) => ({
  ...(await real<typeof import("@/lib/shareLinks")>()),
  createLink: () => Promise.resolve({ id: "abc", url: "https://www.getliftsmith.com/w/abc/" }),
  copyText: () => Promise.resolve(copied.ok),
}));

const ctx: ShareContext = {
  unit: "kg",
  game: { level: { level: 12, title: "Iron", into: 0, span: 1, next: null }, streak: { weeks: 8 } as ShareContext["game"]["streak"] },
};
const item = levelShare({ level: ctx.game.level, streak: ctx.game.streak, xp: 4200, badges: { earned: 9, total: 130 } }, 40, ctx);

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];
  await useApp.getState().reset();
  useAccount.setState({ account: { token: "t", id: "u1", email: null, providers: [], via: "email" } as never });
  copied.ok = true;
});
afterEach(() => {
  cleanup();
  clearToast();
  vi.useRealTimers();
  useAccount.setState({ account: null });
});

async function openLink() {
  render(
    <>
      <ShareSheet open onClose={() => {}} items={[item]} />
      <Toaster />
    </>,
  );
  fireEvent.click(screen.getByRole("button", { name: t("link.create") }));
  return screen.findByRole("button", { name: t("link.copy") });
}

it("shows a Link copied toast after Copy link, and hides it after a moment", async () => {
  const copy = await openLink();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  await act(async () => fireEvent.click(copy));
  expect(screen.getByTestId("toast")).toHaveTextContent(t("link.copied"));
  await act(() => vi.advanceTimersByTimeAsync(TOAST_MS + 50));
  expect(screen.queryByTestId("toast")).toBeNull();
});

it("shows no toast when the copy fails, and leaves the link to copy by hand", async () => {
  copied.ok = false;
  const copy = await openLink();
  await act(async () => fireEvent.click(copy));
  expect(screen.queryByTestId("toast")).toBeNull();
  expect(screen.getAllByText("https://www.getliftsmith.com/w/abc/").length).toBeGreaterThan(1);
});
