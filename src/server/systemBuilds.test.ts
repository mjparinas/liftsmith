import { afterEach, describe, expect, it, vi } from "vitest";

import { buildsCheck } from "./systemHealth";

const run = (sha: string, conclusion: string, title = "A change") => ({
  status: "completed",
  conclusion,
  created_at: "2026-11-25T06:55:58Z",
  html_url: `https://github.com/x/runs/${sha}`,
  head_sha: sha,
  display_title: title,
});

function github(mainRuns: object[], parentStatus: string | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = url.includes("/commits/main")
        ? {
            sha: "promo",
            parents: [{ sha: "oldmain" }, { sha: "staging1" }],
            commit: { message: "Promote staging to main", committer: { date: "2026-11-26T23:23:00Z" } },
          }
        : url.includes("/commits/staging1/statuses")
          ? parentStatus
            ? [{ context: "CI passed tree", state: parentStatus }]
            : []
          : url.includes("/statuses")
            ? []
            : { workflow_runs: url.includes("branch=main") ? mainRuns : [run("s", "success")] };
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("Builds card", () => {
  it("doesn't blame main for an old failed run once a promotion that passed on staging moved it", async () => {
    github([run("oldmain", "failure")], "success");
    const card = await buildsCheck();
    expect(card.state).toBe("ok");
    expect(card.rows.find((r) => r.label === "CI on main")?.value).toMatch(/^Passed on staging before promotion/);
  });

  it("still fails when the failed run tested main's current commit", async () => {
    github([run("promo", "failure")], "success");
    expect((await buildsCheck()).state).toBe("down");
  });

  it("still fails when nothing shows the promoted code passed", async () => {
    github([run("oldmain", "failure")], null);
    expect((await buildsCheck()).state).toBe("down");
  });
});
