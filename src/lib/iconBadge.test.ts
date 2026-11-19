// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { BADGE_MAX, badgeCount, badgeOn, countText } from "./badgeCount";
import { badgeSupported, resetIconBadge, setIconBadge } from "./iconBadge";

afterEach(() => {
  resetIconBadge();
  Reflect.deleteProperty(navigator, "setAppBadge");
  Reflect.deleteProperty(navigator, "clearAppBadge");
  Reflect.deleteProperty(window, "Capacitor");
});

describe("the app icon's number", () => {
  it("adds Friends and coaching, caps at 99 and is 0 when turned off", () => {
    expect(badgeCount({ friends: 2, coach: 3 })).toBe(5);
    expect(badgeCount({ friends: 0, coach: 0 })).toBe(0);
    expect(badgeCount({ friends: 80, coach: 80 })).toBe(BADGE_MAX);
    expect(badgeCount({ friends: -1, coach: 1.7 })).toBe(1);
    expect(badgeCount({ friends: 4, coach: 1 }, false)).toBe(0);
  });

  it("is on unless the lifter turned it off", () => {
    expect(badgeOn({})).toBe(true);
    expect(badgeOn({ messages: { badge: true } })).toBe(true);
    expect(badgeOn({ messages: { badge: false } })).toBe(false);
  });

  it("writes a red count as the number, or 99+ past the cap", () => {
    expect(countText(7)).toBe("7");
    expect(countText(99)).toBe("99");
    expect(countText(150)).toBe("99+");
  });

  it("uses the Badging API on the web, and does nothing where there is none", async () => {
    expect(badgeSupported()).toBe(false);
    await setIconBadge(3); // no API: no throw
    resetIconBadge();
    const set = vi.fn(async () => undefined);
    const clear = vi.fn(async () => undefined);
    Object.assign(navigator, { setAppBadge: set, clearAppBadge: clear });
    expect(badgeSupported()).toBe(true);
    await setIconBadge(3);
    await setIconBadge(3); // same number: not sent again
    await setIconBadge(0);
    expect(set.mock.calls).toEqual([[3]]);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("goes through the native AppBadge plugin in the apps", async () => {
    const set = vi.fn(async () => undefined);
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { AppBadge: { set } } };
    await setIconBadge(120);
    expect(set).toHaveBeenCalledWith({ count: BADGE_MAX });
  });
});
