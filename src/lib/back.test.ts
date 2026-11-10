import { afterEach, describe, expect, it, vi } from "vitest";

import { handleBack, pushBack, resetBack } from "./back";

describe("the phone's back button", () => {
  afterEach(resetBack);

  it("closes the most recently opened sheet first, one per press", () => {
    const first = vi.fn();
    const second = vi.fn();
    const offFirst = pushBack(first);
    const offSecond = pushBack(second);
    expect(handleBack({ history: 3, atRoot: false })).toBe("closed");
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    offSecond();
    expect(handleBack({ history: 3, atRoot: false })).toBe("closed");
    expect(first).toHaveBeenCalledTimes(1);
    offFirst();
  });

  it("closes a sheet even on Today, before leaving the app", () => {
    const close = vi.fn();
    pushBack(close);
    expect(handleBack({ history: 0, atRoot: true })).toBe("closed");
    expect(close).toHaveBeenCalled();
  });

  it("goes to the previous screen when there is one", () => {
    expect(handleBack({ history: 2, atRoot: false })).toBe("back");
  });

  it("goes to Today from a screen opened with nothing behind it (a shortcut, a notification)", () => {
    expect(handleBack({ history: 0, atRoot: false })).toBe("home");
  });

  it("leaves the app only from Today", () => {
    expect(handleBack({ history: 0, atRoot: true })).toBe("exit");
    expect(handleBack({ history: 4, atRoot: true })).toBe("exit");
  });

  it("forgets a closed sheet", () => {
    const close = vi.fn();
    pushBack(close)();
    expect(handleBack({ history: 1, atRoot: false })).toBe("back");
    expect(close).not.toHaveBeenCalled();
  });
});
