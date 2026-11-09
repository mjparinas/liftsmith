import { json, sameOrigin, signOut } from "@/server/adminAuth";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: "Bad origin" });
  return signOut(req);
}
