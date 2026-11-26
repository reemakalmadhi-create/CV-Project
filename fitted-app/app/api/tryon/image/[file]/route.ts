import { currentUser } from "@/lib/auth";
import { readTryonImage } from "@/lib/db";

/** Serve a saved try-on result — only to its owner. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const user = await currentUser();
  if (!user || !user.tryonHistory.some((e) => e.file === file)) return new Response("Not found", { status: 404 });
  const png = await readTryonImage(file);
  if (!png) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" } });
}
