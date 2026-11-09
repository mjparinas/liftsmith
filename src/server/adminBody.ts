// Reads a small JSON body for an admin route: null when it's too large or isn't a JSON object.
export async function readBody(req: Request, limit = 16_000): Promise<Record<string, unknown> | null> {
  try {
    const raw = await req.text();
    if (raw.length > limit) return null;
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
