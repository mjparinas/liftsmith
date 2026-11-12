import { describe, expect, it, vi } from "vitest";

type Session = { accountId: string; session: string } | null;
const fake = vi.hoisted(() => ({ sessionOf: async (): Promise<Session> => null }));
vi.mock("./accounts", () => ({ sessionOf: () => fake.sessionOf() }));

const { signedIn } = await import("./accountHttp");

const req = () => new Request("https://x/api/sync/", { method: "POST", headers: { Authorization: "Bearer t" } });

describe("checking the session on account routes", () => {
  it("passes a good session through", async () => {
    fake.sessionOf = async () => ({ accountId: "a", session: "h" });
    expect(await signedIn(req())).toEqual({ accountId: "a", session: "h" });
  });

  it("answers 401 with the signed-out marker only when the session is gone", async () => {
    fake.sessionOf = async () => null;
    const r = (await signedIn(req())) as Response;
    expect(r.status).toBe(401);
    expect(await r.json()).toMatchObject({ signedOut: true });
  });

  it("answers 503, not 401, when the database doesn't answer, so the device stays signed in", async () => {
    fake.sessionOf = async () => {
      throw new Error("timeout");
    };
    const r = (await signedIn(req())) as Response;
    expect(r.status).toBe(503);
    expect(await r.json()).not.toHaveProperty("signedOut");
  });
});
