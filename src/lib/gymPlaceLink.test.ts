import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
vi.mock("./auth", async (orig) => ({
  ...(await orig<typeof import("./auth")>()),
  api: (path: string) => {
    calls.push(path);
    return Promise.resolve({ place: { id: "0123456789abcdef" } });
  },
}));

const { fetchPlace } = await import("./gymDirectory");

// A gym's website page that opened the app (src/lib/appLinks.ts, 2026-11-26) is looked up by its address.
describe("fetchPlace", () => {
  beforeEach(() => void calls.splice(0));

  it("asks by id for the app's own links", async () => {
    await fetchPlace("0123456789abcdef");
    expect(calls).toEqual(["/api/gyms/?place=0123456789abcdef"]);
  });

  it("asks by city and gym for a website address, and passes a poster scan on", async () => {
    await fetchPlace("toronto~iron-house-gym");
    await fetchPlace("toronto~iron-house-gym~qr");
    expect(calls).toEqual(["/api/gyms/?city=toronto&gym=iron-house-gym", "/api/gyms/?city=toronto&gym=iron-house-gym&qr=1"]);
  });
});
