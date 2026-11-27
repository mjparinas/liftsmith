import { generateKeyPairSync, sign } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { ALLOWED_WORKFLOWS, clearActionsKeys, ISSUER, PINS_AUDIENCE, REPO, verifyActionsToken } from "./githubOidc";

const NOW = 1_800_000_000_000;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256" };
const get = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

function token(over: Record<string, unknown> = {}, kid = "k1") {
  const head = b64({ alg: "RS256", kid });
  const body = b64({
    iss: ISSUER,
    aud: PINS_AUDIENCE,
    exp: NOW / 1000 + 300,
    repository: REPO,
    workflow_ref: ALLOWED_WORKFLOWS[0],
    event_name: "schedule",
    ref: "refs/heads/main",
    ...over,
  });
  return `${head}.${body}.${sign("RSA-SHA256", Buffer.from(`${head}.${body}`), privateKey).toString("base64url")}`;
}

const check = (t: string) => verifyActionsToken(t, { get, now: NOW });

beforeEach(() => clearActionsKeys());

describe("GitHub Actions tokens for the pin maker", () => {
  it("lets in this repo's Pins workflow on main or staging", async () => {
    expect((await check(token())).ok).toBe(true);
    expect(
      (await check(token({ workflow_ref: `${REPO}/.github/workflows/pins.yml@refs/heads/staging`, event_name: "workflow_dispatch" }))).ok,
    ).toBe(true);
  });

  it.each([
    ["another repo (a fork)", { repository: "someone/liftsmith" }, "repository"],
    ["another workflow", { workflow_ref: `${REPO}/.github/workflows/ci.yml@refs/heads/main` }, "workflow"],
    ["a pull request branch", { workflow_ref: `${REPO}/.github/workflows/pins.yml@refs/pull/9/merge` }, "workflow"],
    ["a pull request event", { event_name: "pull_request" }, "event"],
    ["another audience", { aud: "https://example.com" }, "audience"],
    ["another issuer", { iss: "https://accounts.google.com" }, "issuer"],
    ["an expired token", { exp: NOW / 1000 - 600 }, "expired"],
  ])("refuses %s", async (_, over, error) => {
    expect(await check(token(over))).toEqual({ ok: false, error });
  });

  it("refuses a token not signed by GitHub", async () => {
    const t = token();
    const [h, b] = t.split(".");
    const other = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    expect(await check(`${h}.${b}.${sign("RSA-SHA256", Buffer.from(`${h}.${b}`), other).toString("base64url")}`)).toEqual({
      ok: false,
      error: "signature",
    });
    expect(await check(token({}, "unknown"))).toEqual({ ok: false, error: "kid" });
    expect(await check("nope")).toEqual({ ok: false, error: "malformed" });
  });
});
