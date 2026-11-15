// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TodoList } from "@/server/adminTodo";
import type { InboxItem } from "@/server/inbox";

import { Inbox } from "./Inbox";
import { afterAction, summarizeTodo, todoBadge } from "./todoCount";

const mail = (id: string, over: Partial<InboxItem> = {}): InboxItem => ({
  id,
  from: `Pat ${id} <pat-${id}@example.com>`,
  fromEmail: `pat-${id}@example.com`,
  to: ["hello@getliftsmith.com"],
  subject: `Question ${id}`,
  receivedAt: Date.UTC(2026, 10, 14),
  attachments: 0,
  handledAt: null,
  repliedAt: null,
  repliedBy: null,
  archivedAt: null,
  ...over,
});
const item = (key: string, kind: TodoList["items"][number]["kind"]) => ({
  key,
  kind,
  title: key,
  detail: "",
  at: null,
  action: { label: "Open", tab: "Inbox" },
});
const list: TodoList = {
  items: [item("inbox:m1", "inbox"), item("inbox:m2", "inbox"), item("reports", "reports")],
  hidden: 0,
  tasks: [
    { id: 1, title: "Open task", note: "", due: null, createdAt: 0, createdBy: "a@example.com", doneAt: null, doneBy: null },
    { id: 2, title: "Done task", note: "", due: null, createdAt: 0, createdBy: "a@example.com", doneAt: 5, doneBy: "a@example.com" },
  ],
  problems: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the To Do count", () => {
  it("counts the list's items and open tasks", () => {
    const s = summarizeTodo(list)!;
    expect(s).toEqual({ inbox: ["m1", "m2"], other: 2 });
    expect(todoBadge(s, [])).toBe(4);
    expect(summarizeTodo({ error: "nope" })).toBeNull();
  });

  it("drops mail the Inbox shows archived, done or answered, and keeps mail still waiting", () => {
    const s = summarizeTodo(list)!;
    expect(todoBadge(s, [mail("m1", { archivedAt: 1 }), mail("m2")])).toBe(3);
    expect(todoBadge(s, [mail("m1", { handledAt: 1 }), mail("m2", { repliedAt: 1 })])).toBe(2);
    // Mail that isn't on the to-do list (older, or from us) never changes the count.
    expect(todoBadge(s, [mail("m9", { archivedAt: 1 })])).toBe(4);
  });

  it("applies an Inbox action to a message the way the server will", () => {
    expect(afterAction(mail("m1"), { action: "archive", archived: true }, 7).archivedAt).toBe(7);
    expect(afterAction(mail("m1", { archivedAt: 3 }), { action: "archive", archived: false }, 7).archivedAt).toBeNull();
    expect(afterAction(mail("m1"), { action: "handled", handled: true }, 7).handledAt).toBe(7);
    expect(afterAction(mail("m1"), { action: "reply", text: "Hi" }, 7).repliedAt).toBe(7);
    expect(afterAction(mail("m1"), { action: "draft" }, 7)).toEqual(mail("m1"));
  });

  it("goes down as soon as a message on the list is archived in the Inbox", async () => {
    let lists = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "POST") return Response.json({ ok: true });
        if (url.includes("/api/admin/replies/")) return Response.json({ replies: [] });
        if (url.includes("?id="))
          return Response.json({
            message: {
              ...mail("m1"),
              text: "Hello",
              hasHtml: false,
              remoteImages: false,
              replyTo: "",
              messageId: null,
              attachmentNames: [],
            },
          });
        // The list is read once; the read after the archive never answers, so only the Inbox's own update can lower the count.
        if (lists++ > 0) return new Promise<Response>(() => {});
        return Response.json({ configured: true, items: [mail("m1"), mail("m2")], next: null });
      }),
    );
    const s = summarizeTodo(list)!;
    let shown: InboxItem[] = [];
    render(<Inbox admin open="m1" onMail={(m) => (shown = m)} />);
    await waitFor(() => expect(shown).toHaveLength(2));
    expect(todoBadge(s, shown)).toBe(4);
    fireEvent.click(await screen.findByRole("button", { name: "Archive" }));
    await waitFor(() => expect(todoBadge(s, shown)).toBe(3));
  });
});
