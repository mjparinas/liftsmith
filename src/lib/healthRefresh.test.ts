// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HEALTH_REFRESH_MS, startHealthRefresh } from "./healthRefresh";

let state: "visible" | "hidden" = "visible";
function setVisibility(s: "visible" | "hidden") {
  state = s;
  document.dispatchEvent(new Event("visibilitychange"));
}

let clock = 0;
const body = vi.fn(async () => 0);
const daily = vi.fn(async () => 0);
let stop: () => void = () => {};

beforeEach(() => {
  clock = Date.UTC(2026, 10, 2, 7);
  state = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  body.mockClear();
  daily.mockClear();
  stop = startHealthRefresh(
    () => ({ importHealthBody: body, importHealthDaily: daily }),
    () => clock,
  );
});
afterEach(() => stop());

describe("startHealthRefresh", () => {
  it("doesn't read again on a quick return after opening", () => {
    setVisibility("hidden");
    clock += 60_000;
    setVisibility("visible");
    expect(daily).not.toHaveBeenCalled();
    expect(body).not.toHaveBeenCalled();
  });

  it("reads Health on return after a night in memory", () => {
    setVisibility("hidden");
    clock += 8 * 60 * 60 * 1000;
    expect(daily).not.toHaveBeenCalled(); // nothing while away
    setVisibility("visible");
    expect(daily).toHaveBeenCalledTimes(1);
    expect(body).toHaveBeenCalledTimes(1);
  });

  it("reads at most once every 15 minutes", async () => {
    clock += HEALTH_REFRESH_MS;
    setVisibility("hidden");
    setVisibility("visible");
    await new Promise((r) => setTimeout(r, 0));
    clock += HEALTH_REFRESH_MS - 1;
    setVisibility("hidden");
    setVisibility("visible");
    expect(daily).toHaveBeenCalledTimes(1);
    clock += 1;
    setVisibility("hidden");
    setVisibility("visible");
    expect(daily).toHaveBeenCalledTimes(2);
  });

  it("keeps going when a read fails", async () => {
    daily.mockRejectedValueOnce(new Error("revoked"));
    clock += HEALTH_REFRESH_MS;
    setVisibility("visible");
    await new Promise((r) => setTimeout(r, 0));
    clock += HEALTH_REFRESH_MS;
    setVisibility("visible");
    expect(daily).toHaveBeenCalledTimes(2);
  });

  it("stops listening once unsubscribed", () => {
    stop();
    clock += HEALTH_REFRESH_MS;
    setVisibility("visible");
    expect(daily).not.toHaveBeenCalled();
  });
});
