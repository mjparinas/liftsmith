// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { sessionGate } from "./TwoFactor";

const answer = (status: number, body: unknown = {}) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
afterEach(() => vi.unstubAllGlobals());

describe("what the admin panel shows after a 404", () => {
  it("shows sign-in only when the server says there's no session", async () => {
    answer(404);
    expect((await sessionGate()).state).toBe("signin");
  });

  it("asks for the code when the session hasn't passed the second step", async () => {
    answer(200, { ready: false, enabled: true });
    expect((await sessionGate()).state).toBe("twofactor");
  });

  it("keeps a signed-in admin off the sign-in screen when the server or network hiccups", async () => {
    answer(503);
    expect((await sessionGate()).state).toBe("error");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await sessionGate()).state).toBe("error");
  });
});
