import { currentUser } from "@/lib/auth";
import { imageType, readImage } from "@/lib/db";

export const runtime = "nodejs";

/** Serve a saved pose, own garment or try-on result — only to its owner. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const user = await currentUser();
  const owns = user && [...user.tryonHistory, ...user.poses, ...user.garments].some((e) => e.file === file);
  if (!owns) return new Response("Not found", { status: 404 });
  const buf = await readImage(file);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": imageType(file), "Cache-Control": "private, max-age=86400" } });
}
