/** Comments in order, each top comment followed by its replies. A reply whose top comment is gone stands alone. */
export function threaded<C extends { id: string; replyTo?: string }>(comments: readonly C[]): { c: C; reply: boolean }[] {
  const ids = new Set(comments.map((c) => c.id));
  const replies = new Map<string, C[]>();
  for (const c of comments) if (c.replyTo && ids.has(c.replyTo)) replies.set(c.replyTo, [...(replies.get(c.replyTo) ?? []), c]);
  const out: { c: C; reply: boolean }[] = [];
  for (const c of comments) {
    if (c.replyTo && ids.has(c.replyTo)) continue;
    out.push({ c, reply: false });
    for (const r of replies.get(c.id) ?? []) out.push({ c: r, reply: true });
  }
  return out;
}
