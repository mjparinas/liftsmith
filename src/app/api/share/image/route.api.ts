// GET /w/<id>/card.jpg (rewritten here): a public share link's card image. Server build only.
import { getImage, idFrom } from "@/server/shareLinks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = idFrom(req);
  const img = await getImage(id).catch(() => null);
  if (!img)
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60", "X-Robots-Tag": "noindex" } });
  return new Response(new Uint8Array(img), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Robots-Tag": "noindex",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
