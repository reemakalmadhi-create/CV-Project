/**
 * Virtual try-on endpoint.
 *
 * The browser sends the (already resized, 768×1024) person photo + productId + category.
 * - If TRYON_API_URL is set, the request is forwarded to the Python service in
 *   tryon-service/ (FastAPI + IDM-VTON). A real image is only returned if the model produced one.
 * - Otherwise -> { status: "pending", message: "IDM-VTON integration pending" }.
 * Nothing here ever returns the input photo or a placeholder as a "result".
 */
import { currentUser } from "@/lib/auth";
import { saveTryonImage, updateUser } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getProduct, type TryOnCategory } from "@/lib/catalog";
import { toPublic } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const PENDING = "IDM-VTON integration pending";
const CATEGORIES: TryOnCategory[] = ["upper_body", "lower_body", "dresses"];
const MAX_BYTES = 4 * 1024 * 1024; // the browser uploads a resized JPEG (Vercel body limit is 4.5 MB)

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);

  const form = await req.formData().catch(() => null);
  const person = form?.get("person");
  const product = getProduct(String(form?.get("productId") ?? ""));
  const category = String(form?.get("category") ?? "upper_body") as TryOnCategory;

  if (!(person instanceof File) || person.size === 0) return fail("Please add your photo.");
  if (!person.type.startsWith("image/")) return fail("The photo must be an image.");
  if (person.size > MAX_BYTES) return fail("The photo is too large.");
  if (!product) return fail("Please choose a garment.");
  if (!CATEGORIES.includes(category)) return fail("Unknown garment category.");

  const serviceUrl = process.env.TRYON_API_URL?.replace(/\/$/, "");
  if (!serviceUrl) {
    return ok({
      status: "pending",
      message: PENDING,
      detail: "TRYON_API_URL is not set — the Python try-on service (tryon-service/) is not connected yet.",
    });
  }

  // Forward to the Python service
  const out = new FormData();
  out.set("person", person, "person.jpg");
  out.set("garment_url", product.image);
  out.set("garment_id", product.id);
  out.set("category", category);
  out.set("description", product.description || product.name);
  let data: { status?: string; message?: string; detail?: string; image_base64?: string };
  try {
    const res = await fetch(`${serviceUrl}/tryon`, { method: "POST", body: out, signal: AbortSignal.timeout(55_000) });
    data = await res.json();
  } catch (err) {
    return ok({ status: "error", message: "The try-on service could not be reached.", detail: String(err) });
  }

  if (data.status === "ok" && data.image_base64) {
    const file = await saveTryonImage(Buffer.from(data.image_base64, "base64"));
    const updated = await updateUser(user.email, (u) => {
      u.tryonHistory.unshift({ id: file.replace(".png", ""), createdAt: new Date().toISOString(), productId: product.id, file });
    });
    return ok({ status: "ok", image: `data:image/png;base64,${data.image_base64}`, user: toPublic(updated) });
  }
  if (data.status === "pending") return ok({ status: "pending", message: PENDING, detail: data.detail || "" });
  return ok({ status: "error", message: data.message || "Try-on failed.", detail: data.detail || "" });
}

/** Is the model connected? Used by the status badge. */
export async function GET() {
  const serviceUrl = process.env.TRYON_API_URL?.replace(/\/$/, "");
  if (!serviceUrl) return ok({ ready: false, status: "Python try-on service not connected" });
  try {
    const res = await fetch(`${serviceUrl}/health`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    return ok(await res.json());
  } catch {
    return ok({ ready: false, status: "Python try-on service unreachable" });
  }
}
