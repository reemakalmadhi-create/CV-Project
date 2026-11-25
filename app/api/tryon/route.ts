/**
 * Virtual try-on endpoint.
 *
 * The browser sends a person photo (a saved pose id, or a 768×1024 photo) and a garment
 * (a shop product id, or one of the user's own garments) + category.
 * - If TRYON_API_URL is set, the request is forwarded to the Python service in
 *   tryon-service/ (FastAPI + CatVTON) as multipart:
 *     person (file), garment (file), category, description, garment_id
 *   A real image is only returned if the model produced one.
 * - Otherwise -> { status: "pending", message: "Try-on model not connected" }.
 * Nothing here ever returns the input photo or a placeholder as a "result".
 */
import fs from "node:fs/promises";
import path from "node:path";
import { currentUser } from "@/lib/auth";
import { readImage, saveTryonImage, sniffImage, IMAGE_TYPES, updateUser } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getProduct, type TryOnCategory } from "@/lib/catalog";
import { toPublic } from "@/lib/types";
import { MAX_UPLOAD } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 300;

const PENDING = "Try-on model not connected";
const CATEGORIES: TryOnCategory[] = ["upper_body", "lower_body", "dresses"];
const SERVICE_TIMEOUT = 240_000; // the model runs on a Mac (~40-60 s per image) and requests queue

/** Shop product photo bytes: local /public file or a remote URL, fetched server-side. */
async function productImage(src: string): Promise<Buffer | null> {
  try {
    if (src.startsWith("/")) return await fs.readFile(path.join(process.cwd(), "public", path.normalize(src).replace(/^(\.\.[/\\])+/, "")));
    const res = await fetch(src, { headers: { "User-Agent": "FITTED/1.0" }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

const blob = (buf: Buffer) => new Blob([new Uint8Array(buf)], { type: IMAGE_TYPES[sniffImage(buf) ?? "jpg"] });

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);

  const form = await req.formData().catch(() => null);
  const category = String(form?.get("category") ?? "upper_body") as TryOnCategory;
  if (!CATEGORIES.includes(category)) return fail("Unknown garment category.");

  // person: a saved pose, or a photo sent with the request
  const poseId = String(form?.get("poseId") ?? "");
  let person: Buffer | null = null;
  if (poseId) {
    const pose = user.poses.find((p) => p.id === poseId);
    if (!pose) return fail("Pose not found.");
    person = await readImage(pose.file);
  } else {
    const file = form?.get("person");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD) return fail("The photo is too large.");
      person = Buffer.from(await file.arrayBuffer());
    }
  }
  if (!person || !sniffImage(person)) return fail("Please add your photo.");

  // garment: one of my garments, or a shop product
  const garmentId = String(form?.get("garmentId") ?? "");
  const mine = garmentId ? user.garments.find((g) => g.id === garmentId) : undefined;
  const product = mine ? undefined : getProduct(String(form?.get("productId") ?? ""));
  if (garmentId && !mine) return fail("Garment not found.");
  if (!mine && !product) return fail("Please choose a garment.");

  const serviceUrl = process.env.TRYON_API_URL?.replace(/\/$/, "");
  if (!serviceUrl) {
    return ok({
      status: "pending",
      message: PENDING,
      detail: "TRYON_API_URL is not set — the Python try-on service (tryon-service/) is not connected.",
    });
  }

  const garment = mine ? await readImage(mine.file) : await productImage(product!.image);
  if (!garment || !sniffImage(garment)) return fail("The garment photo could not be loaded.");

  // Forward to the Python service
  const out = new FormData();
  out.set("person", blob(person), "person.jpg");
  out.set("garment", blob(garment), "garment.jpg");
  out.set("category", category);
  out.set("description", mine ? mine.name : product!.description || product!.name);
  out.set("garment_id", mine ? `own:${mine.id}` : product!.id);
  let data: { status?: string; message?: string; detail?: string; image_base64?: string };
  try {
    const res = await fetch(`${serviceUrl}/tryon`, { method: "POST", body: out, signal: AbortSignal.timeout(SERVICE_TIMEOUT) });
    data = await res.json();
  } catch (err) {
    return ok({ status: "error", message: "The try-on service could not be reached.", detail: String(err) });
  }

  if (data.status === "ok" && data.image_base64) {
    const file = await saveTryonImage(Buffer.from(data.image_base64, "base64"));
    const updated = await updateUser(user.email, (u) => {
      u.tryonHistory.unshift({
        id: file.replace(".png", ""), createdAt: new Date().toISOString(), file,
        productId: product?.id ?? "", ...(mine ? { garmentId: mine.id } : {}), ...(poseId ? { poseId } : {}),
      });
    });
    return ok({ status: "ok", image: `data:image/png;base64,${data.image_base64}`, file, user: toPublic(updated) });
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
