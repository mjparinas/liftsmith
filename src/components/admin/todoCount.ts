// The To Do tab's count beside its name. The to-do list holds mail waiting for an answer (`inbox:<id>` items) as well
// as everything else, so the count follows the Inbox as it changes: archiving, marking done or answering a message
// there takes it off the count at once, without waiting for the To Do list to be read again (Melvin, 2026-11-15).
import type { TodoList } from "@/server/adminTodo";
import type { InboxItem } from "@/server/inbox";

/** What the count needs from the to-do list: the mail on it, and how many other items and open tasks. */
export interface TodoSummary {
  inbox: string[];
  other: number;
}

const INBOX = "inbox:";

/** The summary of a to-do list as `/api/admin/todo/` returns it, or null when the answer isn't one. */
export function summarizeTodo(j: unknown): TodoSummary | null {
  const list = j as Partial<TodoList> | null;
  if (!list || !Array.isArray(list.items) || !Array.isArray(list.tasks)) return null;
  const inbox = list.items.filter((i) => i.kind === "inbox" && i.key.startsWith(INBOX)).map((i) => i.key.slice(INBOX.length));
  const open = list.tasks.filter((t) => !t.doneAt).length;
  return { inbox, other: list.items.length - inbox.length + open };
}

const waiting = (m: InboxItem) => !m.handledAt && !m.repliedAt && !m.archivedAt;

/** The To Do count: mail on the list leaves it once the Inbox shows it answered, done or archived. */
export function todoBadge(s: TodoSummary, mail: readonly InboxItem[]): number {
  const settled = new Set(mail.filter((m) => !waiting(m)).map((m) => m.id));
  return s.other + s.inbox.filter((id) => !settled.has(id)).length;
}

/** A message as it is right after an Inbox action went through, before the list is read again. */
export function afterAction(m: InboxItem, body: Record<string, unknown>, now: number): InboxItem {
  switch (body.action) {
    case "archive":
      return { ...m, archivedAt: body.archived === false ? null : now };
    case "handled":
      return { ...m, handledAt: body.handled === false ? null : now };
    case "reply":
      return { ...m, repliedAt: now };
    default:
      return m;
  }
}
