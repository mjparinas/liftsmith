// GET /api/connect/: which cloud services this server can connect (has keys for) and which this account has
// connected. Server build only. See src/server/connect.ts.
import { preflight, reply, signedIn } from "@/server/accountHttp";
import { status } from "@/server/connect";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  return reply(req, 200, await status(s.accountId));
}
