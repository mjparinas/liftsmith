// GET /api/admin/todo/: the To Do tab (src/server/adminTodo.ts): worked-out items, the admins' own tasks, and how
// many items are snoozed. POST changes it (admins only, audited):
//   {action: "hide", key, days}  snooze an item for 1 to 365 days, or dismiss it when days is null
//   {action: "unhide"}           bring every snoozed and dismissed item back
//   {action: "add", title, note?, due?}, {action: "done", id, done}, {action: "delete", id}  the admins' own tasks
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { addTask, checkTask, deleteTask, hideItem, pruneHidden, setTaskDone, todoList, unhideAll } from "@/server/adminTodo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, await todoList());
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body) return json(400, { error: "Not JSON" });
  const who = gate.staff.email;
  const id = Number(body.id);
  switch (body.action) {
    case "hide": {
      const key = typeof body.key === "string" ? body.key : "";
      if (!key || key.length > 200) return json(400, { error: "Which item?" });
      const days = body.days == null ? null : Number(body.days);
      if (days != null && (!Number.isInteger(days) || days < 1 || days > 365)) return json(400, { error: "Snooze for 1 to 365 days." });
      await hideItem(key, days);
      await pruneHidden();
      await audit(who, days == null ? "todo.dismiss" : "todo.snooze", key, days == null ? undefined : { days });
      return json(200, { ok: true });
    }
    case "unhide":
      await unhideAll();
      await audit(who, "todo.unhide", null);
      return json(200, { ok: true });
    case "add": {
      const t = checkTask(body);
      if (!t.ok) return json(400, { error: t.error });
      const newId = await addTask(t, who);
      await audit(who, "task.add", String(newId), { title: t.title });
      return json(200, { ok: true, id: newId });
    }
    case "done": {
      if (!Number.isInteger(id)) return json(400, { error: "Which task?" });
      if (!(await setTaskDone(id, body.done !== false, who))) return json(404, { error: "No such task." });
      await audit(who, body.done !== false ? "task.done" : "task.reopen", String(id));
      return json(200, { ok: true });
    }
    case "delete": {
      if (!Number.isInteger(id)) return json(400, { error: "Which task?" });
      if (!(await deleteTask(id))) return json(404, { error: "No such task." });
      await audit(who, "task.delete", String(id));
      return json(200, { ok: true });
    }
    default:
      return json(400, { error: "Unknown action" });
  }
}
