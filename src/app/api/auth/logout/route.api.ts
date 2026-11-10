// POST /api/auth/logout/: ends this device's session. Server build only.
import { preflight, reply, signedIn } from "@/server/accountHttp";
import { signOut } from "@/server/accounts";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  await signOut(s.session);
  return reply(req, 200, { ok: true });
}
