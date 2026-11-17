// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AskAiPanel } from "./Ai";

// The header's Ask AI (docs/decisions/admin-ai.md): opening it sends the tab's words and shows what needs doing.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Ask AI", () => {
  it("asks about the tab on screen when opened and offers the tab for each action", async () => {
    const posts: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          posts.push(JSON.parse(String(init.body)) as Record<string, unknown>);
          const insights = { summary: "Two reports wait.", actions: [{ do: "Answer the email", why: "It's two days old.", tab: "Inbox" }] };
          return Promise.resolve(new Response(JSON.stringify({ insights })));
        }
        return Promise.resolve(new Response(JSON.stringify({ configured: true, ready: true, on: true, cap: 2, spent: 0, calls: 0 })));
      }),
    );
    const go = vi.fn();
    render(
      <>
        <div data-admin-page>Reports: 2 waiting</div>
        <AskAiPanel tab="Reports" go={go} close={() => {}} />
      </>,
    );
    expect(await screen.findByText("Two reports wait.")).toBeTruthy();
    expect(posts[0]).toMatchObject({ task: "page", tab: "Reports", page: "Reports: 2 waiting" });
    fireEvent.click(screen.getByRole("button", { name: "Open Inbox" }));
    expect(go).toHaveBeenCalledWith("Inbox");
    fireEvent.change(screen.getByLabelText("Ask about Reports"), { target: { value: "Which first?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(posts[1]).toMatchObject({ question: "Which first?" }));
  });
});
