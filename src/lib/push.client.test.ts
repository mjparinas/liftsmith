// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { pushTokenOnDevice } from "./push";

describe("pushTokenOnDevice", () => {
  beforeEach(() => localStorage.clear());

  it("is false when no token is stored", () => {
    expect(pushTokenOnDevice()).toBe(false);
  });

  it("is true when a token is stored after registration", () => {
    localStorage.setItem("liftsmith.pushToken", "tok-0123456789abcdef0123456789ab");
    expect(pushTokenOnDevice()).toBe(true);
  });
});