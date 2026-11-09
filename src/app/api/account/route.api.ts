// GET /api/account/: the signed-in account. DELETE /api/account/: deletes it and everything synced to it
// (App Store guideline 5.1.1(v) and Google Play's account deletion rule). Server build only.
import { accountInfo, deleteAccount } from "@/server/accounts";
import { preflight, reply, signedIn } from "@/server/accountHttp";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const a = await accountInfo(s.accountId);
  return a ? reply(req, 200, { account: a }) : reply(req, 401, { error: "Signed out. Sign in again." });
}

export async function DELETE(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  await deleteAccount(s.accountId);
  return reply(req, 200, { ok: true });
}
